import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { createNotification } from './notifications.js'

const router = Router()

router.use(authMiddleware)

router.post('/', (req: Request, res: Response): void => {
  const userId = (req as any).userId
  const { doctorId, slotId, appointmentDate } = req.body
  if (!doctorId || !slotId || !appointmentDate) {
    res.status(400).json({ success: false, error: '请填写完整预约信息' })
    return
  }

  const banRecord = db.prepare(
    'SELECT * FROM noshow_records WHERE patient_id = ? AND is_banned = 1 AND banned_until > datetime("now") ORDER BY banned_until DESC LIMIT 1'
  ).get(userId) as any
  if (banRecord) {
    res.status(403).json({ success: false, error: `您因多次爽约已被禁止预约，解禁日期：${banRecord.banned_until}` })
    return
  }

  const slot = db.prepare('SELECT * FROM schedule_slots WHERE id = ?').get(slotId) as any
  if (!slot) {
    res.status(404).json({ success: false, error: '排班不存在' })
    return
  }

  const existingCount = db.prepare(
    'SELECT COUNT(*) as count FROM appointments WHERE slot_id = ? AND appointment_date = ? AND status != ?'
  ).get(slotId, appointmentDate, 'cancelled') as { count: number }
  if (existingCount.count >= slot.max_appointments) {
    res.status(409).json({ success: false, error: '该时段已约满' })
    return
  }

  const result = db.prepare(
    'INSERT INTO appointments (patient_id, doctor_id, slot_id, appointment_date) VALUES (?, ?, ?, ?)'
  ).run(userId, doctorId, slotId, appointmentDate)

  const doctor = db.prepare(
    'SELECT u.name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?'
  ).get(doctorId) as any

  createNotification(
    userId,
    'confirmation',
    '预约成功',
    `您已成功预约${doctor?.name || '医生'}，日期：${appointmentDate}`
  )

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: appointment })
})

router.get('/mine', (req: Request, res: Response): void => {
  const userId = (req as any).userId
  const appointments = db.prepare(
    `SELECT a.*, u.name as doctor_name, d.title as doctor_title, dep.name as department_name, s.start_time, s.end_time, s.day_of_week
     FROM appointments a
     JOIN doctors doc ON a.doctor_id = doc.id
     JOIN users u ON doc.user_id = u.id
     JOIN departments dep ON doc.department_id = dep.id
     JOIN schedule_slots s ON a.slot_id = s.id
     WHERE a.patient_id = ?
     ORDER BY a.appointment_date DESC, s.start_time`
  ).all(userId)
  res.json({ success: true, data: appointments })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const appointment = db.prepare(
    `SELECT a.*, u.name as patient_name, doc.id as doctor_table_id,
     s.start_time, s.end_time, s.day_of_week,
     du.name as doctor_name, dep.name as department_name
     FROM appointments a
     JOIN users u ON a.patient_id = u.id
     JOIN doctors doc ON a.doctor_id = doc.id
     JOIN users du ON doc.user_id = du.id
     JOIN departments dep ON doc.department_id = dep.id
     JOIN schedule_slots s ON a.slot_id = s.id
     WHERE a.id = ?`
  ).get(id) as any
  if (!appointment) {
    res.status(404).json({ success: false, error: '预约不存在' })
    return
  }
  res.json({ success: true, data: appointment })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const userId = (req as any).userId
  const { id } = req.params
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as any
  if (!appointment) {
    res.status(404).json({ success: false, error: '预约不存在' })
    return
  }
  if (appointment.patient_id !== userId) {
    res.status(403).json({ success: false, error: '无权操作此预约' })
    return
  }
  if (appointment.status !== 'pending') {
    res.status(400).json({ success: false, error: '只能取消待就诊的预约' })
    return
  }
  db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(id)
  res.json({ success: true, message: '取消成功' })
})

router.patch('/:id/checkin', (req: Request, res: Response): void => {
  const { id } = req.params
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as any
  if (!appointment) {
    res.status(404).json({ success: false, error: '预约不存在' })
    return
  }
  if (appointment.status !== 'pending') {
    res.status(400).json({ success: false, error: '只能签到待就诊的预约' })
    return
  }
  db.prepare("UPDATE appointments SET status = 'checked_in' WHERE id = ?").run(id)
  res.json({ success: true, message: '签到成功' })
})

router.patch('/:id/noshow', (req: Request, res: Response): void => {
  const { id } = req.params
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as any
  if (!appointment) {
    res.status(404).json({ success: false, error: '预约不存在' })
    return
  }
  if (appointment.status !== 'pending') {
    res.status(400).json({ success: false, error: '只能标记待就诊的预约为爽约' })
    return
  }

  const markNoshow = db.transaction(() => {
    db.prepare("UPDATE appointments SET status = 'noshow' WHERE id = ?").run(id)

    const allAppointments = db.prepare(
      "SELECT id, status, appointment_date FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC, created_at DESC"
    ).all(appointment.patient_id) as any[]

    let consecutive = 0
    for (const apt of allAppointments) {
      if (apt.status === 'noshow') {
        consecutive++
      } else {
        break
      }
    }

    const isBanned = consecutive >= 3 ? 1 : 0
    const bannedUntil = isBanned
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      : null

    db.prepare(
      'INSERT INTO noshow_records (patient_id, appointment_id, consecutive_count, is_banned, banned_until) VALUES (?, ?, ?, ?, ?)'
    ).run(appointment.patient_id, id, consecutive, isBanned, bannedUntil)

    return { consecutive, isBanned, bannedUntil }
  })

  const result = markNoshow()

  if (result.isBanned) {
    createNotification(
      appointment.patient_id,
      'system',
      '预约限制通知',
      `您因连续${result.consecutive}次爽约，已被禁止预约30天`
    )
  }

  res.json({ success: true, data: result })
})

export default router
