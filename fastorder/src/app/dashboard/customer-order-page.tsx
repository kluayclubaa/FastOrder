"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Search, Plus, Minus, X, ChevronRight, Clock, Eye, Star, User, Gift } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, onSnapshot } from "firebase/firestore"
import { useRouter, useSearchParams } from "next/navigation"
import PaymentMethodModal from "./components/payment-method-modal"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import generatePayload from "promptpay-qr"
import MemberLoginModal from "./components/member-login-modal"
import StaffNotificationHandler from "./components/staff-notification-handler"
import CustomerNotificationListener from "./components/customer-notification-listener"

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
  recommendedTime?: "all" | "morning" | "afternoon" | "evening"
  imageUrl?: string
  options?: MenuOption[]
}

type CartItem = MenuItem & {
  quantity: number
  selectedOptions: MenuOption[]
  specialInstructions: string
}

type Member = {
  id: string
  name: string
  phone: string
  email: string
  points: number
  tier: string
  joinDate: any
  totalSpent: number
}

type Promotion = {
  id: string
  title: string
  description: string
  type: "discount" | "points_multiplier" | "free_item"
  value: number
  minPoints?: number
  minSpent?: number
  timeOfDay: "all" | "morning" | "afternoon" | "evening"
  validFrom?: any
  validTo?: any
  isActive: boolean
}

