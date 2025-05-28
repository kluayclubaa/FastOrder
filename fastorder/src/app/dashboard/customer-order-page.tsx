"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Search, Plus, Minus, X, ChevronRight, Clock, Eye, Star } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, onSnapshot } from "firebase/firestore"
import { useRouter, useSearchParams } from "next/navigation"

type MenuOption = {
  id: string
  name: string
  price: number
}

type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  category: string
  isAvailable: boolean
  isRecommended: boolean
  imageUrl?: string
  options?: MenuOption[]
}

type CartItem = MenuItem & {
  quantity: number
  selectedOptions: MenuOption[]
  specialInstructions: string
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
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<MenuOption[]>([])
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const [currentOrderStatus, setCurrentOrderStatus] = useState<string | null>(null)
  const [itemQuantity, setItemQuantity] = useState(1)
  const [isNavigatingToQueue, setIsNavigatingToQueue] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantId = searchParams.get("id")
  const tableNumber = searchParams.get("table") || "1"

  // Prevent navigation to other pages (except queue)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't prevent if navigating to queue
      if (isNavigatingToQueue) return

      e.preventDefault()
      e.returnValue = ""
    }

    const handlePopState = (e: PopStateEvent) => {
      // Allow navigation to queue page only
      const currentPath = window.location.pathname
      if (!currentPath.includes("/order/queue") && !isNavigatingToQueue) {
        e.preventDefault()
        window.history.pushState(null, "", window.location.href)
      }
    }

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)

    // Push initial state to prevent back navigation
    window.history.pushState(null, "", window.location.href)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [isNavigatingToQueue])

  // Check for existing order in localStorage and set up real-time listener
  useEffect(() => {
    if (restaurantId && tableNumber) {
      const storageKey = `order_${restaurantId}_${tableNumber}`
      const savedOrderId = localStorage.getItem(storageKey)

      if (savedOrderId) {
        setCurrentOrderId(savedOrderId)
        // Set up real-time listener for order status
        setupOrderStatusListener(savedOrderId)
      }
    }
  }, [restaurantId, tableNumber])

  // Set up real-time listener for order status
  const setupOrderStatusListener = (orderId: string) => {
    if (!restaurantId) return

    const orderRef = doc(db, "users", restaurantId, "orders", orderId)

    const unsubscribe = onSnapshot(
      orderRef,
      (doc) => {
        if (doc.exists()) {
          const orderData = doc.data()
          setCurrentOrderStatus(orderData.status)

          // If order is completed or cancelled, remove from localStorage
          if (orderData.status === "completed" || orderData.status === "cancelled") {
            const storageKey = `order_${restaurantId}_${tableNumber}`
            localStorage.removeItem(storageKey)
            setCurrentOrderId(null)
            setCurrentOrderStatus(null)
          }
        } else {
          // Order doesn't exist, remove from localStorage
          const storageKey = `order_${restaurantId}_${tableNumber}`
          localStorage.removeItem(storageKey)
          setCurrentOrderId(null)
          setCurrentOrderStatus(null)
        }
      },
      (error) => {
        console.error("Error listening to order:", error)
      },
    )

    return unsubscribe
  }

  // Fetch restaurant info and menu
  useEffect(() => {
    if (!restaurantId) {
      // Don't redirect, just show error
      setLoading(false)
      return
    }

    const fetchRestaurantData = async () => {
      try {
        setLoading(true)

        const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", restaurantId)))

        if (userDoc.empty) {
          console.error("Restaurant not found")
          setLoading(false)
          return
        }

        const restaurantData = userDoc.docs[0].data()
        setRestaurantInfo(restaurantData)

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
  }, [restaurantId])

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
  const cartTotal = cart.reduce((total, item) => {
    const itemBasePrice = item.price * item.quantity
    const optionsPrice = item.selectedOptions.reduce((sum, option) => sum + option.price, 0) * item.quantity
    return total + itemBasePrice + optionsPrice
  }, 0)

  // Add item to cart - Always show customization modal
  const addToCart = (item: MenuItem) => {
    setCustomizingItem(item)
    setSelectedOptions([])
    setSpecialInstructions("")
    setItemQuantity(1)
  }

  // Add item to cart after customization
  const addItemToCart = (item: MenuItem, options: MenuOption[], instructions: string, quantity: number) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (cartItem) =>
          cartItem.id === item.id &&
          JSON.stringify(cartItem.selectedOptions) === JSON.stringify(options) &&
          cartItem.specialInstructions === instructions,
      )

      if (existingItemIndex >= 0) {
        return prevCart.map((cartItem, index) =>
          index === existingItemIndex ? { ...cartItem, quantity: cartItem.quantity + quantity } : cartItem,
        )
      } else {
        return [
          ...prevCart,
          {
            ...item,
            quantity: quantity,
            selectedOptions: options,
            specialInstructions: instructions,
          },
        ]
      }
    })

    setCustomizingItem(null)
    setItemQuantity(1)
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
      setIsNavigatingToQueue(true)

      const orderData = {
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          specialInstructions: item.specialInstructions,
        })),
        table: tableNumber,
        status: "pending",
        totalAmount: cartTotal,
        createdAt: serverTimestamp(),
      }

      const orderRef = await addDoc(collection(db, "users", restaurantId, "orders"), orderData)

      const storageKey = `order_${restaurantId}_${tableNumber}`
      localStorage.setItem(storageKey, orderRef.id)

      setCurrentOrderId(orderRef.id)
      setCurrentOrderStatus("pending")

      // Set up real-time listener for the new order
      setupOrderStatusListener(orderRef.id)

      const queueUrl = `/order/queue?restaurantId=${restaurantId}&orderId=${orderRef.id}`
      router.push(queueUrl)

      clearCart()
    } catch (error) {
      console.error("Error submitting order:", error)
      setIsNavigatingToQueue(false)
    } finally {
      setLoading(false)
    }
  }

  // View current order queue
  const viewOrderQueue = () => {
    if (currentOrderId && restaurantId) {
      setIsNavigatingToQueue(true)
      const queueUrl = `/order/queue?restaurantId=${restaurantId}&orderId=${currentOrderId}`
      router.push(queueUrl)
    }
  }

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "รอยืนยัน"
      case "cooking":
        return "กำลังปรุง"
      case "served":
        return "เสิร์ฟแล้ว"
      case "completed":
        return "เสร็จสิ้น"
      case "cancelled":
        return "ยกเลิก"
      default:
        return status
    }
  }

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-400">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">กำลังโหลดเมนู...</h2>
        </div>
      </div>
    )
  }

  // Show error if no restaurant ID
  if (!restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-400">
        <div className="text-center text-white p-8">
          <h2 className="text-2xl font-bold mb-4">ไม่พบข้อมูลร้านอาหาร</h2>
          <p className="mb-6">กรุณาสแกน QR Code ใหม่อีกครั้ง</p>
        </div>
      </div>
    )
  }

  const toggleOption = (option: MenuOption) => {
    setSelectedOptions((prev) => {
      const exists = prev.some((o) => o.id === option.id)
      if (exists) {
        return prev.filter((o) => o.id !== option.id)
      } else {
        return [...prev, option]
      }
    })
  }

  // Get recommended items
  const recommendedItems = menuItems.filter((item) => item.isRecommended)

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header - KFC Style */}
      <div className="bg-blue-400 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <h1 className="text-2xl font-bold">
                  {restaurantInfo?.storeName || restaurantInfo?.restaurantName || "ร้านอาหาร"}
                </h1>
                <p className="text-blue-100">โต๊ะ {tableNumber}</p>
              </div>
            </div>

            {/* Current Order Status - Only show on desktop */}
            {currentOrderId && currentOrderStatus && (
              <div className="hidden md:block mr-4">
                <button
                  onClick={viewOrderQueue}
                  className="flex items-center px-4 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  <Clock className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div className="text-sm font-bold">ออเดอร์ปัจจุบัน</div>
                    <div className="text-xs">{getStatusText(currentOrderStatus)}</div>
                  </div>
                  <Eye className="h-5 w-5 ml-2" />
                </button>
              </div>
            )}

            {/* Cart Button */}
            <div className="relative">
              <button
                className="p-3 rounded-full bg-white text-blue-600 relative shadow-lg hover:bg-blue-50 transition-colors"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="h-7 w-7" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-blue-800 text-sm font-bold px-2 py-1 rounded-full min-w-[24px] h-6 flex items-center justify-center">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Order Alert - Mobile only */}
      {currentOrderId && currentOrderStatus && (
        <div className="md:hidden bg-yellow-400 text-blue-800 py-3">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-bold">คุณมีออเดอร์ที่กำลังดำเนินการอยู่</p>
                  <p className="text-sm">สถานะ: {getStatusText(currentOrderStatus)}</p>
                </div>
              </div>
              <button
                onClick={viewOrderQueue}
                className="px-4 py-2 bg-blue-400 text-white font-bold rounded-lg hover:bg-blue-500 flex items-center"
              >
                <Eye className="h-4 w-4 mr-1" />
                ดูสถานะ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
            <input
              type="text"
              placeholder="ค้นหาเมนูที่คุณต้องการ..."
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 shadow-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Categories - KFC Style */}
        <div className="mb-8">
          <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
            <button
              className={`whitespace-nowrap px-8 py-4 rounded-xl text-lg font-bold transition-all ${
                selectedCategory === "all"
                  ? "bg-blue-400 text-white shadow-lg transform scale-105"
                  : "bg-white text-blue-600 border-2 border-blue-400 hover:bg-blue-50"
              }`}
              onClick={() => setSelectedCategory("all")}
            >
              ทั้งหมด
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={`whitespace-nowrap px-8 py-4 rounded-xl text-lg font-bold transition-all ${
                  selectedCategory === category
                    ? "bg-blue-400 text-white shadow-lg transform scale-105"
                    : "bg-white text-blue-600 border-2 border-blue-400 hover:bg-blue-50"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Recommended Items */}
        {recommendedItems.length > 0 && selectedCategory === "all" && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center">
              <Star className="h-6 w-6 mr-2 text-yellow-500" />
              เมนูแนะนำ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendedItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-yellow-400"
                >
                  <div className="relative">
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                          <span className="text-blue-400 text-4xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 bg-yellow-400 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                      แนะนำ
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">{item.name}</h3>
                    {item.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">฿{item.price.toFixed(2)}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-blue-400 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors flex items-center"
                      >
                        <Plus className="h-5 w-5 mr-1" />
                        เพิ่ม
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div>
          <h2 className="text-2xl font-bold text-blue-600 mb-6">
            {selectedCategory === "all" ? "เมนูทั้งหมด" : selectedCategory}
          </h2>

          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">ไม่พบเมนูที่คุณค้นหา</h3>
              <p className="text-gray-600">ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่น</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="relative">
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <span className="text-gray-400 text-4xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    {item.isRecommended && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-blue-800 px-2 py-1 rounded-full text-xs font-bold flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        แนะนำ
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">{item.name}</h3>
                    {item.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">฿{item.price.toFixed(2)}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-blue-400 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors flex items-center shadow-lg"
                      >
                        <Plus className="h-5 w-5 mr-1" />
                        เพิ่ม
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Drawer - KFC Style */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-xl flex flex-col">
            <div className="bg-blue-400 text-white p-6 flex items-center">
              <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-full hover:bg-blue-500 mr-4">
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-bold">ตะกร้าของคุณ</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">ตะกร้าของคุณว่างเปล่า</h3>
                  <p className="text-gray-600 mb-6">เลือกเมนูอร่อยๆ เพื่อเริ่มสั่งอาหาร</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="px-6 py-3 bg-blue-400 text-white rounded-xl font-bold hover:bg-blue-500"
                  >
                    เลือกเมนู
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${JSON.stringify(item.selectedOptions)}-${item.specialInstructions}`}
                      className="bg-gray-50 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <p className="text-blue-600 font-bold text-lg">
                            ฿
                            {(item.price + item.selectedOptions.reduce((sum, option) => sum + option.price, 0)).toFixed(
                              2,
                            )}
                          </p>
                          {item.selectedOptions.length > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              {item.selectedOptions.map((option, idx) => (
                                <span key={option.id}>
                                  {option.name} (+฿{option.price}){idx < item.selectedOptions.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.specialInstructions && (
                            <div className="text-sm text-gray-600 mt-1 italic">"{item.specialInstructions}"</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-white rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 rounded-l-lg bg-gray-200 hover:bg-gray-300"
                          >
                            <Minus className="h-5 w-5 text-gray-600" />
                          </button>
                          <span className="px-4 py-2 font-bold text-lg">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 rounded-r-lg bg-gray-200 hover:bg-gray-300"
                          >
                            <Plus className="h-5 w-5 text-gray-600" />
                          </button>
                        </div>
                        <span className="font-bold text-lg text-blue-600">
                          ฿
                          {(
                            (item.price + item.selectedOptions.reduce((sum, option) => sum + option.price, 0)) *
                            item.quantity
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="bg-gray-50 p-6 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold">ยอดรวมทั้งสิ้น</span>
                  <span className="text-2xl font-bold text-blue-600">฿{cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={submitOrder}
                  className="w-full py-4 bg-blue-400 text-white rounded-xl text-xl font-bold hover:bg-blue-500 flex items-center justify-center shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      ยืนยันการสั่งอาหาร <ChevronRight className="h-6 w-6 ml-2" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Customization Modal - Enhanced */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-400 text-white p-6 rounded-t-2xl flex items-center">
              <button onClick={() => setCustomizingItem(null)} className="p-2 rounded-full hover:bg-blue-500 mr-4">
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-xl font-bold">ปรับแต่งรายการ</h2>
            </div>

            <div className="p-6">
              {/* Item Image */}
              {customizingItem.imageUrl && (
                <div className="mb-4">
                  <img
                    src={customizingItem.imageUrl || "/placeholder.svg"}
                    alt={customizingItem.name}
                    className="w-full h-48 object-cover rounded-xl"
                  />
                </div>
              )}

              <h3 className="font-bold text-xl mb-2">{customizingItem.name}</h3>

              {/* Description */}
              {customizingItem.description && <p className="text-gray-600 mb-4">{customizingItem.description}</p>}

              <p className="text-blue-600 font-bold text-xl mb-6">฿{customizingItem.price.toFixed(2)}</p>

              {/* Quantity Selector */}
              <div className="mb-6">
                <h4 className="font-bold text-lg mb-3">จำนวน</h4>
                <div className="flex items-center justify-center bg-gray-100 rounded-xl p-2 w-fit mx-auto">
                  <button
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="p-3 rounded-lg bg-white hover:bg-gray-50 shadow-sm"
                  >
                    <Minus className="h-5 w-5 text-gray-600" />
                  </button>
                  <span className="px-6 py-3 font-bold text-xl">{itemQuantity}</span>
                  <button
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="p-3 rounded-lg bg-white hover:bg-gray-50 shadow-sm"
                  >
                    <Plus className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Options */}
              {customizingItem.options && customizingItem.options.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-lg mb-3">ตัวเลือกเพิ่มเติม</h4>
                  <div className="space-y-3">
                    {customizingItem.options.map((option) => (
                      <div
                        key={option.id}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedOptions.some((o) => o.id === option.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => toggleOption(option)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option.name}</span>
                          <span className="text-blue-600 font-bold">+฿{option.price.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div className="mb-6">
                <h4 className="font-bold text-lg mb-3">เพิ่มเติม</h4>
                <textarea
                  placeholder="เช่น ไม่ใส่ผัก, ไม่เผ็ด, เพิ่มน้ำแข็ง, ปรุงรสจืด"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                  rows={3}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </div>

              {/* Total Price Preview */}
              <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">ราคารวม</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ฿
                    {(
                      (customizingItem.price + selectedOptions.reduce((sum, option) => sum + option.price, 0)) *
                      itemQuantity
                    ).toFixed(2)}
                  </span>
                </div>
                {selectedOptions.length > 0 && (
                  <div className="text-sm text-gray-600 mt-2">
                    รวมตัวเลือก: {selectedOptions.map((opt) => opt.name).join(", ")}
                  </div>
                )}
              </div>

              <button
                className="w-full py-4 bg-blue-400 text-white rounded-xl text-xl font-bold hover:bg-blue-500 shadow-lg transition-colors"
                onClick={() => addItemToCart(customizingItem, selectedOptions, specialInstructions, itemQuantity)}
              >
                เพิ่มลงตะกร้า ({itemQuantity} ชิ้น)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button (Mobile) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-blue-400 text-white p-4 rounded-full shadow-2xl hover:bg-blue-500 transition-all transform hover:scale-110 relative"
          >
            <ShoppingCart className="h-8 w-8" />
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-blue-800 text-sm font-bold px-2 py-1 rounded-full min-w-[24px] h-6 flex items-center justify-center">
              {cart.reduce((total, item) => total + item.quantity, 0)}
            </span>
            <div className="absolute -bottom-12 right-0 bg-white text-blue-600 px-3 py-1 rounded-lg shadow-lg font-bold text-sm whitespace-nowrap">
              ฿{cartTotal.toFixed(2)}
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
