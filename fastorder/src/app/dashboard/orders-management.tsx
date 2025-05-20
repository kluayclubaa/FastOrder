"use client"

import { useState, useEffect } from "react"
import { FileText, Check, Clock, X, TrendingUp, Filter, Search, RefreshCw } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

type Order = {
  id: string
  table: string
  status: string
  totalAmount: number
  items: any[]
  createdAt: any
  updatedAt: any
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [userId, setUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })
  const router = useRouter()

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
        setupRealTimeOrdersListener(user.uid)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Set up real-time listener for orders
  const setupRealTimeOrdersListener = (uid: string) => {
    try {
      setLoading(true)
      
      // Get today's date at midnight
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Base query with date filter to only show today's orders
      let ordersQuery = query(
        collection(db, "users", uid, "orders"),
        where("createdAt", ">=", today),
        orderBy("createdAt", "desc")
      )
      
      // Add status filter if not showing all orders
      if (statusFilter !== "all") {
        ordersQuery = query(
          collection(db, "users", uid, "orders"),
          where("createdAt", ">=", today),
          where("status", "==", statusFilter),
          orderBy("createdAt", "desc")
        )
      }

      // Set up real-time listener
      const unsubscribe = onSnapshot(ordersQuery, (querySnapshot) => {
        const ordersList: Order[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Order, "id">
          ordersList.push({ id: doc.id, ...data })
        })

        setOrders(ordersList)
        setLoading(false)
      }, (error) => {
        console.error("Error in orders real-time listener:", error)
        showNotification("ไม่สามารถโหลดข้อมูลออเดอร์ได้", "error")
        setLoading(false)
      })

      return unsubscribe
    } catch (error) {
      console.error("Error setting up orders listener:", error)
      showNotification("ไม่สามารถโหลดข้อมูลออเดอร์ได้", "error")
      setLoading(false)
      return () => {}
    }
  }

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!userId) return

    try {
      setLoading(true)
      const orderRef = doc(db, "users", userId, "orders", orderId)

      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      })

      showNotification(`อัปเดตสถานะออเดอร์เป็น "${newStatus}" สำเร็จ`, "success")
    } catch (error) {
      console.error("Error updating order status:", error)
      showNotification("ไม่สามารถอัปเดตสถานะออเดอร์ได้", "error")
    } finally {
      setLoading(false)
    }
  }

  // Show notification
  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" })
    }, 3000)
  }

  // Get filtered orders based on search term
  const getFilteredOrders = () => {
    if (!searchTerm) return orders

    return orders.filter((order) => 
      order.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีออเดอร์</h3>
      <p className="text-sm text-gray-500 max-w-md mb-6">ออเดอร์ใหม่จะปรากฏที่นี่เมื่อลูกค้าสั่งอาหาร</p>
    </div>
  )

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">รอยืนยัน</span>
      case "cooking":
        return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">กำลังปรุง</span>
      case "served":
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">เสิร์ฟแล้ว</span>
      case "completed":
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">เสร็จสิ้น</span>
      case "cancelled":
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">ยกเลิก</span>
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{status}</span>
    }
  }

  // Render action buttons based on status
  const renderActionButtons = (order: Order) => {
    switch (order.status) {
      case "pending":
        return (
          <div className="flex space-x-2">
            <button 
              className="px-3 py-1 bg-green-600 text-white text-xs rounded-md flex items-center"
              onClick={() => updateOrderStatus(order.id, "cooking")}
            >
              <Check className="h-3 w-3 mr-1" /> ยืนยัน
            </button>
            <button 
              className="px-3 py-1 bg-red-600 text-white text-xs rounded-md flex items-center"
              onClick={() => updateOrderStatus(order.id, "cancelled")}
            >
              <X className="h-3 w-3 mr-1" /> ปฏิเสธ
            </button>
          </div>
        )
      case "cooking":
        return (
          <button 
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md flex items-center"
            onClick={() => updateOrderStatus(order.id, "served")}
          >
            <TrendingUp className="h-3 w-3 mr-1" /> เสิร์ฟแล้ว
          </button>
        )
      case "served":
        return (
          <button 
            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md flex items-center"
            onClick={() => updateOrderStatus(order.id, "completed")}
          >
            <Check className="h-3 w-3 mr-1" /> เสร็จสิ้น
          </button>
        )
      default:
        return null
    }
  }

  const filteredOrders = getFilteredOrders()

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-0">จัดการออเดอร์</h2>
          
          <div className="w-full md:w-auto flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาโต๊ะ"
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full appearance-none"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  if (userId) setupRealTimeOrdersListener(userId)
                }}
              >
                <option value="all">ทั้งหมด</option>
                <option value="pending">รอยืนยัน</option>
                <option value="cooking">กำลังปรุง</option>
                <option value="served">เสิร์ฟแล้ว</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>
            
            <button 
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 flex items-center justify-center"
              onClick={() => {
                if (userId) setupRealTimeOrdersListener(userId)
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Add a note about revenue calculation */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <p>หมายเหตุ: รายได้จะถูกคำนวณเฉพาะออเดอร์ที่มีสถานะ "เสร็จสิ้น" เท่านั้น ออเดอร์ที่ถูกปฏิเสธจะไม่ถูกนับเป็นรายได้</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    โต๊ะ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รายการ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ราคารวม
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เวลา
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className={order.status === "cancelled" ? "bg-gray-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">โต๊ะ {order.table || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{order.items?.length || 0} รายการ</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {order.items?.slice(0, 2).map((item: any, index: number) => (
                          <span key={index}>
                            {item.name} x{item.quantity}
                            {index < Math.min(1, (order.items?.length || 0) - 1) ? ", " : ""}
                          </span>
                        ))}
                        {(order.items?.length || 0) > 2 && ` และอื่นๆ อีก ${order.items.length - 2} รายการ`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${order.status === "cancelled" ? "text-gray-500 line-through" : "text-gray-900"}`}>
                        ฿{order.totalAmount?.toFixed(2) || '0'}
                      </div>
                      {order.status === "cancelled" && (
                        <div className="text-xs text-red-500 mt-1">ไม่นับเป็นรายได้</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {order.createdAt?.toDate ? 
                          new Date(order.createdAt.toDate()).toLocaleTimeString('th-TH', {
                            hour: '2-digit', 
                            minute: '2-digit'
                          }) : 
                          '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderActionButtons(order)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>
      
      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white`}
        >
          {notification.message}
        </div>
      )}
    </div>
  )
} 