import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/mine', requireRole('patient'), (req: Request, res: Response): void => {
  const userId = (req as any).userId
  const profile = db.prepare('SELECT * FROM health_profiles WHERE patient_id = ?').get(userId) as any
  if (!profile) {
    res.status(404).json({ success: false, error: '健康档案不存在' })
    return
  }
  res.json({
    success: true,
    data: {
      ...profile,
      allergies: JSON.parse(profile.allergies || '[]'),
      chronic_diseases: JSON.parse(profile.chronic_diseases || '[]'),
    },
  })
})

router.put('/mine', requireRole('patient'), (req: Request, res: Response): void => {
  const userId = (req as any).userId
  const { blood_type, allergies, chronic_diseases, emergency_contact, emergency_phone } = req.body

  db.prepare(
    'UPDATE health_profiles SET blood_type = ?, allergies = ?, chronic_diseases = ?, emergency_contact = ?, emergency_phone = ? WHERE patient_id = ?'
  ).run(
    blood_type || '',
    JSON.stringify(allergies || []),
    JSON.stringify(chronic_diseases || []),
    emergency_contact || '',
    emergency_phone || '',
    userId
  )

  const profile = db.prepare('SELECT * FROM health_profiles WHERE patient_id = ?').get(userId) as any
  res.json({
    success: true,
    data: {
      ...profile,
      allergies: JSON.parse(profile.allergies || '[]'),
      chronic_diseases: JSON.parse(profile.chronic_diseases || '[]'),
    },
  })
})

router.get('/:patientId', requireRole('doctor', 'receptionist'), (req: Request, res: Response): void => {
  const { patientId } = req.params
  const profile = db.prepare('SELECT * FROM health_profiles WHERE patient_id = ?').get(patientId) as any
  if (!profile) {
    res.status(404).json({ success: false, error: '健康档案不存在' })
    return
  }
  res.json({
    success: true,
    data: {
      ...profile,
      allergies: JSON.parse(profile.allergies || '[]'),
      chronic_diseases: JSON.parse(profile.chronic_diseases || '[]'),
    },
  })
})

export default router
