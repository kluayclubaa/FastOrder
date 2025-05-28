"use client"

import { BarChart3, TrendingUp, DollarSign, Calendar } from "lucide-react"
import { motion } from "framer-motion"

const RevenueInsight = () => {
  const revenueData = [
    { day: "จ", amount: 2500 },
    { day: "อ", amount: 3200 },
    { day: "พ", amount: 2800 },
    { day: "พฤ", amount: 3800 },
    { day: "ศ", amount: 4200 },
    { day: "ส", amount: 3600 },
    { day: "อา", amount: 4500 },
  ]

  const maxAmount = Math.max(...revenueData.map((item) => item.amount))

  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.span
            className="mb-2 inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-800"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            วิเคราะห์รายได้
          </motion.span>
          <motion.h2
            className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            ติดตามรายได้และยอดขายแบบเรียลไทม์
          </motion.h2>
          <motion.p
            className="mx-auto max-w-2xl text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >
            ระบบรายงานที่ครบครัน ช่วยให้คุณเข้าใจธุรกิจมากขึ้น และตัดสินใจได้อย่างมีข้อมูล
          </motion.p>
        </motion.div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            className="order-2 lg:order-1"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6">
              {[
                {
                  icon: <BarChart3 className="h-6 w-6 text-green-600" />,
                  title: "รายงานรายได้รายวัน",
                  description: "ดูยอดขายและรายได้แต่ละวัน พร้อมกราฟแสดงแนวโน้มที่เข้าใจง่าย",
                },
                {
                  icon: <TrendingUp className="h-6 w-6 text-green-600" />,
                  title: "วิเคราะห์เมนูยอดนิยม",
                  description: "ติดตามเมนูที่ขายดี เมนูที่ควรปรับปรุง และแนวโน้มการสั่งอาหาร",
                },
                {
                  icon: <Calendar className="h-6 w-6 text-green-600" />,
                  title: "รายงานรายเดือนและรายปี",
                  description: "สรุปผลประกอบการรายเดือน รายปี พร้อมการเปรียบเทียบช่วงเวลา",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-start"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <motion.div
                    className="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100"
                    whileHover={{ scale: 1.1, backgroundColor: "#bbf7d0" }}
                  >
                    {feature.icon}
                  </motion.div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{feature.title}</h4>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="rounded-2xl bg-white p-6 shadow-xl border border-gray-100"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">รายได้รายวัน</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-1" />
                    <span className="text-2xl font-bold text-green-600">฿4,600</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">+12.5%</span>
                  </div>
                </div>
              </div>

              <div className="relative h-64">
                <div className="flex items-end justify-between h-full">
                  {revenueData.map((item, index) => {
                    const height = (item.amount / maxAmount) * 200
                    return (
                      <motion.div
                        key={index}
                        className="flex flex-col items-center"
                        style={{ flex: 1 }}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${height}px` }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                        viewport={{ once: true }}
                      >
                        <motion.div
                          className="bg-gradient-to-t from-green-500 to-green-400 rounded-t-sm w-8 mb-2"
                          style={{ height: `${height}px` }}
                          whileHover={{ scale: 1.1 }}
                          title={`฿${item.amount.toLocaleString()}`}
                        />
                        <span className="text-xs text-gray-600">{item.day}</span>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">70</div>
                  <div className="text-xs text-gray-600">ออเดอร์วันนี้</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">฿52</div>
                  <div className="text-xs text-gray-600">ค่าเฉลี่ย/ออเดอร์</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">42</div>
                  <div className="text-xs text-gray-600">เมนูที่ขายดี</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default RevenueInsight
