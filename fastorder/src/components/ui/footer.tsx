"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Mail,
  MapPin,
  Phone,
  Facebook,
  Instagram,
  ArrowRight,
  MessageCircle,
} from "lucide-react"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 120, damping: 14 },
  },
}

export default function Footer() {
  const [email, setEmail] = useState("")

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Integrate newsletter logic
    setEmail("")
  }

  const quickLinks = [
    { name: "หน้าแรก", href: "/" },
    { name: "ราคา", href: "/pricing" },
  ]

  return (
    <footer className="relative bg-gradient-to-br from-white via-sky-100 to-blue-50 text-slate-800 overflow-hidden">
      {/* Decorative Wave Divider */}
      <div className="absolute -top-1 left-0 w-full overflow-hidden leading-none rotate-180">
        <svg
          className="relative block w-full h-[60px] text-blue-50"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 120"
        >
          <path
            d="M0,0V46.29c47.56,22,104.55,29.14,158.24,17.36C278.23,43.33,334.94,4.57,414,3.92c80.52-.66,134.48,33.85,210,42.34
            c62.06,7.18,124.89-1.13,185-23.9,59.13-22.47,114.31-55.66,173-46.54,39.05,6.36,74.21,31.72,112,45.69V0Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="container mx-auto px-6 py-20 lg:py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand & Newsletter */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
              <motion.h2
                className="text-4xl font-extrabold tracking-tight text-blue-600"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                FastOrder
              </motion.h2>
              <p className="leading-relaxed text-slate-600 max-w-xl">
                ระบบจัดการร้านอาหารที่ทันสมัย เชื่อมต่อเทคโนโลยี QR Code และการจัดการออเดอร์แบบเรียลไทม์ เพื่อยกระดับประสบการณ์ของลูกค้าและเพิ่มประสิทธิภาพธุรกิจให้กับคุณ
              </p>

     
            

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <motion.a
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium text-white text-center shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  เริ่มต้นใช้งาน
                </motion.a>
                <motion.a
                  href="/pricing"
                  className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium text-center shadow-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ดูราคาแพ็กเกจ
                </motion.a>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={itemVariants} className="space-y-5">
              <h3 className="text-xl font-semibold mb-4 text-blue-600">ลิงก์ด่วน</h3>
              <ul className="space-y-3 text-slate-600">
                {quickLinks.map(({ name, href }) => (
                  <li key={name}>
                    <motion.a
                      href={href}
                      className="group inline-flex items-center hover:text-blue-600 transition-colors"
                      whileHover={{ x: 6 }}
                    >
                      <span>{name}</span>
                      <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact & Social */}
            <motion.div variants={itemVariants} className="space-y-8">
              <h3 className="text-xl font-semibold text-blue-600">ติดต่อเรา</h3>
              <div className="space-y-5 text-slate-600">
                {[
                  { icon: Mail, label: "อีเมล", value: "fastallder@gmail.com", href: "mailto:fastallder@gmail.com" },
                  { icon: MapPin, label: "ที่อยู่", value: ["408 ต.ท่ามะเดื่อ อ.บางแก้ว", "พัทลุง 93140"] },
                  { icon: Phone, label: "โทรศัพท์", value: "0991648465", href: "tel:0991648465" },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-start gap-3"
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <item.icon className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-slate-700">{item.label}</div>
                      {Array.isArray(item.value) ? (
                        item.value.map((line) => <div key={line}>{line}</div>)
                      ) : item.href ? (
                        <a href={item.href} className="hover:text-blue-600 transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <div>{item.value}</div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Social Icons */}
              <div className="pt-2">
                <h4 className="text-sm font-semibold text-blue-600 mb-3">ติดตามเรา</h4>
                <div className="flex space-x-4">
                  {[
                    { icon: Facebook, href: "https://www.facebook.com/share/12LqogeyXtK/", bg: "hover:bg-blue-500" },
                    { icon: MessageCircle, href: "https://line.me/ti/p/YpO0ygLT96", bg: "hover:bg-emerald-500" },
                    { icon: Instagram, href: "https://www.instagram.com/fastallder/", bg: "hover:bg-pink-500" },
                  ].map((s, idx) => (
                    <motion.a
                      key={idx}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-full bg-white shadow-md ${s.bg} transition-colors`}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <s.icon className="w-5 h-5 text-slate-700" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>


    </footer>
  )
}
