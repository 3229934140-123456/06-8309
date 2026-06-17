import { create } from 'zustand'
import type { Notification } from '@shared/types'
import { api } from '@/utils/api'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  startPolling: () => void
  stopPolling: () => void
}

let pollInterval: ReturnType<typeof setInterval> | null = null

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const data = await api.get<Notification[]>('/notifications/mine')
      const unreadCount = data.filter((n) => !n.is_read).length
      set({ notifications: data, unreadCount })
    } catch {
      // silent fail for notifications
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      const notifications = get().notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      )
      const unreadCount = notifications.filter((n) => !n.is_read).length
      set({ notifications, unreadCount })
    } catch {
      // silent fail
    }
  },

  startPolling: () => {
    if (pollInterval) return
    get().fetchNotifications()
    pollInterval = setInterval(() => {
      get().fetchNotifications()
    }, 30000)
  },

  stopPolling: () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  },
}))
