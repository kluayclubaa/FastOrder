"use client"

import { useState, useEffect } from "react"
import { FileText, Check, X, TrendingUp, Filter, Search, RefreshCw, Edit, Plus, Minus } from "lucide-react"
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
  getDocs,
  writeBatch,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

type OrderItem = {
  id: string
  name: string
  price: number
  quantity: number
  selectedOptions?: {
    id: string
    name: string
    price: number
  }[]
  specialInstructions?: string
}

type Order = {
  id: string
  table: string
  status: string
  totalAmount: number
  items: OrderItem[]
  createdAt: any
  updatedAt: any
  queueNumber?: number
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [userId, setUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })
  const router = useRouter()
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editedItems, setEditedItems] = useState<OrderItem[]>([])

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (userId) {
      const unsubscribe = setupRealTimeOrdersListener(userId)
      return () => unsubscribe && unsubscribe()
    }
  }, [statusFilter, userId])

  // Set up real-time listener for orders
  const setupRealTimeOrdersListener = (uid: string) => {
    try {
      setLoading(true)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let ordersQuery
      if (statusFilter !== "all") {
        ordersQuery = query(
          collection(db, "users", uid, "orders"),
          where("status", "==", statusFilter),
          where("createdAt", ">=", today),
          orderBy("createdAt", "desc"),
        )
      } else {
        ordersQuery = query(
          collection(db, "users", uid, "orders"),
          where("createdAt", ">=", today),
          orderBy("createdAt", "desc"),
        )
      }

      const unsubscribe = onSnapshot(
        ordersQuery,
        (querySnapshot) => {
          const ordersList: Order[] = []
          querySnapshot.forEach((doc) => {
            const data = doc.data() as Omit<Order, "id">
            ordersList.push({ id: doc.id, ...data })
          })
          setOrders(ordersList)
          setLoading(false)
        },
        (error) => {
          console.error("Error in orders real-time listener:", error)
          showNotification("ไม่สามารถโหลดข้อมูลออเดอร์ได้", "error")
          setLoading(false)
        },
      )

      return unsubscribe
    } catch (error) {
      console.error("Error setting up orders listener:", error)
      showNotification("ไม่สามารถโหลดข้อมูลออเดอร์ได้", "error")
      setLoading(false)
      return () => {}
    }
  }

  // Update queue numbers when an order is completed
  const updateQueueNumbers = async (userId: string) => {
    try {
      // Get all cooking orders ordered by queue number
      const cookingOrdersQuery = query(
        collection(db, "users", userId, "orders"),
        where("status", "==", "cooking"),
        orderBy("queueNumber", "asc"),
      )

      const cookingSnapshot = await getDocs(cookingOrdersQuery)
      const batch = writeBatch(db)

      // Update queue numbers sequentially
      cookingSnapshot.docs.forEach((doc, index) => {
        const orderRef = doc.ref
        batch.update(orderRef, {
          queueNumber: index + 1,
          updatedAt: serverTimestamp(),
        })
      })

      await batch.commit()
    } catch (error) {
      console.error("Error updating queue numbers:", error)
    }
  }

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!userId) return

    try {
      setLoading(true)
      const orderRef = doc(db, "users", userId, "orders", orderId)

      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      }

      // If confirming order (pending -> cooking), assign queue number
      if (newStatus === "cooking") {
        // Get current cooking orders to determine queue position
        const cookingOrdersQuery = query(
          collection(db, "users", userId, "orders"),
          where("status", "==", "cooking"),
          orderBy("updatedAt", "asc"),
        )

        const cookingSnapshot = await getDocs(cookingOrdersQuery)
        const queueNumber = cookingSnapshot.size + 1

        updateData.queueNumber = queueNumber
      }

      await updateDoc(orderRef, updateData)

      // If order is served or cancelled, update queue numbers for remaining cooking orders
      if (newStatus === "served" || newStatus === "cancelled") {
        await updateQueueNumbers(userId)
      }

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

    return orders.filter(
      (order) =>
        order.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()),
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
  const renderStatusBadge = (status: string, queueNumber?: number) => {
    switch (status) {
      case "pending":
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">รอยืนยัน</span>
      case "cooking":
        return (
          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
            กำลังปรุง {queueNumber && `(คิว #${queueNumber})`}
          </span>
        )
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

  const openEditModal = (order: Order) => {
    setEditingOrder(order)
    setEditedItems([...order.items])
  }

  const updateOrderItems = async () => {
    if (!userId || !editingOrder) return

    try {
      setLoading(true)

      // Calculate new total amount
      const newTotalAmount = editedItems.reduce((total, item) => {
        const itemBasePrice = item.price * item.quantity
        const optionsPrice = item.selectedOptions
          ? item.selectedOptions.reduce((sum, option) => sum + option.price, 0) * item.quantity
          : 0
        return total + itemBasePrice + optionsPrice
      }, 0)

      const orderRef = doc(db, "users", userId, "orders", editingOrder.id)

      await updateDoc(orderRef, {
        items: editedItems,
        totalAmount: newTotalAmount,
        updatedAt: serverTimestamp(),
      })

      setEditingOrder(null)
      showNotification("อัปเดตออเดอร์สำเร็จ", "success")
    } catch (error) {
      console.error("Error updating order:", error)
      showNotification("ไม่สามารถอัปเดตออเดอร์ได้", "error")
    } finally {
      setLoading(false)
    }
  }

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(index)
      return
    }

    setEditedItems((items) => items.map((item, idx) => (idx === index ? { ...item, quantity: newQuantity } : item)))
  }

  const removeItem = (index: number) => {
    setEditedItems((items) => items.filter((_, idx) => idx !== index))
  }

  const updateSpecialInstructions = (index: number, instructions: string) => {
    setEditedItems((items) =>
      items.map((item, idx) => (idx === index ? { ...item, specialInstructions: instructions } : item)),
    )
  }

  // Render action buttons based on status
  const renderActionButtons = (order: Order) => {
    const buttons = []

    // Add edit button for all non-completed/cancelled orders
    if (order.status !== "completed" && order.status !== "cancelled") {
      buttons.push(
        <button
          key="edit"
          className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md flex items-center mr-2"
          onClick={() => openEditModal(order)}
        >
          <Edit className="h-3 w-3 mr-1" /> แก้ไข
        </button>,
      )
    }

    switch (order.status) {
      case "pending":
        buttons.push(
          <button
            key="confirm"
            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md flex items-center"
            onClick={() => updateOrderStatus(order.id, "cooking")}
          >
            <Check className="h-3 w-3 mr-1" /> ยืนยัน
          </button>,
          <button
            key="reject"
            className="px-3 py-1 bg-red-600 text-white text-xs rounded-md flex items-center ml-2"
            onClick={() => updateOrderStatus(order.id, "cancelled")}
          >
            <X className="h-3 w-3 mr-1" /> ปฏิเสธ
          </button>,
        )
        break
      case "cooking":
        buttons.push(
          <button
            key="served"
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md flex items-center"
            onClick={() => updateOrderStatus(order.id, "served")}
          >
            <TrendingUp className="h-3 w-3 mr-1" /> เสิร์ฟแล้ว
          </button>,
        )
        break
      case "served":
        buttons.push(
          <button
            key="complete"
            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md flex items-center"
            onClick={() => updateOrderStatus(order.id, "completed")}
          >
            <Check className="h-3 w-3 mr-1" /> เสร็จสิ้น
          </button>,
        )
        break
    }

    return <div className="flex">{buttons}</div>
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
                onChange={(e) => setStatusFilter(e.target.value)}
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
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    โต๊ะ
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    รายการ
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    ราคารวม
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    เวลา
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    สถานะ
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className={order.status === "cancelled" ? "bg-gray-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">โต๊ะ {order.table || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{order.items?.length || 0} รายการ</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {order.items?.slice(0, 2).map((item: any, index: number) => (
                          <span key={index}>
                            {item.name} x{item.quantity}
                            {item.selectedOptions &&
                              item.selectedOptions.length > 0 &&
                              ` (${item.selectedOptions.map((opt: any) => opt.name).join(", ")})`}
                            {item.specialInstructions && ` (${item.specialInstructions})`}
                            {index < Math.min(1, (order.items?.length || 0) - 1) ? ", " : ""}
                          </span>
                        ))}
                        {(order.items?.length || 0) > 2 && ` และอื่นๆ อีก ${order.items.length - 2} รายการ`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${order.status === "cancelled" ? "text-gray-500 line-through" : "text-gray-900"}`}
                      >
                        ฿{order.totalAmount?.toFixed(2) || "0"}
                      </div>
                      {order.status === "cancelled" && <div className="text-xs text-red-500 mt-1">ไม่นับเป็นรายได้</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {order.createdAt?.toDate
                          ? new Date(order.createdAt.toDate()).toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(order.status, order.queueNumber)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{renderActionButtons(order)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center">
              <h2 className="text-lg font-bold">แก้ไขออเดอร์ #{editingOrder.id.slice(-6).toUpperCase()}</h2>
              <button onClick={() => setEditingOrder(null)} className="ml-auto p-1 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">รายการอาหาร</h3>
                  <div className="text-sm text-gray-500">โต๊ะ {editingOrder.table}</div>
                </div>

                <div className="space-y-3">
                  {editedItems.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {item.name}
                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                              <span className="font-normal text-sm text-gray-600 ml-1">
                                ({item.selectedOptions.map((o) => o.name).join(", ")})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            ฿{item.price.toFixed(2)}
                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                              <span className="ml-2">
                                + ฿{item.selectedOptions.reduce((sum, o) => sum + o.price, 0).toFixed(2)}
                              </span>
                            )}
                          </div>
                          {item.specialInstructions && (
                            <div className="text-sm italic text-gray-600 mt-1">"{item.specialInstructions}"</div>
                          )}
                        </div>
                        <div className="flex items-center">
                          <button
                            onClick={() => updateItemQuantity(index, item.quantity - 1)}
                            className="p-1 rounded-full bg-gray-100"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="mx-2 w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(index, item.quantity + 1)}
                            className="p-1 rounded-full bg-gray-100"
                          >
                            <Plus className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => removeItem(index)}
                            className="ml-2 p-1 rounded-full bg-red-100 text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2">
                        <textarea
                          placeholder="คำแนะนำพิเศษ เช่น ไม่ใส่ผัก"
                          className="w-full p-2 text-sm border border-gray-200 rounded-md"
                          rows={2}
                          value={item.specialInstructions || ""}
                          onChange={(e) => updateSpecialInstructions(index, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {editedItems.length === 0 && (
                  <div className="text-center py-4 text-gray-500">ไม่มีรายการอาหาร กรุณาเพิ่มรายการอาหาร</div>
                )}
              </div>

              <div className="flex justify-between items-center font-medium mb-4">
                <div>ยอดรวม</div>
                <div>
                  ฿
                  {editedItems
                    .reduce((total, item) => {
                      const itemBasePrice = item.price * item.quantity
                      const optionsPrice = item.selectedOptions
                        ? item.selectedOptions.reduce((sum, option) => sum + option.price, 0) * item.quantity
                        : 0
                      return total + itemBasePrice + optionsPrice
                    }, 0)
                    .toFixed(2)}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={updateOrderItems}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading || editedItems.length === 0}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      กำลังบันทึก...
                    </div>
                  ) : (
                    "บันทึกการเปลี่ยนแปลง"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
