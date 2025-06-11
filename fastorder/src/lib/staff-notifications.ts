import { db } from "@/lib/firebase"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"

export const confirmStaffCall = async (restaurantId: string, callId: string, table: string) => {
  try {
    // อัพเดทสถานะการเรียกพนักงาน
    const callRef = doc(db, "users", restaurantId, "call_staff", callId)
    await updateDoc(callRef, {
      status: "confirmed",
      confirmedAt: serverTimestamp(),
    })

    // ส่งการแจ้งเตือนไปยังลูกค้า (ผ่าน localStorage หรือ real-time listener)
    // ในกรณีนี้เราจะใช้ localStorage เพื่อแจ้ง��ตือนลูกค้าที่อยู่ในหน้าเดียวกัน
    const notificationData = {
      type: "staff_confirmed",
      table: table,
      message: `พนักงานได้รับเรื่องการเรียกจากโต๊ะ ${table} แล้ว กำลังไปหาคุณ`,
      timestamp: Date.now(),
    }

    // บันทึกการแจ้งเตือนใน localStorage (สำหรับลูกค้าที่อยู่ในเบราว์เซอร์เดียวกัน)
    const existingNotifications = JSON.parse(localStorage.getItem("customer_notifications") || "[]")
    existingNotifications.push(notificationData)
    localStorage.setItem("customer_notifications", JSON.stringify(existingNotifications))

    return true
  } catch (error) {
    console.error("Error confirming staff call:", error)
    throw error
  }
}