export default function CustomerOrderPageFixed() {
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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"scan" | "counter" | null>(null)
  const [restaurantQRCode, setRestaurantQRCode] = useState<string>("")
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  })
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [restaurantPromptPayID, setRestaurantPromptPayID] = useState<string>("")

  // New states for membership system
  const [member, setMember] = useState<Member | null>(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([])
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null)
  const [pointsToEarn, setPointsToEarn] = useState(0)

  // Staff notification state
  const [isStaffMode, setIsStaffMode] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantId = searchParams.get("id")
  const tableNumber = searchParams.get("table") || "1"
  const staffMode = searchParams.get("staff") === "true"

  // Check if this is staff mode
  useEffect(() => {
    setIsStaffMode(staffMode)
  }, [staffMode])

  const callStaff = async () => {
    if (!restaurantId || !tableNumber) return
    try {
      await addDoc(collection(db, "users", restaurantId, "call_staff"), {
        table: tableNumber,
        createdAt: serverTimestamp(),
        status: "pending",
      })
      showNotification("เรียกพนักงานแล้ว กรุณารอสักครู่", "success")
    } catch (error) {
      console.error("Error calling staff:", error)
      showNotification("ไม่สามารถเรียกพนักงานได้", "error")
    }
  }

  // Prevent navigation to other pages (except queue)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isNavigatingToQueue) return
      e.preventDefault()
      e.returnValue = ""
    }

    const handlePopState = (e: PopStateEvent) => {
      const currentPath = window.location.pathname
      if (!currentPath.includes("/order/queue") && !isNavigatingToQueue) {
        e.preventDefault()
        window.history.pushState(null, "", window.location.href)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)
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

          if (orderData.status === "completed" || orderData.status === "cancelled") {
            const storageKey = `order_${restaurantId}_${tableNumber}`
            localStorage.removeItem(storageKey)
            setCurrentOrderId(null)
            setCurrentOrderStatus(null)
          }
        } else {
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
      setLoading(false)
      return
    }

    const fetchRestaurantData = async () => {
      try {
        setLoading(true)

        const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", restaurantId)))

        if (userDoc.empty) {
          console.error("Restaurant not found")
          showNotification("ไม่พบข้อมูลร้านอาหาร", "error")
          setLoading(false)
          return
        }

        const restaurantData = userDoc.docs[0].data()
        setRestaurantInfo(restaurantData)
        setRestaurantQRCode(restaurantData.paymentQRCode || "")
        setRestaurantPromptPayID(restaurantData.promptPayID || "")

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
        showNotification("ไม่สามารถโหลดข้อมูลร้านอาหารได้", "error")
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

  // Show notification
  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" })
    }, 3000)
  }

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
    showNotification(`เพิ่ม ${item.name} ลงตะกร้าแล้ว`, "success")
  }

  // Update item quantity in cart
  const updateQuantity = (itemIndex: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemIndex)
      return
    }

    setCart((prevCart) =>
      prevCart.map((item, index) => (index === itemIndex ? { ...item, quantity: newQuantity } : item)),
    )
  }

  // Remove item from cart
  const removeFromCart = (itemIndex: number) => {
    setCart((prevCart) => prevCart.filter((_, index) => index !== itemIndex))
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
  }

  // Handle receipt upload
  const handleReceiptUpload = async (file: File) => {
    if (!restaurantId) return

    try {
      setIsUploadingReceipt(true)

      const timestamp = Date.now()
      const fileName = `receipt-${timestamp}-${file.name}`

      const receiptRef = ref(storage, `receipts/${restaurantId}/${fileName}`)
      await uploadBytes(receiptRef, file)
      const url = await getDownloadURL(receiptRef)

      setReceiptUrl(url)
      showNotification("อัพโหลดหลักฐานการโอนเงินสำเร็จ", "success")

      return url
    } catch (error) {
      console.error("Error uploading receipt:", error)
      showNotification("ไม่สามารถอัพโหลดหลักฐานการโอนเงินได้", "error")
      throw error
    } finally {
      setIsUploadingReceipt(false)
    }
  }

  const generateDynamicQRCodeData = (amount: number) => {
    if (!restaurantPromptPayID) return ""

    try {
      const payload = generatePayload(restaurantPromptPayID, { amount })
      return payload
    } catch (error) {
      console.error("Error generating PromptPay QR code:", error)
      return ""
    }
  }

  // Handle payment method selection
  const handleSelectPayment = async (method: "scan" | "counter") => {
    setPaymentMethod(method)

    if (method === "counter") {
      await submitOrder(method)
    } else if (method === "scan") {
      if (receiptUrl) {
        await submitOrder(method, receiptUrl)
      } else {
        showNotification("กรุณาอัพโหลดหลักฐานการโอนเงินก่อน", "error")
      }
    }
  }

  // Load available promotions
  const loadAvailablePromotions = async () => {
    if (!restaurantId) return

    try {
      const now = new Date()
      const currentHour = now.getHours()
      let timeOfDay: "morning" | "afternoon" | "evening" = "morning"

      if (currentHour >= 12 && currentHour < 18) timeOfDay = "afternoon"
      else if (currentHour >= 18) timeOfDay = "evening"

      const promotionsQuery = query(
        collection(db, "restaurants", restaurantId, "promotions"),
        where("isActive", "==", true),
      )

      const snapshot = await getDocs(promotionsQuery)
      const promotions: Promotion[] = []

      snapshot.forEach((doc) => {
        const promotion = {
          id: doc.id,
          ...doc.data(),
        } as Promotion

        if (promotion.timeOfDay === "all" || promotion.timeOfDay === timeOfDay) {
          if (promotion.validFrom && promotion.validTo) {
            const validFrom = promotion.validFrom.toDate()
            const validTo = promotion.validTo.toDate()
            if (now >= validFrom && now <= validTo) {
              promotions.push(promotion)
            }
          } else {
            promotions.push(promotion)
          }
        }
      })

      setAvailablePromotions(promotions)
    } catch (error) {
      console.error("Error loading promotions:", error)
    }
  }

  // Apply promotion
  const applyPromotion = (promotion: Promotion) => {
    if (!member) {
      showNotification("กรุณาเข้าสู่ระบบสมาชิกก่อน", "error")
      return
    }

    if (promotion.minPoints && member.points < promotion.minPoints) {
      showNotification(`ต้องมีแต้มอย่างน้อย ${promotion.minPoints} แต้ม`, "error")
      return
    }

    if (promotion.minSpent && cartTotal < promotion.minSpent) {
      showNotification(`ยอดซื้อต้องอย่างน้อย ฿${promotion.minSpent}`, "error")
      return
    }

    setAppliedPromotion(promotion)
    showNotification("ใช้โปรโมชั่นสำเร็จ", "success")
  }

  // Calculate final total after promotion
  const getFinalTotal = () => {
    let total = cartTotal

    if (appliedPromotion) {
      if (appliedPromotion.type === "discount") {
        total = total * (1 - appliedPromotion.value / 100)
      }
    }

    return total
  }

  // Calculate points from amount
  const calculatePointsFromAmount = (amount: number): number => {
    return Math.floor(amount / 20)
  }

  // Calculate points to earn
  useEffect(() => {
    const finalTotal = getFinalTotal()
    let points = calculatePointsFromAmount(finalTotal)

    if (appliedPromotion && appliedPromotion.type === "points_multiplier") {
      points = points * appliedPromotion.value
    }

    setPointsToEarn(points)
  }, [cartTotal, appliedPromotion])

  // Load promotions on start
  useEffect(() => {
    if (restaurantId) {
      loadAvailablePromotions()
    }
  }, [restaurantId])

  // Submit order
  const submitOrder = async (method: "scan" | "counter", uploadedReceiptUrl?: string) => {
    if (!restaurantId || cart.length === 0) {
      showNotification("ไม่สามารถส่งออเดอร์ได้ กรุณาลองใหม่อีกครั้ง", "error")
      return
    }

    try {
      setIsSubmittingOrder(true)
      setIsNavigatingToQueue(true)

      const finalTotal = getFinalTotal()

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
        totalAmount: finalTotal,
        originalAmount: cartTotal,
        paymentMethod: method,
        receiptUrl: method === "scan" ? uploadedReceiptUrl : null,
        memberId: member?.id || null,
        memberPhone: member?.phone || null,
        appliedPromotion: appliedPromotion
          ? {
              id: appliedPromotion.id,
              title: appliedPromotion.title,
              type: appliedPromotion.type,
              value: appliedPromotion.value,
            }
          : null,
        pointsEarned: member ? pointsToEarn : 0,
        createdAt: serverTimestamp(),
      }

      const orderRef = await addDoc(collection(db, "users", restaurantId, "orders"), orderData)

      if (member && pointsToEarn > 0) {
        localStorage.setItem(
          `pending_points_${orderRef.id}`,
          JSON.stringify({
            memberId: member.id,
            points: pointsToEarn,
            orderId: orderRef.id,
          }),
        )
      }

      const storageKey = `order_${restaurantId}_${tableNumber}`
      localStorage.setItem(storageKey, orderRef.id)

      setCurrentOrderId(orderRef.id)
      setCurrentOrderStatus("pending")

      setupOrderStatusListener(orderRef.id)

      showNotification("ส่งออเดอร์สำเร็จ กำลังนำไปยังหน้าติดตามสถานะ", "success")

      setTimeout(() => {
        const queueUrl = `/order/queue?restaurantId=${restaurantId}&orderId=${orderRef.id}`
        router.push(queueUrl)
      }, 1000)

      clearCart()
      setPaymentMethod(null)
      setReceiptUrl(null)
      setAppliedPromotion(null)
    } catch (error) {
      console.error("Error submitting order:", error)
      showNotification("ไม่สามารถส่งออเดอร์ได้ กรุณาลองใหม่อีกครั้ง", "error")
      setIsNavigatingToQueue(false)
    } finally {
      setIsSubmittingOrder(false)
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

  // Toggle option selection
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

  // Get recommended items based on current time
  const getRecommendedItems = () => {
    const now = new Date()
    const currentHour = now.getHours()
    let timeOfDay: "morning" | "afternoon" | "evening" = "morning"

    if (currentHour >= 12 && currentHour < 18) timeOfDay = "afternoon"
    else if (currentHour >= 18) timeOfDay = "evening"

    return menuItems.filter(
      (item) =>
        item.isRecommended &&
        (!item.recommendedTime || item.recommendedTime === "all" || item.recommendedTime === timeOfDay),
    )
  }

  const recommendedItems = getRecommendedItems()

  // Handle guest continue
  const handleGuestContinue = () => {
    setShowMemberModal(false)
    showNotification("สั่งอาหารแบบไม่เป็นสมาชิก", "success")
  }

  // Handle staff notification received
  const handleStaffNotificationReceived = (call: any) => {
    showNotification(`มีการเรียกพนักงานจากโต๊ะ ${call.table}`, "info")
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

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Staff Notification Handler - Only show in staff mode */}
      {isStaffMode && restaurantId && (
        <StaffNotificationHandler
          restaurantId={restaurantId}
          onNotificationReceived={handleStaffNotificationReceived}
        />
      )}

      {/* Customer Notification Listener - Only show in customer mode */}
      {!isStaffMode && <CustomerNotificationListener />}

      {/* Header */}
      <div className="bg-blue-400 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <h1 className="text-2xl font-bold">
                  {restaurantInfo?.storeName || restaurantInfo?.restaurantName || "ร้านอาหาร"}
                </h1>
                <p className="text-blue-100">
                  โต๊ะ {tableNumber}{" "}
                  {isStaffMode && <span className="bg-red-500 px-2 py-1 rounded text-xs ml-2">โหมดพนักงาน</span>}
                </p>
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

            {/* Member Info - Desktop */}
            {member && (
              <div className="hidden md:block mr-4">
                <div className="bg-white text-blue-600 px-4 py-2 rounded-lg border-2 border-blue-200">
                  <div className="text-sm font-bold">{member.name}</div>
                  <div className="text-xs">แต้มสะสม: {member.points.toLocaleString()}</div>
                </div>
              </div>
            )}

            {!member && !isStaffMode && (
              <button
                onClick={() => setShowMemberModal(true)}
                className="hidden md:flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium mr-4"
              >
                <User className="h-5 w-5 mr-2" />
                เข้าสู่ระบบสมาชิก
              </button>
            )}

            <div className="flex items-center space-x-4">
              {/* Call Staff Button - Desktop (only in customer mode) */}
              {!isStaffMode && (
                <button
                  onClick={callStaff}
                  className="hidden md:flex items-center px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  เรียกพนักงาน
                </button>
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
        {/* Available Promotions */}
        {availablePromotions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 flex items-center">
              <Gift className="h-6 w-6 mr-2" />
              โปรโมชั่นพิเศษ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePromotions.map((promotion) => (
                <div
                  key={promotion.id}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    appliedPromotion?.id === promotion.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-purple-200 hover:border-purple-400"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-purple-800">{promotion.title}</h3>
                      <p className="text-sm text-purple-600">{promotion.description}</p>
                    </div>
                    <button
                      onClick={() => applyPromotion(promotion)}
                      disabled={!member || appliedPromotion?.id === promotion.id}
                      className={`px-3 py-1 rounded-md text-sm font-bold ${
                        appliedPromotion?.id === promotion.id
                          ? "bg-purple-200 text-purple-800"
                          : member
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {appliedPromotion?.id === promotion.id ? "ใช้แล้ว" : "ใช้โปรโมชั่น"}
                    </button>
                  </div>
                  <div className="text-xs text-purple-500 space-y-1">
                    {promotion.minPoints && promotion.minPoints > 0 && (
                      <div>ต้องมีแต้มอย่างน้อย {promotion.minPoints} แต้ม</div>
                    )}
                    {promotion.minSpent && promotion.minSpent > 0 && <div>ยอดซื้อขั้นต่ำ ฿{promotion.minSpent}</div>}
                    {!member && <div className="text-red-500">ต้องเป็นสมาชิกเท่านั้น</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Categories */}
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

      {/* Member Login Button - Mobile (only in customer mode) */}
      {!member && !isStaffMode && (
        <div className="fixed left-6 bottom-24 z-40 md:hidden">
          <button
            onClick={() => setShowMemberModal(true)}
            className="bg-green-500 text-white p-3 rounded-full shadow-2xl hover:bg-green-600 transition-all duration-300 transform hover:scale-110"
          >
            <User className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Call Staff Button - Mobile (only in customer mode) */}
      {!isStaffMode && (
        <div className="fixed right-6 bottom-32 z-40 md:hidden">
          <button
            onClick={callStaff}
            className="group bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-full shadow-2xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-110 active:scale-95"
          >
            <div className="flex items-center">
              <svg className="w-6 h-6 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-2 font-bold text-sm whitespace-nowrap">เรียกพนักงาน</span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
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
                  {cart.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4">
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
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="p-2 rounded-l-lg bg-gray-200 hover:bg-gray-300"
                          >
                            <Minus className="h-5 w-5 text-gray-600" />
                          </button>
                          <span className="px-4 py-2 font-bold text-lg">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
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
                {/* Member Info in Cart */}
                {member && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-blue-800">{member.name}</div>
                        <div className="text-sm text-blue-600">แต้มสะสม: {member.points.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-blue-600">จะได้รับ</div>
                        <div className="font-bold text-blue-800">{pointsToEarn} แต้ม</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Applied Promotion */}
                {appliedPromotion && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-purple-800">{appliedPromotion.title}</div>
                        <div className="text-sm text-purple-600">
                          {appliedPromotion.type === "discount" && `ลด ${appliedPromotion.value}%`}
                          {appliedPromotion.type === "points_multiplier" && `แต้มคูณ ${appliedPromotion.value}`}
                        </div>
                      </div>
                      <button
                        onClick={() => setAppliedPromotion(null)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg">ยอดรวม</span>
                    <span className="text-lg">฿{cartTotal.toFixed(2)}</span>
                  </div>
                  {appliedPromotion && appliedPromotion.type === "discount" && (
                    <div className="flex justify-between items-center text-purple-600">
                      <span>ส่วนลด({appliedPromotion.value}%)</span>
                      <span>-฿{((cartTotal * appliedPromotion.value) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">ยอดรวมทั้งสิ้น</span>
                      <span className="text-2xl font-bold text-blue-600">฿{getFinalTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-4 bg-blue-400 text-white rounded-xl text-xl font-bold hover:bg-blue-500 flex items-center justify-center shadow-lg"
                  disabled={isSubmittingOrder}
                >
                  {isSubmittingOrder ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      เลือกวิธีการชำระเงิน <ChevronRight className="h-6 w-6 ml-2" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Customization Modal */}
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
              ฿{getFinalTotal().toFixed(2)}
            </div>
          </button>
        </div>
      )}

      {/* Member Login Modal */}
      <MemberLoginModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        onMemberLogin={(memberData) => {
          setMember(memberData)
          setShowMemberModal(false)
          showNotification(`ยินดีต้อนรับ ${memberData.name}`, "success")
        }}
        onGuestContinue={handleGuestContinue}
        restaurantId={restaurantId || ""}
      />

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectPayment={handleSelectPayment}
        restaurantPromptPayID={restaurantPromptPayID}
        dynamicQRCodeData={generateDynamicQRCodeData(getFinalTotal())}
        totalAmount={getFinalTotal()}
        onReceiptUpload={handleReceiptUpload}
        isUploading={isUploadingReceipt}
      />

      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed bottom-4 left-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            notification.type === "success"
              ? "bg-green-500"
              : notification.type === "info"
                ? "bg-blue-500"
                : "bg-red-500"
          } text-white max-w-sm`}
        >
          {notification.message}
        </div>
      )}

      {/* Loading Overlay */}
      {isSubmittingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-bold mb-2">กำลังส่งออเดอร์...</h3>
            <p className="text-gray-600">กรุณารอสักครู่</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
