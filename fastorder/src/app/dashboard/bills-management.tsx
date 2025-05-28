"use client"

import { useState, useEffect } from "react"
import { FileText, Download, Search, Calendar, DollarSign, Receipt, Printer } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, getDocs } from "firebase/firestore"
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

export default function BillsManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("today")
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null)
  const router = useRouter()

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
        fetchRestaurantInfo(user.uid)
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
  }, [userId, dateFilter])

  // Fetch restaurant info
  const fetchRestaurantInfo = async (uid: string) => {
    try {
      const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", uid)))
      if (!userDoc.empty) {
        setRestaurantInfo(userDoc.docs[0].data())
      }
    } catch (error) {
      console.error("Error fetching restaurant info:", error)
    }
  }

  // Set up real-time listener for completed orders
  const setupRealTimeOrdersListener = (uid: string) => {
    try {
      setLoading(true)

      let startDate = new Date()
      let endDate = new Date()

      switch (dateFilter) {
        case "today":
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          break
        case "week":
          startDate.setDate(startDate.getDate() - 7)
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          break
        case "month":
          startDate.setDate(1)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
          endDate.setHours(23, 59, 59, 999)
          break
        case "all":
          startDate = new Date(2020, 0, 1) // Far past date
          endDate.setHours(23, 59, 59, 999)
          break
      }

      const ordersQuery = query(
        collection(db, "users", uid, "orders"),
        where("status", "==", "completed"),
        where("createdAt", ">=", startDate),
        where("createdAt", "<=", endDate),
        orderBy("createdAt", "desc"),
      )

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
          showNotification("ไม่สามารถโหลดข้อมูลบิลได้", "error")
          setLoading(false)
        },
      )

      return unsubscribe
    } catch (error) {
      console.error("Error setting up orders listener:", error)
      showNotification("ไม่สามารถโหลดข้อมูลบิลได้", "error")
      setLoading(false)
      return () => {}
    }
  }

  // Filter orders based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOrders(orders)
    } else {
      const filtered = orders.filter(
        (order) =>
          order.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredOrders(filtered)
    }
  }, [orders, searchTerm])

  // Generate bill content
  const generateBillContent = (order: Order) => {
    const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date()
    const restaurantName = restaurantInfo?.storeName || restaurantInfo?.restaurantName || "ร้านอาหาร"
    const phone = restaurantInfo?.phone || restaurantInfo?.phoneNumber || ""

    let content = `
=================================
${restaurantName}
=================================
${phone ? `โทร: ${phone}` : ""}
วันที่: ${date.toLocaleDateString("th-TH")}
เวลา: ${date.toLocaleTimeString("th-TH")}
โต๊ะ: ${order.table}
บิลเลขที่: #${order.id.slice(-6).toUpperCase()}
=================================

รายการอาหาร:
`

    let totalItems = 0
    order.items?.forEach((item, index) => {
      const itemTotal =
        (item.price + (item.selectedOptions?.reduce((sum: number, opt: any) => sum + opt.price, 0) || 0)) *
        item.quantity
      totalItems += item.quantity

      content += `${index + 1}. ${item.name} x${item.quantity}\n`
      content += `   ราคา: ฿${item.price.toFixed(2)}`

      if (item.selectedOptions && item.selectedOptions.length > 0) {
        content += `\n   ตัวเลือก: ${item.selectedOptions.map((opt: any) => `${opt.name} (+฿${opt.price})`).join(", ")}`
      }

      if (item.specialInstructions) {
        content += `\n   หมายเหตุ: ${item.specialInstructions}`
      }

      content += `\n   รวม: ฿${itemTotal.toFixed(2)}\n\n`
    })

    content += `=================================
จำนวนรายการทั้งหมด: ${totalItems} ชิ้น
ยอดรวมทั้งสิ้น: ฿${order.totalAmount?.toFixed(2) || "0.00"}
=================================

ขอบคุณที่ใช้บริการ
กรุณาเก็บใบเสร็จไว้เป็นหลักฐาน
`

    return content
  }

  // Download bill
  const downloadBill = (order: Order) => {
    const content = generateBillContent(order)
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `bill-${order.id.slice(-6)}-table${order.table}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showNotification("ดาวน์โหลดบิลสำเร็จ", "success")
  }

  // Print bill
  const printBill = (order: Order) => {
    const content = generateBillContent(order)
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>บิล #${order.id.slice(-6).toUpperCase()}</title>
            <style>
              body { font-family: 'Courier New', monospace; white-space: pre-line; margin: 20px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Show notification
  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" })
    }, 3000)
  }

  // Calculate totals
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
  const totalOrders = filteredOrders.length

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-0">จัดการบิล</h2>

          <div className="w-full md:w-auto flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาโต๊ะหรือเลขบิล"
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full appearance-none"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="today">วันนี้</option>
                <option value="week">7 วันที่ผ่านมา</option>
                <option value="month">เดือนนี้</option>
                <option value="all">ทั้งหมด</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-700">รายได้รวม</p>
                <h3 className="text-xl font-bold text-green-900">฿{totalRevenue.toFixed(2)}</h3>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-700">จำนวนบิล</p>
                <h3 className="text-xl font-bold text-blue-900">{totalOrders}</h3>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-700">มูลค่าเฉลี่ย</p>
                <h3 className="text-xl font-bold text-purple-900">
                  ฿{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00"}
                </h3>
              </div>
            </div>
          </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เลขบิล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    โต๊ะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่/เวลา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รายการ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดรวม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order.id.slice(-6).toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">โต๊ะ {order.table}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.createdAt?.toDate
                          ? new Date(order.createdAt.toDate()).toLocaleDateString("th-TH", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "-"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.createdAt?.toDate
                          ? new Date(order.createdAt.toDate()).toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.items?.length || 0} รายการ</div>
                      <div className="text-xs text-gray-500">
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
                      <div className="text-sm font-medium text-green-600">฿{order.totalAmount?.toFixed(2) || "0"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadBill(order)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 flex items-center"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          ดาวน์โหลด
                        </button>
                        <button
                          onClick={() => printBill(order)}
                          className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 flex items-center"
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          พิมพ์
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Receipt className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีบิลในช่วงเวลานี้</h3>
            <p className="text-sm text-gray-500 max-w-md mb-6">บิลจะปรากฏที่นี่เมื่อมีออเดอร์ที่เสร็จสิ้นแล้ว</p>
          </div>
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
