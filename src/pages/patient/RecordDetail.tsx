import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, AlertTriangle, Stethoscope, MessageSquare, ClipboardList, Pill } from 'lucide-react'
import { api } from '@/utils/api'
import type { Consultation } from '@shared/types'

export default function RecordDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      api
        .get<Consultation>(`/consultations/${id}`)
        .then((data) => {
          setRecord(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <RefreshCw size={24} className="animate-spin" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-gray-400">
        <AlertTriangle size={32} className="mb-2" />
        <p className="font-serif text-lg">未找到就诊记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/patient/records')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} />
        返回记录列表
      </button>

      <div className="flex items-center gap-3">
        <Stethoscope size={24} className="text-primary" />
        <h1 className="font-serif text-2xl font-semibold text-gray-800">就诊记录详情</h1>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-800">
            {(record as any).doctor_name || record.doctor?.user?.name || '医生'}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(record.created_at).toLocaleDateString('zh-CN')}
          </span>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-warmwhite p-4">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare size={16} className="text-primary" />
              <span className="text-sm font-medium text-gray-700">主诉</span>
            </div>
            <p className="text-sm text-gray-800">{record.chief_complaint || '无主诉记录'}</p>
          </div>

          <div className="rounded-xl bg-warmwhite p-4">
            <div className="mb-2 flex items-center gap-2">
              <ClipboardList size={16} className="text-primary" />
              <span className="text-sm font-medium text-gray-700">诊断</span>
            </div>
            <p className="text-sm text-gray-800">{record.diagnosis || '待诊断'}</p>
          </div>
        </div>
      </div>

      {record.prescriptions && record.prescriptions.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Pill size={20} className="text-primary" />
            <h2 className="font-serif text-lg font-semibold text-gray-800">处方</h2>
          </div>
          <div className="space-y-3">
            {record.prescriptions.map((rx, index) => (
              <div key={rx.id || index} className="rounded-xl border border-gray-100 bg-warmwhite p-4">
                <p className="mb-2 text-sm font-medium text-gray-800">{rx.medicine_name}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <span className="text-gray-400">剂量：</span>
                    <span className="text-gray-700">{rx.dosage || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">频率：</span>
                    <span className="text-gray-700">{rx.frequency || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">天数：</span>
                    <span className="text-gray-700">{rx.duration_days ? `${rx.duration_days}天` : '-'}</span>
                  </div>
                  {rx.remarks && (
                    <div className="col-span-2">
                      <span className="text-gray-400">备注：</span>
                      <span className="text-gray-700">{rx.remarks}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
