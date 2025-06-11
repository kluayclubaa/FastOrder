"use client"

import { useState } from "react"
import { Check, X, Star, Phone, MessageCircle, Facebook, Instagram } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function PublicPricingPage() {
  const router = useRouter()
  const [showContactDialog, setShowContactDialog] = useState(false)

  const handleLogin = () => {
    router.push("/login")
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
      action: () => window.open("https://web.facebook.com/kluay.game"),
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      name: "Instagram",
      icon: Instagram,
      value: "ps_kluay",
      action: () => window.open("https://www.instagram.com/ps_kluay/"),
      color: "bg-pink-500 hover:bg-pink-600",
    },
  ]

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
          <h1 className="text-3xl font-bold mb-2">แผนการสมัครสมาชิก</h1>
          <p className="text-gray-600">เลือกแผนที่เหมาะสมกับความต้องการของคุณ</p>
        </div>

        {/* Mobile View - Card Style */}
        <div className="md:hidden space-y-6">
          {plans.map((plan) => (
            <div
              key={`mobile-${plan.id}`}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                {plan.popular && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm flex items-center">
                      <Star className="h-3 w-3 mr-1" /> แนะนำ
                    </div>
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-center">{plan.name}</h3>
                <div className="flex items-baseline justify-center mt-2">
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
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white p-8 rounded-lg border border-gray-200 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">พร้อมที่จะเริ่มต้นแล้วหรือยัง?</h2>
            <p className="text-gray-600 mb-6">เข้าสู่ระบบเพื่อเลือกแผนที่เหมาะกับคุณ หรือติดต่อเราเพื่อสอบถามข้อมูลเพิ่มเติม</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
                เข้าสู่ระบบ
              </Button>

              <Button onClick={() => setShowContactDialog(true)} variant="outline">
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
            <DialogTitle>ติดต่อเรา</DialogTitle>
            <DialogDescription>
              เลือกช่องทางที่สะดวกสำหรับคุณเพื่อสอบถามข้อมูลเพิ่มเติม
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