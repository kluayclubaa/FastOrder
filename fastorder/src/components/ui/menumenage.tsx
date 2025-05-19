"use client"

import { useRef } from "react"
import { Edit, PlusCircle, MenuSquare, ImageIcon, MoveVertical, Search, Tag } from "lucide-react"
import { motion } from "framer-motion"

const MenuManagement = () => {
  const containerRef = useRef<HTMLDivElement>(null)

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

  const menuItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: (i: number) => ({
      x: 0,
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

  const featureVariants = {
    hidden: { x: 20, opacity: 0 },
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

  const menuItems = [
    {
      id: 1,
      name: "ต้มยำกุ้ง",
      description: "ต้มยำกุ้งน้ำใส รสชาติเข้มข้น เปรี้ยวหวานกำลังดี",
      price: "฿180",
      image:
        "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    },
    {
      id: 2,
      name: "ผัดไทยกุ้งสด",
      description: "ผัดไทยเส้นเหนียวนุ่ม กุ้งสดตัวใหญ่ คลุกเคล้ากับซอสสูตรพิเศษ",
      price: "฿120",
      image:
        "https://images.pexels.com/photos/12365244/pexels-photo-12365244.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    },
    {
      id: 3,
      name: "ข้าวผัดปู",
      description: "ข้าวหอมมะลิผัดกับเนื้อปูก้อนใหญ่ ไข่ และผักสด",
      price: "฿150",
      image:
        "https://images.pexels.com/photos/5409010/pexels-photo-5409010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    },
  ]

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20 min-h-screen">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-yellow-200 opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-blue-200 opacity-10 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10" ref={containerRef}>
        <motion.div
          className="mb-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <motion.span
            className="mb-2 inline-block rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-800"
            variants={itemVariants}
          >
            จัดการเมนู
          </motion.span>
          <motion.h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl" variants={itemVariants}>
            สร้างเมนูดิจิทัลของคุณอย่างง่ายดาย
          </motion.h2>
          <motion.p className="mx-auto max-w-2xl text-gray-600" variants={itemVariants}>
            ระบบอินเทอร์เฟซแบบลากและวางที่ใช้งานง่าย ช่วยให้คุณสร้างและอัปเดตเมนูได้แบบเรียลไทม์ โดยไม่จำเป็นต้องมีความรู้ทางเทคนิค
          </motion.p>
        </motion.div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            className="order-2 lg:order-1"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <motion.div
              className="relative rounded-xl bg-white p-6 shadow-xl border border-gray-100"
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="flex items-center text-xl font-bold text-gray-900">
                  <MenuSquare className="mr-2 h-5 w-5 text-blue-600" />
                  แก้ไขเมนู
                </h3>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาเมนู"
                      className="rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <motion.div
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                   
                  >
                    บันทึกการเปลี่ยนแปลง
                  </motion.div>
                </div>
              </div>

              <div className="mb-6 space-y-4">
                {menuItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                    custom={index}
                    variants={menuItemVariants}
                   
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-0">
                      <div className="relative h-24 w-24 sm:h-16 sm:w-16 mx-auto sm:mx-0 flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                        <motion.button
                          className="absolute bottom-0 right-0 rounded-tl-lg bg-blue-600 p-1 text-white hover:bg-blue-700"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <ImageIcon className="h-3 w-3" />
                        </motion.button>
                      </div>
                      <div className="ml-0 sm:ml-4 mt-2 sm:mt-0 text-center sm:text-left">
                        <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                      <div className="flex items-center mr-2 sm:mr-4">
                        <Tag className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">อาหารไทย</span>
                      </div>
                      <span className="mr-4 text-lg font-medium text-gray-900">{item.price}</span>
                      <div className="flex gap-2">
                        <motion.button
                          className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <MoveVertical className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          className="rounded-full bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Edit className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-blue-300 p-4 text-blue-600 hover:bg-blue-50"
                whileHover={{ scale: 1.01, backgroundColor: "rgba(239, 246, 255, 0.7)" }}
                whileTap={{ scale: 0.99 }}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                เพิ่มรายการใหม่
              </motion.button>
            </motion.div>
          </motion.div>

          <motion.div
            className="order-1 lg:order-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <motion.h3 className="mb-4 text-2xl font-bold text-gray-900" variants={itemVariants}>
              ควบคุมเมนูของคุณได้อย่างสมบูรณ์
            </motion.h3>
            <motion.p className="mb-6 text-gray-600" variants={itemVariants}>
              ระบบจัดการเมนูของเราให้คุณมีอำนาจในการสร้าง อัปเดต และปรับแต่งเมนูดิจิทัลของคุณแบบเรียลไทม์ โดยไม่จำเป็นต้องมีความรู้ทางเทคนิค
            </motion.p>

            <div className="space-y-6">
              {[
                {
                  icon: <Edit className="h-5 w-5 text-blue-600" />,
                  title: "อินเทอร์เฟซแบบลากและวาง",
                  description: "จัดระเบียบหมวดหมู่และรายการเมนูของคุณได้อย่างง่ายดายด้วยฟังก์ชันลากและวางที่ใช้งานง่าย",
                },
                {
                  icon: <ImageIcon className="h-5 w-5 text-blue-600" />,
                  title: "การแก้ไขภาพที่สมบูรณ์",
                  description: "อัปโหลดรูปภาพคุณภาพสูงสำหรับแต่ละเมนู เพิ่มคำอธิบายโดยละเอียด และกำหนดราคาที่ถูกต้อง",
                },
                {
                  icon: <MenuSquare className="h-5 w-5 text-blue-600" />,
                  title: "อัปเดตแบบเรียลไทม์",
                  description: "การเปลี่ยนแปลงเมนูของคุณจะปรากฏทันทีสำหรับลูกค้า ช่วยให้คุณอัปเดตราคาหรือความพร้อมให้บริการได้อย่างรวดเร็ว",
                },
              ].map((feature, index) => (
                <motion.div key={index} className="flex" custom={index} variants={featureVariants}>
                  <motion.div
                    className="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
                    whileHover={{ scale: 1.1, backgroundColor: "#dbeafe" }}
                  >
                    {feature.icon}
                  </motion.div>
                  <div>
                    <h4 className="text-xl font-semibold">{feature.title}</h4>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default MenuManagement
