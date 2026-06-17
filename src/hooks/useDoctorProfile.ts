import { useState, useEffect } from 'react'
import type { Doctor, Department } from '@shared/types'
import { api } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'

interface DeptWithDoctors extends Department {
  doctors?: Doctor[]
}

let cachedDoctor: Doctor | null = null

export function useDoctorProfile() {
  const { user } = useAuthStore()
  const [doctor, setDoctor] = useState<Doctor | null>(cachedDoctor)
  const [loading, setLoading] = useState(!cachedDoctor)

  useEffect(() => {
    if (cachedDoctor || !user) return

    let cancelled = false

    async function fetchDoctor() {
      try {
        const departments = await api.get<DeptWithDoctors[]>('/departments')
        if (cancelled) return

        for (const dept of departments) {
          if (dept.doctors) {
            const found = dept.doctors.find((d) => d.user_id === user.id)
            if (found) {
              const doc = { ...found, department: dept }
              cachedDoctor = doc
              setDoctor(doc)
              setLoading(false)
              return
            }
          }
        }
        setLoading(false)
      } catch {
        setLoading(false)
      }
    }

    fetchDoctor()
    return () => { cancelled = true }
  }, [user])

  return { doctor, loading }
}
