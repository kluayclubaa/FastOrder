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
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  return (
    <motion.section
      ref={sectionRef}
      id="features"
      className="relative py-32 md:py-40 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-blue-50 z-0" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <motion.div style={{ y: backgroundY }} className="absolute w-full h-full">
          {/* Animated blobs */}
          <div className="absolute top-20 -left-24 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute top-40 -right-24 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-40 left-1/2 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-3000"></div>

          {/* Decorative patterns */}
          <div className="absolute top-10 right-10 w-64 h-64 border border-blue-200 rounded-full opacity-20"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 border border-purple-200 rounded-full opacity-20"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-green-200 rounded-full opacity-20"></div>

          {/* Floating dots */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-blue-400 opacity-10"
              style={{
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Mesh grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 z-0"></div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 15s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-10px) translateX(10px);
          }
          50% {
            transform: translateY(0) translateX(20px);
          }
          75% {
            transform: translateY(10px) translateX(10px);
          }
          100% {
            transform: translateY(0) translateX(0);
          }
        }
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="mb-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Decorative element above title */}

          <motion.h2
            className="mb-6 text-2xl font-extrabold text-gray-900 md:text-6xl bg-clip-text  "
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
           
            <span className="">สำหรับร้านอาหารยุคใหม่</span>
          </motion.h2>

          <motion.p
            className="mx-auto max-w-2xl text-gray-600 text-xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            แพลตฟอร์มของเรามีทุกสิ่งที่คุณต้องการเพื่อสร้างประสบการณ์การรับประทานอาหารแบบดิจิทัลที่ราบรื่นสำหรับลูกค้าของคุณ
            พร้อมทั้งช่วยให้การดำเนินงานของคุณมีประสิทธิภาพมากขึ้น
          </motion.p>

          {/* Decorative element below description */}
          <motion.div
            className="flex justify-center items-center gap-2 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === 0 ? "bg-blue-400" : i === 1 ? "bg-purple-400" : "bg-teal-400"
                }`}
              />
            ))}
          </motion.div>
        </motion.div>

        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<ClipboardEdit className="h-8 w-8" />}
            title="จัดการเมนู"
            description="สร้างเมนูของคุณได้อย่างง่ายดายด้วยแดชบอร์ดที่ทันสมัย—เพิ่มเมนูใหม่หรืออัปเดตราคาได้ในไม่กี่วินาที"
            color="from-blue-500 to-indigo-600"
            delay={0}
            accentColor="blue"
          />

          <FeatureCard
            icon={<QrCode className="h-8 w-8" />}
            title="สั่งอาหารผ่าน QR Code"
            description="ให้ลูกค้าสั่งอาหารด้วยการสแกน QR โค้ดอย่างรวดเร็ว—ไร้รอยต่อ ไร้การสัมผัส และรวดเร็วทันใจ"
            color="from-purple-500 to-pink-500"
            delay={200}
            accentColor="purple"
          />

          <FeatureCard
            icon={<BarChart3 className="h-8 w-8" />}
            title="สรุปรายได้"
            description="จบวันด้วยความชัดเจน—ดูคำสั่งซื้อ รายได้ และกำไรในที่เดียว พร้อมภาพที่สวยงามน่าประทับใจ"
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
