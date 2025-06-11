"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Clock, CheckCircle, Utensils, ArrowLeft, X, Receipt, ChevronDown, ChevronUp, User, Gift } from 'lucide-react'
import { db } from "@/lib/firebase"
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore"
import { useRouter, useSearchParams } from "next/navigation"

interface CustomerQueueStatusProps {
  tableNumber: string
}

// Add notification permission request function
const requestNotificationPermission = async () => {
  if ("Notification" in window) {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }
  return false
}

// Add function to show browser notification
const showBrowserNotification = (title: string, body: string, icon?: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: "queue-status",
      requireInteraction: true,
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    // Auto close after 15 seconds for important notifications
    setTimeout(() => {
      notification.close()
    }, 15000)
  }
}

type Order = {
  id: string
  table: string
  status: string
  totalAmount: number
  originalAmount?: number
  items: any[]
  createdAt: any
  updatedAt: any
  queueNumber?: number
  userId?: string
  memberId?: string
  memberPhone?: string
  pointsEarned?: number
  appliedPromotion?: any
}

const CustomerQueueStatus: React.FC<CustomerQueueStatusProps> = ({ tableNumber }) => {
  const [staffNotifications, setStaffNotifications] = useState<any[]>([])

  // ฟังก์ชันสำหรับแสดง Browser Notification
  const showBrowserNotificationStaff = (title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body: body,
          icon: "/favicon.ico", // Replace with your notification icon path
        })
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, {
              body: body,
              icon: "/favicon.ico", // Replace with your notification icon path
            })
          }
        })
      }
    }
  }

  // ฟังก์ชันสำหรับตรวจสอบการแจ้งเตือนจากพนักงาน
  useEffect(() => {
    const checkStaffNotifications = () => {
      const notifications = JSON.parse(localStorage.getItem("customer_notifications") || "[]")
      const newNotifications = notifications.filter(
        (notif: any) =>
          notif.table === tableNumber && notif.type === "staff_confirmed" && Date.now() - notif.timestamp < 300000, // แสดงแจ้งเตือนใน 5 นาที
      )

      if (newNotifications.length > 0) {
        setStaffNotifications(newNotifications)

        // แสดงการแจ้งเตือนในเบราว์เซอร์
        newNotifications.forEach((notif: any) => {
          showBrowserNotificationStaff("✅ พนักงานรับเรื่องแล้ว", notif.message)
        })

        // ลบการแจ้งเตือนที่แสดงแล้ว
        setTimeout(() => {
          const remainingNotifications = notifications.filter(
            (notif: any) => !newNotifications.some((newNotif: any) => newNotif.timestamp === notif.timestamp),
          )
          localStorage.setItem("customer_notifications", JSON.stringify(remainingNotifications))
          setStaffNotifications([])
        }, 5000)
      }
    }

    // ตรวจสอบการแจ้งเตือนทุก 2 วินาที
    const interval = setInterval(checkStaffNotifications, 2000)

    return () => clearInterval(interval)
  }, [tableNumber])

  return (
    <div>
      {/* Staff Notifications */}
      {staffNotifications.length > 0 && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          {staffNotifications.map((notification, index) => (
            <div key={index} className="bg-green-500 text-white p-4 rounded-lg shadow-lg mb-2 animate-bounce">
              <div className="flex items-center">
                <div className="text-2xl mr-3">✅</div>
                <div>
                  <div className="font-bold">พนักงานรับเรื่องแล้ว!</div>
                  <div className="text-sm">{notification.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomerQueueStatus

export function CustomerQueueStatusPage() {
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

  const [previousStatus, setPreviousStatus] = useState<string | null>(null)
  const [previousQueueNumber, setPreviousQueueNumber] = useState<number | null>(null)
  const [notificationPermission, setNotificationPermission] = useState(false)

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

          // Check for status changes and queue position for notifications
          if (foundCurrentOrder || (ordersList.length > 0 && !foundCurrentOrder)) {
            const currentOrderForNotification = foundCurrentOrder || ordersList[0]

            // Check for status changes
            if (previousStatus && previousStatus !== currentOrderForNotification.status) {
              let notificationTitle = ""
              let notificationBody = ""

              switch (currentOrderForNotification.status) {
                case "cooking":
                  notificationTitle = "👨‍🍳 เริ่มปรุงอาหารแล้ว!"
                  notificationBody = `ออเดอร์ของคุณกำลังถูกเตรียม${currentOrderForNotification.queueNumber ? ` (คิวที่ ${currentOrderForNotification.queueNumber})` : ""}`
                  break
                case "served":
                  notificationTitle = "🍽️ อาหารพร้อมเสิร์ฟ!"
                  notificationBody = "อาหารของคุณพร้อมแล้ว กรุณามารับที่เคาน์เตอร์"
                  break
                case "completed":
                  notificationTitle = "✅ เสร็จสิ้น!"
                  notificationBody = `ขอบคุณที่ใช้บริการ${currentOrderForNotification.pointsEarned ? ` คุณได้รับ ${currentOrderForNotification.pointsEarned} แต้ม` : ""}`
                  break
                case "cancelled":
                  notificationTitle = "❌ ออเดอร์ถูกยกเลิก"
                  notificationBody = "ออเดอร์ของคุณถูกยกเลิก กรุณาติดต่อพนักงาน"
                  break
              }

              if (notificationTitle) {
                showBrowserNotification(notificationTitle, notificationBody)
              }
            }

            // Check for queue position changes (notify when reaching position 3 or less)
            if (currentOrderForNotification.status === "cooking" && currentOrderForNotification.queueNumber) {
              const currentQueue = currentOrderForNotification.queueNumber

              if (previousQueueNumber && previousQueueNumber !== currentQueue) {
                if (currentQueue <= 3 && previousQueueNumber > 3) {
                  showBrowserNotification("⏰ เกือบถึงคิวแล้ว!", `คุณอยู่ในคิวที่ ${currentQueue} อาหารจะเสร็จเร็วๆ นี้`)
                } else if (currentQueue === 1) {
                  showBrowserNotification("🔥 ถึงคิวแล้ว!", "คุณอยู่ในคิวแรก อาหารกำลังจะเสร็จแล้ว!")
                }
              }

              setPreviousQueueNumber(currentQueue)
            }

            setPreviousStatus(currentOrderForNotification.status)
          }

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

  // Request notification permission on mount
  useEffect(() => {
    const initNotifications = async () => {
      const granted = await requestNotificationPermission()
      setNotificationPermission(granted)
    }
    initNotifications()
  }, [])

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
          title: "เสิร์ฟแล้ว",
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
${order.memberId ? `สมาชิก: ${order.memberPhone || "ไม่ระบุ"}` : ""}
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

    content += `=================================`

    // Show original amount if promotion was applied
    if (order.originalAmount && order.originalAmount !== order.totalAmount) {
      content += `\nราคาเดิม: ฿${order.originalAmount.toFixed(2)}`
      if (order.appliedPromotion) {
        content += `\nโปรโมชั่น: ${order.appliedPromotion.title}`
        if (order.appliedPromotion.type === "discount") {
          content += ` (ลด ${order.appliedPromotion.value}%)`
        }
      }
    }

    content += `\nยอดรวมทั้งสิ้น: ฿${order.totalAmount?.toFixed(2) || "0.00"}`

    // Show points earned for members
    if (order.memberId && order.pointsEarned && order.status === "completed") {
      content += `\n=================================`
      content += `\nแต้มที่ได้รับ: ${order.pointsEarned} แต้ม`
    }

    content += `\n=================================

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
      {/* Include staff notification component */}
      <CustomerQueueStatus tableNumber={tableNumber || orders[0]?.table || "1"} />

      {/* Header - KFC Style */}
      <div className="bg-blue-400 text-white shadow-lg">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center">
            <button onClick={goBackToOrder} className="mr-3 p-2 rounded-full hover:bg-blue-500">
              <ArrowLeft className="h-6 w-6" />
            </button>
            {/* Notification Status Indicator */}
            {notificationPermission && (
              <div className="mr-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                🔔 แจ้งเตือนเปิด
              </div>
            )}
            {!notificationPermission && (
              <button
                onClick={async () => {
                  const granted = await requestNotificationPermission()
                  setNotificationPermission(granted)
                }}
                className="mr-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full hover:bg-yellow-200"
              >
                🔕 เปิดแจ้งเตือน
              </button>
            )}
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

                      {/* Member Points Info */}
                      {currentOrder.memberId && currentOrder.pointsEarned && (
                        <div className="mt-4 p-3 bg-white rounded-xl border-2 border-green-200 shadow-lg">
                          <div className="flex items-center justify-center mb-2">
                            <User className="h-4 w-4 text-green-600 mr-2" />
                            <span className="text-sm font-medium text-green-600">สมาชิก</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <Gift className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-sm text-gray-600">
                              {currentOrder.status === "completed"
                                ? `ได้รับ ${currentOrder.pointsEarned} แต้ม`
                                : `จะได้รับ ${currentOrder.pointsEarned} แต้ม`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Info */}
                    <div className="p-4 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">ออเดอร์ #{currentOrder.id.slice(-6).toUpperCase()}</span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            ฿{currentOrder.totalAmount?.toFixed(2) || "0.00"}
                          </div>
                          {currentOrder.originalAmount && currentOrder.originalAmount !== currentOrder.totalAmount && (
                            <div className="text-xs text-gray-500 line-through">
                              ฿{currentOrder.originalAmount.toFixed(2)}
                            </div>
                          )}
                          {currentOrder.appliedPromotion && (
                            <div className="text-xs text-purple-600">
                              {currentOrder.appliedPromotion.title}
                            </div>
                          )}
                        </div>
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
                            {order.memberId && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                สมาชิก
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
                          {order.originalAmount && order.originalAmount !== order.totalAmount && (
                            <div className="text-xs text-gray-500 line-through">
                              ฿{order.originalAmount.toFixed(2)}
                            </div>
                          )}
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
                          {order.memberId && order.pointsEarned && (
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                              <span className="text-green-600 font-medium flex items-center">
                                <Gift className="h-4 w-4 mr-1" />
                                แต้มที่จะได้รับ
                              </span>
                              <span className="font-bold text-green-600">{order.pointsEarned} แต้ม</span>
                            </div>
                          )}
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

                        {/* Promotion Info */}
                        {order.appliedPromotion && (
                          <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
                            <div className="flex items-center">
                              <Gift className="h-4 w-4 text-purple-600 mr-2" />
                              <span className="font-medium text-purple-800">โปรโมชั่น: {order.appliedPromotion.title}</span>
                            </div>
                            {order.appliedPromotion.type === "discount" && (
                              <div className="text-sm text-purple-600 mt-1">
                                ลด {order.appliedPromotion.value}%
                              </div>
                            )}
                            {order.appliedPromotion.type === "points_multiplier" && (
                              <div className="text-sm text-purple-600 mt-1">
                                แต้มคูณ {order.appliedPromotion.value}
                              </div>
                            )}
                          </div>
                        )}

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

              <p className="text-gray-600 mb-4">
                {showCompletionModal.type === "completed"
                  ? "ขอบคุณที่ใช้บริการ คุณสามารถดาวน์โหลดใบเสร็จได้"
                  : "ออเดอร์ของคุณถูกยกเลิกแล้ว"}
              </p>

              {/* Show points earned for completed member orders */}
              {showCompletionModal.type === "completed" &&
               showCompletionModal.order.memberId &&
               showCompletionModal.order.pointsEarned && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center">
                    <Gift className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">
                      คุณได้รับ {showCompletionModal.order.pointsEarned} แต้ม!
                    </span>
                  </div>
                </div>
              )}

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
