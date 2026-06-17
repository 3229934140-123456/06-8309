import { useState } from 'react'
import { Search, CheckCircle, XCircle, QrCode, User, Clock } from 'lucide-react'
import { api } from '@/utils/api'

interface CheckinResult {
  id: number
  patient_name: string
  patient_phone: string
  doctor_name: string
  doctor_title: string
  department_name: string
  start_time: string
  end_time: string
  appointment_date: string
  status: string
}

export default function QuickCheckin() {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheckin = async () => {
    if (!identifier.trim()) return
    
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const data = await api.post<CheckinResult>('/reception/quick-checkin', {
        identifier: identifier.trim(),
      })
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '报到失败')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheckin()
    }
  }

  const handleReset = () => {
    setIdentifier('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <QrCode size={32} className="text-primary" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-gray-800">快速报到</h2>
        <p className="mt-1 text-sm text-gray-500">输入预约号或手机号快速完成报到</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {!result ? (
          <div className="space-y-4">
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="请输入预约号或手机号"
                className="w-full rounded-xl border border-gray-200 py-4 pl-12 pr-4 text-lg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>

            <button
              onClick={handleCheckin}
              disabled={loading || !identifier.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  处理中...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  快速报到
                </>
              )}
            </button>

            {error && (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-600">
                <XCircle size={20} className="flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 rounded-xl bg-green-50 p-4 text-green-600">
              <CheckCircle size={24} />
              <p className="font-serif text-lg font-semibold">报到成功</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-warmwhite p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">患者姓名</p>
                  <p className="text-sm font-medium text-gray-800">{result.patient_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-warmwhite p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Clock size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">就诊时段</p>
                  <p className="text-sm font-medium text-gray-800">
                    {result.start_time} - {result.end_time}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-warmwhite p-3">
                <p className="text-xs text-gray-500">科室 / 医生</p>
                <p className="mt-1 text-sm font-medium text-gray-800">
                  {result.department_name} / {result.doctor_title} {result.doctor_name}
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              继续报到下一位
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
