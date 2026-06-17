import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)
router.use(requireRole('receptionist'))

router.get('/today-queue', (_req: Request, res: Response): void => {
  const today = new Date().toISOString().slice(0, 10)
  const queue = db.prepare(
    `SELECT a.id, a.appointment_date, a.status, a.created_at,
       p.name as patient_name, p.phone as patient_phone,
       u.name as doctor_name, doc.title as doctor_title, dep.name as department_name,
       s.start_time, s.end_time
     FROM appointments a
     JOIN users p ON a.patient_id = p.id
     JOIN doctors doc ON a.doctor_id = doc.id
     JOIN users u ON doc.user_id = u.id
     JOIN departments dep ON doc.department_id = dep.id
     JOIN schedule_slots s ON a.slot_id = s.id
     WHERE a.appointment_date = ? AND a.status != 'cancelled'
     ORDER BY s.start_time`
  ).all(today)
  res.json({ success: true, data: queue })
})

router.get('/appointments', (req: Request, res: Response): void => {
  const { date } = req.query
  if (!date) {
    res.status(400).json({ success: false, error: '请提供日期参数' })
    return
  }
  const appointments = db.prepare(
    `SELECT a.id, a.appointment_date, a.status, a.created_at,
       p.name as patient_name, p.phone as patient_phone,
       u.name as doctor_name, doc.title as doctor_title, dep.name as department_name,
       s.start_time, s.end_time
     FROM appointments a
     JOIN users p ON a.patient_id = p.id
     JOIN doctors doc ON a.doctor_id = doc.id
     JOIN users u ON doc.user_id = u.id
     JOIN departments dep ON doc.department_id = dep.id
     JOIN schedule_slots s ON a.slot_id = s.id
     WHERE a.appointment_date = ?
     ORDER BY s.start_time`
  ).all(date)
  res.json({ success: true, data: appointments })
})

export default router
