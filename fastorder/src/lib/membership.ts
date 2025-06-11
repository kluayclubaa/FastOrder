import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore"

export interface Member {
  id: string
  email: string
  phone: string
  name: string
  points: number
  totalSpent: number
  joinDate: any
  lastVisit: any
  tier: "bronze" | "silver" | "gold" | "platinum"
  restaurantId: string
}

export interface PointTransaction {
  id: string
  memberId: string
  type: "earn" | "redeem"
  points: number
  orderId?: string
  description: string
  createdAt: any
}

export interface Promotion {
  id: string
  title: string
  description: string
  type: "discount" | "points_multiplier" | "free_item"
  value: number
  minPoints?: number
  minSpent?: number
  validFrom?: any
  validTo?: any
  isActive: boolean
  restaurantId: string
  timeOfDay?: "morning" | "afternoon" | "evening" | "all"
}

// Create new member
export const createMember = async (
  restaurantId: string,
  memberData: Omit<Member, "id" | "points" | "totalSpent" | "joinDate" | "tier" | "restaurantId">,
) => {
  try {
    const memberRef = doc(collection(db, "restaurants", restaurantId, "members"))
    const newMember: Omit<Member, "id"> = {
      ...memberData,
      points: 0,
      totalSpent: 0,
      joinDate: serverTimestamp(),
      lastVisit: serverTimestamp(),
      tier: "bronze",
      restaurantId,
    }

    await setDoc(memberRef, newMember)
    return memberRef.id
  } catch (error) {
    console.error("Error creating member:", error)
    throw error
  }
}

// Find member by phone
export const findMemberByPhone = async (restaurantId: string, phone: string) => {
  try {
    const membersRef = collection(db, "restaurants", restaurantId, "members")
    const q = query(membersRef, where("phone", "==", phone))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as Member
    }
    return null
  } catch (error) {
    console.error("Error finding member:", error)
    throw error
  }
}

// Add points
export const addPoints = async (
  restaurantId: string,
  memberId: string,
  points: number,
  orderId?: string,
  description?: string,
) => {
  try {
    const memberRef = doc(db, "restaurants", restaurantId, "members", memberId)

    // Update member points
    await updateDoc(memberRef, {
      points: increment(points),
      lastVisit: serverTimestamp(),
    })

    // Record transaction
    const transactionRef = collection(db, "restaurants", restaurantId, "point_transactions")
    await addDoc(transactionRef, {
      memberId,
      type: "earn",
      points,
      orderId,
      description: description || `ได้รับแต้มจากการสั่งอาหาร`,
      createdAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error adding points:", error)
    throw error
  }
}

// Redeem points
export const redeemPoints = async (restaurantId: string, memberId: string, points: number, description: string) => {
  try {
    const memberRef = doc(db, "restaurants", restaurantId, "members", memberId)
    const memberDoc = await getDoc(memberRef)

    if (!memberDoc.exists()) {
      throw new Error("ไม่พบข้อมูลสมาชิก")
    }

    const memberData = memberDoc.data() as Member
    if (memberData.points < points) {
      throw new Error("แต้มไม่เพียงพอ")
    }

    // Deduct points
    await updateDoc(memberRef, {
      points: increment(-points),
      lastVisit: serverTimestamp(),
    })

    // Record transaction
    const transactionRef = collection(db, "restaurants", restaurantId, "point_transactions")
    await addDoc(transactionRef, {
      memberId,
      type: "redeem",
      points,
      description,
      createdAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error redeeming points:", error)
    throw error
  }
}

// Calculate points from amount
export const calculatePointsFromAmount = (amount: number): number => {
  // 1 baht = 1 point
  return Math.floor(amount)
}

// Update member tier
export const updateMemberTier = async (restaurantId: string, memberId: string, totalSpent: number) => {
  let tier: Member["tier"] = "bronze"

  if (totalSpent >= 10000) tier = "platinum"
  else if (totalSpent >= 5000) tier = "gold"
  else if (totalSpent >= 2000) tier = "silver"

  const memberRef = doc(db, "restaurants", restaurantId, "members", memberId)
  await updateDoc(memberRef, { tier, totalSpent })
}
