import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/:id/schedule', (req: Request, res: Response): void => {
  const { id } = req.params
  const slots = db.prepare(
    'SELECT * FROM schedule_slots WHERE doctor_id = ? ORDER BY day_of_week, start_time'
  ).all(id)
  res.json({ success: true, data: slots })
})

router.get('/:id/appointments', (req: Request, res: Response): void => {
  const { id } = req.params
  const { date } = req.query
  const appointments = db.prepare(
    `SELECT a.*, u.name as patient_name, u.phone as patient_phone,
     s.start_time, s.end_time, s.day_of_week, s.max_appointments
     FROM appointments a
     JOIN users u ON a.patient_id = u.id
     JOIN schedule_slots s ON a.slot_id = s.id
     WHERE a.doctor_id = ? AND a.appointment_date = ?
     ORDER BY s.start_time`
  ).all(id, date)
  res.json({ success: true, data: appointments })
})

export default router
