"use client"
import { Smartphone, MonitorSmartphone, Check } from "lucide-react"
import CustomerMenu from "./mockup/CustomerMenu"
import StoreDashboard from "./mockup/StoreDashboard"

const Mockups = () => {
  return (
    <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">ออกแบบมาเพื่อทั้งสองฝั่งของเคาน์เตอร์</h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            อินเทอร์เฟซที่ใช้งานง่าย ช่วยให้เจ้าของร้านอาหารมีพลังในการจัดการ และมอบประสบการณ์ที่ราบรื่นให้กับลูกค้า
          </p>
        </div>

        {/* Customer Ordering Mockup */}
        <div className="mb-24 flex flex-col items-center gap-12 lg:flex-row">
          <div className="w-full lg:w-1/2">
            <h3 className="mb-2 flex items-center text-2xl font-bold text-gray-900">
              <Smartphone className="mr-2 h-6 w-6 text-purple-600" />
              ประสบการณ์การสั่งอาหารของลูกค้า
            </h3>
            <p className="mb-4 text-gray-600">ประสบการณ์บนมือถือที่สวยงามและใช้งานง่าย ทำให้การสั่งอาหารเป็นเรื่องที่น่าเพลิดเพลิน</p>
            <ul className="mb-6 space-y-3">
              {[
                "สแกน QR โค้ดเพื่อเข้าถึงเมนูดิจิทัลได้ทันที",
                "เลือกดูรายการเมนูที่แสดงอย่างสวยงามพร้อมภาพคุณภาพสูง",
                "เพิ่มรายการลงตะกร้าด้วยการแตะเพียงครั้งเดียว",
                "ปรับแต่งคำสั่งซื้อด้วยคำขอพิเศษ",
                "ทำรายการสั่งซื้อและชำระเงินได้อย่างราบรื่น",
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <div className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <button className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700">
              ทดลองใช้เดโมสำหรับลูกค้า
            </button>
          </div>
          <div className="relative w-full lg:w-1/2">
            <div className="relative mx-auto w-96 overflow-hidden rounded-3xl border-8 border-gray-800 shadow-xl">
              <CustomerMenu />
            </div>
          </div>
        </div>

        {/* Store Dashboard Mockup */}
        <div className="flex flex-col-reverse items-center gap-12 lg:flex-row">
          <div className="relative w-full lg:w-1/2">
            <div className="relative mx-auto w-full overflow-hidden rounded-3xl border-8 border-gray-800">
              <StoreDashboard />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gray-900 px-4 py-3"></div>
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <h3 className="mb-2 flex items-center text-2xl font-bold text-gray-900">
              <MonitorSmartphone className="mr-2 h-6 w-6 text-indigo-600" />
              แดชบอร์ดสำหรับเจ้าของร้าน
            </h3>
            <p className="mb-4 text-gray-600">ศูนย์ควบคุมที่ทรงพลังสำหรับจัดการเมนู คำสั่งซื้อ และวิเคราะห์ประสิทธิภาพ</p>
            <ul className="mb-6 space-y-3">
              {[
                "เครื่องมือแก้ไขเมนูแบบลากและวางพร้อมการอัปเดตแบบเรียลไทม์",
                "การแจ้งเตือนคำสั่งซื้อแบบสดพร้อมการประมวลผลด้วยคลิกเดียว",
                "สรุปรายได้ประจำวันพร้อมแผนภูมิแบบโต้ตอบ",
                "ข้อมูลเชิงลึกของลูกค้าและการติดตามรายการยอดนิยม",
                "อินเทอร์เฟซโหมดมืดที่เหมาะสำหรับสภาพแวดล้อมของร้านอาหาร",
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <div className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Check className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <button className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700">
              ทดลองใช้เดโมแดชบอร์ด
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Mockups
