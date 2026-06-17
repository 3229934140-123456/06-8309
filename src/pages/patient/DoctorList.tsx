import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Stethoscope } from 'lucide-react'
import { api } from '@/utils/api'
import type { Doctor, Department } from '@shared/types'

export default function DoctorList() {
  const { deptId } = useParams<{ deptId: string }>()
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [department, setDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Doctor[]>(`/departments/${deptId}/doctors`),
      api.get<Department[]>('/departments'),
    ])
      .then(([docList, depts]) => {
        setDoctors(docList)
        setDepartment(depts.find((d) => d.id === Number(deptId)) || null)
      })
      .finally(() => setLoading(false))
  }, [deptId])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <span className="animate-pulse text-sm">加载中...</span>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/patient"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} />
        返回科室列表
      </Link>

      <h1 className="mb-6 font-serif text-2xl font-semibold text-gray-800">
        {department?.name || '科室'}医生
      </h1>

      {doctors.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center text-gray-400">
          <Stethoscope size={40} className="mb-3 opacity-40" />
          <p className="text-sm">暂无医生</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc) => (
            <button
              key={doc.id}
              onClick={() => navigate(`/patient/schedule/${doc.id}`)}
              className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-lg font-semibold text-primary">
                {doc.user?.name?.charAt(0) || '医'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-base font-semibold text-gray-800">
                  {doc.user?.name || '医生'}
                </h3>
                <p className="mt-0.5 text-xs text-accent">{doc.title}</p>
                <p className="mt-1 text-sm text-gray-500">{doc.specialty}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
