"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Save, X, Loader, Search, Filter, ArrowUpDown } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  category: string
  isAvailable: boolean
  isRecommended: boolean
  createdAt: any
  imageUrl?: string
}

type UserProfile = {
  storeName: string
  restaurantName: string
  phone: string
  phoneNumber: string
}

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [categories, setCategories] = useState<string[]>([])
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    isAvailable: true,
    isRecommended: false,
    imageUrl: "",
    imageFile: null as File | null,
  })
  const router = useRouter()

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
        fetchUserProfile(user.uid)
        setupRealTimeMenuListener(user.uid)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Fetch user profile data
  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", uid)))

      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data() as UserProfile
        setUserProfile({
          storeName: userData.storeName || "",
          restaurantName: userData.restaurantName || "",
          phone: userData.phone || "",
          phoneNumber: userData.phoneNumber || "",
        })
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      showNotification("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้", "error")
    }
  }

  // Setup real-time listener for menu items
  const setupRealTimeMenuListener = (uid: string) => {
    try {
      setLoading(true)
      const menuQuery = query(
        collection(db, "users", uid, "menu"),
        orderBy(sortBy, sortOrder === "asc" ? "asc" : "desc"),
      )

      // Set up real-time listener
      const unsubscribe = onSnapshot(menuQuery, (querySnapshot) => {
        const items: MenuItem[] = []
        const categorySet = new Set<string>()

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<MenuItem, "id">
          items.push({ id: doc.id, ...data })
          if (data.category) categorySet.add(data.category)
        })

        setMenuItems(items)
        setCategories(Array.from(categorySet))
        setLoading(false)
      }, (error) => {
        console.error("Error in menu real-time listener:", error)
        showNotification("ไม่สามารถโหลดเมนูได้", "error")
        setLoading(false)
      })

      return unsubscribe
    } catch (error) {
      console.error("Error setting up menu listener:", error)
      showNotification("ไม่สามารถโหลดเมนูได้", "error")
      setLoading(false)
      return () => {}
    }
  }

  // Update fetch function to use the real-time listener (for compatibility)
  const fetchMenuItems = async (uid: string) => {
    // This function is now just a placeholder for backward compatibility
    // The real-time listener handles updates automatically
    return
  }

  // Handle image upload
  const handleImageUpload = async (file: File): Promise<string> => {
    if (!userId || !file) return ""

    const storage = getStorage()
    const fileExtension = file.name.split(".").pop()
    const fileName = `menu_${Date.now()}.${fileExtension}`
    const storageRef = ref(storage, `users/${userId}/menu/${fileName}`)

    await uploadBytes(storageRef, file)
    const downloadUrl = await getDownloadURL(storageRef)
    return downloadUrl
  }

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData({
        ...formData,
        imageFile: file,
      })

      // Create a preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            imageUrl: event.target?.result as string,
          }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Add new menu item
  const addMenuItem = async () => {
    if (!userId) return
    if (!formData.name || !formData.price) {
      showNotification("กรุณากรอกชื่อเมนูและราคา", "error")
      return
    }

    try {
      setLoading(true)

      // Upload image if exists
      let imageUrl = ""
      if (formData.imageFile) {
        imageUrl = await handleImageUpload(formData.imageFile)
      }

      const menuData = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        category: formData.category,
        isAvailable: formData.isAvailable,
        isRecommended: formData.isRecommended,
        imageUrl: imageUrl,
        userId,
        storeName: userProfile?.storeName || "",
        restaurantName: userProfile?.restaurantName || "",
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, "users", userId, "menu"), menuData)

      resetForm()
      setIsModalOpen(false)
      showNotification("เพิ่มเมนูสำเร็จ", "success")
      fetchMenuItems(userId)
    } catch (error) {
      console.error("Error adding menu item:", error)
      showNotification("ไม่สามารถเพิ่มเมนูได้", "error")
    } finally {
      setLoading(false)
    }
  }

  // Update menu item
  const updateMenuItem = async () => {
    if (!userId || !editingItem) return

    try {
      setLoading(true)

      // Upload image if a new one is selected
      let imageUrl = formData.imageUrl
      if (formData.imageFile) {
        // Delete old image if exists
        if (editingItem.imageUrl && editingItem.imageUrl.includes("firebase")) {
          try {
            const storage = getStorage()
            const oldImageRef = ref(storage, editingItem.imageUrl)
            await deleteObject(oldImageRef)
          } catch (error) {
            console.error("Error deleting old image:", error)
          }
        }

        // Upload new image
        imageUrl = await handleImageUpload(formData.imageFile)
      }

      const menuData = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        category: formData.category,
        isAvailable: formData.isAvailable,
        isRecommended: formData.isRecommended,
        imageUrl: imageUrl,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(doc(db, "users", userId, "menu", editingItem.id), menuData)

      resetForm()
      setIsModalOpen(false)
      showNotification("อัปเดตเมนูสำเร็จ", "success")
      fetchMenuItems(userId)
    } catch (error) {
      console.error("Error updating menu item:", error)
      showNotification("ไม่สามารถอัปเดตเมนูได้", "error")
    } finally {
      setLoading(false)
    }
  }

  // Delete menu item
  const deleteMenuItem = async (id: string) => {
    if (!userId) return

    if (!confirm("คุณต้องการลบเมนูนี้ใช่หรือไม่?")) return

    try {
      setLoading(true)

      // Get the menu item to delete
      const menuItemRef = doc(db, "users", userId, "menu", id)
      const menuItemSnap = await getDocs(query(collection(db, "users", userId, "menu"), where("__name__", "==", id)))

      if (!menuItemSnap.empty) {
        const menuItemData = menuItemSnap.docs[0].data() as MenuItem

        // Delete image if exists
        if (menuItemData.imageUrl && menuItemData.imageUrl.includes("firebase")) {
          try {
            const storage = getStorage()
            const imageRef = ref(storage, menuItemData.imageUrl)
            await deleteObject(imageRef)
          } catch (error) {
            console.error("Error deleting image:", error)
          }
        }
      }

      await deleteDoc(doc(db, "users", userId, "menu", id))

      showNotification("ลบเมนูสำเร็จ", "success")
      fetchMenuItems(userId)
    } catch (error) {
      console.error("Error deleting menu item:", error)
      showNotification("ไม่สามารถลบเมนูได้", "error")
    } finally {
      setLoading(false)
    }
  }

  // Toggle availability
  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    if (!userId) return

    try {
      await updateDoc(doc(db, "users", userId, "menu", id), {
        isAvailable: !currentStatus,
        updatedAt: serverTimestamp(),
      })

      showNotification("อัปเดตสถานะสำเร็จ", "success")
      fetchMenuItems(userId)
    } catch (error) {
      console.error("Error toggling availability:", error)
      showNotification("ไม่สามารถอัปเดตสถานะได้", "error")
    }
  }

  // Toggle recommended status
  const toggleRecommended = async (id: string, currentStatus: boolean) => {
    if (!userId) return

    try {
      await updateDoc(doc(db, "users", userId, "menu", id), {
        isRecommended: !currentStatus, // Fixed: was updating isAvailable instead of isRecommended
        updatedAt: serverTimestamp(),
      })

      showNotification("อัปเดตสถานะสำเร็จ", "success")
      fetchMenuItems(userId)
    } catch (error) {
      console.error("Error toggling recommended status:", error)
      showNotification("ไม่สามารถอัปเดตสถานะได้", "error")
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      isAvailable: true,
      isRecommended: false,
      imageUrl: "",
      imageFile: null,
    })
    setEditingItem(null)
  }

  // Open modal for editing
  const openEditModal = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category: item.category || "",
      isAvailable: item.isAvailable,
      isRecommended: item.isRecommended,
      imageUrl: item.imageUrl || "",
      imageFile: null,
    })
    setIsModalOpen(true)
  }

  // Open modal for adding
  const openAddModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === "checkbox") {
      const target = e.target as HTMLInputElement
      setFormData({
        ...formData,
        [name]: target.checked,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  // Show notification
  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" })
    }, 3000)
  }

  // Filter menu items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }

    if (userId) fetchMenuItems(userId)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">จัดการเมนู</h1>
          <p className="text-gray-600 text-sm">
            {userProfile?.storeName ? `ร้าน ${userProfile.storeName}` : "เพิ่มเมนูของร้านคุณ"}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มเมนูใหม่
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="ค้นหาเมนู..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">ทุกหมวดหมู่</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading && menuItems.length === 0 ? (
          <div className="flex justify-center items-center p-8">
            <Loader className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีเมนู</h3>
            <p className="text-sm text-gray-500 max-w-md mb-6">เพิ่มเมนูอาหารของร้านคุณเพื่อให้ลูกค้าสั่งได้</p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มเมนูใหม่
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange("name")}
                  >
                    <div className="flex items-center">
                      เมนู
                      {sortBy === "name" && <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange("price")}
                  >
                    <div className="flex items-center">
                      ราคา
                      {sortBy === "price" && <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange("category")}
                  >
                    <div className="flex items-center">
                      หมวดหมู่
                      {sortBy === "category" && <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    สถานะ
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    แนะนำ
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMenuItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            className="w-10 h-10 rounded-md object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-xs text-gray-500">ไม่มีรูป</span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 max-w-xs truncate">{item.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">฿{item.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.category || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleAvailability(item.id, item.isAvailable)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.isAvailable ? "พร้อมขาย" : "หมด"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleRecommended(item.id, item.isRecommended)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.isRecommended ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.isRecommended ? "แนะนำ" : "ไม่แนะนำ"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(item)} className="text-blue-600 hover:text-blue-900 mr-3">
                        แก้ไข
                      </button>
                      <button onClick={() => deleteMenuItem(item.id)} className="text-red-600 hover:text-red-900">
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Menu Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editingItem ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setIsModalOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเมนู *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ชื่อเมนู"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>เลือกหมวดหมู่</option>
                      <option value="อาหารจานเดียว">อาหารจานเดียว</option>
                      <option value="กับข้าว">กับข้าว</option>
                      <option value="เครื่องดื่ม">เครื่องดื่ม</option>
                      <option value="ของหวาน">ของหวาน</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="รายละเอียดเมนู"
                      rows={3}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพเมนู</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        {formData.imageUrl ? (
                          <div className="relative w-full h-40 border rounded-md overflow-hidden">
                            <img
                              src={formData.imageUrl || "/placeholder.svg"}
                              alt="รูปภาพเมนู"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, imageUrl: "", imageFile: null })}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-md hover:bg-gray-50">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg
                                className="w-10 h-10 text-gray-400 mb-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                ></path>
                              </svg>
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">อัพโหลดรูป</span>
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG หรือ GIF (สูงสุด 10MB)</p>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                          </label>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="isAvailable"
                              name="isAvailable"
                              checked={formData.isAvailable}
                              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isAvailable" className="ml-2 text-sm text-gray-700">
                              พร้อมขาย
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="isRecommended"
                              name="isRecommended"
                              checked={formData.isRecommended}
                              onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isRecommended" className="ml-2 text-sm text-gray-700">
                              แนะนำ
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  onClick={() => setIsModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  onClick={editingItem ? updateMenuItem : addMenuItem}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingItem ? "อัปเดต" : "บันทึก"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white`}
        >
          {notification.message}
        </div>
      )}
    </div>
  )
}
