"use client"

import { useRef } from "react"
import { ClipboardEdit, QrCode, BarChart3 } from "lucide-react"
import FeatureCard from "./mockup/FeatureCard"
import { motion, useScroll, useTransform } from "framer-motion"

const FeatureSection = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])

  return (
    <motion.section
      ref={sectionRef}
      id="features"
      className="relative py-16 md:py-20 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 bg-white z-0" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h2
            className="mb-6 text-2xl font-extrabold text-gray-900 md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <span className="">ฟีเจอร์ครบครันสำหรับร้านอาหารยุคใหม่</span>
          </motion.h2>

          <motion.p
            className="mx-auto max-w-2xl text-gray-600 text-xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            ระบบจัดการร้านอาหารที่ทันสมัย ช่วยให้การดำเนินงานของคุณมีประสิทธิภาพมากขึ้น และมอบประสบการณ์ที่ดีให้กับลูกค้า
          </motion.p>
        </motion.div>

        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<ClipboardEdit className="h-8 w-8" />}
            title="จัดการเมนูอย่างง่ายดาย"
            description="เพิ่ม แก้ไข และอัปเดตเมนูได้ในไม่กี่คลิก พร้อมระบบจัดหมวดหมู่และการตั้งราคาที่ยืดหยุ่น"
            color="from-blue-500 to-indigo-600"
            delay={0}
            accentColor="blue"
          />

          <FeatureCard
            icon={<QrCode className="h-8 w-8" />}
            title="สั่งอาหารผ่าน QR Code"
            description="ลูกค้าสแกน QR Code เพื่อดูเมนูและสั่งอาหารได้ทันที ไม่ต้องรอพนักงาน ลดการสัมผัสและเพิ่มความปลอดภัย"
            color="from-purple-500 to-pink-500"
            delay={200}
            accentColor="purple"
          />

          <FeatureCard
            icon={<BarChart3 className="h-8 w-8" />}
            title="วิเคราะห์รายได้และยอดขาย"
            description="ดูสถิติรายได้รายวัน รายเดือน พร้อมรายงานเมนูยอดนิยมและข้อมูลเชิงลึกเพื่อการตัดสินใจ"
            color="from-emerald-500 to-teal-500"
            delay={400}
            accentColor="emerald"
          />
        </div>
      </div>
    </motion.section>
  )
}

export default FeatureSection
