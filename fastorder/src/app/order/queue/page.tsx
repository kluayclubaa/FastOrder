"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import CustomerQueueStatus from "../../dashboard/customer-queue-status"

export default function QueuePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantId = searchParams.get("restaurantId")
  const orderId = searchParams.get("orderId")

  useEffect(() => {
    if (!restaurantId || !orderId) {
      router.push("/")
    }
  }, [restaurantId, orderId, router])

  if (!restaurantId || !orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold mb-2">ไม่พบข้อมูลออเดอร์</h1>
          <p className="text-gray-600 mb-4">กรุณาสแกน QR Code ใหม่อีกครั้ง</p>
        </div>
      </div>
    )
  }

  return <CustomerQueueStatus />
}
