"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { doc, updateDoc, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

type ValidationError = {
  field: string
  message: string
}

export default function SetupStorePage() {
  const [storeName, setStoreName] = useState("")
  const [phone, setPhone] = useState("")
  const [storeType, setStoreType] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()

  // รัดกุมมากขึ้น - Regex patterns
  const phoneRegex = /^0[6-9]\d{8}$/ // เบอร์ไทย: 0 + (6-9) + 8 หลัก
  const storeNameRegex = /^[\u0E00-\u0E7F\w\s]{2,50}$/ // ไทย/อังกฤษ/ตัวเลข 2-50 ตัวอักษร
  const storeTypeRegex = /^[\u0E00-\u0E7F\w\s,.-]{2,30}$/ // ไทย/อังกฤษ/เครื่องหมาย 2-30 ตัวอักษร

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
      const userRef = doc(db, "users", userId)
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        const data = docSnap.data()
        if (data?.storeInfoComplete) {
          router.push("/pricing")
        }
      })
      return () => unsubscribe()
    }
  }, [userId, router])

  const validateForm = (): ValidationError[] => {
    const validationErrors: ValidationError[] = []

    // ตรวจสอบชื่อร้าน
    if (!storeName.trim()) {
      validationErrors.push({ field: "storeName", message: "กรุณากรอกชื่อร้าน" })
    } else if (!storeNameRegex.test(storeName.trim())) {
      validationErrors.push({ 
        field: "storeName", 
        message: "ชื่อร้านต้องมี 2-50 ตัวอักษร และประกอบด้วยตัวอักษรไทย/อังกฤษ ตัวเลข และช่องว่างเท่านั้น" 
      })
    }

    // ตรวจสอบเบอร์โทร
    if (!phone.trim()) {
      validationErrors.push({ field: "phone", message: "กรุณากรอกเบอร์โทร" })
    } else if (!phoneRegex.test(phone)) {
      validationErrors.push({ 
        field: "phone", 
        message: "รูปแบบเบอร์โทรไม่ถูกต้อง (ตัวอย่าง: 0812345678, 0612345678)" 
      })
    }

    // ตรวจสอบประเภทร้าน
    if (!storeType.trim()) {
      validationErrors.push({ field: "storeType", message: "กรุณากรอกประเภทร้าน" })
    } else if (!storeTypeRegex.test(storeType.trim())) {
      validationErrors.push({ 
        field: "storeType", 
        message: "ประเภทร้านต้องมี 2-30 ตัวอักษร (ตัวอย่าง: อาหาร, คาเฟ่, ของหวาน)" 
      })
    }

    return validationErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    // ล้างข้อความก่อนหน้า
    setErrors([])
    setSuccessMessage("")

    // ตรวจสอบข้อมูล
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        storeName: storeName.trim(),
        phone: phone.trim(),
        storeType: storeType.trim(),
        storeInfoComplete: true,
      })
      
      setSuccessMessage("บันทึกข้อมูลสำเร็จ! กำลังไปหน้าเลือกแพ็กเกจ...")
      
      // รอ 1.5 วินาทีก่อนเปลี่ยนหน้า
      setTimeout(() => {
        router.push("/pricing")
      }, 1500)
      
    } catch (err) {
      console.error("Error updating store info:", err)
      setErrors([{ field: "general", message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง" }])
    } finally {
      setLoading(false)
    }
  }

  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // กรองอักขระที่ไม่ต้องการออก
    const filtered = value.replace(/[^\u0E00-\u0E7F\w\s]/g, "").slice(0, 50)
    setStoreName(filtered)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "") // เก็บเฉพาะตัวเลข
    if (value.length <= 10) {
      setPhone(value)
    }
  }

  const handleStoreTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // กรองอักขระที่ไม่ต้องการออก
    const filtered = value.replace(/[^\u0E00-\u0E7F\w\s,.-]/g, "").slice(0, 30)
    setStoreType(filtered)
  }

  const getFieldError = (fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 px-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-center">ข้อมูลร้านค้า</CardTitle>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* แสดงข้อผิดพลาดทั่วไป */}
            {errors.some(error => error.field === "general") && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {getFieldError("general")}
                </AlertDescription>
              </Alert>
            )}

            {/* แสดงข้อความสำเร็จ */}
            {successMessage && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <div>
              <label className="text-sm font-medium">ชื่อร้าน</label>
              <Input
                type="text"
                value={storeName}
                onChange={handleStoreNameChange}
                className={getFieldError("storeName") ? "border-red-500" : ""}
                placeholder="กรอกชื่อร้านค้าของคุณ"
                required
              />
              {getFieldError("storeName") && (
                <p className="text-sm text-red-500 mt-1">{getFieldError("storeName")}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">เบอร์โทรร้าน</label>
              <Input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                className={getFieldError("phone") ? "border-red-500" : ""}
                placeholder="เช่น 0812345678"
                required
              />
              {getFieldError("phone") && (
                <p className="text-sm text-red-500 mt-1">{getFieldError("phone")}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">ประเภทร้าน</label>
              <Input
                type="text"
                placeholder="เช่น อาหาร, คาเฟ่, ของหวาน"
                value={storeType}
                onChange={handleStoreTypeChange}
                className={getFieldError("storeType") ? "border-red-500" : ""}
                required
              />
              {getFieldError("storeType") && (
                <p className="text-sm text-red-500 mt-1">{getFieldError("storeType")}</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึกข้อมูลร้านค้า"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}