import { create } from 'zustand'
import type { User, AuthResponse, UserRole } from '@shared/types'
import { api } from '@/utils/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (phone: string, password: string, role: UserRole) => Promise<void>
  register: (phone: string, password: string, name: string, healthProfile?: {
    bloodType: string
    allergies: string
    chronicDiseases: string
    emergencyContact: string
    emergencyPhone: string
  }) => Promise<void>
  logout: () => void
  loadUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (phone, password, role) => {
    set({ isLoading: true })
    try {
      const data = await api.post<AuthResponse>('/auth/login', { phone, password, role })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (phone, password, name, healthProfile) => {
    set({ isLoading: true })
    try {
      const data = await api.post<AuthResponse>('/auth/register', { phone, password, name, ...healthProfile })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  loadUser: () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token) {
      const user = userStr ? (JSON.parse(userStr) as User) : null
      set({ token, user, isAuthenticated: true })
    }
  },
}))
