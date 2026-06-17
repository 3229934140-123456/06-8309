import { Router, type Request, type Response } from 'express'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { JWT_SECRET } from '../middleware/auth.js'

const router = Router()

router.post('/register', (req: Request, res: Response): void => {
  const { phone, password, name, bloodType, allergies, chronicDiseases, emergencyContact, emergencyPhone } = req.body
  if (!phone || !password || !name) {
    res.status(400).json({ success: false, error: '请填写完整信息' })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
  if (existing) {
    res.status(409).json({ success: false, error: '该手机号已注册' })
    return
  }

  const hashedPassword = bcryptjs.hashSync(password, 10)
  const insertUser = db.prepare(
    'INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)'
  )
  const insertHealthProfile = db.prepare(
    'INSERT INTO health_profiles (patient_id, blood_type, allergies, chronic_diseases, emergency_contact, emergency_phone) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const allergiesArray = allergies ? allergies.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean) : []
  const chronicArray = chronicDiseases ? chronicDiseases.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean) : []

  const transaction = db.transaction(() => {
    const result = insertUser.run(phone, hashedPassword, name, 'patient')
    insertHealthProfile.run(
      result.lastInsertRowid,
      bloodType || '',
      JSON.stringify(allergiesArray),
      JSON.stringify(chronicArray),
      emergencyContact || '',
      emergencyPhone || ''
    )
    return result.lastInsertRowid
  })

  const userId = transaction()
  const user = db.prepare('SELECT id, phone, name, role, created_at FROM users WHERE id = ?').get(userId) as any

  const token = jwt.sign({ userId: user.id, userRole: user.role }, JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ success: true, data: { token, user } })
})

router.post('/login', (req: Request, res: Response): void => {
  const { phone, password } = req.body
  if (!phone || !password) {
    res.status(400).json({ success: false, error: '请提供手机号和密码' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any
  if (!user) {
    res.status(401).json({ success: false, error: '手机号或密码错误' })
    return
  }

  if (!bcryptjs.compareSync(password, user.password)) {
    res.status(401).json({ success: false, error: '手机号或密码错误' })
    return
  }

  const token = jwt.sign({ userId: user.id, userRole: user.role }, JWT_SECRET, { expiresIn: '7d' })
  const { password: _, ...userWithoutPassword } = user
  res.json({ success: true, data: { token, user: userWithoutPassword } })
})

export default router
