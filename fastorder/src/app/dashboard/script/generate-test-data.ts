import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

// Sample menu items for test orders
const sampleMenuItems = [
  { name: "ข้าวผัดกระเพรา", price: 60, category: "อาหารจานเดียว" },
  { name: "ต้มยำกุ้ง", price: 120, category: "กับข้าว" },
  { name: "ผัดไทย", price: 80, category: "อาหารจานเดียว" },
  { name: "ส้มตำ", price: 70, category: "กับข้าว" },
  { name: "ข้าวมันไก่", price: 65, category: "อาหารจานเดียว" },
  { name: "น้ำส้ม", price: 30, category: "เครื่องดื่ม" },
  { name: "ชาเย็น", price: 35, category: "เครื่องดื่ม" },
  { name: "ข้าวเหนียวมะม่วง", price: 90, category: "ของหวาน" },
]

// Function to generate a random integer between min and max (inclusive)
const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Function to get random items from the sample menu
const getRandomMenuItems = (count: number) => {
  const shuffled = [...sampleMenuItems].sort(() => 0.5 - Math.random())
  const selected = shuffled.slice(0, count)

  return selected.map((item) => ({
    ...item,
    quantity: getRandomInt(1, 3),
  }))
}

// Function to create a test order
export const createTestOrder = async (userId: string) => {
  try {
    // Generate random order data
    const items = getRandomMenuItems(getRandomInt(1, 4))
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tableNumber = getRandomInt(1, 10).toString()

    // Statuses: pending, cooking, served, completed, cancelled
    const statuses = ["pending", "cooking", "served", "completed", "cancelled"]
    const status = statuses[getRandomInt(0, 1)] // Only pending or cooking for test orders

    const orderData = {
      items,
      table: tableNumber,
      status,
      totalAmount,
      createdAt: serverTimestamp(),
    }

    // Add order to Firestore
    await addDoc(collection(db, "users", userId, "orders"), orderData)

    return true
  } catch (error) {
    console.error("Error creating test order:", error)
    return false
  }
}

// Function to create multiple test orders
export const createMultipleTestOrders = async (userId: string, count: number) => {
  try {
    const promises = []

    for (let i = 0; i < count; i++) {
      promises.push(createTestOrder(userId))
    }

    await Promise.all(promises)
    return true
  } catch (error) {
    console.error("Error creating multiple test orders:", error)
    return false
  }
}
