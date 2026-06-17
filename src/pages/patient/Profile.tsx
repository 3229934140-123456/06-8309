import { useState, useEffect } from 'react'
import { Droplets, AlertCircle, Activity, Phone, User, Pencil, CheckCircle, X } from 'lucide-react'
import { api } from '@/utils/api'
import type { HealthProfile } from '@shared/types'

const bloodTypes = ['A', 'B', 'AB', 'O', 'RH-']

export default function Profile() {
  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [form, setForm] = useState({
    blood_type: '',
    allergies: '',
    chronic_diseases: '',
    emergency_contact: '',
    emergency_phone: '',
  })

  useEffect(() => {
    api.get<HealthProfile>('/health-profiles/mine')
      .then((data) => {
        setProfile(data)
        setForm({
          blood_type: data.blood_type || '',
          allergies: data.allergies?.join(', ') || '',
          chronic_diseases: data.chronic_diseases?.join(', ') || '',
          emergency_contact: data.emergency_contact || '',
          emergency_phone: data.emergency_phone || '',
        })
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        blood_type: form.blood_type,
        allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
        chronic_diseases: form.chronic_diseases.split(',').map((s) => s.trim()).filter(Boolean),
        emergency_contact: form.emergency_contact,
        emergency_phone: form.emergency_phone,
      }
      const updated = await api.put<HealthProfile>('/health-profiles/mine', body)
      setProfile(updated)
      setEditing(false)
      setToast({ type: 'success', msg: '保存成功' })
    } catch (err) {
      setToast({ type: 'error', msg: err instanceof Error ? err.message : '保存失败' })
    } finally {
      setSaving(false)
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
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-gray-800">健康档案</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Pencil size={14} />
            编辑
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false)
                if (profile) {
                  setForm({
                    blood_type: profile.blood_type || '',
                    allergies: profile.allergies?.join(', ') || '',
                    chronic_diseases: profile.chronic_diseases?.join(', ') || '',
                    emergency_contact: profile.emergency_contact || '',
                    emergency_phone: profile.emergency_phone || '',
                  })
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <X size={14} />
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              <CheckCircle size={14} />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-serif text-base font-semibold text-gray-800">基本信息</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">血型</label>
                <select
                  value={form.blood_type}
                  onChange={(e) => setForm({ ...form, blood_type: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">请选择</option>
                  {bloodTypes.map((bt) => (
                    <option key={bt} value={bt}>{bt}型</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-serif text-base font-semibold text-gray-800">过敏与疾病</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">过敏史（逗号分隔）</label>
                <input
                  type="text"
                  value={form.allergies}
                  onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                  placeholder="如：青霉素, 花粉"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">慢性疾病（逗号分隔）</label>
                <input
                  type="text"
                  value={form.chronic_diseases}
                  onChange={(e) => setForm({ ...form, chronic_diseases: e.target.value })}
                  placeholder="如：高血压, 糖尿病"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-serif text-base font-semibold text-gray-800">紧急联系人</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">联系人姓名</label>
                <input
                  type="text"
                  value={form.emergency_contact}
                  onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                  placeholder="请输入紧急联系人姓名"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">联系电话</label>
                <input
                  type="tel"
                  value={form.emergency_phone}
                  onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })}
                  placeholder="请输入紧急联系电话"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Droplets size={18} className="text-primary" />
              <h2 className="font-serif text-base font-semibold text-gray-800">血型</h2>
            </div>
            <p className="text-sm text-gray-600">
              {profile?.blood_type ? `${profile.blood_type}型` : '未填写'}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle size={18} className="text-accent" />
              <h2 className="font-serif text-base font-semibold text-gray-800">过敏史</h2>
            </div>
            {profile?.allergies && profile.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((a, i) => (
                  <span key={i} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">无</p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              <h2 className="font-serif text-base font-semibold text-gray-800">慢性疾病</h2>
            </div>
            {profile?.chronic_diseases && profile.chronic_diseases.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.chronic_diseases.map((d, i) => (
                  <span key={i} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {d}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">无</p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Phone size={18} className="text-primary" />
              <h2 className="font-serif text-base font-semibold text-gray-800">紧急联系人</h2>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={14} className="text-gray-400" />
                <span>{profile?.emergency_contact || '未填写'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400" />
                <span>{profile?.emergency_phone || '未填写'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
