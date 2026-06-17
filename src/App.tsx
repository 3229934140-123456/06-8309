import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Departments from '@/pages/patient/Departments'
import DoctorList from '@/pages/patient/DoctorList'
import ScheduleView from '@/pages/patient/ScheduleView'
import Appointments from '@/pages/patient/Appointments'
import Records from '@/pages/patient/Records'
import RecordDetail from '@/pages/patient/RecordDetail'
import Profile from '@/pages/patient/Profile'
import WaitingList from '@/pages/doctor/WaitingList'
import DoctorSchedule from '@/pages/doctor/DoctorSchedule'
import Consultation from '@/pages/doctor/Consultation'
import DoctorRecords from '@/pages/doctor/DoctorRecords'
import Queue from '@/pages/reception/Queue'
import NoShow from '@/pages/reception/NoShow'
import type { UserRole } from '@shared/types'

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const redirectMap: Record<UserRole, string> = {
      patient: '/patient',
      doctor: '/doctor',
      receptionist: '/reception',
      admin: '/patient',
    }
    return <Navigate to={redirectMap[user.role]} replace />
  }

  return <>{children}</>
}

function AuthRedirect() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />

  const redirectMap: Record<UserRole, string> = {
    patient: '/patient',
    doctor: '/doctor',
    receptionist: '/reception',
    admin: '/patient',
  }
  return <Navigate to={redirectMap[user.role]} replace />
}

function AppRoutes() {
  const { loadUser } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Departments />} />
        <Route path="doctors/:deptId" element={<DoctorList />} />
        <Route path="schedule/:doctorId" element={<ScheduleView />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="records" element={<Records />} />
        <Route path="records/:id" element={<RecordDetail />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<WaitingList />} />
        <Route path="schedule" element={<DoctorSchedule />} />
        <Route path="consultation/:id" element={<Consultation />} />
        <Route path="records" element={<DoctorRecords />} />
      </Route>

      <Route
        path="/reception"
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Queue />} />
        <Route path="noshow" element={<NoShow />} />
      </Route>

      <Route path="/" element={<AuthRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}
