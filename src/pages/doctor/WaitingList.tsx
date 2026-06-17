import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserRound, Clock, Stethoscope, Users, RefreshCw } from 'lucide-react'
import { api } from '@/utils/api'
import { useDoctorProfile } from '@/hooks/useDoctorProfile'
import type { Appointment } from '@shared/types'

export default function WaitingList() {
  const { doctor, loading: doctorLoading } = useDoctorProfile()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAppointments = useCallback(async () => {
    if (!doctor) return
    try {
      const data = await api.get<any[]>(
        `/doctors/${doctor.id}/appointments?date=today`
      )
      const mapped: Appointment[] = data.map((a) => ({
        id: a.id,
        patient_id: a.patient_id,
        doctor_id: a.doctor_id,
        slot_id: a.slot_id,
        appointment_date: a.appointment_date,
        status: a.status,
        created_at: a.created_at,
        patient: { id: a.patient_id, name: a.patient_name, phone: a.patient_phone, role: 'patient' as const, created_at: '' },
        slot: { id: a.slot_id, doctor_id: a.doctor_id, day_of_week: a.day_of_week, start_time: a.start_time, end_time: a.end_time, max_appointments: a.max_appointments },
      }))
      const checkedIn = mapped.filter((a) => a.status === 'checked_in')
      setAppointments(checkedIn)
      if (checkedIn.length > 0 && !selectedId) {
        setSelectedId(checkedIn[0].id)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [doctor])

  useEffect(() => {
    fetchAppointments()
    const interval = setInterval(fetchAppointments, 30000)
    return () => clearInterval(interval)
  }, [fetchAppointments])

  const selected = appointments.find((a) => a.id === selectedId)

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
          <h1 className="font-serif text-2xl font-semibold text-gray-800">候诊列表</h1>
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Users size={14} />
            当前候诊 {appointments.length} 人
          </span>
        </div>
        <button
          onClick={fetchAppointments}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={14} />
          刷新
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint">
            <UserRound size={28} className="text-primary" />
          </div>
          <p className="font-serif text-lg text-gray-500">暂无候诊患者</p>
          <p className="mt-1 text-sm text-gray-400">当前没有已签到的患者</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-1">
            {appointments.map((apt, index) => (
              <button
                key={apt.id}
                onClick={() => setSelectedId(apt.id)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  selectedId === apt.id
                    ? 'border-primary bg-mint shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      selectedId === apt.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {apt.patient?.name || `患者 #${apt.patient_id}`}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>
                        {apt.slot?.start_time} - {apt.slot?.end_time}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selected && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <UserRound size={24} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-gray-800">
                      {selected.patient?.name || `患者 #${selected.patient_id}`}
                    </h2>
                    <p className="text-sm text-gray-500">
                      预约时段：{selected.slot?.start_time} - {selected.slot?.end_time}
                    </p>
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-warmwhite p-4">
                    <p className="text-xs text-gray-500">预约日期</p>
                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {selected.appointment_date}
                    </p>
                  </div>
                  <div className="rounded-xl bg-warmwhite p-4">
                    <p className="text-xs text-gray-500">签到状态</p>
                    <p className="mt-1 text-sm font-medium text-primary">已签到</p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate(`/doctor/consultation/${selected.id}`, {
                      state: { appointment: selected },
                    })
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                >
                  <Stethoscope size={18} />
                  开始接诊
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
