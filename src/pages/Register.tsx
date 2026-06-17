import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, Lock, User, Leaf, Heart, Droplets, AlertTriangle, Contact, PhoneCall } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const [form, setForm] = useState({
    phone: '',
    name: '',
    password: '',
    bloodType: '',
    allergies: '',
    chronicDiseases: '',
    emergencyContact: '',
    emergencyPhone: '',
  })
  const [error, setError] = useState('')

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await register(form.phone, form.password, form.name)
      navigate('/patient')
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
    }
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

  return (
    <div className="flex min-h-screen">
      {/* Left decorative area */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary-dark lg:flex lg:items-center lg:justify-center">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute left-1/3 top-2/3 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative z-10 px-16 text-center text-white">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Leaf size={40} className="text-white" />
          </div>
          <h1 className="mb-4 font-serif text-4xl font-bold">仁心诊所</h1>
          <p className="text-lg text-white/80">加入我们，开启健康管理之旅</p>
        </div>
      </div>

      {/* Right register form */}
      <div className="flex w-full items-start justify-center overflow-y-auto bg-warmwhite px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Leaf size={22} className="text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-gray-800">仁心诊所</h1>
          </div>

          <h2 className="mb-2 font-serif text-2xl font-semibold text-gray-800">创建账户</h2>
          <p className="mb-8 text-gray-500">填写信息以注册新账户</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic info */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">手机号</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="请输入手机号"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">姓名</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="请输入姓名"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">密码</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="请设置密码（至少6位）"
                  className={inputClass}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Health profile */}
            <div className="pt-2">
              <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold text-gray-800">
                <Heart size={16} className="text-primary" />
                健康档案（选填）
              </h3>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">血型</label>
              <div className="relative">
                <Droplets size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.bloodType}
                  onChange={(e) => update('bloodType', e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">请选择</option>
                  <option value="A">A型</option>
                  <option value="B">B型</option>
                  <option value="AB">AB型</option>
                  <option value="O">O型</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">过敏史</label>
              <div className="relative">
                <AlertTriangle size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.allergies}
                  onChange={(e) => update('allergies', e.target.value)}
                  placeholder="如：青霉素、花粉（逗号分隔）"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">慢性疾病</label>
              <div className="relative">
                <Heart size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.chronicDiseases}
                  onChange={(e) => update('chronicDiseases', e.target.value)}
                  placeholder="如：高血压、糖尿病（逗号分隔）"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">紧急联系人</label>
                <div className="relative">
                  <Contact size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.emergencyContact}
                    onChange={(e) => update('emergencyContact', e.target.value)}
                    placeholder="联系人姓名"
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">联系电话</label>
                <div className="relative">
                  <PhoneCall size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={form.emergencyPhone}
                    onChange={(e) => update('emergencyPhone', e.target.value)}
                    placeholder="联系电话"
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-primary/30 disabled:opacity-60"
            >
              {isLoading ? '注册中...' : '注 册'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            已有账户？{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
              返回登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
