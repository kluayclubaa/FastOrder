"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { doc, updateDoc, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function SetupStorePage() {
  const [storeName, setStoreName] = useState("")
  const [phone, setPhone] = useState("")
  const [storeType, setStoreType] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

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
          router.push("/dashboard")
        }
      })
      return () => unsubscribe()
    }
  }, [userId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setLoading(true)

    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        storeName,
        phone,
        storeType,
        storeInfoComplete: true,
      })
      router.push("/pricing")
    } catch (err) {
      console.error("Error updating store info:", err)
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 px-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-center">ข้อมูลร้านค้า</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">ชื่อร้าน</label>
              <Input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">เบอร์โทรร้าน</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">ประเภทร้าน</label>
              <Input
                type="text"
                placeholder="เช่น อาหาร, คาเฟ่, ของหวาน"
                value={storeType}
                onChange={(e) => setStoreType(e.target.value)}
                required
              />
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
