import type React from "react"
import { Search, ShoppingCart, Plus } from "lucide-react"

const CustomerMenu: React.FC = () => {
  return (
    <div className="mockup-card bg-white rounded-2xl overflow-hidden shadow-lg p-4">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">ชื่อร้าน</h3>
          <div className="bg-white/20 rounded-lg p-2">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="ค้นหาเมนู..."
            className="w-full bg-white/10 text-white placeholder-white/60 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:bg-white/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto mb-4">
        <div className="flex space-x-2 pb-2">
          {["ทั้งหมด", "กาแฟ", "เบเกอรี่", "อาหาร", "ของหวาน"].map((category) => (
            <div
              key={category}
              className={`px-4 py-2 text-sm rounded-full whitespace-nowrap ${
                category === "กาแฟ" ? "bg-blue-100 text-blue-600 font-medium" : "bg-slate-100 text-slate-600"
              }`}
            >
              {category}
            </div>
          ))}
        </div>
      </div>

      <h4 className="font-medium text-slate-800 mb-3">เมนูแนะนำ</h4>
      <div className="space-y-3 mb-4">
        {[
          { name: "คาปูชิโน่", price: "50", img: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg" },
          {
            name: "มัฟฟินบลูเบอร์รี่",
            price: "50",
            img: "https://images.pexels.com/photos/1657343/pexels-photo-1657343.jpeg",
          },
          {
            name: "อะโวคาโดโทสต์",
            price: "60",
            img: "https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg",
          },
        ].map((item) => (
          <div key={item.name} className="flex items-center bg-slate-50 rounded-xl p-2">
            <img
              src={item.img || "/placeholder.svg"}
              alt={item.name}
              className="w-16 h-16 object-cover rounded-lg mr-3"
            />
            <div className="flex-1">
              <h5 className="font-medium text-slate-800">{item.name}</h5>
              <p className="text-slate-500 text-sm">{item.price} บาท</p>
            </div>
            <button className="bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        ))}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg rounded-t-2xl"
        style={{ position: "relative", marginTop: "1rem" }}
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500">เมนูของคุณ (3 รายการ)</p>
            <p className="font-semibold text-slate-800">160 บาท</p>
          </div>
          <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium py-2 px-5 rounded-lg flex items-center">
            <ShoppingCart className="w-4 h-4 mr-2" />
            ตะกร้า
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomerMenu