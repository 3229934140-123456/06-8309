import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Heart, Bone, Baby, Flower2, Droplets, Leaf, Smile, Eye } from 'lucide-react'
import { api } from '@/utils/api'
import type { Department } from '@shared/types'

const iconMap: Record<string, React.ReactNode> = {
  heart: <Heart size={28} />,
  bone: <Bone size={28} />,
  baby: <Baby size={28} />,
  flower: <Flower2 size={28} />,
  drop: <Droplets size={28} />,
  leaf: <Leaf size={28} />,
  tooth: <Smile size={28} />,
  eye: <Eye size={28} />,
}

export default function Departments() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get<Department[]>('/departments')
      .then(setDepartments)
      .finally(() => setLoading(false))
  }, [])

  const filtered = departments.filter((d) =>
    d.name.includes(search) || d.description.includes(search)
  )

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <span className="animate-pulse text-sm">加载中...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-2xl font-semibold text-gray-800">选择科室</h1>
        <div className="relative w-full sm:w-72">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索科室..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center text-gray-400">
          <Search size={40} className="mb-3 opacity-40" />
          <p className="text-sm">未找到匹配的科室</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((dept) => (
            <button
              key={dept.id}
              onClick={() => navigate(`/patient/doctors/${dept.id}`)}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-mint p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                {iconMap[dept.icon] || <Leaf size={28} />}
              </div>
              <h3 className="font-serif text-base font-semibold text-gray-800">{dept.name}</h3>
              <p className="text-xs leading-relaxed text-gray-500">{dept.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
