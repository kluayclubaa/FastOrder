"use client"

import { useState, useEffect } from "react"
import { QrCode, AlertCircle, Check } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { doc, updateDoc, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

export default function QRPaymentSettings() {
  const [user, setUser] = useState<any>(null)
  const [promptPayID, setPromptPayID] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        setupListener(currentUser.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  const setupListener = (userId: string) => {
    const userRef = doc(db, "users", userId)
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        setPromptPayID(data.promptPayID || "")
      }
    })
    return unsubscribe
  }

  const savePromptPayID = async () => {
    if (!user) return

    try {
      setSaving(true)

      // Update user document
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        promptPayID: promptPayID,
        updatedAt: new Date(),
      })

      showNotification("บันทึก PromptPay ID สำเร็จ", "success")
    } catch (error) {
      console.error("Error saving PromptPay ID:", error)
      showNotification("ไม่สามารถบันทึก PromptPay ID ได้", "error")
    } finally {
      setSaving(false)
    }
  }

  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" })
    }, 3000)
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center mb-6">
        <QrCode className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-bold">ตั้งค่า PromptPay สำหรับรับเงิน</h2>
      </div>

      <div className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">PromptPay ID สำหรับรับเงิน</h3>
            <p className="text-gray-500 mb-4">
              กรอกหมายเลข PromptPay (เบอร์โทรศัพท์หรือเลขประจำตัวประชาชน) สำหรับรับเงินจากลูกค้า
            </p>

            <div className="flex flex-col items-center space-y-4">
              <input
                type="text"
                value={promptPayID}
                onChange={(e) => setPromptPayID(e.target.value)}
                placeholder="เบอร์โทรศัพท์หรือเลขประจำตัวประชาชน"
                className="w-full max-w-md px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />

              <button
                onClick={savePromptPayID}
                disabled={saving || !promptPayID}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    บันทึก PromptPay ID
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">คำแนะนำ:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• ใช้หมายเลข PromptPay ที่ลงทะเบียนกับธนาคารของคุณ</li>
                <li>• ระบบจะสร้าง QR Code แบบไดนามิกตามยอดเงินที่ลูกค้าต้องชำระ</li>
                <li>• ลูกค้าสามารถสแกน QR Code เพื่อโอนเงินได้ทันที</li>
                <li>• ตรวจสอบให้แน่ใจว่าหมายเลข PromptPay ถูกต้อง</li>
              </ul>
            </div>
          </div>
        </div>
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
