"use client"

import { useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { Check, X, Star, Phone, MessageCircle, Facebook, Instagram } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function PricingPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string>("free-trial")
  const [isLoading, setIsLoading] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [selectedPlanName, setSelectedPlanName] = useState("")

  const handleSubscribe = async (planId: string, planName: string) => {
    const user = auth.currentUser
    if (!user || !user.email) {
      console.error("ยังไม่ได้เข้าสู่ระบบ")
      return
    }

    setSelectedPlanName(planName)
    setShowContactDialog(true)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการออกจากระบบ:", error)
    }
  }

  const contactChannels = [
    {
      name: "โทรศัพท์",
      icon: Phone,
      value: "099-164-8465",
      action: () => window.open("tel:0991648465"),
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      name: "Line",
      icon: MessageCircle,
      value: "Kluay",
      action: () => window.open("https://line.me/ti/p/YpO0ygLT96"),
      color: "bg-green-400 hover:bg-green-500",
    },
    {
      name: "Facebook",
      icon: Facebook,
      value: "Patcharakiri Shichat",
      action: () => window.open("https://www.facebook.com/profile.php?id=61576821897503"),
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      name: "Instagram",
      icon: Instagram,
      value: "ps_kluay",
      action: () => window.open("https://www.instagram.com/fastallder"),
      color: "bg-pink-500 hover:bg-pink-600",
    },
  ]

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            const userData = userSnap.data()
            const isPaid = userData?.isPaid === true

            if (isPaid) {
              router.push("/dashboard")
              return
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        // ถ้าไม่ได้ login ให้ redirect ไปหน้า login
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  const plans = [
    {
      id: "free-trial",
      name: "ทดลองใช้",
      price: "ฟรี",
      duration: "14 วัน",
      popular: false,
    },
    {
      id: "monthly",
      name: "รายเดือน",
      price: "499",
      duration: "ต่อเดือน",
      popular: false,
    },
    {
      id: "yearly",
      name: "รายปี",
      price: "4,999",
      duration: "ต่อปี",
      popular: true,
    },
    {
      id: "lifetime",
      name: "ตลอดชีพ",
      price: "15,000",
      duration: "ชำระครั้งเดียว",
      popular: false,
    },
  ]

  const features = [
    {
      category: "การใช้งาน",
      items: [
        {
          name: "ใช้งานได้ทุกฟีเจอร์",
          included: ["free-trial", "monthly", "yearly", "lifetime"],
        },
      ],
    },
    {
      category: "คุณสมบัติ",
      items: [
        {
          name: "อัพเดทฟีเจอร์ใหม่",
          included: ["monthly", "yearly", "lifetime"],
        },
        {
          name: "ดาวน์โหลดข้อมูลออฟไลน์",
          included: ["yearly", "lifetime"],
        },
        {
          name: "ส่งออกข้อมูลในรูปแบบต่างๆ",
          included: ["yearly", "lifetime"],
        },
      ],
    },
    {
      category: "การสนับสนุน",
      items: [
        {
          name: "สนับสนุนทางเทคนิค",
          included: ["monthly", "yearly", "lifetime"],
        },
        {
          name: "การตอบกลับด่วน",
          included: ["monthly", "yearly", "lifetime"],
        },
        {
          name: "สนับสนุนทางเทคนิคตลอดการใช้งาน",
          included: ["lifetime"],
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">เลือกแผนที่เหมาะกับคุณ</h1>
          <p className="text-gray-600">เราให้คุณเลือกแผนที่เหมาะสมกับความต้องการของคุณ</p>
        </div>

        {/* Mobile View - Card Style */}
        <div className="md:hidden space-y-6">
          {plans.map((plan) => (
            <div
              key={`mobile-${plan.id}`}
              className={`bg-white rounded-lg border ${
                selectedPlan === plan.id ? "border-blue-500" : "border-gray-200"
              } overflow-hidden`}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="flex items-baseline mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.price !== "ฟรี" && <span className="ml-1">฿</span>}
                  <span className="ml-2 text-sm text-gray-500">{plan.duration}</span>
                </div>

                <div className="mt-6 space-y-4">
                  {features.map((category) => (
                    <div key={`mobile-cat-${category.category}`}>
                      <h4 className="font-medium text-gray-700 mb-2">{category.category}</h4>
                      <ul className="space-y-2">
                        {category.items.map((feature) => (
                          <li key={`mobile-feat-${feature.name}`} className="flex items-start">
                            {feature.included?.includes(plan.id) ? (
                              <>
                                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                <span>{feature.name}</span>
                              </>
                            ) : (
                              <>
                                <X className="h-5 w-5 text-gray-300 mr-2 flex-shrink-0" />
                                <span className="text-gray-400">{feature.name}</span>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <label className="flex items-center mb-4 cursor-pointer">
                    <input
                      type="radio"
                      className="form-radio h-5 w-5 text-blue-600"
                      name="mobile-plan"
                      checked={selectedPlan === plan.id}
                      onChange={() => setSelectedPlan(plan.id)}
                    />
                    <span className="ml-2">เลือกแผนนี้</span>
                  </label>

                  <Button
                    onClick={() => handleSubscribe(plan.id, plan.name)}
                    disabled={selectedPlan !== plan.id || isLoading}
                    className={`w-full ${
                      selectedPlan === plan.id && !isLoading
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading && selectedPlan === plan.id
                      ? "กำลังดำเนินการ..."
                      : plan.id === "free-trial"
                        ? "เริ่มทดลองใช้"
                        : "สมัครสมาชิก"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - Netflix Style Table */}
        <div className="hidden md:block">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Plan Headers */}
            <div className="grid grid-cols-5">
              <div className="p-6 border-b border-r border-gray-200"></div>
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`p-6 text-center border-b ${
                    index < plans.length - 1 ? "border-r" : ""
                  } border-gray-200 relative ${plan.popular ? "bg-blue-50" : ""}`}
                >
                  {plan.popular && <div className="absolute top-0 inset-x-0 h-1 bg-blue-500"></div>}
                  {plan.popular && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm flex items-center">
                        <Star className="h-3 w-3 mr-1" /> แนะนำ
                      </div>
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    {plan.price !== "ฟรี" && <span className="ml-1">฿</span>}
                  </div>
                  <div className="text-sm text-gray-500">{plan.duration}</div>
                  <div className="mt-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio h-5 w-5 text-blue-600"
                        name="plan"
                        checked={selectedPlan === plan.id}
                        onChange={() => setSelectedPlan(plan.id)}
                      />
                      <span className="ml-2 text-sm">เลือก</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature Categories */}
            {features.map((category, catIndex) => (
              <div key={category.category}>
                <div className="grid grid-cols-5 bg-gray-50">
                  <div className="p-4 font-medium text-gray-700 border-r border-gray-200">{category.category}</div>
                  <div className="col-span-4"></div>
                </div>

                {/* Feature Items */}
                {category.items.map((feature, featIndex) => (
                  <div
                    key={feature.name}
                    className={`grid grid-cols-5 ${
                      catIndex === features.length - 1 && featIndex === category.items.length - 1 ? "" : "border-b"
                    } border-gray-200`}
                  >
                    <div className="p-4 text-gray-700 border-r border-gray-200">{feature.name}</div>
                    {plans.map((plan, planIndex) => (
                      <div
                        key={`${feature.name}-${plan.id}`}
                        className={`p-4 text-center ${planIndex < plans.length - 1 ? "border-r" : ""} border-gray-200`}
                      >
                        {feature.included?.includes(plan.id) ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}

            {/* CTA Section */}
            <div className="grid grid-cols-5 border-t border-gray-200">
              <div className="p-6 border-r border-gray-200"></div>
              {plans.map((plan, index) => (
                <div
                  key={`cta-${plan.id}`}
                  className={`p-6 text-center ${index < plans.length - 1 ? "border-r" : ""} border-gray-200`}
                >
                  <Button
                    onClick={() => handleSubscribe(plan.id, plan.name)}
                    disabled={selectedPlan !== plan.id || isLoading}
                    className={`w-full ${
                      selectedPlan === plan.id && !isLoading
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading && selectedPlan === plan.id
                      ? "กำลังดำเนินการ..."
                      : plan.id === "free-trial"
                        ? "เริ่มทดลองใช้"
                        : "สมัครสมาชิก"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white p-8 rounded-lg border border-gray-200 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">มีคำถาม?</h2>
            <p className="text-gray-600 mb-6">หากคุณมีคำถามเกี่ยวกับแผนการสมัครสมาชิกของเรา ทีมงานของเราพร้อมให้ความช่วยเหลือคุณ</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleLogout} variant="destructive">
                ออกจากระบบ
              </Button>

              <Button onClick={() => setShowContactDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                ติดต่อเรา
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPlanName ? `สมัครแผน${selectedPlanName}` : "ติดต่อเรา"}</DialogTitle>
            <DialogDescription>
              {selectedPlanName ? `เลือกช่องทางติดต่อเพื่อสมัครแผน${selectedPlanName}` : "เลือกช่องทางที่สะดวกสำหรับคุณ"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 mt-4">
            {contactChannels.map((channel) => {
              const IconComponent = channel.icon
              return (
                <Button
                  key={channel.name}
                  onClick={channel.action}
                  className={`${channel.color} text-white flex items-center justify-start gap-3 h-12`}
                >
                  <IconComponent className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{channel.name}</div>
                    <div className="text-sm opacity-90">{channel.value}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
