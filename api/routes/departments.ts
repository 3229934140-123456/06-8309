import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const departments = db.prepare('SELECT * FROM departments').all()
  res.json({ success: true, data: departments })
})

router.get('/:id/doctors', (req: Request, res: Response): void => {
  const { id } = req.params
  const doctors = db.prepare(
    'SELECT d.*, u.name, u.phone FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.department_id = ?'
  ).all(id)
  res.json({ success: true, data: doctors })
})

export default router
