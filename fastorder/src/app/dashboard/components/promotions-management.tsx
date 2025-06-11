"use client"

import { useState, useEffect } from "react"
import { Gift, Plus, Edit, Trash2, Clock, Target, Percent } from 'lucide-react'
import { auth, db } from "@/lib/firebase"
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { type Promotion } from "@/lib/membership"

export default function PromotionsManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [notification, setNotification] = useState({ show: false, message: "", type: "" })

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'discount' as Promotion['type'],
    value: 0,
    minPoints: 0,
    minSpent: 0,
    validFrom: '',
    validTo: '',
    timeOfDay: 'all' as Promotion['timeOfDay'],
    isActive: true
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        setupPromotionsListener(currentUser.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  const setupPromotionsListener = (userId: string) => {
    const promotionsRef = collection(db, "restaurants", userId, "promotions")
    const promotionsQuery = query(promotionsRef, orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(promotionsQuery, (snapshot) => {
      const promotionsList: Promotion[] = []
      snapshot.forEach((doc) => {
        promotionsList.push({ id: doc.id, ...doc.data() } as Promotion)
      })
      setPromotions(promotionsList)
      setLoading(false)
    })

    return unsubscribe
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'discount',
      value: 0,
      minPoints: 0,
      minSpent: 0,
      validFrom: '',
      validTo: '',
      timeOfDay: 'all',
      isActive: true
    })
    setEditingPromotion(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setFormData({
      title: promotion.title,
      description: promotion.description,
      type: promotion.type,
      value: promotion.value,
      minPoints: promotion.minPoints || 0,
      minSpent: promotion.minSpent || 0,
      validFrom: promotion.validFrom?.toDate ? 
        new Date(promotion.validFrom.toDate()).toISOString().split('T')[0] : '',
      validTo: promotion.validTo?.toDate ? 
        new Date(promotion.validTo.toDate()).toISOString().split('T')[0] : '',
      timeOfDay: promotion.timeOfDay || 'all',
      isActive: promotion.isActive
    })
    setShowModal(true)
  }

  const savePromotion = async () => {
    if (!user || !formData.title || !formData.description) {
      showNotification('กรุณากรอกข้อมูลให้ครบถ้วน', 'error')
      return
    }

    try {
      const promotionData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        value: formData.value,
        minPoints: formData.minPoints || undefined,
        minSpent: formData.minSpent || undefined,
        validFrom: formData.validFrom ? new Date(formData.validFrom) : null,
        validTo: formData.validTo ? new Date(formData.validTo) : null,
        timeOfDay: formData.timeOfDay,
        isActive: formData.isActive,
        restaurantId: user.uid,
        updatedAt: serverTimestamp()
      }

      if (editingPromotion) {
        await updateDoc(doc(db, "restaurants", user.uid, "promotions", editingPromotion.id), promotionData)
        showNotification('อัพเดทโปรโมชั่นสำเร็จ', 'success')
      } else {
        await addDoc(collection(db, "restaurants", user.uid, "promotions"), {
          ...promotionData,
          createdAt: serverTimestamp()
        })
        showNotification('เพิ่มโปรโมชั่นสำเร็จ', 'success')
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving promotion:', error)
      showNotification('เกิดข้อผิดพลาด', 'error')
    }
  }

  const deletePromotion = async (promotionId: string) => {
    if (!user || !confirm('คุณต้องการลบโปรโมชั่นนี้หรือไม่?')) return

    try {
      await deleteDoc(doc(db, "restaurants", user.uid, "promotions", promotionId))
      showNotification('ลบโปรโมชั่นสำเร็จ', 'success')
    } catch (error) {
      console.error('Error deleting promotion:', error)
      showNotification('เกิดข้อผิดพลาด', 'error')
    }
  }

  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" })
    }, 3000)
  }

  const getTypeIcon = (type: Promotion['type']) => {
    switch (type) {
      case 'discount': return <Percent className="h-4 w-4" />
      case 'points_multiplier': return <Target className="h-4 w-4" />
      case 'free_item': return <Gift className="h-4 w-4" />
      default: return <Gift className="h-4 w-4" />
    }
  }

  const getTypeText = (type: Promotion['type']) => {
    switch (type) {
      case 'discount': return 'ส่วนลด'
      case 'points_multiplier': return 'แต้มคูณ'
      case 'free_item': return 'ของแถม'
      default: return type
    }
  }

  const getTimeOfDayText = (timeOfDay: Promotion['timeOfDay']) => {
    switch (timeOfDay) {
      case 'morning': return 'เช้า (06:00-11:59)'
      case 'afternoon': return 'กลางวัน (12:00-17:59)'
      case 'evening': return 'เย็น (18:00-23:59)'
      case 'all': return 'ตลอดวัน'
      default: return 'ตลอดวัน'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Gift className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-bold">จัดการโปรโมชั่น</h2>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มโปรโมชั่น
          </button>
        </div>

        {/* Promotions List */}
        {promotions.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีโปรโมชั่น</h3>
            <p className="text-gray-500 mb-4">สร้างโปรโมชั่นเพื่อดึงดูดลูกค้า</p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              เพิ่มโปรโมชั่นแรก
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.map((promotion) => (
              <div
                key={promotion.id}
                className={`border rounded-lg p-4 ${
                  promotion.isActive ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${
                      promotion.isActive ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {getTypeIcon(promotion.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{promotion.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {promotion.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openEditModal(promotion)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletePromotion(promotion.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{promotion.description}</p>

                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center">
                    <span className="font-medium">ประเภท:</span>
                    <span className="ml-1">{getTypeText(promotion.type)}</span>
                    {promotion.type === 'discount' && <span className="ml-1">({promotion.value}%)</span>}
                    {promotion.type === 'points_multiplier' && <span className="ml-1">(x{promotion.value})</span>}
                  </div>

                  {promotion.minPoints && promotion.minPoints > 0 && (
                    <div className="flex items-center">
                      <span className="font-medium">แต้มขั้นต่ำ:</span>
                      <span className="ml-1">{promotion.minPoints} แต้ม</span>
                    </div>
                  )}

                  {promotion.minSpent && promotion.minSpent > 0 && (
                    <div className="flex items-center">
                      <span className="font-medium">ยอดซื้อขั้นต่ำ:</span>
                      <span className="ml-1">฿{promotion.minSpent}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{getTimeOfDayText(promotion.timeOfDay)}</span>
                  </div>

                  {promotion.validFrom && promotion.validTo && (
                    <div className="flex items-center">
                      <span className="font-medium">ระยะเวลา:</span>
                      <span className="ml-1">
                        {new Date(promotion.validFrom.toDate()).toLocaleDateString('th-TH')} - 
                        {new Date(promotion.validTo.toDate()).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-6">
                {editingPromotion ? 'แก้ไขโปรโมชั่น' : 'เพิ่มโปรโมชั่นใหม่'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อโปรโมชั่น *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="เช่น ลด 20% สำหรับสมาชิก Gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รายละเอียด *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="อธิบายรายละเอียดโปรโมชั่น"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ประเภทโปรโมชั่น
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as Promotion['type']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="discount">ส่วนลด (%)</option>
                    <option value="points_multiplier">แต้มคูณ</option>
                    <option value="free_item">ของแถม</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ค่า {formData.type === 'discount' ? '(เปอร์เซ็นต์)' : formData.type === 'points_multiplier' ? '(ตัวคูณ)' : ''}
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                    max={formData.type === 'discount' ? "100" : undefined}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      แต้มขั้นต่ำ
                    </label>
                    <input
                      type="number"
                      value={formData.minPoints}
                      onChange={(e) => setFormData({...formData, minPoints: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ยอดซื้อขั้นต่ำ (บาท)
                    </label>
                    <input
                      type="number"
                      value={formData.minSpent}
                      onChange={(e) => setFormData({...formData, minSpent: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ช่วงเวลาใช้งาน
                  </label>
                  <select
                    value={formData.timeOfDay}
                    onChange={(e) => setFormData({...formData, timeOfDay: e.target.value as Promotion['timeOfDay']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">ตลอดวัน</option>
                    <option value="morning">เช้า (06:00-11:59)</option>
                    <option value="afternoon">กลางวัน (12:00-17:59)</option>
                    <option value="evening">เย็น (18:00-23:59)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วันที่เริ่ม
                    </label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วันที่สิ้นสุด
                    </label>
                    <input
                      type="date"
                      value={formData.validTo}
                      onChange={(e) => setFormData({...formData, validTo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    เปิดใช้งานโปรโมชั่น
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={savePromotion}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  {editingPromotion ? 'อัพเดท' : 'เพิ่ม'}โปรโมชั่น
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
