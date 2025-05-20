"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Search, Plus, Minus, X, ArrowLeft, ChevronRight } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { useRouter, useSearchParams } from "next/navigation"

type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  category: string
  isAvailable: boolean
  isRecommended: boolean
  imageUrl?: string
}

type CartItem = MenuItem & {
  quantity: number
}

export default function CustomerOrderPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantId = searchParams.get("id")
  const tableNumber = searchParams.get("table") || "1"

  // Fetch restaurant info and menu
  useEffect(() => {
    if (!restaurantId) {
      router.push("/")
      return
    }

    const fetchRestaurantData = async () => {
      try {
        setLoading(true)

        // Fetch restaurant info
        const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", restaurantId)))

        if (userDoc.empty) {
          console.error("Restaurant not found")
          router.push("/")
          return
        }

        const restaurantData = userDoc.docs[0].data()
        setRestaurantInfo(restaurantData)

        // Fetch menu items
        const menuQuery = query(collection(db, "users", restaurantId, "menu"), where("isAvailable", "==", true))

        const menuSnapshot = await getDocs(menuQuery)
        const items: MenuItem[] = []
        const categorySet = new Set<string>()

        menuSnapshot.forEach((doc) => {
          const data = doc.data() as Omit<MenuItem, "id">
          const item = { id: doc.id, ...data } as MenuItem
          items.push(item)
          if (data.category) categorySet.add(data.category)
        })

        setMenuItems(items)
        setFilteredItems(items)
        setCategories(Array.from(categorySet))
        setLoading(false)
      } catch (error) {
        console.error("Error fetching restaurant data:", error)
        setLoading(false)
      }
    }

    fetchRestaurantData()
  }, [restaurantId, router])

  // Filter menu items based on search and category
  useEffect(() => {
    let filtered = menuItems

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredItems(filtered)
  }, [selectedCategory, searchTerm, menuItems])

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  // Add item to cart
  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id)

      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      } else {
        return [...prevCart, { ...item, quantity: 1 }]
      }
    })
  }

  // Update item quantity in cart
  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(id)
      return
    }

    setCart((prevCart) => prevCart.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
  }

  // Submit order
  const submitOrder = async () => {
    if (!restaurantId || cart.length === 0) return

    try {
      setLoading(true)

      const orderData = {
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        table: tableNumber,
        status: "pending",
        totalAmount: cartTotal,
        createdAt: serverTimestamp(),
      }

      const orderRef = await addDoc(collection(db, "users", restaurantId, "orders"), orderData)

      setOrderNumber(orderRef.id.slice(-6).toUpperCase())
      setOrderSuccess(true)
      clearCart()
    } catch (error) {
      console.error("Error submitting order:", error)
    } finally {
      setLoading(false)
    }
  }

  // Render loading state
  if (loading && !orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Render order success page
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">สั่งอาหารสำเร็จ!</h2>
          <p className="text-gray-600 mb-6">หมายเลขออเดอร์ของคุณคือ #{orderNumber}</p>
          <p className="text-sm text-gray-500 mb-8">กรุณารอสักครู่ ทางร้านกำลังเตรียมอาหารให้คุณ</p>
          <button
            onClick={() => {
              setOrderSuccess(false)
              window.location.reload()
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            สั่งอาหารเพิ่มเติม
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Restaurant Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button onClick={() => router.push("/")} className="mr-3 p-1 rounded-full hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold">
                {restaurantInfo?.storeName || restaurantInfo?.restaurantName || "ร้านอาหาร"}
              </h1>
              <p className="text-sm text-gray-500">โต๊ะ {tableNumber}</p>
            </div>
            <div className="ml-auto relative">
              <button
                className="p-2 rounded-full bg-blue-50 text-blue-600 relative"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Categories */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="ค้นหาเมนู..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex overflow-x-auto pb-2 -mx-1 hide-scrollbar">
          <button
            className={`whitespace-nowrap px-4 py-2 rounded-full mx-1 text-sm font-medium ${
              selectedCategory === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
            }`}
            onClick={() => setSelectedCategory("all")}
          >
            ทั้งหมด
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`whitespace-nowrap px-4 py-2 rounded-full mx-1 text-sm font-medium ${
                selectedCategory === category ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-4xl mx-auto px-4 py-2">
        <h2 className="text-lg font-bold mb-4">{selectedCategory === "all" ? "เมนูทั้งหมด" : selectedCategory}</h2>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500">ไม่พบเมนูที่คุณค้นหา</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex">
                <div className="flex-1 p-4">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  {item.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-blue-600 font-medium">฿{item.price.toFixed(2)}</span>
                    <button onClick={() => addToCart(item)} className="p-1 rounded-full bg-blue-50 text-blue-600">
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {item.imageUrl && (
                  <div className="w-24 h-24 md:w-32 md:h-32">
                    <img
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center">
              <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-full hover:bg-gray-100 mr-2">
                <X className="h-6 w-6 text-gray-500" />
              </button>
              <h2 className="text-lg font-bold">ตะกร้าของคุณ</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">ตะกร้าของคุณว่างเปล่า</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    เลือกเมนู
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center border-b border-gray-100 pb-4">
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">฿{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-full bg-gray-100"
                        >
                          <Minus className="h-4 w-4 text-gray-600" />
                        </button>
                        <span className="mx-2 w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-full bg-gray-100"
                        >
                          <Plus className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex justify-between mb-4">
                  <span className="font-medium">รวมทั้งสิ้น</span>
                  <span className="font-bold">฿{cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={submitOrder}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      ยืนยันการสั่งอาหาร <ChevronRight className="h-5 w-5 ml-1" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Cart Summary (Mobile) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{cart.reduce((total, item) => total + item.quantity, 0)} รายการ</p>
              <p className="font-bold">฿{cartTotal.toFixed(2)}</p>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              ดูตะกร้า <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
