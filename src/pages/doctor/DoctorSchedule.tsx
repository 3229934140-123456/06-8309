import { useState, useEffect } from 'react'
import { CalendarDays, Save, Check, RefreshCw } from 'lucide-react'
import { api } from '@/utils/api'
import { useDoctorProfile } from '@/hooks/useDoctorProfile'
import type { ScheduleSlot } from '@shared/types'

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const TIME_SLOTS: string[] = []
for (let h = 8; h <= 16; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00-${String(h).padStart(2, '0')}:30`)
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30-${String(h + 1).padStart(2, '0')}:00`)
}

interface SlotKey {
  day: number
  timeSlot: string
}

function slotKey(day: number, timeSlot: string): string {
  return `${day}-${timeSlot}`
}

function parseTimeSlot(ts: string): { start: string; end: string } {
  const [start, end] = ts.split('-')
  return { start, end }
}

export default function DoctorSchedule() {
  const { doctor, loading: doctorLoading } = useDoctorProfile()
  const [savedSlots, setSavedSlots] = useState<ScheduleSlot[]>([])
  const [toggledOff, setToggledOff] = useState<Set<string>>(new Set())
  const [toggledOn, setToggledOn] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!doctor) return
    async function fetchSchedule() {
      try {
        const data = await api.get<ScheduleSlot[]>(`/schedules?doctorId=${doctor.id}`)
        setSavedSlots(data)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchSchedule()
  }, [doctor])

  const isSlotActive = (day: number, timeSlot: string): boolean => {
    const key = slotKey(day, timeSlot)
    if (toggledOff.has(key)) return false
    if (toggledOn.has(key)) return true
    const { start, end } = parseTimeSlot(timeSlot)
    return savedSlots.some(
      (s) => s.day_of_week === day && s.start_time === start && s.end_time === end
    )
  }

  const toggleSlot = (day: number, timeSlot: string) => {
    const key = slotKey(day, timeSlot)
    const { start, end } = parseTimeSlot(timeSlot)
    const isOriginal = savedSlots.some(
      (s) => s.day_of_week === day && s.start_time === start && s.end_time === end
    )

    if (isOriginal) {
      setToggledOff((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
      setToggledOn((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    } else {
      setToggledOn((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
      setToggledOff((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const handleSave = async () => {
    if (!doctor) return
    setSaving(true)
    setMessage('')
    try {
      const slots: { day_of_week: number; start_time: string; end_time: string; max_appointments: number }[] = []
      for (let day = 1; day <= 7; day++) {
        for (const ts of TIME_SLOTS) {
          if (isSlotActive(day, ts)) {
            const { start, end } = parseTimeSlot(ts)
            slots.push({ day_of_week: day, start_time: start, end_time: end, max_appointments: 1 })
          }
        }
      }
      await api.post('/schedules/batch', { doctor_id: doctor.id, slots })
      setMessage('排班保存成功')
      const data = await api.get<ScheduleSlot[]>(`/schedules?doctorId=${doctor.id}`)
      setSavedSlots(data)
      setToggledOff(new Set())
      setToggledOn(new Set())
      setTimeout(() => setMessage(''), 3000)
    } catch (e) {
      setMessage('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  if (doctorLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <RefreshCw size={24} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays size={24} className="text-primary" />
          <h1 className="font-serif text-2xl font-semibold text-gray-800">出诊排班</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? '保存中...' : '保存排班'}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.includes('成功')
              ? 'bg-primary/10 text-primary'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {message}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">时段</th>
              {DAYS.map((d, i) => (
                <th key={d} className="px-2 py-3 text-center text-xs font-medium text-gray-500">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((ts) => (
              <tr key={ts} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap">{ts}</td>
                {DAYS.map((_, dayIndex) => {
                  const day = dayIndex + 1
                  const active = isSlotActive(day, ts)
                  return (
                    <td key={day} className="px-2 py-2 text-center">
                      <button
                        onClick={() => toggleSlot(day, ts)}
                        className={`flex h-8 w-full items-center justify-center rounded-lg text-xs font-medium transition-all ${
                          active
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {active && <Check size={14} />}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">点击格子可添加或移除出诊时段，完成后点击「保存排班」</p>
    </div>
  )
}
