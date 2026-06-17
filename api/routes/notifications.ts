import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/mine', (req: Request, res: Response): void => {
  const userId = (req as any).userId
  const notifications = db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId)
  res.json({ success: true, data: notifications })
})

router.patch('/:id/read', (req: Request, res: Response): void => {
  const userId = (req as any).userId
  const { id } = req.params
  const result = db.prepare(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
  ).run(id, userId)
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: '通知不存在' })
    return
  }
  res.json({ success: true, message: '已标记为已读' })
})

export function createNotification(userId: number, type: string, title: string, content: string, appointmentId?: number): void {
  db.prepare(
    'INSERT INTO notifications (user_id, type, title, content, appointment_id) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, type, title, content, appointmentId ?? null)
}

export default router
