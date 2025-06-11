"use client"

import { useState, useEffect } from "react"
import { CheckCircle, X } from "lucide-react"

interface CustomerNotification {
  type: string
  table: string
  message: string
  timestamp: number
}

export default function CustomerNotificationListener() {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([])

  useEffect(() => {
    const checkForNotifications = () => {
      const stored = localStorage.getItem("customer_notifications")
      if (stored) {
        const allNotifications: CustomerNotification[] = JSON.parse(stored)
        const newNotifications = allNotifications.filter(
          (notif) => notif.timestamp > Date.now() - 30000, // Show notifications from last 30 seconds
        )

        if (newNotifications.length > 0) {
          setNotifications(newNotifications)
          // Clear old notifications
          localStorage.setItem("customer_notifications", JSON.stringify([]))
        }
      }
    }

    // Check immediately and then every 2 seconds
    checkForNotifications()
    const interval = setInterval(checkForNotifications, 2000)

    return () => clearInterval(interval)
  }, [])

  const dismissNotification = (timestamp: number) => {
    setNotifications((prev) => prev.filter((notif) => notif.timestamp !== timestamp))
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 left-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.timestamp}
          className="bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm animate-slide-in-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold">พนักงานรับเรื่องแล้ว!</div>
                <div className="text-sm opacity-90">{notification.message}</div>
              </div>
            </div>
            <button
              onClick={() => dismissNotification(notification.timestamp)}
              className="text-white hover:text-gray-200 ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
