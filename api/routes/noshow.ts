import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)
router.use(requireRole('receptionist', 'admin'))

router.get('/records', (req: Request, res: Response): void => {
  const { patientId } = req.query
  if (patientId) {
    const records = db.prepare(
      'SELECT n.*, u.name as patient_name FROM noshow_records n JOIN users u ON n.patient_id = u.id WHERE n.patient_id = ? ORDER BY n.created_at DESC'
    ).all(patientId)
    res.json({ success: true, data: records })
    return
  }
  const records = db.prepare(
    'SELECT n.*, u.name as patient_name FROM noshow_records n JOIN users u ON n.patient_id = u.id ORDER BY n.created_at DESC'
  ).all()
  res.json({ success: true, data: records })
})

router.get('/banned', (_req: Request, res: Response): void => {
  const banned = db.prepare(
    'SELECT n.*, u.name as patient_name, u.phone FROM noshow_records n JOIN users u ON n.patient_id = u.id WHERE n.is_banned = 1 AND n.banned_until > datetime("now") ORDER BY n.banned_until DESC'
  ).all()
  res.json({ success: true, data: banned })
})

router.patch('/:id/lift-ban', (req: Request, res: Response): void => {
  const { id } = req.params
  const record = db.prepare('SELECT * FROM noshow_records WHERE id = ?').get(id) as any
  if (!record) {
    res.status(404).json({ success: false, error: '记录不存在' })
    return
  }
  db.prepare('UPDATE noshow_records SET is_banned = 0, banned_until = NULL WHERE id = ?').run(id)
  res.json({ success: true, message: '已解除禁约' })
})

export default router
