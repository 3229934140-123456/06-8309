import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, Lock, Leaf, Heart, ShieldCheck, Activity } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@shared/types'

type RoleTab = 'patient' | 'staff'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [tab, setTab] = useState<RoleTab>('patient')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const role: UserRole = tab === 'patient' ? 'patient' : 'doctor'
    try {
      await login(phone, password, role)
      const user = useAuthStore.getState().user
      if (user?.role === 'patient') navigate('/patient')
      else if (user?.role === 'doctor') navigate('/doctor')
      else if (user?.role === 'receptionist') navigate('/reception')
      else navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left decorative area */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary-dark lg:flex lg:items-center lg:justify-center">
        {/* Decorative circles */}
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute left-1/3 top-2/3 h-40 w-40 rounded-full bg-white/5" />

        {/* Decorative content */}
        <div className="relative z-10 px-16 text-center text-white">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Leaf size={40} className="text-white" />
          </div>
          <h1 className="mb-4 font-serif text-4xl font-bold">仁心诊所</h1>
          <p className="mb-12 text-lg text-white/80">仁心仁术，呵护健康</p>

          <div className="flex justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Heart size={24} />
              </div>
              <span className="text-sm text-white/70">温暖关怀</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <ShieldCheck size={24} />
              </div>
              <span className="text-sm text-white/70">专业信赖</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Activity size={24} />
              </div>
              <span className="text-sm text-white/70">全程守护</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex w-full items-center justify-center bg-warmwhite px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Leaf size={22} className="text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-gray-800">仁心诊所</h1>
          </div>

          <h2 className="mb-2 font-serif text-2xl font-semibold text-gray-800">欢迎回来</h2>
          <p className="mb-8 text-gray-500">请登录您的账户</p>

          {/* Role tabs */}
          <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setTab('patient')}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                tab === 'patient'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              患者
            </button>
            <button
              onClick={() => setTab('staff')}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                tab === 'staff'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              医生&前台
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">手机号</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-primary/30 disabled:opacity-60"
            >
              {isLoading ? '登录中...' : '登 录'}
            </button>
          </form>

          {/* Register link */}
          {tab === 'patient' && (
            <p className="mt-6 text-center text-sm text-gray-500">
              还没有账户？{' '}
              <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
                立即注册
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
