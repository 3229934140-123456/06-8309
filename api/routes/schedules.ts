import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)
router.use(requireRole('doctor'))

router.get('/', (req: Request, res: Response): void => {
  const { doctorId } = req.query
  if (!doctorId) {
    res.status(400).json({ success: false, error: '请提供医生ID' })
    return
  }
  const slots = db.prepare(
    'SELECT * FROM schedule_slots WHERE doctor_id = ? ORDER BY day_of_week, start_time'
  ).all(doctorId)
  res.json({ success: true, data: slots })
})

router.post('/batch', (req: Request, res: Response): void => {
  const { doctorId, slots } = req.body
  if (!doctorId || !Array.isArray(slots)) {
    res.status(400).json({ success: false, error: '请提供医生ID和排班数据' })
    return
  }

  const deleteSlots = db.prepare('DELETE FROM schedule_slots WHERE doctor_id = ?')
  const insertSlot = db.prepare(
    'INSERT INTO schedule_slots (doctor_id, day_of_week, start_time, end_time, max_appointments) VALUES (?, ?, ?, ?, ?)'
  )

  const transaction = db.transaction(() => {
    deleteSlots.run(doctorId)
    for (const slot of slots) {
      const dayOfWeek = slot.day_of_week ?? slot.dayOfWeek
      const startTime = slot.start_time ?? slot.startTime
      const endTime = slot.end_time ?? slot.endTime
      const maxAppt = slot.max_appointments ?? slot.maxAppointments ?? 1
      insertSlot.run(doctorId, dayOfWeek, startTime, endTime, maxAppt)
    }
  })
  transaction()

  const updatedSlots = db.prepare(
    'SELECT * FROM schedule_slots WHERE doctor_id = ? ORDER BY day_of_week, start_time'
  ).all(doctorId)
  res.json({ success: true, data: updatedSlots })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const result = db.prepare('DELETE FROM schedule_slots WHERE id = ?').run(id)
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: '排班不存在' })
    return
  }
  res.json({ success: true, message: '删除成功' })
})

export default router
