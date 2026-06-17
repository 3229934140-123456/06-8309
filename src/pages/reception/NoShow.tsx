import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import {
  UserX,
  ShieldOff,
  Search,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Phone,
} from 'lucide-react'
import { api } from '@/utils/api'

interface BannedPatient {
  id: number
  patient_id: number
  patient_name: string
  phone: string
  consecutive_count: number
  is_banned: number
  banned_until: string
  created_at: string
}

interface NoShowRecord {
  id: number
  patient_id: number
  patient_name: string
  appointment_id: number
  consecutive_count: number
  is_banned: number
  banned_until: string | null
  created_at: string
}

interface BannedResponse {
  success: boolean
  data: BannedPatient[]
}

interface RecordsResponse {
  success: boolean
  data: NoShowRecord[]
}

export default function NoShow() {
  const [banned, setBanned] = useState<BannedPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [lifting, setLifting] = useState<number | null>(null)

  const [searchPhone, setSearchPhone] = useState('')
  const [records, setRecords] = useState<NoShowRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchedPatientId, setSearchedPatientId] = useState<number | null>(null)

  const fetchBanned = useCallback(async () => {
    try {
      const res = await api.get<BannedResponse>('/noshow/banned')
      if (res.success) setBanned(res.data)
    } catch {
      console.error('获取受限患者失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBanned()
  }, [fetchBanned])

  const handleLiftBan = async (id: number) => {
    setLifting(id)
    try {
      await api.patch(`/noshow/${id}/lift-ban`)
      await fetchBanned()
      if (searchedPatientId) {
        const res = await api.get<RecordsResponse>(`/noshow/records?patientId=${searchedPatientId}`)
        if (res.success) setRecords(res.data)
      }
      setConfirmId(null)
    } catch (err) {
      alert((err as Error).message || '操作失败')
    } finally {
      setLifting(null)
    }
  }

  const handleSearchRecords = async () => {
    if (!searchPhone.trim()) return
    setRecordsLoading(true)
    setHasSearched(true)
    try {
      const matched = banned.find((b) => b.phone === searchPhone.trim())
      if (!matched) {
        setRecords([])
        setSearchedPatientId(null)
        return
      }
      setSearchedPatientId(matched.patient_id)
      const res = await api.get<RecordsResponse>(`/noshow/records?patientId=${matched.patient_id}`)
      if (res.success) setRecords(res.data)
    } catch {
      setRecords([])
    } finally {
      setRecordsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold text-gray-800">爽约管理</h2>
        <button
          onClick={fetchBanned}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={14} />
          刷新
        </button>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
            <ShieldOff size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">当前受限患者</p>
            <p className="text-2xl font-semibold text-gray-800">{banned.length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <UserX size={18} className="text-red-500" />
            <h3 className="font-serif text-lg font-semibold text-gray-800">被限制预约的患者</h3>
          </div>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center text-gray-400">
            <RefreshCw size={20} className="animate-spin" />
            <span className="ml-2">加载中...</span>
          </div>
        ) : banned.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-gray-400">
            <CheckCircle size={32} className="mb-2 opacity-40" />
            <p>暂无被限制预约的患者</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-gray-500">
                  <th className="px-5 py-3 text-left font-medium">患者姓名</th>
                  <th className="px-5 py-3 text-left font-medium">手机号</th>
                  <th className="px-5 py-3 text-left font-medium">连续爽约次数</th>
                  <th className="px-5 py-3 text-left font-medium">限制截止日期</th>
                  <th className="px-5 py-3 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {banned.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-mint/30">
                    <td className="px-5 py-3 font-medium text-gray-800">{p.patient_name}</td>
                    <td className="px-5 py-3 text-gray-600">{p.phone}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                        {p.consecutive_count}次
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {p.banned_until
                        ? format(parseISO(p.banned_until), 'yyyy-MM-dd HH:mm')
                        : '-'}
                    </td>
                    <td className="px-5 py-3">
                      {confirmId === p.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">确认解除？</span>
                          <button
                            onClick={() => handleLiftBan(p.id)}
                            disabled={lifting === p.id}
                            className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                          >
                            确认
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(p.id)}
                          className="rounded-lg border border-accent px-3 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                        >
                          解除限制
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-primary" />
            <h3 className="font-serif text-lg font-semibold text-gray-800">爽约记录查询</h3>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="输入患者手机号查询..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchRecords()}
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleSearchRecords}
              disabled={recordsLoading}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              <Search size={14} />
              查询
            </button>
          </div>
        </div>

        {recordsLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-400">
            <RefreshCw size={20} className="animate-spin" />
            <span className="ml-2">查询中...</span>
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-gray-500">
                  <th className="px-5 py-3 text-left font-medium">预约日期</th>
                  <th className="px-5 py-3 text-left font-medium">医生</th>
                  <th className="px-5 py-3 text-left font-medium">连续爽约次数</th>
                  <th className="px-5 py-3 text-left font-medium">限制状态</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-mint/30">
                    <td className="px-5 py-3 text-gray-600">
                      {format(parseISO(r.created_at), 'yyyy-MM-dd')}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{r.patient_name}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                        {r.consecutive_count}次
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {r.is_banned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                          <AlertTriangle size={12} />
                          已限制至 {r.banned_until ? format(parseISO(r.banned_until), 'yyyy-MM-dd') : '-'}
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                          正常
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          hasSearched && !recordsLoading && (
            <div className="flex h-32 flex-col items-center justify-center text-gray-400">
              <UserX size={32} className="mb-2 opacity-40" />
              <p>未找到相关爽约记录</p>
            </div>
          )
        )}
      </div>

      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmId(null)}>
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                <AlertTriangle size={20} className="text-accent" />
              </div>
              <h4 className="font-serif text-lg font-semibold text-gray-800">确认解除限制</h4>
            </div>
            <p className="mb-6 text-sm text-gray-600">
              解除限制后，该患者将可以重新进行预约。确定要解除此患者的预约限制吗？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => handleLiftBan(confirmId)}
                disabled={lifting !== null}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                确认解除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
