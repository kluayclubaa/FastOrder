"use client"

import { useEffect, useRef, useState } from "react"
import {
  TrendingUp,
  DollarSignIcon as BahtSign,
  LineChart,
  PieChart,
  Calendar,
  ArrowUpRight,
  Download,
} from "lucide-react"
import { motion } from "framer-motion"

const RevenueInsight = () => {
  const [isVisible, setIsVisible] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const [counters, setCounters] = useState({
    orders: 0,
    revenue: 0,
    profit: 0,
  })

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 100,
      },
    }),
    hover: {
      y: -5,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
  }

  const barVariants = {
    hidden: { height: 0 },
    visible: (height: number) => ({
      height: `${height}%`,
      transition: {
        duration: 1,
        ease: "easeOut",
      },
    }),
  }

  const progressVariants = {
    hidden: { width: 0 },
    visible: (width: number) => ({
      width: `${width}%`,
      transition: {
        duration: 1.5,
        ease: "easeOut",
      },
    }),
  }

  const pieVariants = {
    hidden: { rotate: 0 },
    visible: (rotation: number) => ({
      rotate: rotation,
      transition: {
        duration: 1.5,
        ease: "easeOut",
      },
    }),
  }

  // Intersection Observer to trigger animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (chartRef.current) {
      observer.observe(chartRef.current)
    }

    return () => {
      if (chartRef.current) {
        observer.unobserve(chartRef.current)
      }
    }
  }, [])

  // Counter animation
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setCounters((prev) => ({
          orders: prev.orders < 127 ? prev.orders + 1 : 127,
          revenue: prev.revenue < 112500 ? prev.revenue + 1000 : 112500,
          profit: prev.profit < 39500 ? prev.profit + 500 : 39500,
        }))
      }, 30)

      return () => clearInterval(interval)
    }
  }, [isVisible])

  const barHeights = [20, 35, 50, 80, 65, 75, 90, 60, 40, 30, 45, 55]
  const categoryWidths = [75, 50, 33]
  const pieRotations = [45, 165]

  return (
    <section className="bg-gradient-to-br from-white to-teal-50 py-20">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-teal-200 opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-blue-200 opacity-10 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          className="grid items-center gap-12 lg:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <motion.div variants={containerVariants}>
            <motion.span
              className="mb-2 inline-block rounded-full bg-teal-100 px-4 py-1 text-sm font-semibold text-teal-800"
              variants={itemVariants}
            >
              ข้อมูลเชิงลึกจากข้อมูลจริง
            </motion.span>
            <motion.h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl" variants={itemVariants}>
              แปลงข้อมูลเป็นการตัดสินใจทางธุรกิจที่ปฏิบัติได้จริง
            </motion.h2>
            <motion.p className="mb-8 text-lg text-gray-600" variants={itemVariants}>
              จบวันด้วยความชัดเจน—ดูคำสั่งซื้อ รายได้ และกำไรในที่เดียว ด้วยภาพที่สวยงามที่ช่วยให้คุณเข้าใจธุรกิจของคุณอย่างที่ไม่เคยเป็นมาก่อน
            </motion.p>

            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  icon: <TrendingUp className="h-6 w-6 text-teal-600" />,
                  title: "แนวโน้มยอดขาย",
                  description: "ติดตามรูปแบบการขายตลอดเวลาด้วยแผนภูมิแบบโต้ตอบ",
                  index: 0,
                },
                {
                  icon: <BahtSign className="h-6 w-6 text-teal-600" />,
                  title: "อัตรากำไร",
                  description: "คำนวณกำไรตามต้นทุนและข้อมูลการขาย",
                  index: 1,
                },
                {
                  icon: <LineChart className="h-6 w-6 text-teal-600" />,
                  title: "การวิเคราะห์ประสิทธิภาพ",
                  description: "เปรียบเทียบประสิทธิภาพในช่วงเวลาที่แตกต่างกัน",
                  index: 2,
                },
                {
                  icon: <PieChart className="h-6 w-6 text-teal-600" />,
                  title: "รายการยอดนิยม",
                  description: "ระบุรายการขายดีที่สุดและรายการโปรดของลูกค้า",
                  index: 3,
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  className="rounded-xl bg-white p-6 shadow-md"
                  custom={feature.index}
                  variants={cardVariants}
                  whileHover="hover"
                >
                  <motion.div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100"
                    whileHover={{ scale: 1.1, backgroundColor: "#99f6e4" }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="relative" variants={containerVariants} ref={chartRef}>
            <motion.div
              className="rounded-xl bg-gray-900 p-6 shadow-2xl"
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center">
                  <h3 className="text-xl font-bold text-white">สรุปประจำวัน</h3>
                  <motion.div
                    className="ml-2 flex items-center text-xs text-gray-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                  >
                    <div className="mr-1 h-2 w-2 rounded-full bg-teal-500"></div>
                    กำลังอัปเดต
                  </motion.div>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center rounded-lg bg-gray-800 px-3 py-2 text-sm text-white">
                    <Calendar className="mr-2 h-4 w-4" />
                    วันนี้
                  </div>
                  <motion.button
                    className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white flex items-center"
                    whileHover={{ scale: 1.05, backgroundColor: "#14b8a6" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ดูรายละเอียด
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div
                  className="rounded-lg bg-gray-800 p-4"
                  variants={itemVariants}
                  whileHover={{ y: -5, backgroundColor: "#1f2937" }}
                >
                  <p className="text-sm text-gray-400">คำสั่งซื้อทั้งหมด</p>
                  <p className="text-2xl font-bold text-white">{counters.orders}</p>
                  <p className="mt-2 text-xs text-green-400">↑ 12% จากเมื่อวาน</p>
                </motion.div>
                <motion.div
                  className="rounded-lg bg-gray-800 p-4"
                  variants={itemVariants}
                  whileHover={{ y: -5, backgroundColor: "#1f2937" }}
                >
                  <p className="text-sm text-gray-400">รายได้</p>
                  <p className="text-2xl font-bold text-white">฿{counters.revenue.toLocaleString()}</p>
                  <p className="mt-2 text-xs text-green-400">↑ 8% จากเมื่อวาน</p>
                </motion.div>
                <motion.div
                  className="rounded-lg bg-gray-800 p-4"
                  variants={itemVariants}
                  whileHover={{ y: -5, backgroundColor: "#1f2937" }}
                >
                  <p className="text-sm text-gray-400">กำไร</p>
                  <p className="text-2xl font-bold text-white">฿{counters.profit.toLocaleString()}</p>
                  <p className="mt-2 text-xs text-green-400">↑ 5% จากเมื่อวาน</p>
                </motion.div>
              </div>

              <motion.div
                className="mt-6 rounded-lg bg-gray-800 p-4"
                variants={itemVariants}
                whileHover={{ backgroundColor: "#1f2937" }}
              >
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-medium text-white">ยอดขายตามชั่วโมง</p>
                  <motion.button
                    className="text-xs text-teal-400 flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    ดาวน์โหลด
                  </motion.button>
                </div>
                <div className="flex h-40 items-end justify-between">
                  {barHeights.map((height, i) => (
                    <motion.div
                      key={i}
                      className="w-4 rounded-t bg-teal-500"
                      custom={height}
                      variants={barVariants}
                      initial="hidden"
                      animate={isVisible ? "visible" : "hidden"}
                      whileHover={{ backgroundColor: "#14b8a6" }}
                    ></motion.div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-400">
                  <span>9:00</span>
                  <span>12:00</span>
                  <span>15:00</span>
                  <span>18:00</span>
                  <span>21:00</span>
                </div>
              </motion.div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div
                  className="rounded-lg bg-gray-800 p-4"
                  variants={itemVariants}
                  whileHover={{ backgroundColor: "#1f2937" }}
                >
                  <p className="mb-4 text-sm font-medium text-white">หมวดหมู่ยอดนิยม</p>
                  <div className="space-y-3">
                    {[
                      { name: "อาหารจานหลัก", width: 75, color: "bg-purple-500" },
                      { name: "เครื่องดื่ม", width: 50, color: "bg-indigo-500" },
                      { name: "ของหวาน", width: 33, color: "bg-teal-500" },
                    ].map((category, i) => (
                      <div key={i} className="flex items-center">
                        <div className="h-3 w-full rounded-full bg-gray-700 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${category.color}`}
                            custom={category.width}
                            variants={progressVariants}
                            initial="hidden"
                            animate={isVisible ? "visible" : "hidden"}
                          ></motion.div>
                        </div>
                        <span className="ml-2 text-xs text-gray-400">{category.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
                <motion.div
                  className="rounded-lg bg-gray-800 p-4"
                  variants={itemVariants}
                  whileHover={{ backgroundColor: "#1f2937" }}
                >
                  <p className="mb-4 text-sm font-medium text-white">วิธีการชำระเงิน</p>
                  <div className="relative h-32 w-32 mx-auto">
                    <motion.div
                      className="absolute inset-0 rounded-full border-8 border-indigo-500"
                    
                    ></motion.div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-8 border-transparent border-t-purple-500"
                      custom={45}
                      variants={pieVariants}
                      initial="hidden"
                      animate={isVisible ? "visible" : "hidden"}
                    ></motion.div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-8 border-transparent border-t-teal-500"
                      custom={165}
                      variants={pieVariants}
                      initial="hidden"
                      animate={isVisible ? "visible" : "hidden"}
                    ></motion.div>
                  </div>
                  <div className="mt-4 flex justify-around text-xs text-gray-400">
                    <div className="flex items-center">
                      <div className="mr-1 h-2 w-2 rounded-full bg-indigo-500"></div>
                      <span>เงินสด</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-1 h-2 w-2 rounded-full bg-purple-500"></div>
                      <span>บัตร</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-1 h-2 w-2 rounded-full bg-teal-500"></div>
                      <span>โอนเงิน</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -right-4 -top-4 transform rounded-lg bg-white p-4 shadow-lg md:-right-8"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="flex items-center">
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100"
                  whileHover={{ scale: 1.1, backgroundColor: "#99f6e4" }}
                >
                  <TrendingUp className="h-6 w-6 text-teal-600" />
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">รายได้เฉลี่ยต่อวัน</p>
                  <p className="text-lg font-bold text-gray-800">฿102,500</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default RevenueInsight
