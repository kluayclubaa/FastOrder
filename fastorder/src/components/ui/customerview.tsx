"use client"
import { useRef } from "react"
import { Smartphone, MonitorSmartphone, Check, Clock } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"
import CustomerMenu from "./mockup/CustomerMenu"
import StoreDashboard from "./mockup/StoreDashboard"
import QueueStatus from "./QueueStatus"

const ResponsiveMockups = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // ลด Parallax effect ให้น้อยลง
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"])
  const floatingY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 60, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  }

  const mockupVariants = {
    hidden: { scale: 0.8, opacity: 0, rotateY: -15 },
    visible: {
      scale: 1,
      opacity: 1,
      rotateY: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: 0.3,
      },
    },
  }

  return (
    <motion.section
      ref={sectionRef}
      // ลด padding ลง
      className="relative bg-white py-8 sm:py-12 lg:py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10" style={{ y: contentY }}>
        <motion.div
          // ลด margin bottom ลง
          className="mb-8 sm:mb-12 text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2
            className="mb-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-800 leading-tight"
            variants={itemVariants}
          >
            ออกแบบมาเพื่อทั้งสองฝั่งของเคาน์เตอร์
          </motion.h2>
          <motion.p
            className="mx-auto max-w-3xl text-lg sm:text-xl text-slate-600 leading-relaxed"
            variants={itemVariants}
          >
            อินเทอร์เฟซที่ใช้งานง่าย ช่วยให้เจ้าของร้านอาหารมีพลังในการจัดการ และมอบประสบการณ์ที่ราบรื่นให้กับลูกค้า
          </motion.p>
        </motion.div>

        {/* Customer Ordering Mockup */}
        <motion.div
          // ลด margin bottom ลง
          className="mb-8 sm:mb-12 flex flex-col items-center gap-8 sm:gap-12 lg:flex-row"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div className="w-full lg:w-1/2 order-2 lg:order-1" variants={itemVariants}>
            <motion.h3
              className="mb-4 flex items-center text-2xl sm:text-3xl font-bold text-blue-800"
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div className="mr-3 p-2 bg-blue-100 rounded-lg" whileHover={{ scale: 1.1, rotate: 5 }}>
                <Smartphone className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
              </motion.div>
              ประสบการณ์การสั่งอาหารของลูกค้า
            </motion.h3>
            <motion.p className="mb-6 text-base sm:text-lg text-slate-600 leading-relaxed" variants={itemVariants}>
              ประสบการณ์บนมือถือที่สวยงามและใช้งานง่าย ทำให้การสั่งอาหารเป็นเรื่องที่น่าเพลิดเพลิน
            </motion.p>
            <motion.ul className="space-y-3" variants={containerVariants}>
              {[
                "สแกน QR โค้ดเพื่อเข้าถึงเมนูดิจิทัลได้ทันที",
                "เลือกดูรายการเมนูที่แสดงอย่างสวยงามพร้อมภาพคุณภาพสูง",
                "เพิ่มรายการลงตะกร้าด้วยการแตะเพียงครั้งเดียว",
                "ปรับแต่งคำสั่งซื้อด้วยคำขอพิเศษ",
                "ทำรายการสั่งซื้อและชำระเงินได้อย่างราบรื่น",
              ].map((item, index) => (
                <motion.li key={index} className="flex items-start" variants={itemVariants} whileHover={{ x: 5 }}>
                  <motion.div
                    className="mr-3 sm:mr-4 flex h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-100 border-2 border-green-200"
                    whileHover={{ scale: 1.2, backgroundColor: "#bbf7d0" }}
                  >
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </motion.div>
                  <span className="text-sm sm:text-base text-slate-600">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
          <motion.div
            className="relative w-full lg:w-1/2 order-1 lg:order-2 flex justify-center"
            variants={mockupVariants}
          >
            <motion.div
              className="relative w-80 sm:w-96 overflow-hidden rounded-3xl sm:rounded-[2rem] border-4 sm:border-8 border-slate-800 shadow-2xl bg-white"
              whileHover={{
                y: -10,
                rotateY: 5,
                boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <CustomerMenu />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Queue Status Mockup */}
        <motion.div
          className="mb-8 sm:mb-12 flex flex-col items-center gap-8 sm:gap-12 lg:flex-row-reverse"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div className="w-full lg:w-1/2 order-2" variants={itemVariants}>
            <motion.h3
              className="mb-4 flex items-center text-2xl sm:text-3xl font-bold text-blue-800"
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div className="mr-3 p-2 bg-orange-100 rounded-lg" whileHover={{ scale: 1.1, rotate: 5 }}>
                <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600" />
              </motion.div>
              ระบบติดตามสถานะออเดอร์
            </motion.h3>
            <motion.p className="mb-6 text-base sm:text-lg text-slate-600 leading-relaxed" variants={itemVariants}>
              ลูกค้าสามารถติดตามสถานะออเดอร์แบบเรียลไทม์ ตั้งแต่การยืนยันจนถึงการเสิร์ฟ
            </motion.p>
            <motion.ul className="space-y-3" variants={containerVariants}>
              {[
                "แสดงสถานะออเดอร์แบบเรียลไทม์",
                "ระบบคิวที่แสดงลำดับการเตรียมอาหาร",
                "รายละเอียดออเดอร์ครบถ้วนพร้อมราคา",
                "ขั้นตอนการเตรียมอาหารที่ชัดเจน",
                "การแจ้งเตือนเมื่อออเดอร์เสร็จสิ้น",
              ].map((item, index) => (
                <motion.li key={index} className="flex items-start" variants={itemVariants} whileHover={{ x: 5 }}>
                  <motion.div
                    className="mr-3 sm:mr-4 flex h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 border-2 border-orange-200"
                    whileHover={{ scale: 1.2, backgroundColor: "#fed7aa" }}
                  >
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                  </motion.div>
                  <span className="text-sm sm:text-base text-slate-600">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
          <motion.div className="relative w-full lg:w-1/2 order-1 flex justify-center" variants={mockupVariants}>
            <motion.div
              className="relative w-80 sm:w-96 overflow-hidden rounded-3xl sm:rounded-[2rem] border-4 sm:border-8 border-slate-800 shadow-2xl bg-white"
              whileHover={{
                y: -10,
                rotateY: -5,
                boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <QueueStatus />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Store Dashboard Mockup */}
        <motion.div
          className="flex flex-col items-center gap-8 sm:gap-12 lg:flex-row"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div
            className="relative w-full lg:w-1/2 order-2 lg:order-1 flex justify-center"
            variants={mockupVariants}
          >
            <motion.div
              className="relative w-full max-w-4xl overflow-hidden rounded-3xl sm:rounded-[2rem] border-4 sm:border-8 border-slate-800 shadow-2xl bg-white"
              whileHover={{
                y: -10,
                scale: 1.02,
                boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <StoreDashboard />
            </motion.div>
          </motion.div>
          <motion.div className="w-full lg:w-1/2 order-1 lg:order-2" variants={itemVariants}>
            <motion.h3
              className="mb-4 flex items-center text-2xl sm:text-3xl font-bold text-blue-800"
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div className="mr-3 p-2 bg-indigo-100 rounded-lg" whileHover={{ scale: 1.1, rotate: 5 }}>
                <MonitorSmartphone className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" />
              </motion.div>
              แดชบอร์ดสำหรับเจ้าของร้าน
            </motion.h3>
            <motion.p className="mb-6 text-base sm:text-lg text-slate-600 leading-relaxed" variants={itemVariants}>
              ศูนย์ควบคุมที่ทรงพลังสำหรับจัดการเมนู คำสั่งซื้อ และวิเคราะห์ประสิทธิภาพ
            </motion.p>
            <motion.ul className="space-y-3" variants={containerVariants}>
              {[
                "เครื่องมือแก้ไขเมนูแบบลากและวางพร้อมการอัปเดตแบบเรียลไทม์",
                "การแจ้งเตือนคำสั่งซื้อแบบสดพร้อมการประมวลผลด้วยคลิกเดียว",
                "สรุปรายได้ประจำวันพร้อมแผนภูมิแบบโต้ตอบ",
                "ข้อมูลเชิงลึกของลูกค้าและการติดตามรายการยอดนิยม",
                "อินเทอร์เฟซที่เหมาะสำหรับสภาพแวดล้อมของร้านอาหาร",
              ].map((item, index) => (
                <motion.li key={index} className="flex items-start" variants={itemVariants} whileHover={{ x: 5 }}>
                  <motion.div
                    className="mr-3 sm:mr-4 flex h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 border-2 border-indigo-200"
                    whileHover={{ scale: 1.2, backgroundColor: "#c7d2fe" }}
                  >
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
                  </motion.div>
                  <span className="text-sm sm:text-base text-slate-600">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.section>
  )
}

export default ResponsiveMockups