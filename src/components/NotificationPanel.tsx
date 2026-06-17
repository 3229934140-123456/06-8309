import { useNavigate } from 'react-router-dom'
import { CheckCircle, Bell, Info, X, ChevronRight } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import { useAuthStore } from '@/store/authStore'
import type { NotificationType } from '@shared/types'

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

const iconMap: Record<NotificationType, React.ReactNode> = {
  confirmation: <CheckCircle size={18} className="text-primary" />,
  reminder: <Bell size={18} className="text-accent" />,
  system: <Info size={18} className="text-blue-500" />,
}

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { notifications, markAsRead } = useNotificationStore()

  const handleNotificationClick = async (n: { id: number; appointment_id?: number }) => {
    await markAsRead(n.id)
    if (n.appointment_id && user?.role === 'patient') {
      navigate(`/patient/appointments/${n.appointment_id}`)
    }
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6">
          <h2 className="font-serif text-lg font-semibold text-gray-800">通知</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="h-[calc(100vh-4rem)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Bell size={40} className="mb-3" />
              <p className="text-sm">暂无通知</p>
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex cursor-pointer items-center gap-3 border-b border-gray-50 px-6 py-4 transition-colors hover:bg-gray-50 ${
                    !n.is_read ? 'bg-mint/40' : ''
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {iconMap[n.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.content}</p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {new Date(n.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <ChevronRight size={16} className="flex-shrink-0 text-gray-300" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
