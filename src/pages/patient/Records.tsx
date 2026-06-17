import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Stethoscope, MessageSquare, ClipboardList } from 'lucide-react'
import { api } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'
import type { Consultation } from '@shared/types'

export default function Records() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [records, setRecords] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      api.get<Consultation[]>(`/consultations/patient/${user.id}`)
        .then(setRecords)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <span className="animate-pulse text-sm">加载中...</span>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-gray-800">就诊记录</h1>

      {records.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-gray-400">
          <FileText size={48} className="mb-4 opacity-30" />
          <p className="text-sm">暂无就诊记录</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-6">
            {records.map((record) => (
              <button
                key={record.id}
                onClick={() => navigate(`/patient/records/${record.id}`)}
                className="group relative flex w-full gap-4 text-left"
              >
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Stethoscope size={18} className="text-primary" />
                </div>

                <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm transition-all group-hover:shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">
                      {record.doctor?.user?.name || (record as any).doctor_name || '医生'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(record.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                      <MessageSquare size={14} className="mt-0.5 shrink-0 text-gray-400" />
                      <span className="line-clamp-1">{record.chief_complaint || '无主诉记录'}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                      <ClipboardList size={14} className="mt-0.5 shrink-0 text-gray-400" />
                      <span className="line-clamp-1">{record.diagnosis || '待诊断'}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
