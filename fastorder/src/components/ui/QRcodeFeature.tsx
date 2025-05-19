"use client"

import { useState } from "react"
import Image from "next/image"
import { QrCode, ArrowRight, ShoppingCart } from "lucide-react"
import { motion } from "framer-motion"

const QrCodeFeature = () => {
  const [cart, setCart] = useState<number[]>([])

  const addToCart = (id: number) => {
    setCart([...cart, id])
  }

  const menuItems = [
    {
      id: 1,
      name: "พิซซ่าฮาวายเอี้ยน",
      description: "พิซซ่าหน้าสับปะรด แฮม และชีส",
      price: "฿299",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      id: 2,
      name: "สเต็กเนื้อออสเตรเลีย",
      description: "เนื้อออสเตรเลียคุณภาพดี เสิร์ฟพร้อมมันบด",
      price: "฿459",
      image: "/placeholder.svg?height=300&width=400",
    },
  ]

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  }

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
    hover: {
      scale: 1.03,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
  }

  const stepVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: i * 0.2,
        type: "spring",
        stiffness: 100,
      },
    }),
  }

  return (
    <section className="bg-gradient-to-br from-sky-50 to-slate-100 py-20 text-slate-800">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="flex flex-col-reverse items-center justify-between gap-12 lg:flex-row md:flex-row"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Text content - will appear first on mobile */}
          <motion.div className="w-full lg:w-1/2" variants={itemVariants}>
            <motion.h2
              className="mb-6 text-4xl font-bold leading-tight text-blue-800"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              จาก QR Code สู่การสั่งอาหารในไม่กี่วินาที
            </motion.h2>

            <motion.p
              className="mb-8 text-lg text-slate-600"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              มอบความสะดวกสบายให้กับลูกค้าของคุณ ด้วยระบบการสั่งอาหารผ่าน QR Code ลูกค้าสามารถดูเมนู สั่งอาหาร
              และชำระเงินได้ทั้งหมดจากอุปกรณ์ของตัวเอง
            </motion.p>

            <div className="space-y-6">
              {[1, 2, 3, 4].map((step, index) => (
                <motion.div
                  key={step}
                  className="flex"
                  custom={index}
                  variants={stepVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <motion.div
                    className="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 border-2 border-blue-200"
                    whileHover={{ scale: 1.1, backgroundColor: "#93c5fd" }}
                  >
                    <span className="font-bold text-blue-700">{step}</span>
                  </motion.div>
                  <div>
                    <h4 className="text-xl font-semibold text-blue-700">
                      {step === 1 && "สแกน QR Code"}
                      {step === 2 && "เลือกเมนูและสั่งอาหาร"}
                      {step === 3 && "ชำระเงิน"}
                      {step === 4 && "รับอาหาร"}
                    </h4>
                    <p className="text-slate-600">
                      {step === 1 && "ลูกค้าสแกน QR Code ที่แสดงบนโต๊ะอาหาร"}
                      {step === 2 && "เลือกดูเมนูอาหารที่น่าสนใจและเพิ่มลงตะกร้า"}
                      {step === 3 && "ชำระเงินอย่างปลอดภัยด้วยหลากหลายช่องทาง"}
                      {step === 4 && "คำสั่งซื้อจะปรากฏทันทีบนหน้าจอของร้านเพื่อเตรียมอาหาร"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              className="mt-8 inline-flex items-center rounded-full bg-blue-600 px-8 py-4 font-semibold text-white transition shadow-lg"
              whileHover={{ scale: 1.05, backgroundColor: "#2563eb" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring" }}
              viewport={{ once: true }}
            >
              เรียนรู้เพิ่มเติม
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}>
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.div>
            </motion.button>
          </motion.div>

          {/* Visual content - will appear second on mobile */}
          <motion.div className="w-full lg:w-1/2" variants={itemVariants}>
            <motion.div
              className="rounded-2xl bg-white p-1 shadow-lg"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="rounded-xl bg-gradient-to-br from-sky-100 to-blue-50 p-8">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="relative">
                    <QrCode className="h-12 w-12 text-blue-500 relative z-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-700">สแกนเพื่อสั่งอาหาร</h3>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {menuItems.map((item) => (
                    <motion.div
                      key={item.id}
                      className="rounded-xl bg-white p-4 shadow-md"
                      variants={cardVariants}
                      whileHover="hover"
                    >
                      <div className="relative h-40 w-full mb-3 rounded-lg overflow-hidden">
                        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                      </div>
                      <h4 className="font-semibold text-lg text-blue-800">{item.name}</h4>
                      <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="font-bold text-blue-700">{item.price}</div>
                        <motion.button
                          className="rounded-full bg-blue-500 p-2 cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => addToCart(item.id)}
                        >
                          <ShoppingCart className="h-4 w-4 text-white" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default QrCodeFeature
