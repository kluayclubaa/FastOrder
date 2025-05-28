"use client"

import { useState, useEffect } from "react"
import { Clock, CheckCircle, Utensils, ArrowLeft, X, Star, Receipt, ChevronDown, ChevronUp } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore"
import { useRouter, useSearchParams } from "next/navigation"

type Order = {
  id: string
  table: string
  status: string
  totalAmount: number
  items: any[]
  createdAt: any
  updatedAt: any
  queueNumber?: number
  userId?: string
}

export default function CustomerQueueStatus() {
  const [orders, setOrders] = useState<Order[]>([])
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [showCompletionModal, setShowCompletionModal] = useState<{
    show: boolean
    order: Order | null
    type: "completed" | "cancelled"
  }>({
    show: false,
    order: null,
    type: "completed",
  })

  const restaurantId = searchParams.get("restaurantId")
  const orderId = searchParams.get("orderId")
  const tableNumber = searchParams.get("table")

  useEffect(() => {
    const userId = searchParams.get("userId") || localStorage.getItem("userId")

    if (userId) {
      setUserId(userId)
    }

    if (!restaurantId) {
      setError("ข้อมูลร้านอาหารไม่ถูกต้อง")
      setLoading(false)
      return
    }

    // Fetch restaurant info
    const fetchRestaurantInfo = async () => {
      try {
        const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", restaurantId)))
        if (!userDoc.empty) {
          setRestaurantInfo(userDoc.docs[0].data())
        }
      } catch (error) {
        console.error("Error fetching restaurant info:", error)
      }
    }

    fetchRestaurantInfo()

    // Get table number from orderId if not provided
    const setupOrderListener = async () => {
      let tableNum = tableNumber

      // If we have orderId but no table number, get it from the order
      if (orderId && !tableNum) {
        try {
          const orderRef = doc(db, "users", restaurantId, "orders", orderId)
          const orderSnap = await getDocs(
            query(collection(db, "users", restaurantId, "orders"), where("__name__", "==", orderId)),
          )
          if (!orderSnap.empty) {
            tableNum = orderSnap.docs[0].data().table
          }
        } catch (error) {
          console.error("Error fetching order for table:", error)
        }
      }

      if (!userId && !tableNum) {
        setError("ไม่พบข้อมูลผู้ใช้หรือโต๊ะ")
        setLoading(false)
        return
      }

      // Listen to all orders for this table
      const ordersQuery = userId
        ? query(collection(db, "users", restaurantId, "orders"), where("userId", "==", userId))
        : query(collection(db, "users", restaurantId, "orders"), where("table", "==", tableNum))

      const unsubscribe = onSnapshot(
        ordersQuery,
        (snapshot) => {
          const ordersList: Order[] = []
          let foundCurrentOrder: Order | null = null

          snapshot.forEach((doc) => {
            const data = doc.data() as Omit<Order, "id">
            const order: Order = { id: doc.id, ...data }
            ordersList.push(order)

            // Set current order if it matches orderId
            if (orderId && doc.id === orderId) {
              foundCurrentOrder = order
            }
          })

          // Sort by creation date, newest first
          ordersList.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0
            return bTime - aTime
          })

          setOrders(ordersList)

          // If we have a specific orderId, set it as current order
          if (foundCurrentOrder) {
            setCurrentOrder(foundCurrentOrder)
            // Auto-expand the current order
            setExpandedOrders(new Set([(foundCurrentOrder as Order).id]))
          } else if (ordersList.length > 0) {
            // If no specific order, use the newest one as current
            const newestOrder = ordersList[0]
            setCurrentOrder(newestOrder)
            setExpandedOrders(new Set([newestOrder.id]))
          }

          setLoading(false)
        },
        (error) => {
          console.error("Error listening to orders:", error)
          setError("เกิดข้อผิดพลาดในการโหลดข้อมูล")
          setLoading(false)
        },
      )

      return unsubscribe
    }

    setupOrderListener()
  }, [restaurantId, orderId, tableNumber, userId])

  // Effect to detect completed/cancelled orders and show download prompt
  useEffect(() => {
    orders.forEach((order) => {
      if ((order.status === "completed" || order.status === "cancelled") && !showCompletionModal.show) {
        // Check if this order has been dismissed in this session
        const wasDismissedInSession = sessionStorage.getItem(`order-${order.id}-dismissed`)

        // Check if this is a new session by comparing with order completion time
        const orderCompletedTime = order.updatedAt?.toDate ? order.updatedAt.toDate().getTime() : 0
        const sessionStartTime = sessionStorage.getItem("session-start-time")

        if (!sessionStartTime) {
          // First time in this session, record the start time
          sessionStorage.setItem("session-start-time", Date.now().toString())
        }

        const sessionStart = Number.parseInt(sessionStartTime || Date.now().toString())
        const timeDifference = sessionStart - orderCompletedTime

        // Don't show modal if:
        // 1. Already dismissed in this session
        // 2. Order was completed before this session started (more than 30 seconds ago)
        if (!wasDismissedInSession && timeDifference < 30000) {
          setShowCompletionModal({
            show: true,
            order: order,
            type: order.status as "completed" | "cancelled",
          })
        }
      }
    })
  }, [orders, showCompletionModal.show])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          title: "รอการยืนยัน",
          description: "ร้านค้ากำลังตรวจสอบออเดอร์ของคุณ",
          color: "yellow",
          bgColor: "bg-yellow-50",
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          badgeColor: "bg-yellow-100 text-yellow-800",
          icon: <Clock className="h-8 w-8" />,
        }
      case "cooking":
        return {
          title: "กำลังเตรียมอาหาร",
          description: "ร้านค้ากำลังปรุงอาหารให้คุณ",
          color: "orange",
          bgColor: "bg-orange-50",
          iconBg: "bg-orange-100",
          iconColor: "text-orange-600",
          badgeColor: "bg-orange-100 text-orange-800",
          icon: <Utensils className="h-8 w-8" />,
        }
      case "served":
        return {
          title: "เสิร์ฟแล��ว",
          description: "อาหารของคุณพร้อมเสิร์ฟแล้ว",
          color: "green",
          bgColor: "bg-green-50",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          badgeColor: "bg-green-100 text-green-800",
          icon: <CheckCircle className="h-8 w-8" />,
        }
      case "completed":
        return {
          title: "เสร็จสิ้น",
          description: "ขอบคุณที่ใช้บริการ",
          color: "green",
          bgColor: "bg-green-50",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          badgeColor: "bg-green-100 text-green-800",
          icon: <CheckCircle className="h-8 w-8" />,
        }
      case "cancelled":
        return {
          title: "ยกเลิกแล้ว",
          description: "ออเดอร์นี้ถูกยกเลิก",
          color: "red",
          bgColor: "bg-red-50",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          badgeColor: "bg-red-100 text-red-800",
          icon: <X className="h-8 w-8" />,
        }
      default:
        return {
          title: "ไม่ทราบสถานะ",
          description: "",
          color: "gray",
          bgColor: "bg-gray-50",
          iconBg: "bg-gray-100",
          iconColor: "text-gray-600",
          badgeColor: "bg-gray-100 text-gray-800",
          icon: <Clock className="h-8 w-8" />,
        }
    }
  }

  // Generate receipt content
  const generateReceiptContent = (order: Order) => {
    const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date()
    const restaurantName = restaurantInfo?.storeName || restaurantInfo?.restaurantName || "ร้านอาหาร"

    // แก้ไขการแสดงผลภาษาไทย
    let content = `
=================================
${restaurantName}
=================================
วันที่: ${date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })}
เวลา: ${date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}
โต๊ะ: ${order.table}
ออเดอร์: #${order.id.slice(-6).toUpperCase()}
${userId ? `ลูกค้า: ${userId.slice(-6).toUpperCase()}` : ""}
=================================

รายการอาหาร:
`

    order.items?.forEach((item, index) => {
      const itemTotal =
        (item.price + (item.selectedOptions?.reduce((sum: number, opt: any) => sum + opt.price, 0) || 0)) *
        item.quantity
      content += `${index + 1}. ${item.name} x${item.quantity}\n`
      content += `   ฿${item.price.toFixed(2)}`

      if (item.selectedOptions && item.selectedOptions.length > 0) {
        content += `\n   ตัวเลือก: ${item.selectedOptions.map((opt: any) => `${opt.name} (+฿${opt.price})`).join(", ")}`
      }

      if (item.specialInstructions) {
        content += `\n   หมายเหตุ: ${item.specialInstructions}`
      }

      content += `\n   รวม: ฿${itemTotal.toFixed(2)}\n\n`
    })

    content += `=================================
ยอดรวมทั้งสิ้น: ฿${order.totalAmount?.toFixed(2) || "0.00"}
=================================

ขอบคุณที่ใช้บริการ
`

    return content
  }

  // Download receipt
  const downloadReceipt = (order: Order) => {
    const content = generateReceiptContent(order)

    // ใช้ UTF-8 BOM เพื่อแสดงผลภาษาไทยถูกต้อง
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + content], {
      type: "text/plain;charset=utf-8",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `receipt-${order.id.slice(-6)}-${userId ? userId.slice(-6) : "guest"}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const goBackToOrder = () => {
    if (restaurantId) {
      const tableNum = tableNumber || orders[0]?.table || "1"
      router.push(`/order?id=${restaurantId}&table=${tableNum}`)
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const setAsCurrentOrder = (order: Order) => {
    setCurrentOrder(order)
    setExpandedOrders(new Set([order.id]))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-400 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">กำลังโหลดสถานะ...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="text-red-500 mb-6">
            <X className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={goBackToOrder}
            className="px-6 py-3 bg-blue-400 text-white rounded-xl font-bold hover:bg-blue-500"
          >
            กลับไปสั่งอาหาร
          </button>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-blue-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">ไม่พบออเดอร์</h2>
          <p className="text-gray-600 mb-6">ไม่พบออเดอร์สำหรับโต๊ะนี้</p>
          <button
            onClick={goBackToOrder}
            className="px-6 py-3 bg-blue-400 text-white rounded-xl font-bold hover:bg-blue-500"
          >
            สั่งอาหาร
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - KFC Style */}
      <div className="bg-blue-400 text-white shadow-lg">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center">
            <button onClick={goBackToOrder} className="mr-3 p-2 rounded-full hover:bg-blue-500">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold">สถานะออเดอร์</h1>
              <p className="text-blue-100">
                {userId
                  ? `ออเดอร์ของคุณ • ${orders.filter((order) => order.status !== "completed" && order.status !== "cancelled").length} ออเดอร์`
                  : `โต๊ะ ${orders[0]?.table} • ${orders.filter((order) => order.status !== "completed" && order.status !== "cancelled").length} ออเดอร์`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4">
        {/* Current Order Summary */}
        {currentOrder && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">ออเดอร์ปัจจุบัน</h2>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-blue-200">
              {(() => {
                const statusInfo = getStatusInfo(currentOrder.status)
                return (
                  <>
                    {/* Status Section */}
                    <div className={`p-6 text-center ${statusInfo.bgColor}`}>
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${statusInfo.iconBg} ${statusInfo.iconColor}`}
                      >
                        {statusInfo.icon}
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{statusInfo.title}</h3>
                      <p className="text-gray-600">{statusInfo.description}</p>

                      {/* Queue Number */}
                      {currentOrder.status === "cooking" && currentOrder.queueNumber && (
                        <div className="mt-4 p-3 bg-white rounded-xl border-2 border-blue-200 shadow-lg">
                          <p className="text-sm text-gray-600 mb-1">ออเดอร์นี้อยู่ในคิว</p>
                          <div className="flex items-center justify-center">
                         
                            <p className="text-2xl font-bold text-blue-600">#{currentOrder.queueNumber}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Info */}
                    <div className="p-4 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">ออเดอร์ #{currentOrder.id.slice(-6).toUpperCase()}</span>
                        <span className="text-lg font-bold text-blue-600">
                          ฿{currentOrder.totalAmount?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* All Orders List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">
            ออเดอร์ที่กำลังดำเนินการ (
            {orders.filter((order) => order.status !== "completed" && order.status !== "cancelled").length})
          </h2>

          {orders
            .filter((order) => order.status !== "completed" && order.status !== "cancelled")
            .map((order) => {
              const statusInfo = getStatusInfo(order.status)
              const isExpanded = expandedOrders.has(order.id)
              const isCurrent = currentOrder?.id === order.id

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                    isCurrent ? "border-2 border-blue-300" : "border border-gray-200"
                  }`}
                >
                  {/* Order Header */}
                  <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleOrderExpansion(order.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            order.status === "pending"
                              ? "bg-yellow-500"
                              : order.status === "cooking"
                                ? "bg-orange-500"
                                : order.status === "served"
                                  ? "bg-blue-500"
                                  : order.status === "completed"
                                    ? "bg-green-500"
                                    : "bg-red-500"
                          }`}
                        ></div>
                        <div>
                          <div className="flex items-center">
                            <span className="font-bold text-gray-800">#{order.id.slice(-6).toUpperCase()}</span>
                            {isCurrent && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                ปัจจุบัน
                              </span>
                            )}
                          </div>
                          <div className="flex items-center mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.badgeColor}`}>
                              {statusInfo.title}
                            </span>
                            {order.status === "cooking" && order.queueNumber && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                คิว #{order.queueNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right mr-3">
                          <div className="font-bold text-blue-600">฿{order.totalAmount?.toFixed(2) || "0.00"}</div>
                          <div className="text-xs text-gray-500">
                            {order.createdAt?.toDate
                              ? new Date(order.createdAt.toDate()).toLocaleTimeString("th-TH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {/* Order Details */}
                      <div className="p-4">
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-600 font-medium">เวลาสั่ง</span>
                            <span className="font-bold">
                              {order.createdAt?.toDate
                                ? new Date(order.createdAt.toDate()).toLocaleString("th-TH", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-600 font-medium">จำนวนรายการ</span>
                            <span className="font-bold">{order.items?.length || 0} รายการ</span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="mb-4">
                          <h4 className="font-bold text-lg mb-3">รายการอาหาร</h4>
                          <div className="space-y-2">
                            {order.items?.map((item, index) => (
                              <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-xl">
                                <div className="flex-1">
                                  <span className="font-bold">{item.name}</span>
                                  <span className="text-blue-600 font-bold ml-2">x{item.quantity}</span>
                                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                                    <div className="text-sm text-gray-600 mt-1">
                                      ({item.selectedOptions.map((opt: any) => opt.name).join(", ")})
                                    </div>
                                  )}
                                  {item.specialInstructions && (
                                    <div className="text-sm text-gray-600 italic mt-1">
                                      "{item.specialInstructions}"
                                    </div>
                                  )}
                                </div>
                                <span className="font-bold text-blue-600">
                                  ฿
                                  {(
                                    (item.price +
                                      (item.selectedOptions?.reduce((sum: number, opt: any) => sum + opt.price, 0) ||
                                        0)) *
                                    item.quantity
                                  ).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {!isCurrent && (
                            <button
                              onClick={() => setAsCurrentOrder(order)}
                              className="flex-1 px-4 py-3 bg-blue-400 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors"
                            >
                              ตั้งเป็นออเดอร์ปัจจุบัน
                            </button>
                          )}
                          {order.status === "completed" && (
                            <button
                              onClick={() => downloadReceipt(order)}
                              className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              ดาวน์โหลดใบเสร็จ
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress Steps */}
                      <div className="bg-gray-50 p-4">
                        <h4 className="font-bold text-sm mb-4">ขั้นตอนการเตรียมอาหาร</h4>
                        <div className="space-y-3">
                          <div
                            className={`flex items-center ${
                              ["pending", "cooking", "served", "completed"].includes(order.status)
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                                ["pending", "cooking", "served", "completed"].includes(order.status)
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            >
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-medium">ได้รับออเดอร์</span>
                          </div>

                          <div
                            className={`flex items-center ${
                              ["cooking", "served", "completed"].includes(order.status)
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                                ["cooking", "served", "completed"].includes(order.status)
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            >
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-medium">ยืนยันออเดอร์</span>
                          </div>

                          <div
                            className={`flex items-center ${
                              ["served", "completed"].includes(order.status) ? "text-green-600" : "text-gray-400"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                                ["served", "completed"].includes(order.status) ? "bg-green-500" : "bg-gray-300"
                              }`}
                            >
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-medium">เตรียมอาหารเสร็จ</span>
                          </div>

                          <div
                            className={`flex items-center ${order.status === "completed" ? "text-green-600" : "text-gray-400"}`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                                order.status === "completed" ? "bg-green-500" : "bg-gray-300"
                              }`}
                            >
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-medium">เสร็จสิ้น</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

          {/* Completed/Cancelled Orders History */}
        </div>

        {/* Completion/Cancellation Modal */}
        {showCompletionModal.show && showCompletionModal.order && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  showCompletionModal.type === "completed" ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {showCompletionModal.type === "completed" ? (
                  <CheckCircle className={`h-8 w-8 text-green-600`} />
                ) : (
                  <X className={`h-8 w-8 text-red-600`} />
                )}
              </div>

              <h3 className="text-xl font-bold mb-2">
                {showCompletionModal.type === "completed" ? "ออเดอร์เสร็จสิ้น!" : "ออเดอร์ถูกยกเลิก"}
              </h3>

              <p className="text-gray-600 mb-6">
                {showCompletionModal.type === "completed"
                  ? "ขอบคุณที่ใช้บริการ คุณสามารถดาวน์โหลดใบเสร็จได้"
                  : "ออเดอร์ของคุณถูกยกเลิกแล้ว"}
              </p>

              <div className="space-y-3">
                {showCompletionModal.type === "completed" && (
                  <button
                    onClick={() => {
                      downloadReceipt(showCompletionModal.order!)
                      sessionStorage.setItem(`order-${showCompletionModal.order!.id}-dismissed`, "true")
                      setShowCompletionModal({ show: false, order: null, type: "completed" })
                    }}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    ดาวน์โหลดใบเสร็จ
                  </button>
                )}

                <button
                  onClick={() => {
                    if (showCompletionModal.order) {
                      sessionStorage.setItem(`order-${showCompletionModal.order.id}-dismissed`, "true")
                    }
                    setShowCompletionModal({ show: false, order: null, type: "completed" })
                  }}
                  className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  ปิด
                </button>

                <button
                  onClick={() => {
                    if (showCompletionModal.order) {
                      sessionStorage.setItem(`order-${showCompletionModal.order.id}-dismissed`, "true")
                    }
                    goBackToOrder()
                  }}
                  className="w-full px-4 py-3 bg-blue-400 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors"
                >
                  สั่งอาหารเพิ่ม
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto Refresh Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 bg-white rounded-xl p-3">📱 หน้านี้จะอัปเดตสถานะอัตโนมัติ</p>
        </div>

        {/* Back to Order Button */}
        <div className="mt-6">
          <button
            onClick={goBackToOrder}
            className="w-full px-6 py-4 bg-blue-400 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors"
          >
            สั่งอาหารเพิ่ม
          </button>
        </div>
      </div>
    </div>
  )
}
