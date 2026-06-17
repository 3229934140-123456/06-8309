import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)
router.use(requireRole('receptionist'))

router.get('/today-queue', (req: Request, res: Response): void => {
  const today = new Date().toISOString().slice(0, 10)
  const { status, search } = req.query
  
  let whereClause = 'WHERE a.appointment_date = ?'
  const params: any[] = [today]
  
  if (status && status !== 'all') {
    whereClause += ' AND a.status = ?'
    params.push(status)
  }
  
  if (search) {
    whereClause += ' AND (p.name LIKE ? OR p.phone LIKE ? OR CAST(CA.d AS TEXT)T) LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  
  const queue = db.prepare(
    `SELECT a.id, a.appointment_no, a.appointment_date, a.status, a.created_at,
       p.name as patient_name, p.phone as patient_phone,
       u.name as doctor_name, doc.title as doctor_title, dep.name as department_name,
       s.start_time, s.end_time
     FROM appointments a
     JOIN users p ON a.patient_id = p.id
     JOIN doctors doc ON a.doctor_id = doc.id
     JOIN users u ON doc.user_id = u.id
     JOIN departments dep ON doc.department_id = dep.id
     JOIN schedule_slots s ON a.slot_id = s.id
     ${whereClause}
     ORDER BY s.start_time`
  ).all(...params)
  res.json({ success: true, data: queue })
})

router.get('/appointments', (req: Request, res: Response): void => {
  const { date, status, search } = req.query
  if (!date) {
    res.status(400).json({ success: false, error: '请提供日期参数' })
    return
  }
  
  let whereClause = 'WHERE a.appointment_date = ?'
  const params: any[] = [date]
  
  if (status && status !== 'all') {
    whereClause += ' AND a.status = ?'
    params.push(status)
  }
  
  if (search) {
    whereClause += ' AND (p.name LIKE ? OR p.phone LIKE ? OR a.appointment_no LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  
  const appointments = db.prepare(
    `SELECT a.id, a.appointment_no, a.appointment_date, a.status, a.created_at,
       p.name as patient_name, p.phone as patient_phone,
       u.name as doctor_name, doc.title as doctor_title, dep.name as department_name,
       s.start_time, s.end_time
     FROM appointments a
     JOIN users p ON a.patient_id = p.id
     JOIN doctors doc ON a.doctor_id = doc.id
     JOIN users u ON doc.user_id = u.id
     JOIN departments dep ON doc.department_id = dep.id
     JOIN schedule_slots s ON a.slot_id = s.id
     ${whereClause}
     ORDER BY s.start_time`
  ).all(...params)
  res.json({ success: true, data: appointments })
})

router.post('/quick-checkin', (req: Request, res: Response): void => {
  const { identifier } = req.body
  if (!identifier) {
    res.status(400).json({ success: false, error: '请提供预约号或手机号' })
    return
  }

  const today = new Date().toISOString().slice(0, 10)
  
  const appointment = db.prepare(
    `SELECT a.*, p.name as patient_name, p.phone as patient_phone
     FROM appointments a
     JOIN users p ON a.patient_id = p.id
     WHERE a.appointment_date = ? 
     AND (a.appointment_no = ? OR p.phone LIKE ?)
     ORDER BY a.created_at DESC
     LIMIT 1`
  ).get(today, identifier, `%${identifier}%`) as any

  if (!appointment) {
    res.status(404).json({ success: false, error: '未找到今日的预约记录' })
    return
  }

  if (appointment.status === 'checked_in') {
    res.status(400).json({ success: false, error: '该预约已报到' })
    return
  }

  if (appointment.status !== 'pending') {
    res.status(400).json({ success: false, error: `当前状态为${
      appointment.status === 'completed' ? '已完成' :
      appointment.status === 'cancelled' ? '已取消' :
      appointment.status === 'noshow' ? '爽约' : appointment.status
    }，无法报到` })
    return
  }

  db.prepare("UPDATE appointments SET status = 'checked_in' WHERE id = ?").run(appointment.id)

  const result = db.prepare(
    `SELECT a.id, a.appointment_no, a.appointment_date, a.status, a.created_at,
       p.name as patient_name, p.phone as patient_phone,
       u.name as doctor_name, doc.title as doctor_title, dep.name as department_name,
       s.start_time, s.end_time
     FROM appointments a
     JOIN users p ON a.patient_id = p.id
     JOIN doctors doc ON a.doctor_id = doc.id
     JOIN users u ON doc.user_id = u.id
     JOIN departments dep ON doc.department_id = dep.id
     JOIN schedule_slots s ON a.slot_id = s.id
     WHERE a.id = ?`
  ).get(appointment.id)

  res.json({ success: true, data: result, message: '报到成功' })
})

export default router
