'use client'
import { useState } from "react"
import { Check, X, Star } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PricingPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string>("free-trial")

  const handleSubscribe = () => {
    if (!selectedPlan) return
    // Here you would implement your payment processing logic
    console.log(`Selected plan: ${selectedPlan}`)
    // After payment processing, you would update the user's isPaid status in Firestore
    // and then redirect to the dashboard
  }

  const plans = [
    {
      id: "free-trial",
      name: "ทดลองใช้",
      price: "ฟรี",
      duration: "7 วัน",
      popular: false,
    },
    {
      id: "monthly",
      name: "รายเดือน",
      price: "299",
      duration: "ต่อเดือน",
      popular: false,
    },
    {
      id: "yearly",
      name: "รายปี",
      price: "3,000",
      duration: "ต่อปี",
      popular: true,
    },
    {
      id: "lifetime",
      name: "ตลอดชีพ",
      price: "5,000",
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
        {
          name: "จำนวนอุปกรณ์ที่ใช้งานพร้อมกัน",
          values: {
            "free-trial": "1 เครื่อง",
            monthly: "2 เครื่อง",
            yearly: "5 เครื่อง",
            lifetime: "ไม่จำกัด",
          },
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
          included: ["yearly", "lifetime"],
        },
        {
          name: "สนับสนุนทางเทคนิคระดับ VIP",
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
                            {"values" in feature ? (
                              <>
                                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                <span>
                                  {feature.name}: {feature.values?.[plan.id as keyof typeof feature.values]}
                                </span>
                              </>
                            ) : feature.included?.includes(plan.id) ? (
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

                  <button
                    onClick={handleSubscribe}
                    className={`w-full py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                      selectedPlan === plan.id
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {plan.id === "free-trial" ? "เริ่มทดลองใช้" : "สมัครสมาชิก"}
                  </button>
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
                        {"values" in feature ? (
                          <span className="text-sm font-medium">
                            {feature.values?.[plan.id as keyof typeof feature.values]}
                          </span>
                        ) : feature.included?.includes(plan.id) ? (
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
                  <button
                    onClick={handleSubscribe}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                      selectedPlan === plan.id
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {plan.id === "free-trial" ? "เริ่มทดลองใช้" : "สมัครสมาชิก"}
                  </button>
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
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                ดูคำถามที่พบบ่อย
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                ติดต่อเรา
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">© 2025 บริษัทของคุณ. สงวนลิขสิทธิ์ทั้งหมด.</p>
        </div>
      </div>
    </div>
  )
}
