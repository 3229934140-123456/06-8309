import { useState, useEffect } from 'react'
import { CalendarCheck, Clock, User, Building2, XCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { api } from '@/utils/api'
import type { Appointment, AppointmentStatus } from '@shared/types'

const statusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待就诊', color: 'text-blue-600', bg: 'bg-blue-50' },
  checked_in: { label: '已签到', color: 'text-amber-600', bg: 'bg-amber-50' },
  completed: { label: '已完成', color: 'text-green-600', bg: 'bg-green-50' },
  cancelled: { label: '已取消', color: 'text-gray-500', bg: 'bg-gray-100' },
  noshow: { label: '爽约', color: 'text-red-600', bg: 'bg-red-50' },
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const fetchAppointments = async () => {
    try {
      const data = await api.get<Appointment[]>('/appointments/mine')
      setAppointments(data)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: number) => {
    setCancellingId(id)
    try {
      await api.del(`/appointments/${id}`)
      setToast({ type: 'success', msg: '预约已取消' })
      fetchAppointments()
    } catch (err) {
      setToast({ type: 'error', msg: err instanceof Error ? err.message : '取消失败' })
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <span className="animate-pulse text-sm">加载中...</span>
      </div>
    )
  }

  return (
    <div>
      {toast && (
        <div className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'success' ? 'bg-primary' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {toast.msg}
        </div>
      )}

      <h1 className="mb-6 font-serif text-2xl font-semibold text-gray-800">我的预约</h1>

      {appointments.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-gray-400">
          <CalendarCheck size={48} className="mb-4 opacity-30" />
          <p className="text-sm">暂无预约记录</p>
          <p className="mt-1 text-xs">选择科室开始预约吧</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const cfg = statusConfig[apt.status]
            return (
              <div key={apt.id} className="relative rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(apt.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={14} className="text-gray-400" />
                        <span className="font-medium text-gray-800">
                          {apt.doctor?.user?.name || '医生'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {apt.doctor?.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Building2 size={14} className="text-gray-400" />
                        <span>{apt.doctor?.department?.name || '科室'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CalendarCheck size={14} className="text-gray-400" />
                        <span>{apt.appointment_date}</span>
                      </div>
                      {apt.slot && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock size={14} className="text-gray-400" />
                          <span>{apt.slot.start_time} - {apt.slot.end_time}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {apt.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(apt.id)}
                      disabled={cancellingId === apt.id}
                      className="flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      {cancellingId === apt.id ? '取消中...' : '取消预约'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
