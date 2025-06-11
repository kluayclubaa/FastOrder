"use client"

import { useState } from "react"
import { X, User, Phone, Mail, Gift } from "lucide-react"
import { createMember, findMemberByPhone, type Member } from "@/lib/membership"

interface MemberLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onMemberLogin: (member: Member) => void
  onGuestContinue: () => void
  restaurantId: string
}

export default function MemberLoginModal({
  isOpen,
  onClose,
  onMemberLogin,
  onGuestContinue,
  restaurantId,
}: MemberLoginModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleLogin = async () => {
    if (!phone.trim()) {
      setError("กรุณากรอกเบอร์โทรศัพท์")
      return
    }

    setLoading(true)
    setError("")

    try {
      const member = await findMemberByPhone(restaurantId, phone)
      if (member) {
        onMemberLogin(member)
        onClose()
      } else {
        setError("ไม่พบข้อมูลสมาชิก กรุณาสมัครสมาชิกใหม่")
        setMode("register")
      }
    } catch (error) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!phone.trim() || !name.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน")
      return
    }

    setLoading(true)
    setError("")

    try {
      // ตรวจสอบว่ามีสมาชิกแล้วหรือไม่
      const existingMember = await findMemberByPhone(restaurantId, phone)
      if (existingMember) {
        setError("เบอร์โทรศัพท์นี้เป็นสมาชิกอยู่แล้ว")
        setMode("login")
        return
      }

      const memberId = await createMember(restaurantId, {
        phone,
        name,
        email: email || "",
        lastVisit: new Date(),
      })

      const newMember: Member = {
        id: memberId,
        phone,
        name,
        email: email || "",
        points: 0,
        totalSpent: 0,
        joinDate: new Date(),
        lastVisit: new Date(),
        tier: "bronze",
        restaurantId,
      }

      onMemberLogin(newMember)
      onClose()
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการสมัครสมาชิก")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPhone("")
    setName("")
    setEmail("")
    setError("")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">{mode === "login" ? "เข้าสู่ระบบสมาชิก" : "สมัครสมาชิกใหม่"}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Benefits Display */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl mb-6">
            <div className="flex items-center mb-2">
              <Gift className="h-5 w-5 text-purple-600 mr-2" />
              <h4 className="font-bold text-purple-800">สิทธิประโยชน์สมาชิก</h4>
            </div>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• สะสมแต้ม 1 บาท = 1 แต้ม</li>
              <li>• แลกแต้มเป็นส่วนลด</li>
              <li>• รับโปรโมชั่นพิเศษ</li>
              <li>• ติดตามประวัติการสั่ง</li>
            </ul>
          </div>

          <div className="space-y-4">
            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ *</label>
              <div className="relative">
                <Phone className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="08xxxxxxxx"
                />
              </div>
            </div>

            {/* Name Input (Register mode only) */}
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล *</label>
                  <div className="relative">
                    <User className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ชื่อ นามสกุล"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล (ไม่บังคับ)</label>
                  <div className="relative">
                    <Mail className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={mode === "login" ? handleLogin : handleRegister}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    {mode === "login" ? "กำลังเข้าสู่ระบบ..." : "กำลังสมัครสมาชิก..."}
                  </div>
                ) : mode === "login" ? (
                  "เข้าสู่ระบบ"
                ) : (
                  "สมัครสมาชิก"
                )}
              </button>

              {mode === "login" ? (
                <button
                  onClick={() => {
                    setMode("register")
                    resetForm()
                  }}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
                >
                  สมัครสมาชิกใหม่
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMode("login")
                    resetForm()
                  }}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
                >
                  เข้าสู่ระบบสมาชิก
                </button>
              )}

              <button
                onClick={onGuestContinue}
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
              >
                สั่งแบบไม่เป็นสมาชิก
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
