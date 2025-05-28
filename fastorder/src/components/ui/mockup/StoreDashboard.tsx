"use client"

import type React from "react"
import {
  Utensils,
  BarChart3,
  Settings,
  QrCode,
  DollarSign,
  Bell,
  LogOut,
  FileText,
  Clock,
  Star,
  Menu,
} from "lucide-react"
import { useState } from "react"

const StoreDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const mockStats = {
    todayRevenue: 27500,
    todayOrders: 24,
    avgOrderValue: 1145.83,
    pendingOrders: 3,
  }

  const mockPendingOrders = [
    {
      id: "1",
      table: "1",
      customerName: "สมชาย ใจดี",
      time: "5 นาทีที่แล้ว",
      items: "คาปูชิโน่, มัฟฟิน",
      total: 195,
      status: "preparing",
    },
    {
      id: "2",
      table: "2",
      customerName: "สุดา รักดี",
      time: "12 นาทีที่แล้ว",
      items: "ลาเต้, โทสต์",
      total: 310,
      status: "ready",
    },
  ]

  const mockRecommendedItems = [
    { id: "1", name: "คาปูชิโน่", price: 85 },
    { id: "2", name: "มัฟฟินบลูเบอร์รี่", price: 65 },
    { id: "3", name: "อะโวคาโดโทสต์", price: 120 },
  ]

  const mockPopularItems = [
    { id: "1", name: "คาปูชิโน่", count: 45, revenue: 3825 },
    { id: "2", name: "ลาเต้", count: 38, revenue: 2850 },
    { id: "3", name: "อะโวคาโดโทสต์", count: 22, revenue: 2640 },
  ]

  const mockWeeklyRevenue = [
    { day: "จ", amount: 15000 },
    { day: "อ", amount: 22000 },
    { day: "พ", amount: 18000 },
    { day: "พฤ", amount: 28000 },
    { day: "ศ", amount: 25000 },
    { day: "ส", amount: 32000 },
    { day: "อา", amount: 27500 },
  ]

  return (
    <div className="bg-gray-50 w-full h-[500px] sm:h-[600px] lg:h-[700px] max-w-7xl mx-auto overflow-hidden flex relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        bg-white border-r border-gray-200 
        w-48 sm:w-56 lg:w-16 xl:w-20
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        h-full
      `}
      >
        {/* Logo */}
        <div className="p-4 lg:p-2 xl:p-4 border-b border-gray-200">
          <div className="flex items-center lg:justify-center">
            <div className="h-8 w-8 lg:h-6 lg:w-6 xl:h-8 xl:w-8 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <Utensils className="h-5 w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
            </div>
            <span className="ml-3 lg:hidden font-semibold text-gray-900">Dashboard</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 lg:p-2 xl:p-4">
          <div className="space-y-2">
            <div className="p-3 lg:p-1.5 xl:p-3 bg-blue-50 text-blue-700 rounded-md flex items-center">
              <BarChart3 className="h-5 w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
              <span className="ml-3 lg:hidden">ภาพรวม</span>
            </div>
            <div className="p-3 lg:p-1.5 xl:p-3 text-gray-700 hover:bg-gray-100 rounded-md relative flex items-center">
              <FileText className="h-5 w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
              <span className="ml-3 lg:hidden">คำสั่งซื้อ</span>
              <span className="absolute -top-1 -right-1 lg:top-0 lg:right-0 bg-red-500 text-white text-xs font-medium px-1 py-0.5 rounded-full">
                {mockStats.pendingOrders}
              </span>
            </div>
            <div className="p-3 lg:p-1.5 xl:p-3 text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
              <Utensils className="h-5 w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
              <span className="ml-3 lg:hidden">เมนู</span>
            </div>
            <div className="p-3 lg:p-1.5 xl:p-3 text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
              <QrCode className="h-5 w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
              <span className="ml-3 lg:hidden">QR Code</span>
            </div>
            <div className="p-3 lg:p-1.5 xl:p-3 text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
              <DollarSign className="h-5 w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
              <span className="ml-3 lg:hidden">การเงิน</span>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="p-4 lg:p-2 xl:p-4 border-t border-gray-200 space-y-2">
          <div className="p-3 lg:p-1.5 xl:p-3 text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
            <Settings className="h-5 w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
            <span className="ml-3 lg:hidden">ตั้งค่า</span>
          </div>
          <div className="p-3 lg:p-1.5 xl:p-3 text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
            <LogOut className="h-5 w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
            <span className="ml-3 lg:hidden">ออกจากระบบ</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
               
                className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 mr-2"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="text-lg lg:text-xl font-bold">ภาพรวม</h2>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-500" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium px-1 py-0.5 rounded-full">
                  {mockStats.pendingOrders}
                </span>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">...</p>
                <p className="text-xs text-gray-500">089-123-4567</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-2 sm:p-3 lg:p-4 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="bg-white p-3 lg:p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">รายได้วันนี้</p>
                  <h3 className="text-sm lg:text-lg font-bold mt-1">฿{mockStats.todayRevenue.toLocaleString()}</h3>
                </div>
                <div className="p-1 lg:p-2 bg-green-50 rounded-lg">
                  <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white p-3 lg:p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">ออเดอร์เสร็จสิ้น</p>
                  <h3 className="text-sm lg:text-lg font-bold mt-1">{mockStats.todayOrders}</h3>
                </div>
                <div className="p-1 lg:p-2 bg-blue-50 rounded-lg">
                  <Utensils className="h-3 w-3 lg:h-4 lg:w-4 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white p-3 lg:p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">มูลค่าเฉลี่ย</p>
                  <h3 className="text-sm lg:text-lg font-bold mt-1">฿{mockStats.avgOrderValue.toFixed(0)}</h3>
                </div>
                <div className="p-1 lg:p-2 bg-purple-50 rounded-lg">
                  <BarChart3 className="h-3 w-3 lg:h-4 lg:w-4 text-purple-500" />
                </div>
              </div>
            </div>

            <div className="bg-white p-3 lg:p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">รอยืนยัน</p>
                  <h3 className="text-sm lg:text-lg font-bold mt-1">{mockStats.pendingOrders}</h3>
                </div>
                <div className="p-1 lg:p-2 bg-amber-50 rounded-lg">
                  <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-amber-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white p-2 sm:p-3 lg:p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold mb-2 sm:mb-3 text-xs sm:text-sm lg:text-base">รายได้รายวัน</h3>
              <div className="flex items-end justify-between h-16 sm:h-20 lg:h-24 w-full">
          
              
              </div>
            </div>

            {/* Pending Orders */}
            <div className="bg-white p-2 sm:p-3 lg:p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold mb-2 sm:mb-3 text-xs sm:text-sm lg:text-base">ออเดอร์รอยืนยัน</h3>
              <div className="space-y-2 max-h-20 sm:max-h-24 lg:max-h-32 overflow-y-auto">
                {mockPendingOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-xs lg:text-sm">โต๊ะ {order.table}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          order.status === "ready" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status === "ready" ? "พร้อมรับ" : "รอยืนยัน"}
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-gray-600">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.items}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">{order.time}</span>
                      <span className="font-bold text-red-600 text-xs lg:text-sm">฿{order.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Popular Items and Recommended */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {/* Popular Items */}
            <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4 text-sm lg:text-base">เมนูยอดนิยม</h3>
              <div className="space-y-3">
                {mockPopularItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold text-xs lg:text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-xs lg:text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-500">สั่ง {item.count} ครั้ง</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs lg:text-sm font-medium text-green-600">
                        ฿{item.revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Items */}
            <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4 text-sm lg:text-base">เมนูแนะนำ</h3>
              <div className="space-y-3">
                {mockRecommendedItems.map((item) => (
                  <div key={item.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-lg mr-3 flex items-center justify-center">
                      <Utensils className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-xs lg:text-sm">{item.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-blue-600 font-medium text-xs lg:text-sm">฿{item.price}</span>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">
                          <Star className="h-2 w-2 lg:h-3 lg:w-3 mr-1" />
                          แนะนำ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoreDashboard
