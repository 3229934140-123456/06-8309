import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Leaf,
  LayoutGrid,
  CalendarCheck,
  FileText,
  HeartPulse,
  UserRound,
  ClipboardList,
  CalendarDays,
  Stethoscope,
  Users,
  UserX,
  Bell,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import NotificationPanel from './NotificationPanel'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
}

const patientNav: NavItem[] = [
  { label: '科室浏览', icon: <LayoutGrid size={20} />, path: '/patient' },
  { label: '我的预约', icon: <CalendarCheck size={20} />, path: '/patient/appointments' },
  { label: '就诊记录', icon: <FileText size={20} />, path: '/patient/records' },
  { label: '健康档案', icon: <HeartPulse size={20} />, path: '/patient/profile' },
]

const doctorNav: NavItem[] = [
  { label: '候诊列表', icon: <UserRound size={20} />, path: '/doctor' },
  { label: '出诊排班', icon: <CalendarDays size={20} />, path: '/doctor/schedule' },
  { label: '就诊记录', icon: <ClipboardList size={20} />, path: '/doctor/records' },
]

const receptionNav: NavItem[] = [
  { label: '当日队列', icon: <Users size={20} />, path: '/reception' },
  { label: '爽约管理', icon: <UserX size={20} />, path: '/reception/noshow' },
]

const navMap: Record<string, NavItem[]> = {
  patient: patientNav,
  doctor: doctorNav,
  receptionist: receptionNav,
}

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { unreadCount, startPolling, stopPolling } = useNotificationStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  const role = user?.role || 'patient'
  const navItems = navMap[role] || patientNav

  const handleLogout = () => {
    stopPolling()
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-warmwhite">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-100 bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Leaf size={20} className="text-primary" />
          </div>
          <h1 className="font-serif text-xl font-semibold text-gray-800">仁心诊所</h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${role}` || item.path === '/reception'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Stethoscope size={16} className="text-primary" />
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">
                {role === 'patient' ? '患者' : role === 'doctor' ? '医生' : '前台'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-50"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-warmwhite p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Notification panel */}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Mobile close button */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed right-4 top-4 z-50 rounded-lg bg-white p-2 shadow-lg lg:hidden"
        >
          <X size={20} />
        </button>
      )}
    </div>
  )
}
