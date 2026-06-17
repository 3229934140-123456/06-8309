import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import departmentRoutes from './routes/departments.js'
import doctorRoutes from './routes/doctors.js'
import scheduleRoutes from './routes/schedules.js'
import appointmentRoutes from './routes/appointments.js'
import consultationRoutes from './routes/consultations.js'
import healthProfileRoutes from './routes/health-profiles.js'
import notificationRoutes from './routes/notifications.js'
import noshowRoutes from './routes/noshow.js'
import receptionRoutes from './routes/reception.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/consultations', consultationRoutes)
app.use('/api/health-profiles', healthProfileRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/noshow', noshowRoutes)
app.use('/api/reception', receptionRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
