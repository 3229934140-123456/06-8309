import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.post('/', (req: Request, res: Response): void => {
  const { appointment_id, patient_id, doctor_id, chief_complaint, diagnosis, notes, prescriptions } = req.body
  if (!appointment_id || !patient_id || !doctor_id) {
    res.status(400).json({ success: false, error: '请填写完整诊疗信息' })
    return
  }

  const insertConsultation = db.prepare(
    'INSERT INTO consultations (appointment_id, patient_id, doctor_id, chief_complaint, diagnosis, notes) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertPrescription = db.prepare(
    'INSERT INTO prescriptions (consultation_id, medicine_name, dosage, frequency, duration_days, remarks) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const updateAppointment = db.prepare("UPDATE appointments SET status = 'completed' WHERE id = ?")

  const transaction = db.transaction(() => {
    const result = insertConsultation.run(appointment_id, patient_id, doctor_id, chief_complaint || '', diagnosis || '', notes || '')
    const consultationId = result.lastInsertRowid

    if (Array.isArray(prescriptions)) {
      for (const p of prescriptions) {
        insertPrescription.run(
          consultationId,
          p.medicine_name,
          p.dosage || '',
          p.frequency || '',
          p.duration_days || null,
          p.remarks || ''
        )
      }
    }

    updateAppointment.run(appointment_id)
    return consultationId
  })

  const consultationId = transaction()
  const consultation = db.prepare('SELECT * FROM consultations WHERE id = ?').get(consultationId) as any
  const prescs = db.prepare('SELECT * FROM prescriptions WHERE consultation_id = ?').all(consultationId)
  res.status(201).json({ success: true, data: { ...consultation, prescriptions: prescs } })
})

router.get('/patient/:patientId', (req: Request, res: Response): void => {
  const { patientId } = req.params
  const consultations = db.prepare(
    `SELECT c.*, u.name as doctor_name FROM consultations c JOIN doctors doc ON c.doctor_id = doc.id JOIN users u ON doc.user_id = u.id WHERE c.patient_id = ? ORDER BY c.created_at DESC`
  ).all(patientId)

  const results = consultations.map((c: any) => {
    const prescriptions = db.prepare('SELECT * FROM prescriptions WHERE consultation_id = ?').all(c.id)
    return { ...c, prescriptions }
  })

  res.json({ success: true, data: results })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const consultation = db.prepare(
    'SELECT c.*, u.name as doctor_name FROM consultations c JOIN doctors doc ON c.doctor_id = doc.id JOIN users u ON doc.user_id = u.id WHERE c.id = ?'
  ).get(id) as any
  if (!consultation) {
    res.status(404).json({ success: false, error: '诊疗记录不存在' })
    return
  }
  const prescriptions = db.prepare('SELECT * FROM prescriptions WHERE consultation_id = ?').all(id)
  res.json({ success: true, data: { ...consultation, prescriptions } })
})

export default router
