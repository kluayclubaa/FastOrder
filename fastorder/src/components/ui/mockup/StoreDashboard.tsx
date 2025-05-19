import type React from "react"
import { Home, Utensils, BarChart3, Settings, ShoppingBag, CreditCard, Clock, Check, X } from "lucide-react"

const StoreDashboard: React.FC = () => {
  return (
    <div className="mockup-card bg-[#1a1d2d] text-white rounded-2xl overflow-hidden shadow-lg">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-16 bg-[#12141f] flex flex-col items-center py-8 gap-8">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">A</div>
          <div className="space-y-6">
            <div className="p-2 bg-[#252a3c] rounded-lg">
              <Home className="w-5 h-5 text-blue-400" />
            </div>
            <div className="p-2">
              <Utensils className="w-5 h-5 text-slate-500" />
            </div>
            <div className="p-2">
              <BarChart3 className="w-5 h-5 text-slate-500" />
            </div>
            <div className="p-2">
              <Settings className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">แดชบอร์ด</h3>
            <div className="bg-[#252a3c] rounded-lg px-3 py-1 text-sm flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              ออนไลน์
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { value: "24", label: "คำสั่งซื้อวันนี้" },
              { value: "฿27,500", label: "รายได้" },
              { value: "18 นาที", label: "เวลาเฉลี่ย" },
            ].map((stat) => (
              <div key={stat.label} className="dashboard-card bg-[#252a3c] rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                    <p className="text-xl font-semibold">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Orders */}
          <h4 className="text-sm font-medium text-slate-400 mb-3">คำสั่งซื้อที่กำลังดำเนินการ</h4>
          <div className="space-y-3 mb-4">
            {[
              {
                id: "โต๊ะ 1",
                name: "สมชาย ใจดี",
                time: "5 นาทีที่แล้ว",
                items: "คาปูชิโน่, มัฟฟินบลูเบอร์รี่",
                total: "฿195",
                status: "preparing",
              },
              {
                id: "โต๊ะ 2",
                name: "สุดา รักดี",
                time: "12 นาทีที่แล้ว",
                items: "ลาเต้, อะโวคาโดโทสต์",
                total: "฿310",
                status: "ready",
              },
            ].map((order) => (
              <div key={order.id} className="dashboard-card bg-[#252a3c] rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{order.id}</p>
                      <p className="text-xs text-slate-400">{order.time}</p>
                    </div>
                    <p className="text-sm">{order.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.total}</p>
                    <div className={`text-xs ${order.status === "ready" ? "text-green-400" : "text-amber-400"}`}>
                      {order.status === "ready" ? "พร้อมรับ" : "กำลังเตรียม"}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-2">{order.items}</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-[#1a1d2d] text-xs py-1 rounded flex items-center justify-center gap-1">
                    <X className="w-3 h-3" /> ยกเลิก
                  </button>
                  <button className="flex-1 bg-blue-500 text-xs py-1 rounded flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" /> เสร็จสิ้น
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Chart Preview */}
          <div className="dashboard-card bg-[#252a3c] rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">รายได้วันนี้</h4>
              <button className="text-xs bg-blue-500 px-3 py-1 rounded">ดูรายงาน</button>
            </div>
            <div className="flex items-end h-24 gap-2">
              {[40, 65, 45, 80, 60, 75, 50].map((height, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500/20 rounded-t-sm"
                    style={{
                      height: `${height}%`,
                      backgroundImage: height > 70 ? "linear-gradient(to top, #3b82f6, #6366f1)" : undefined,
                      backgroundColor: height <= 70 ? "#3b82f680" : undefined,
                    }}
                  ></div>
                  <p className="text-xs text-slate-400 mt-1">{index + 9}น.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoreDashboard
