import type React from "react"
import { Clock, CheckCircle, Utensils, ArrowLeft, RefreshCw } from "lucide-react"

const QueueStatus: React.FC = () => {
  const currentOrder = {
    id: "ORD-001",
    table: "1",
    items: [
      { name: "คาปูชิโน่", quantity: 2, price: 85 },
      { name: "มัฟฟินบลูเบอร์รี่", quantity: 1, price: 65 },
      { name: "อะโวคาโดโทสต์", quantity: 1, price: 120 },
    ],
    total: 355,
    status: "preparing",
    estimatedTime: "8-12 นาที",
    queuePosition: 3,
  }

  const orderSteps = [
    { id: 1, name: "ยืนยันออเดอร์", status: "completed", time: "14:25" },
    { id: 2, name: "เตรียมอาหาร", status: "current", time: "14:27" },
    { id: 3, name: "พร้อมเสิร์ฟ", status: "pending", time: "-" },
    { id: 4, name: "เสร็จสิ้น", status: "pending", time: "-" },
  ]

  const queueList = [
    { position: 1, table: "5", status: "ready", items: "ลาเต้, โทสต์" },
    { position: 2, table: "3", status: "preparing", items: "เอสเปรสโซ, มัฟฟิน" },
    { position: 3, table: "1", status: "preparing", items: "คาปูชิโน่, โทสต์", current: true },
    { position: 4, table: "7", status: "waiting", items: "อเมริกาโน่, แซนด์วิช" },
    { position: 5, table: "2", status: "waiting", items: "มอคค่า, เค้ก" },
  ]

  return (
    <div className="bg-gray-50 w-full h-[500px] sm:h-[600px] lg:h-[700px] max-w-md sm:max-w-lg lg:max-w-xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-orange-600 text-white shadow-lg sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button className="mr-2 p-1 hover:bg-orange-700 rounded-full sm:hidden">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-sm sm:text-base lg:text-lg font-bold">สถานะออเดอร์</h1>
                <p className="text-orange-100 text-xs sm:text-sm">โต๊ะ {currentOrder.table}</p>
              </div>
            </div>
            <button className="p-1.5 hover:bg-orange-700 rounded-full transition-colors">
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-2 sm:py-3 space-y-2 sm:space-y-3 h-full overflow-y-auto">
        {/* Current Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">ออเดอร์ #{currentOrder.id}</h2>
              <p className="text-xs sm:text-sm text-gray-600">โต๊ะ {currentOrder.table}</p>
            </div>
            <div className="text-right">
              <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">กำลังเตรียม</div>
              <p className="text-xs text-gray-500 mt-1">เวลาโดยประมาณ: {currentOrder.estimatedTime}</p>
            </div>
          </div>

          {/* Queue Position */}
          <div className="bg-orange-50 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">#{currentOrder.queuePosition}</div>
                <p className="text-xs sm:text-sm text-gray-600">ลำดับในคิว</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-1 sm:space-y-2">
            <h3 className="font-semibold text-xs sm:text-sm text-gray-900">รายการที่สั่ง</h3>
            {currentOrder.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center">
                  <span className="text-xs sm:text-sm text-gray-900">{item.name}</span>
                  <span className="ml-1 text-xs text-gray-500">x{item.quantity}</span>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-900">฿{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1 border-t border-gray-200">
              <span className="font-semibold text-xs sm:text-sm text-gray-900">รวมทั้งสิ้น</span>
              <span className="font-bold text-sm sm:text-base text-orange-600">฿{currentOrder.total}</span>
            </div>
          </div>
        </div>

        {/* Order Progress */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4">
          <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">ขั้นตอนการเตรียม</h3>
          <div className="space-y-2 sm:space-y-3">
            {orderSteps.map((step, index) => (
              <div key={step.id} className="flex items-center relative">
                <div className="flex-shrink-0">
                  {step.status === "completed" ? (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                  ) : step.status === "current" ? (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                      <Utensils className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="ml-2 sm:ml-3 flex-1">
                  <div className="flex justify-between items-center">
                    <p
                      className={`text-xs sm:text-sm font-medium ${
                        step.status === "completed"
                          ? "text-green-600"
                          : step.status === "current"
                            ? "text-orange-600"
                            : "text-gray-500"
                      }`}
                    >
                      {step.name}
                    </p>
                    <span className="text-xs text-gray-500">{step.time}</span>
                  </div>
                </div>
                {index < orderSteps.length - 1 && (
                  <div className="absolute left-3 sm:left-4 mt-6 sm:mt-8 w-0.5 h-3 sm:h-4 bg-gray-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Queue Overview */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4">
          <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">คิวทั้งหมด</h3>
          <div className="space-y-2">
            {queueList.map((order) => (
              <div
                key={order.position}
                className={`p-2 sm:p-3 rounded-lg border ${
                  order.current ? "border-orange-300 bg-orange-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        order.status === "ready"
                          ? "bg-green-500 text-white"
                          : order.status === "preparing"
                            ? "bg-orange-500 text-white"
                            : "bg-gray-400 text-white"
                      }`}
                    >
                      {order.position}
                    </div>
                    <div className="ml-2 sm:ml-3">
                      <p className="text-xs sm:text-sm font-medium text-gray-900">โต๊ะ {order.table}</p>
                      <p className="text-xs text-gray-600">{order.items}</p>
                    </div>
                  </div>
                  <div
                    className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${
                      order.status === "ready"
                        ? "bg-green-100 text-green-800"
                        : order.status === "preparing"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status === "ready" ? "พร้อมรับ" : order.status === "preparing" ? "กำลังทำ" : "รอคิว"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QueueStatus
