import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import bcryptjs from 'bcryptjs'

const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
const wasmBinary = fs.readFileSync(wasmPath)
const SQL = await initSqlJs({ wasmBinary })

const dbPath = path.join(process.cwd(), 'clinic.db')

let rawDb: any

if (fs.existsSync(dbPath)) {
  const fileBuffer = fs.readFileSync(dbPath)
  rawDb = new SQL.Database(fileBuffer)
} else {
  rawDb = new SQL.Database()
}

let inTransaction = false

function saveDb() {
  if (inTransaction) return
  const data = rawDb.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

class Statement {
  private sql: string
  constructor(sql: string) {
    this.sql = sql
  }

  get(...params: unknown[]) {
    const stmt = rawDb.prepare(this.sql)
    if (params.length > 0) stmt.bind(params)
    let result: any = undefined
    if (stmt.step()) {
      result = stmt.getAsObject()
    }
    stmt.free()
    return result
  }

  all(...params: unknown[]) {
    const stmt = rawDb.prepare(this.sql)
    if (params.length > 0) stmt.bind(params)
    const results: any[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    return results
  }

  run(...params: unknown[]) {
    rawDb.run(this.sql, params)
    const lastInsertRowid = rawDb.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] ?? 0
    const changes = rawDb.getRowsModified()
    saveDb()
    return { lastInsertRowid, changes }
  }
}

class DatabaseWrapper {
  prepare(sql: string) {
    return new Statement(sql)
  }

  exec(sql: string) {
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0)
    for (const stmt of statements) {
      try {
        rawDb.run(stmt)
      } catch (e) {
        console.error('SQL exec error:', stmt, e)
      }
    }
    saveDb()
  }

  pragma(str: string) {
    rawDb.run(`PRAGMA ${str}`)
  }

  transaction<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      inTransaction = true
      rawDb.run('BEGIN TRANSACTION')
      try {
        const result = fn(...args)
        rawDb.run('COMMIT')
        inTransaction = false
        saveDb()
        return result
      } catch (err) {
        try { rawDb.run('ROLLBACK') } catch {}
        inTransaction = false
        throw err
      }
    }) as any as T
  }
}

const db = new DatabaseWrapper()

db.pragma('foreign_keys = ON')

const createTableSQLs = [
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT NOT NULL UNIQUE, password TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS departments (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, icon TEXT)`,
  `CREATE TABLE IF NOT EXISTS doctors (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, department_id INTEGER NOT NULL, title TEXT, specialty TEXT, avatar TEXT)`,
  `CREATE TABLE IF NOT EXISTS schedule_slots (id INTEGER PRIMARY KEY AUTOINCREMENT, doctor_id INTEGER NOT NULL, day_of_week INTEGER NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, max_appointments INTEGER DEFAULT 1)`,
  `CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL, doctor_id INTEGER NOT NULL, slot_id INTEGER NOT NULL, appointment_date TEXT NOT NULL, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS health_profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL UNIQUE, blood_type TEXT, allergies TEXT DEFAULT '[]', chronic_diseases TEXT DEFAULT '[]', emergency_contact TEXT, emergency_phone TEXT)`,
  `CREATE TABLE IF NOT EXISTS consultations (id INTEGER PRIMARY KEY AUTOINCREMENT, appointment_id INTEGER NOT NULL UNIQUE, patient_id INTEGER NOT NULL, doctor_id INTEGER NOT NULL, chief_complaint TEXT, diagnosis TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS prescriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, consultation_id INTEGER NOT NULL, medicine_name TEXT NOT NULL, dosage TEXT, frequency TEXT, duration_days INTEGER, remarks TEXT)`,
  `CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS noshow_records (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL, appointment_id INTEGER NOT NULL, consecutive_count INTEGER DEFAULT 1, is_banned INTEGER DEFAULT 0, banned_until TEXT, created_at TEXT DEFAULT (datetime('now')))`,
]

for (const sql of createTableSQLs) {
  rawDb.run(sql)
}
saveDb()

const seedDept = db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number }
if (seedDept.count === 0) {
  const hashedPassword = bcryptjs.hashSync('123456', 10)

  db.prepare('INSERT INTO departments (name, description, icon) VALUES (?, ?, ?)').run('内科', '常见内科疾病诊疗', 'heart')
  db.prepare('INSERT INTO departments (name, description, icon) VALUES (?, ?, ?)').run('外科', '外科疾病诊疗与手术', 'bone')
  db.prepare('INSERT INTO departments (name, description, icon) VALUES (?, ?, ?)').run('儿科', '儿童疾病诊疗', 'baby')
  db.prepare('INSERT INTO departments (name, description, icon) VALUES (?, ?, ?)').run('妇科', '妇女健康诊疗', 'flower')
  db.prepare('INSERT INTO departments (name, description, icon) VALUES (?, ?, ?)').run('皮肤科', '皮肤疾病诊疗', 'drop')
  db.prepare('INSERT INTO departments (name, description, icon) VALUES (?, ?, ?)').run('中医科', '中医诊疗与调理', 'leaf')
  db.prepare('INSERT INTO departments (name, description, icon) VALUES (?, ?, ?)').run('口腔科', '口腔疾病诊疗', 'tooth')
  db.prepare('INSERT INTO departments (name, description, icon) VALUES (?, ?, ?)').run('眼科', '眼科疾病诊疗', 'eye')

  const r1 = db.prepare('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)').run('13800000001', hashedPassword, '张医生', 'doctor')
  const r2 = db.prepare('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)').run('13800000002', hashedPassword, '李医生', 'doctor')
  db.prepare('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)').run('13800000003', hashedPassword, '王前台', 'receptionist')
  db.prepare('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)').run('13800000004', hashedPassword, '管理员', 'admin')

  db.prepare('INSERT INTO doctors (user_id, department_id, title, specialty) VALUES (?, ?, ?, ?)').run(r1.lastInsertRowid, 1, '主任医师', '心血管内科')
  db.prepare('INSERT INTO doctors (user_id, department_id, title, specialty) VALUES (?, ?, ?, ?)').run(r2.lastInsertRowid, 6, '副主任医师', '中医调理')
}

export default db
