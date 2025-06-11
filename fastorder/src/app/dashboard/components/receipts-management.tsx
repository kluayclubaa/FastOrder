"use client"

import { useState, useEffect } from "react"
import { Receipt, Download, Trash2, AlertTriangle, Eye, X } from "lucide-react"
import { auth, db, storage } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore"
import { ref, deleteObject } from "firebase/storage"
import { onAuthStateChanged } from "firebase/auth"

type ReceiptData = {
  id: string
  orderId: string
  table: string
  amount: number
  receiptUrl: string
  uploadedAt: any
  expiresAt: any
  customerName?: string
}

export default function ReceiptsManagement() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [filter, setFilter] = useState<"all" | "expiring" | "expired">("all")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        setupReceiptsListener(currentUser.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  const setupReceiptsListener = (userId: string) => {
    const receiptsRef = collection(db, "users", userId, "receipts")
    const receiptsQuery = query(receiptsRef, orderBy("uploadedAt", "desc"))

    const unsubscribe = onSnapshot(receiptsQuery, (snapshot) => {
      const receiptsList: ReceiptData[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        receiptsList.push({
          id: doc.id,
          ...data,
        } as ReceiptData)
      })
      setReceipts(receiptsList)
      setLoading(false)
    })

    return unsubscribe
  }

  const deleteReceipt = async (receipt: ReceiptData) => {
    if (!user) return

    try {
      // Delete from storage
      const storageRef = ref(storage, receipt.receiptUrl)
      await deleteObject(storageRef)

      // Delete from firestore
      await deleteDoc(doc(db, "users", user.uid, "receipts", receipt.id))

      showNotification("ลบใบเสร็จสำเร็จ", "success")
    } catch (error) {
      console.error("Error deleting receipt:", error)
      showNotification("ไม่สามารถลบใบเสร็จได้", "error")
    }
  }

  const downloadReceipt = async (receipt: ReceiptData) => {
    try {
      // For Firebase Storage URLs, we can try direct download first
      if (receipt.receiptUrl.includes("firebasestorage.googleapis.com")) {
        // Try to download directly using the Firebase Storage URL
        const link = document.createElement("a")
        link.href = receipt.receiptUrl
        link.download = `receipt-${receipt.orderId}-${receipt.table}.jpg`
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        showNotification("เริ่มดาวน์โหลดใบเสร็จแล้ว", "success")
        return
      }

      // Fallback method for other URLs
      const response = await fetch(receipt.receiptUrl, {
        mode: "cors",
        credentials: "omit",
        headers: {
          Accept: "image/*",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `receipt-${receipt.orderId}-${receipt.table}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showNotification("ดาวน์โหลดใบเสร็จสำเร็จ", "success")
    } catch (error) {
      console.error("Error downloading receipt:", error)

      // If fetch fails, try opening in new tab as fallback
      try {
        const link = document.createElement("a")
        link.href = receipt.receiptUrl
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        showNotification("เปิดใบเสร็จในแท็บใหม่แล้ว กรุณาดาวน์โหลดด้วยตนเอง", "success")
      } catch (fallbackError) {
        console.error("Fallback download also failed:", fallbackError)
        showNotification("ไม่สามารถดาวน์โหลดใบเสร็จได้ ลองใช้เบราว์เซอร์อื่น", "error")
      }
    }
  }

  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" })
    }, 3000)
  }

  const getFilteredReceipts = () => {
    const now = new Date()

    switch (filter) {
      case "expiring":
        return receipts.filter((receipt) => {
          const expiresAt = receipt.expiresAt?.toDate()
          const daysUntilExpiry = expiresAt
            ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : 0
          return daysUntilExpiry <= 2 && daysUntilExpiry > 0
        })
      case "expired":
        return receipts.filter((receipt) => {
          const expiresAt = receipt.expiresAt?.toDate()
          return expiresAt && expiresAt < now
        })
      default:
        return receipts
    }
  }

  const getDaysUntilExpiry = (expiresAt: any) => {
    if (!expiresAt?.toDate) return 0
    const now = new Date()
    const expiry = expiresAt.toDate()
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getExpiryStatus = (receipt: ReceiptData) => {
    const days = getDaysUntilExpiry(receipt.expiresAt)

    if (days < 0) {
      return { text: "หมดอายุแล้ว", color: "text-red-600", bgColor: "bg-red-100" }
    } else if (days <= 2) {
      return { text: `หมดอายุใน ${days} วัน`, color: "text-orange-600", bgColor: "bg-orange-100" }
    } else {
      return { text: `หมดอายุใน ${days} วัน`, color: "text-green-600", bgColor: "bg-green-100" }
    }
  }

  const filteredReceipts = getFilteredReceipts()

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold">จัดการใบเสร็จลูกค้า</h2>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              ทั้งหมด ({receipts.length})
            </button>
            <button
              onClick={() => setFilter("expiring")}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === "expiring" ? "bg-orange-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              ใกล้หมดอายุ
            </button>
            <button
              onClick={() => setFilter("expired")}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === "expired" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              หมดอายุแล้ว
            </button>
          </div>
        </div>

        {/* Warning about auto-deletion */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">ข้อมูลสำคัญ</h4>
              <p className="text-sm text-yellow-700">
                ใบเสร็จจะถูกลบออกจากระบบอัตโนมัติหลังจากอัพโหลด 7 วัน กรุณาดาวน์โหลดเก็บไว้หากต้องการใช้เป็นหลักฐาน
              </p>
            </div>
          </div>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === "all" ? "ยังไม่มีใบเสร็จ" : filter === "expiring" ? "ไม่มีใบเสร็จที่ใกล้หมดอายุ" : "ไม่มีใบเสร็จที่หมดอายุ"}
            </h3>
            <p className="text-gray-500">{filter === "all" ? "ใบเสร็จจากลูกค้าจะแสดงที่นี่" : ""}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReceipts.map((receipt) => {
              const expiryStatus = getExpiryStatus(receipt)

              return (
                <div
                  key={receipt.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">ออเดอร์ #{receipt.orderId.slice(-6).toUpperCase()}</h4>
                      <p className="text-sm text-gray-600">โต๊ะ {receipt.table}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${expiryStatus.bgColor} ${expiryStatus.color}`}>
                      {expiryStatus.text}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-lg font-bold text-blue-600">฿{receipt.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      อัพโหลดเมื่อ: {receipt.uploadedAt?.toDate()?.toLocaleDateString("th-TH")}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedReceipt(receipt)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      ดู
                    </button>
                    <button
                      onClick={() => downloadReceipt(receipt)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center justify-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      ดาวน์โหลด
                    </button>
                    <button
                      onClick={() => deleteReceipt(receipt)}
                      className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Receipt Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold">ใบเสร็จ - ออเดอร์ #{selectedReceipt.orderId.slice(-6).toUpperCase()}</h3>
              <button onClick={() => setSelectedReceipt(null)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <p>
                  <strong>โต๊ะ:</strong> {selectedReceipt.table}
                </p>
                <p>
                  <strong>จำนวนเงิน:</strong> ฿{selectedReceipt.amount.toFixed(2)}
                </p>
                <p>
                  <strong>อัพโหลดเมื่อ:</strong> {selectedReceipt.uploadedAt?.toDate()?.toLocaleString("th-TH")}
                </p>
              </div>

              <div className="text-center">
                <img
                  src={selectedReceipt.receiptUrl || "/placeholder.svg"}
                  alt="Receipt"
                  className="max-w-full h-auto border border-gray-200 rounded-lg"
                />
              </div>

              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => downloadReceipt(selectedReceipt)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  ดาวน์โหลด
                </button>
                <button
                  onClick={() => {
                    deleteReceipt(selectedReceipt)
                    setSelectedReceipt(null)
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  ลบ
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
