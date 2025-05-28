"use client"

import { useState } from "react"
import {
  QrCode,
  ShoppingCart,
  Smartphone,
  Utensils,
  FileText,
  Check,
  X,
  TrendingUp,
  Filter,
  Search,
  Edit,
} from "lucide-react"
import { motion } from "framer-motion"

const QrOrderFeature = () => {
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Mock order data for demonstration
  const mockOrders = [
    {
      id: "ORD001",
      table: "A1",
      status: "pending",
      totalAmount: 450,
      items: [
        { name: "ต้มยำกุ้ง", quantity: 1, price: 180 },
        { name: "ผัดไทยกุ้งสด", quantity: 2, price: 135 },
      ],
      createdAt: "14:30",
      queueNumber: null,
    },
    {
      id: "ORD002",
      table: "B3",
      status: "cooking",
      totalAmount: 320,
      items: [
        { name: "ข้าวผัดปู", quantity: 1, price: 160 },
        { name: "น้ำมะนาว", quantity: 2, price: 80 },
      ],
      createdAt: "14:25",
      queueNumber: 1,
    },
    {
      id: "ORD003",
      table: "C2",
      status: "served",
      totalAmount: 280,
      items: [
        { name: "ส้มตำไทย", quantity: 1, price: 120 },
        { name: "ไก่ย่าง", quantity: 1, price: 160 },
      ],
      createdAt: "14:20",
      queueNumber: null,
    },
  ]

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

  // Render status badge
  const renderStatusBadge = (status: string, queueNumber?: number | null) => {
    switch (status) {
      case "pending":
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">รอยืนยัน</span>
      case "cooking":
        return (
          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
            กำลังปรุง {queueNumber && `(คิว #${queueNumber})`}
          </span>
        )
      case "served":
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">เสิร์ฟแล้ว</span>
      case "completed":
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">เสร็จสิ้น</span>
      case "cancelled":
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">ยกเลิก</span>
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{status}</span>
    }
  }

  // Render action buttons based on status
  const renderActionButtons = (status: string) => {
    const buttons = []

    // Add edit button for all non-completed/cancelled orders
    if (status !== "completed" && status !== "cancelled") {
      buttons.push(
        <button key="edit" className="px-2 py-1 bg-gray-600 text-white text-xs rounded-md flex items-center mr-1">
          <Edit className="h-3 w-3 mr-1" /> แก้ไข
        </button>,
      )
    }

    switch (status) {
      case "pending":
        buttons.push(
          <button key="confirm" className="px-2 py-1 bg-green-600 text-white text-xs rounded-md flex items-center mr-1">
            <Check className="h-3 w-3 mr-1" /> ยืนยัน
          </button>,
          <button key="reject" className="px-2 py-1 bg-red-600 text-white text-xs rounded-md flex items-center">
            <X className="h-3 w-3 mr-1" /> ปฏิเสธ
          </button>,
        )
        break
      case "cooking":
        buttons.push(
          <button key="served" className="px-2 py-1 bg-blue-600 text-white text-xs rounded-md flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" /> เสิร์ฟแล้ว
          </button>,
        )
        break
      case "served":
        buttons.push(
          <button key="complete" className="px-2 py-1 bg-green-600 text-white text-xs rounded-md flex items-center">
            <Check className="h-3 w-3 mr-1" /> เสร็จสิ้น
          </button>,
        )
        break
    }

    return <div className="flex flex-wrap gap-1">{buttons}</div>
  }

  return (
    <section className="bg-white py-12 text-slate-800">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="flex flex-col-reverse items-center justify-between gap-12 lg:flex-row md:flex-row"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.div className="w-full lg:w-1/2" variants={itemVariants}>
            <motion.h2
              className="mb-6 text-4xl font-bold leading-tight text-blue-800"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              จาก QR Code สู่การจัดการออเดอร์
            </motion.h2>

            <motion.p
              className="mb-8 text-lg text-slate-600"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              ระบบจัดการออเดอร์ที่เชื่อมต่อกับ QR Code ช่วยให้ร้านอาหารสามารถติดตามและจัดการออเดอร์ได้อย่างมีประสิทธิภาพ
              ตั้งแต่การรับออเดอร์จนถึงการเสิร์ฟ
            </motion.p>

            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: "รับออเดอร์อัตโนมัติ",
                  description: "ออเดอร์จาก QR Code จะเข้าสู่ระบบทันที",
                  icon: <QrCode className="h-6 w-6" />,
                },
                {
                  step: 2,
                  title: "จัดการคิวการปรุงอาหาร",
                  description: "ระบบจัดลำดับคิวและแจ้งเตือนครัวอัตโนมัติ",
                  icon: <Utensils className="h-6 w-6" />,
                },
                {
                  step: 3,
                  title: "ติดตามสถานะออเดอร์",
                  description: "อัปเดตสถานะออเดอร์แบบเรียลไทม์",
                  icon: <Smartphone className="h-6 w-6" />,
                },
                {
                  step: 4,
                  title: "รายงานยอดขายทันที",
                  description: "ดูยอดขายและสถิติการขายแบบเรียลไทม์",
                  icon: <ShoppingCart className="h-6 w-6" />,
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
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
                    <span className="font-bold text-blue-700">{item.step}</span>
                  </motion.div>
                  <div>
                    <h4 className="text-xl font-semibold text-blue-700 flex items-center">
                      {item.icon}
                      <span className="ml-2">{item.title}</span>
                    </h4>
                    <p className="text-slate-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="w-full lg:w-1/2" variants={itemVariants}>
            <motion.div
              className="rounded-2xl bg-white p-1 shadow-lg"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="rounded-xl bg-gradient-to-br from-sky-100 to-blue-50 p-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                      <h2 className="text-lg font-bold mb-2 sm:mb-0">จัดการออเดอร์</h2>

                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                        <div className="relative">
                          <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="ค้นหาโต๊ะ"
                            className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm w-full sm:w-32"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>

                        <div className="relative">
                          <Filter className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <select
                            className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm w-full appearance-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                          >
                            <option value="all">ทั้งหมด</option>
                            <option value="pending">รอยืนยัน</option>
                            <option value="cooking">กำลังปรุง</option>
                            <option value="served">เสิร์ฟแล้ว</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-800">
                      <p>ระบบจัดการออเดอร์แบบเรียลไทม์ - ออเดอร์จาก QR Code จะปรากฏที่นี่ทันที</p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="space-y-3">
                      {mockOrders.map((order) => (
                        <motion.div
                          key={order.id}
                          className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-sm">โต๊ะ {order.table}</div>
                              <div className="text-xs text-gray-500">#{order.id}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">฿{order.totalAmount}</div>
                              <div className="text-xs text-gray-500">{order.createdAt}</div>
                            </div>
                          </div>

                          <div className="text-xs text-gray-600 mb-2">
                            {order.items.map((item, index) => (
                              <span key={index}>
                                {item.name} x{item.quantity}
                                {index < order.items.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </div>

                          <div className="flex justify-between items-center">
                            {renderStatusBadge(order.status, order.queueNumber)}
                            {renderActionButtons(order.status)}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {mockOrders.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="bg-gray-100 p-3 rounded-full mb-3">
                          <FileText className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">ยังไม่มีออเดอร์</h3>
                        <p className="text-xs text-gray-500">ออเดอร์ใหม่จะปรากฏที่นี่เมื่อลูกค้าสั่งอาหาร</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default QrOrderFeature
