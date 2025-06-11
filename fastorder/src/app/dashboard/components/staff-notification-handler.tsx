"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { Bell, Check, X } from "lucide-react"

interface StaffCall {
  id: string
  table: string
  createdAt: any
  status: string
}

interface StaffNotificationHandlerProps {
  restaurantId: string
  onNotificationReceived?: (call: StaffCall) => void
}

export default function StaffNotificationHandler({
  restaurantId,
  onNotificationReceived,
}: StaffNotificationHandlerProps) {
  const [staffCalls, setStaffCalls] = useState<StaffCall[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    if (!restaurantId) return

    const staffCallQuery = query(collection(db, "users", restaurantId, "call_staff"), where("status", "==", "pending"))

    const unsubscribe = onSnapshot(staffCallQuery, (snapshot) => {
      const calls: StaffCall[] = []
      snapshot.forEach((doc) => {
        calls.push({ id: doc.id, ...doc.data() } as StaffCall)
      })

      // Check for new notifications
      if (calls.length > staffCalls.length && staffCalls.length > 0) {
        const newCall = calls[calls.length - 1]
        if (onNotificationReceived) {
          onNotificationReceived(newCall)
        }

        // Play notification sound
        try {
          const audio = new Audio("/notification.mp3")
          audio.play().catch(console.error)
        } catch (error) {
          console.error("Error playing notification sound:", error)
        }
      }

      setStaffCalls(calls)
    })

    return () => unsubscribe()
  }, [restaurantId, staffCalls.length, onNotificationReceived])

  const handleConfirmCall = async (callId: string, table: string) => {
    try {
      const callRef = doc(db, "users", restaurantId, "call_staff", callId)
      await updateDoc(callRef, {
        status: "confirmed",
        confirmedAt: serverTimestamp(),
      })

      // Create customer notification
      const notificationData = {
        type: "staff_confirmed",
        table: table,
        message: `พนักงานได้รับเรื่องการเรียกจากโต๊ะ ${table} แล้ว กำลังไปหาคุณ`,
        timestamp: Date.now(),
      }

      // Store in localStorage for customer notification
      const existingNotifications = JSON.parse(localStorage.getItem("customer_notifications") || "[]")
      existingNotifications.push(notificationData)
      localStorage.setItem("customer_notifications", JSON.stringify(existingNotifications))

      // Show success message
      alert(`รับเรื่องการเรียกจากโต๊ะ ${table} แล้ว`)
    } catch (error) {
      console.error("Error confirming staff call:", error)
      alert("เกิดข้อผิดพลาดในการรับเรื่อง")
    }
  }

  if (staffCalls.length === 0) return null

  return (
    <>
      {/* Floating notification button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-all duration-300 animate-pulse"
        >
          <Bell className="h-6 w-6" />
          {staffCalls.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-800 text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
              {staffCalls.length}
            </span>
          )}
        </button>
      </div>

      {/* Notification panel */}
      {showNotifications && (
        <div className="fixed top-16 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-red-50">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-red-800 flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                แจ้งเตือนเรียกพนักงาน
              </h3>
              <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {staffCalls.map((call) => (
              <div key={call.id} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-orange-800">โต๊ะ {call.table}</div>
                    <div className="text-xs text-orange-600">
                      {call.createdAt?.toDate
                        ? new Date(call.createdAt.toDate()).toLocaleTimeString("th-TH")
                        : "เมื่อสักครู่"}
                    </div>
                  </div>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">รอการตอบรับ</span>
                </div>

                <button
                  onClick={() => handleConfirmCall(call.id, call.table)}
                  className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-bold flex items-center justify-center"
                >
                  <Check className="h-4 w-4 mr-2" />
                  รับเรื่องแล้ว
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
