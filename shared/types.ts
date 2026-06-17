export type UserRole = 'patient' | 'doctor' | 'receptionist' | 'admin'

export interface User {
  id: number
  phone: string
  name: string
  role: UserRole
  created_at: string
}

export interface Department {
  id: number
  name: string
  description: string
  icon: string
}

export interface Doctor {
  id: number
  user_id: number
  department_id: number
  title: string
  specialty: string
  avatar: string
  user?: User
  department?: Department
}

export interface ScheduleSlot {
  id: number
  doctor_id: number
  day_of_week: number
  start_time: string
  end_time: string
  max_appointments: number
}

export type AppointmentStatus = 'pending' | 'checked_in' | 'completed' | 'cancelled' | 'noshow'

export interface Appointment {
  id: number
  patient_id: number
  doctor_id: number
  slot_id: number
  appointment_date: string
  status: AppointmentStatus
  created_at: string
  patient?: User
  doctor?: Doctor
  slot?: ScheduleSlot
}

export interface HealthProfile {
  id: number
  patient_id: number
  blood_type: string
  allergies: string[]
  chronic_diseases: string[]
  emergency_contact: string
  emergency_phone: string
}

export interface Consultation {
  id: number
  appointment_id: number
  patient_id: number
  doctor_id: number
  chief_complaint: string
  diagnosis: string
  notes: string
  created_at: string
  patient?: User
  doctor?: Doctor
  prescriptions?: Prescription[]
}

export interface Prescription {
  id: number
  consultation_id: number
  medicine_name: string
  dosage: string
  frequency: string
  duration_days: number
  remarks: string
}

export type NotificationType = 'confirmation' | 'reminder' | 'system'

export interface Notification {
  id: number
  user_id: number
  type: NotificationType
  title: string
  content: string
  is_read: boolean
  created_at: string
  appointment_id?: number
}

export interface NoShowRecord {
  id: number
  patient_id: number
  appointment_id: number
  consecutive_count: number
  is_banned: boolean
  banned_until: string | null
  created_at: string
  patient?: User
}

export interface AuthResponse {
  token: string
  user: User
}
