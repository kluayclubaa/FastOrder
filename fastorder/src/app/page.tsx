'use client'
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db, getDoc, doc } from "@/lib/firebase"
import { HeroSection } from "@/components/ui/hero-section"

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid) // 👈 หรือเปลี่ยนเป็น "setup" ตามที่คุณใช้
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            const userData = userSnap.data()
            const isPaid = userData?.isPaid === true

            router.push(isPaid ? "/dashboard" : "/pricing")
          } else {
            // ถ้าไม่มี document ให้ redirect ไปตั้งค่า
            router.push("/pricing")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          router.push("/pricing")
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])



  return (
    <main>
      <HeroSection />
    </main>
  )
}
