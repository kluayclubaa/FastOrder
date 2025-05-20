"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import CustomerOrderPage from "../dashboard/customer-order-page"

export default function OrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantId = searchParams.get("id")

  useEffect(() => {
    if (!restaurantId) {
      router.push("/")
    }
  }, [restaurantId, router])

  if (!restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold mb-2">ไม่พบข้อมูลร้านอาหาร</h1>
          <p className="text-gray-600 mb-4">กรุณาสแกน QR Code ใหม่อีกครั้ง</p>
        </div>
      </div>
    )
  }

  return <CustomerOrderPage />
}
