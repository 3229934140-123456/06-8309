import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { api } from '@/utils/api'
import type { Doctor, Department, ScheduleSlot } from '@shared/types'

const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const statusLabels: Record<number, string> = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日' }

function getNext7Days(): Date[] {
  const days: Date[] = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }
  return days
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ScheduleView() {
  const { doctorId } = useParams<{ doctorId: string }>()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [confirmSlot, setConfirmSlot] = useState<ScheduleSlot | null>(null)
  const [booking, setBooking] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const next7Days = useMemo(() => getNext7Days(), [])

  useEffect(() => {
    Promise.all([
      api.get<Department[]>('/departments'),
      api.get<ScheduleSlot[]>(`/doctors/${doctorId}/schedule`),
    ]).then(([depts, slots]) => {
      setSchedule(slots)
      for (const dept of depts) {
        const found = (dept as Department & { doctors?: Doctor[] }).doctors?.find(
          (d) => d.id === Number(doctorId)
        )
        if (found) {
          setDoctor(found)
          setDepartment(dept)
          break
        }
      }
      if (!doctor) {
        setDoctor({ id: Number(doctorId), user_id: 0, department_id: depts[0]?.id || 0, title: '', specialty: '', avatar: '' })
      }
    }).finally(() => setLoading(false))
  }, [doctorId])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const slotsForDate = useMemo(() => {
    const dow = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay()
    return schedule.filter((s) => s.day_of_week === dow)
  }, [selectedDate, schedule])

  const weeklyGrid = useMemo(() => {
    const grid: Record<number, ScheduleSlot[]> = {}
    for (let d = 1; d <= 7; d++) grid[d] = schedule.filter((s) => s.day_of_week === d)
    return grid
  }, [schedule])

  const handleBook = async () => {
    if (!confirmSlot) return
    setBooking(true)
    try {
      await api.post('/appointments', {
        doctorId: Number(doctorId),
        slotId: confirmSlot.id,
        appointmentDate: formatDate(selectedDate),
      })
      setToast({ type: 'success', msg: '预约成功！' })
      setConfirmSlot(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '预约失败'
      if (msg.includes('ban') || msg.includes('爽约') || msg.includes('禁止')) {
        setToast({ type: 'error', msg: '您因多次爽约已被禁止预约，请联系前台' })
      } else {
        setToast({ type: 'error', msg })
      }
    } finally {
      setBooking(false)
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

      <Link to={department ? `/patient/doctors/${department.id}` : '/patient'} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary">
        <ArrowLeft size={16} />
        返回医生列表
      </Link>

      <div className="mb-6 flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-xl font-semibold text-primary">
          {doctor?.user?.name?.charAt(0) || '医'}
        </div>
        <div>
          <h1 className="font-serif text-xl font-semibold text-gray-800">{doctor?.user?.name || '医生'}</h1>
          <p className="mt-0.5 text-sm text-accent">{doctor?.title}</p>
          <p className="mt-0.5 text-sm text-gray-500">{doctor?.specialty}</p>
          {department && <p className="mt-0.5 text-xs text-gray-400">{department.name}</p>}
        </div>
      </div>

      <h2 className="mb-3 font-serif text-lg font-semibold text-gray-800">出诊安排</h2>
      <div className="mb-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left font-medium text-gray-500">时段</th>
              {dayLabels.map((label, i) => (
                <th key={i} className="px-4 py-3 text-center font-medium text-gray-500">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {['上午', '下午'].map((period) => (
              <tr key={period} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium text-gray-700">{period}</td>
                {Array.from({ length: 7 }, (_, i) => i + 1).map((dow) => {
                  const slots = weeklyGrid[dow] || []
                  const periodSlots = slots.filter((s) =>
                    period === '上午' ? s.start_time < '12:00' : s.start_time >= '12:00'
                  )
                  return (
                    <td key={dow} className="px-4 py-3 text-center">
                      {periodSlots.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <CheckCircle size={12} />
                          可约
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 font-serif text-lg font-semibold text-gray-800">预约挂号</h2>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {next7Days.map((d, i) => {
          const isSelected = formatDate(d) === formatDate(selectedDate)
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(d)}
              className={`flex shrink-0 flex-col items-center rounded-xl px-4 py-2.5 text-sm transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="text-xs">{statusLabels[d.getDay() === 0 ? 7 : d.getDay()]}</span>
              <span className="font-medium">{d.getDate()}</span>
            </button>
          )
        })}
      </div>

      {slotsForDate.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-gray-400">
          <CalendarDays size={32} className="mr-2 opacity-40" />
          <span className="text-sm">该日期暂无出诊安排</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slotsForDate.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{slot.start_time} - {slot.end_time}</p>
                  <p className="text-xs text-gray-400">名额 {slot.max_appointments}</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmSlot(slot)}
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                预约
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmSlot(null)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 font-serif text-lg font-semibold text-gray-800">确认预约</h3>
            <div className="mb-2 text-sm text-gray-600">
              <p>医生：{doctor?.user?.name}</p>
              <p>日期：{formatDate(selectedDate)}</p>
              <p>时段：{confirmSlot.start_time} - {confirmSlot.end_time}</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setConfirmSlot(null)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">
                取消
              </button>
              <button onClick={handleBook} disabled={booking} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60">
                {booking ? '预约中...' : '确认预约'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
