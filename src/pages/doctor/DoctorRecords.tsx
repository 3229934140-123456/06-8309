import { useState, useEffect } from 'react'
import { ClipboardList, RefreshCw, ChevronDown, ChevronUp, Pill, UserRound } from 'lucide-react'
import { api } from '@/utils/api'
import { useDoctorProfile } from '@/hooks/useDoctorProfile'
import type { Consultation, Appointment } from '@shared/types'

export default function DoctorRecords() {
  const { doctor, loading: doctorLoading } = useDoctorProfile()
  const [records, setRecords] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    if (!doctor) return
    async function fetchRecords() {
      try {
        const appointments = await api.get<Appointment[]>(
          `/doctors/${doctor.id}/appointments?date=today`
        )
        const completed = appointments.filter((a) => a.status === 'completed')

        if (completed.length === 0) {
          setRecords([])
          setLoading(false)
          return
        }

        const consultations: Consultation[] = []
        for (const apt of completed) {
          try {
            const consults = await api.get<Consultation[]>(
              `/consultations/appointment/${apt.id}`
            )
            consultations.push(...consults)
          } catch {
          }
        }

        consultations.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setRecords(consultations)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchRecords()
  }, [doctor])

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
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
      <div className="flex items-center gap-3">
        <ClipboardList size={24} className="text-primary" />
        <h1 className="font-serif text-2xl font-semibold text-gray-800">就诊记录</h1>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint">
            <ClipboardList size={28} className="text-primary" />
          </div>
          <p className="font-serif text-lg text-gray-500">暂无就诊记录</p>
          <p className="mt-1 text-sm text-gray-400">今日还没有已完成的就诊记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const isExpanded = expandedId === record.id
            return (
              <div
                key={record.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all"
              >
                <button
                  onClick={() => toggleExpand(record.id)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <UserRound size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {record.patient?.name || `患者 #${record.patient_id}`}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {new Date(record.created_at).toLocaleDateString('zh-CN')}{' '}
                        {new Date(record.created_at).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden max-w-[200px] truncate text-xs text-gray-400 sm:block">
                      {record.diagnosis}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-50 px-5 pb-5 pt-4">
                    <div className="space-y-4">
                      <div>
                        <p className="mb-1 text-xs font-medium text-gray-500">主诉</p>
                        <p className="rounded-xl bg-warmwhite p-3 text-sm text-gray-800">
                          {record.chief_complaint}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-gray-500">诊断</p>
                        <p className="rounded-xl bg-warmwhite p-3 text-sm text-gray-800">
                          {record.diagnosis}
                        </p>
                      </div>
                      {record.prescriptions && record.prescriptions.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-medium text-gray-500">处方</p>
                          <div className="space-y-2">
                            {record.prescriptions.map((rx) => (
                              <div
                                key={rx.id}
                                className="flex items-start gap-3 rounded-xl bg-warmwhite p-3"
                              >
                                <Pill size={16} className="mt-0.5 shrink-0 text-accent" />
                                <div className="flex-1 text-sm">
                                  <p className="font-medium text-gray-800">
                                    {rx.medicine_name}
                                  </p>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {rx.dosage} · {rx.frequency} · {rx.duration_days}天
                                    {rx.remarks && ` · ${rx.remarks}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
