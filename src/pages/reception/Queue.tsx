import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  Search,
  RefreshCw,
  Printer,
} from 'lucide-react'
import { api } from '@/utils/api'
import type { AppointmentStatus } from '@shared/types'

interface QueueItem {
  id: number
  patient_name: string
  department_name: string
  doctor_name: string
  doctor_title: string
  start_time: string
  end_time: string
  appointment_date: string
  status: AppointmentStatus
  created_at: string
}

interface ApiResponse {
  success: boolean
  data: QueueItem[]
}

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: { label: '待就诊', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  checked_in: { label: '已报到', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  completed: { label: '已完成', className: 'bg-green-50 text-green-700 border border-green-200' },
  cancelled: { label: '已取消', className: 'bg-gray-50 text-gray-500 border border-gray-200' },
  noshow: { label: '爽约', className: 'bg-red-50 text-red-700 border border-red-200' },
}

export default function Queue() {
  const [appointments, setAppointments] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchQueue = useCallback(async () => {
    try {
      const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd')
      const endpoint = isToday
        ? '/reception/today-queue'
        : `/reception/appointments?date=${selectedDate}`
      const res = await api.get<ApiResponse>(endpoint)
      if (res.success) setAppointments(res.data)
    } catch {
      console.error('获取队列失败')
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    setLoading(true)
    fetchQueue()
  }, [fetchQueue])

  useEffect(() => {
    const timer = setInterval(fetchQueue, 30000)
    return () => clearInterval(timer)
  }, [fetchQueue])

  const handleAction = async (id: number, action: 'checkin' | 'noshow') => {
    setActionLoading(id)
    try {
      await api.patch(`/appointments/${id}/${action}`)
      await fetchQueue()
    } catch (err) {
      alert((err as Error).message || '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = appointments.filter((a) =>
    a.patient_name.includes(search.trim()),
  )

  const stats = {
    total: filtered.length,
    checkedIn: filtered.filter((a) => a.status === 'checked_in').length,
    pending: filtered.filter((a) => a.status === 'pending').length,
    noshow: filtered.filter((a) => a.status === 'noshow').length,
  }

  const grouped = filtered.reduce<Record<string, QueueItem[]>>((acc, item) => {
    const slot = `${item.start_time}-${item.end_time}`
    ;(acc[slot] ??= []).push(item)
    return acc
  }, {})

  const sortedSlots = Object.keys(grouped).sort()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-serif text-2xl font-semibold text-gray-800">当日预约队列</h2>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={fetchQueue}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={14} />
            刷新
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 print:hidden"
          >
            <Printer size={14} />
            打印
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: <Users size={20} />, label: '总预约', value: stats.total, color: 'text-primary bg-primary/10' },
          { icon: <UserCheck size={20} />, label: '已报到', value: stats.checkedIn, color: 'text-amber-600 bg-amber-50' },
          { icon: <Clock size={20} />, label: '待就诊', value: stats.pending, color: 'text-blue-600 bg-blue-50' },
          { icon: <UserX size={20} />, label: '爽约', value: stats.noshow, color: 'text-red-600 bg-red-50' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-2xl font-semibold text-gray-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="搜索患者姓名..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-gray-400">
          <RefreshCw size={20} className="animate-spin" />
          <span className="ml-2">加载中...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center text-gray-400">
          <Users size={40} className="mb-2 opacity-40" />
          <p>暂无预约记录</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedSlots.map((slot) => (
            <div key={slot} className="rounded-xl bg-white shadow-sm border border-gray-100">
              <div className="border-b border-gray-100 px-5 py-3">
                <span className="font-serif text-sm font-semibold text-primary">
                  {slot}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 text-gray-500">
                      <th className="px-5 py-3 text-left font-medium">序号</th>
                      <th className="px-5 py-3 text-left font-medium">患者姓名</th>
                      <th className="px-5 py-3 text-left font-medium">科室</th>
                      <th className="px-5 py-3 text-left font-medium">医生</th>
                      <th className="px-5 py-3 text-left font-medium">时段</th>
                      <th className="px-5 py-3 text-left font-medium">状态</th>
                      <th className="px-5 py-3 text-left font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[slot].map((apt, idx) => (
                      <tr key={apt.id} className="border-b border-gray-50 last:border-0 hover:bg-mint/30">
                        <td className="px-5 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-5 py-3 font-medium text-gray-800">{apt.patient_name}</td>
                        <td className="px-5 py-3 text-gray-600">{apt.department_name}</td>
                        <td className="px-5 py-3 text-gray-600">
                          {apt.doctor_title} {apt.doctor_name}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {format(parseISO(`2000-01-01T${apt.start_time}`), 'HH:mm')}
                          -
                          {format(parseISO(`2000-01-01T${apt.end_time}`), 'HH:mm')}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[apt.status].className}`}>
                            {statusConfig[apt.status].label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {apt.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAction(apt.id, 'checkin')}
                                disabled={actionLoading === apt.id}
                                className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                              >
                                标记报到
                              </button>
                              <button
                                onClick={() => handleAction(apt.id, 'noshow')}
                                disabled={actionLoading === apt.id}
                                className="rounded-lg bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                              >
                                标记爽约
                              </button>
                            </div>
                          )}
                          {apt.status === 'checked_in' && (
                            <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                              已报到
                            </span>
                          )}
                          {apt.status === 'completed' && (
                            <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                              已完成
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
