import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, User, Building2, Bell, XCircle, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, AlertCircle, QrCode } from 'lucide-react'
import { api } from '@/utils/api'
import { useNotificationStore } from '@/store/notificationStore'
import type { Appointment, AppointmentStatus, Notification } from '@shared/types'

const statusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待就诊', color: 'text-blue-600', bg: 'bg-blue-50' },
  checked_in: { label: '已签到', color: 'text-amber-600', bg: 'bg-amber-50' },
  completed: { label: '已完成', color: 'text-green-600', bg: 'bg-green-50' },
  cancelled: { label: '已取消', color: 'text-gray-500', bg: 'bg-gray-100' },
  noshow: { label: '爽约', color: 'text-red-600', bg: 'bg-red-50' },
}

const checkInConfig: Record<AppointmentStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: '尚未签到，请在就诊当日准时到达医院签到', icon: <Clock size={20} />, color: 'text-blue-600' },
  checked_in: { label: '您已完成签到，请耐心等候叫号', icon: <CheckCircle size={20} />, color: 'text-amber-600' },
  completed: { label: '本次就诊已完成', icon: <CheckCircle size={20} />, color: 'text-green-600' },
  cancelled: { label: '预约已取消', icon: <AlertCircle size={20} />, color: 'text-gray-500' },
  noshow: { label: '您未按时就诊，已记为爽约', icon: <AlertCircle size={20} />, color: 'text-red-600' },
}

export default function AppointmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { markAsRead } = useNotificationStore()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchData(id)
    }
  }, [id])

  const fetchData = async (apptId: string) => {
    setLoading(true)
    setError(null)
    try {
      const [aptData, notifData] = await Promise.all([
        api.get<Appointment>(`/appointments/${apptId}`),
        api.get<Notification[]>('/notifications/mine'),
      ])
      setAppointment(aptData)
      const filtered = notifData.filter((n) => n.appointment_id === Number(apptId))
      setNotifications(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!appointment) return
    setCancelling(true)
    try {
      await api.del(`/appointments/${appointment.id}`)
      navigate('/patient/appointments')
    } catch (err) {
      alert(err instanceof Error ? err.message : '取消失败')
    } finally {
      setCancelling(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      )
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <RefreshCw size={24} className="animate-spin" />
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/patient/appointments')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          返回预约列表
        </button>
        <div className="flex h-64 flex-col items-center justify-center text-gray-400">
          <AlertTriangle size={32} className="mb-2" />
          <p className="font-serif text-lg">{error || '未找到预约记录'}</p>
        </div>
      </div>
    )
  }

  const cfg = statusConfig[appointment.status]
  const checkIn = checkInConfig[appointment.status]
  const doctorName = (appointment as any).doctor_name || appointment.doctor?.user?.name || '医生'
  const doctorTitle = (appointment as any).doctor_title || appointment.doctor?.title || ''
  const departmentName = (appointment as any).department_name || appointment.doctor?.department?.name || '科室'
  const startTime = (appointment as any).start_time || appointment.slot?.start_time || ''
  const endTime = (appointment as any).end_time || appointment.slot?.end_time || ''
  const appointmentNo = (appointment as any).appointment_no || `APT${String(appointment.id).padStart(8, '0')}`
  const patientName = (appointment as any).patient_name || appointment.patient?.name || '患者'
  const patientPhone = (appointment as any).patient_phone || appointment.patient?.phone || ''

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/patient/appointments')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} />
        返回预约列表
      </button>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cfg.color} ${cfg.bg}`}>
              {cfg.label}
            </span>
            <p className="mt-2 text-xs text-gray-400">
              创建于 {new Date(appointment.created_at).toLocaleString('zh-CN')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">预约号</p>
            <p className="font-serif text-lg font-bold text-primary">{appointmentNo}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">医生</p>
              <p className="text-base font-medium text-gray-800">
                {doctorName}
                {doctorTitle && <span className="ml-2 text-sm text-gray-500">{doctorTitle}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Building2 size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">科室</p>
              <p className="text-base font-medium text-gray-800">{departmentName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Calendar size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">就诊日期</p>
              <p className="text-base font-medium text-gray-800">{appointment.appointment_date}</p>
            </div>
          </div>

          {(startTime || endTime) && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Clock size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">时间段</p>
                <p className="text-base font-medium text-gray-800">{startTime} - {endTime}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-serif text-lg font-semibold text-gray-800">签到状态</h2>
        <div className={`flex items-center gap-3 rounded-xl bg-warmwhite p-4 ${checkIn.color}`}>
          {checkIn.icon}
          <p className="text-sm font-medium">{checkIn.label}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <QrCode size={20} className="text-primary" />
          <h2 className="font-serif text-lg font-semibold text-gray-800">到院凭证</h2>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative mb-4 flex h-48 w-48 items-center justify-center rounded-xl border-2 border-primary/20 bg-white p-3">
            <div className="grid h-full w-full grid-cols-8 grid-rows-8 gap-0.5">
              {Array.from({ length: 64 }).map((_, i) => {
                const row = Math.floor(i / 8)
                const col = i % 8
                const isCorner = (row < 2 && col < 2) || (row < 2 && col >= 6) || (row >= 6 && col < 2)
                const isPattern = (row + col) % 3 === 0 || (row * col) % 5 === 0
                const showSquare = isCorner || isPattern
                return (
                  <div
                    key={i}
                    className={`rounded-sm ${showSquare ? 'bg-primary' : 'bg-transparent'}`}
                  />
                )
              })}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white">
                <QrCode size={28} className="text-primary" />
              </div>
            </div>
          </div>
          <p className="mb-1 font-serif text-lg font-semibold text-gray-800">{appointmentNo}</p>
          <p className="text-sm text-gray-600">{patientName}</p>
          {patientPhone && <p className="text-xs text-gray-400">{patientPhone}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={20} className="text-primary" />
          <h2 className="font-serif text-lg font-semibold text-gray-800">通知记录</h2>
        </div>
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">暂无相关通知</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`cursor-pointer rounded-xl p-4 transition-colors hover:bg-mint/30 ${
                  n.is_read ? 'bg-warmwhite' : 'bg-mint/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${n.is_read ? 'text-gray-600' : 'text-gray-800'}`}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <span className="text-[10px] font-medium text-primary">未读</span>
                    )}
                    <span className="text-[11px] text-gray-400">
                      {new Date(n.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {appointment.status === 'pending' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <XCircle size={20} className="text-red-500" />
            <h2 className="font-serif text-lg font-semibold text-gray-800">取消规则</h2>
          </div>
          <div className="mb-5 rounded-xl bg-warmwhite p-4 text-sm text-gray-600">
            <p className="mb-2">· 待就诊状态的预约可以取消</p>
            <p className="mb-2">· 请提前至少 24 小时取消，以免影响您的预约信用</p>
            <p>· 多次爽约将可能被限制预约功能</p>
          </div>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            <XCircle size={18} />
            {cancelling ? '取消中...' : '取消预约'}
          </button>
        </div>
      )}
    </div>
  )
}
