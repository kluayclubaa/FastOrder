"use client"

import { motion } from "framer-motion"
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, ArrowRight,MessageCircle } from "lucide-react"

const Footer = () => {
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
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  }

  return (
    <motion.footer
      className="bg-slate-900 text-white"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <motion.div
          className="py-12 lg:py-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Company Info */}
            <motion.div className="lg:col-span-2" variants={itemVariants}>
              <motion.h3
                className="text-2xl font-bold text-blue-400 mb-4"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                FastOrder
              </motion.h3>
              <p className="text-slate-300 mb-6 leading-relaxed">
                ระบบจัดการร้านอาหารที่ทันสมัย ช่วยให้ธุรกิจของคุณเติบโตด้วยเทคโนโลยี QR Code และระบบจัดการออเดอร์ที่มีประสิทธิภาพ
                พร้อมเพิ่มประสบการณ์ที่ดีให้กับลูกค้า
              </p>

              {/* Newsletter Signup */}
             

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.a
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors text-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  เริ่มต้นใช้งาน
                </motion.a>
                <motion.a
                  href="/"
                  className="border border-slate-600 hover:border-slate-500 hover:bg-slate-800 px-6 py-3 rounded-lg font-medium transition-colors text-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ดูตัวอย่าง
                </motion.a>
              </div>
            </motion.div>

            {/* Quick Links */}
            {/* <motion.div variants={itemVariants}>
              <h4 className="text-lg font-semibold mb-6 text-blue-400">ลิงก์ด่วน</h4>
              <ul className="space-y-3">
                {[
                  { name: "หน้าแรก", href: "/" },
                  { name: "ฟีเจอร์", href: "/" },
                  { name: "ราคา", href: "/" },
                  { name: "เกี่ยวกับเรา", href: "/" },
                  { name: "บล็อก", href: "/" },
                  { name: "ช่วยเหลือ", href: "/" },
                ].map((link, index) => (
                  <li key={index}>
                    <motion.a
                      href={link.href}
                      className="text-slate-300 hover:text-blue-400 transition-colors flex items-center group"
                      whileHover={{ x: 5 }}
                    >
                      <span>{link.name}</span>
                      <ArrowRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div> */}

            {/* Contact Info */}
            <motion.div variants={itemVariants}>
              <h4 className="text-lg font-semibold mb-6 text-blue-400">ติดต่อเรา</h4>
              <div className="space-y-4 text-slate-300">
                <motion.div
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Mail className="h-5 w-5 mr-3 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">อีเมล</div>
                    <a href="mailto:kluay.edu@gmail.com" className="hover:text-blue-400 transition-colors">
                      kluay.edu@gmail.com
                    </a>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <MapPin className="h-5 w-5 mr-3 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">ที่อยู่</div>
                    <div>408 ต.ท่ามะเดื่อ อ.บางเเก้ว</div>
                    <div>พัทลุง 93140</div>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Phone className="h-5 w-5 mr-3 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">โทรศัพท์</div>
                    <a href="tel:0991648465" className="hover:text-blue-400 transition-colors">
                      0991648465
                    </a>
                  </div>
                </motion.div>
              </div>

              {/* Social Media */}
              <div className="mt-8">
                <h5 className="text-sm font-semibold mb-4 text-blue-400">ติดตามเรา</h5>
                <div className="flex space-x-3">
                  {[
                    { name: "Facebook", icon: Facebook, href: "https://web.facebook.com/kluay.game", color: "hover:bg-blue-600" },
                    { name: "Line", icon: MessageCircle, href: "https://line.me/ti/p/YpO0ygLT96", color: "hover:bg-sky-500" },
                    { name: "Instagram", icon: Instagram, href: "https://www.instagram.com/ps_kluay/", color: "hover:bg-pink-600" },
                  ].map((social, index) => (
                    <motion.a
                      target="_blank"
                      key={social.name}
                      href={social.href}
                      className={`bg-slate-800 ${social.color} p-3 rounded-lg transition-colors group`}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      title={social.name}
                    >
                      <social.icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          className="border-t border-slate-700 py-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
              <motion.a
                href="/privacy"
                className="text-slate-400 hover:text-blue-400 transition-colors"
                whileHover={{ y: -1 }}
              >
                นโยบายความเป็นส่วนตัว
              </motion.a>
              <motion.a
                href="/terms"
                className="text-slate-400 hover:text-blue-400 transition-colors"
                whileHover={{ y: -1 }}
              >
                ข้อกำหนดการใช้งาน
              </motion.a>
  
            </div>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  )
}

export default Footer
