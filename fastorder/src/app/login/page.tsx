"use client"

import type React from "react"

import { useState } from "react"
import { auth, db } from "@/lib/firebase"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Lock, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Get user data from Firestore to check isPaid status
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        setSuccess("เข้าสู่ระบบสำเร็จ!")

        // Redirect based on payment status
        setTimeout(() => {
          if (userData.isPaid) {
            router.push("/dashboard")
          } else {
            router.push("/pricing")
          }
        }, 1500)
      } else {
        // If user document doesn't exist for some reason, redirect to pricing
        setSuccess("เข้าสู่ระบบสำเร็จ!")
        setTimeout(() => {
          router.push("/pricing")
        }, 1500)
      }

      setEmail("")
      setPassword("")
    } catch (err: any) {
      let errorMessage = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"

      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "มีการพยายามเข้าสู่ระบบหลายครั้ง กรุณาลองใหม่ภายหลัง"
      } else if (err.code === "auth/invalid-credential") {
        errorMessage = "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง"
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      let isPaid = false

      // If user doesn't exist, create a new document
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          isPaid: false,
          authProvider: "google",
        })
      } else {
        // Update last login and get isPaid status
        const userData = userSnap.data()
        isPaid = userData.isPaid || false
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true })
      }

      setSuccess("เข้าสู่ระบบด้วย Google สำเร็จ!")

      // Redirect based on payment status
      setTimeout(() => {
        if (isPaid) {
          router.push("/dashboard")
        } else {
          router.push("/pricing")
        }
      }, 1500)
    } catch (err: any) {
      setError("ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-none shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Lock className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">เข้าสู่ระบบ</CardTitle>
            <CardDescription className="text-center">เข้าสู่ระบบเพื่อใช้งาน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="อีเมล"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="รหัสผ่าน"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="text-right">
                  <a href="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700">
                    ลืมรหัสผ่าน?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">หรือ</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
              )}
              เข้าสู่ระบบด้วย Google
            </Button>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-50 text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-green-50 text-green-600 text-sm"
              >
                {success}
              </motion.div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              ยังไม่มีบัญชี?{" "}
              <a href="/register" className="text-purple-600 hover:text-purple-700 font-medium">
                สมัครสมาชิก
              </a>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
