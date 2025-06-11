"use client"

import { useState, useEffect } from "react"
import { Users, Search, Gift, TrendingUp, Star, Phone, Mail, Calendar } from 'lucide-react'
import { auth, db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { type Member, type PointTransaction } from "@/lib/membership"

export default function MembersManagement() {
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | 'bronze' | 'silver' | 'gold' | 'platinum'>('all')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        setupMembersListener(currentUser.uid)
        setupTransactionsListener(currentUser.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let filtered = members

    if (searchTerm) {
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(member => member.tier === tierFilter)
    }

    setFilteredMembers(filtered)
  }, [members, searchTerm, tierFilter])

  const setupMembersListener = (userId: string) => {
    const membersRef = collection(db, "restaurants", userId, "members")
    const membersQuery = query(membersRef, orderBy("joinDate", "desc"))

    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const membersList: Member[] = []
      snapshot.forEach((doc) => {
        membersList.push({ id: doc.id, ...doc.data() } as Member)
      })
      setMembers(membersList)
      setLoading(false)
    })

    return unsubscribe
  }

  const setupTransactionsListener = (userId: string) => {
    const transactionsRef = collection(db, "restaurants", userId, "point_transactions")
    const transactionsQuery = query(transactionsRef, orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsList: PointTransaction[] = []
      snapshot.forEach((doc) => {
        transactionsList.push({ id: doc.id, ...doc.data() } as PointTransaction)
      })
      setPointTransactions(transactionsList)
    })

    return unsubscribe
  }

  const getTierColor = (tier: Member['tier']) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-800'
      case 'silver': return 'bg-gray-100 text-gray-800'
      case 'gold': return 'bg-yellow-100 text-yellow-800'
      case 'platinum': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierIcon = (tier: Member['tier']) => {
    switch (tier) {
      case 'bronze': return '🥉'
      case 'silver': return '🥈'
      case 'gold': return '🥇'
      case 'platinum': return '💎'
      default: return '🏅'
    }
  }

  // สถิติสมาชิก
  const totalMembers = members.length
  const totalPoints = members.reduce((sum, member) => sum + member.points, 0)
  const totalSpent = members.reduce((sum, member) => sum + member.totalSpent, 0)
  const averageSpent = totalMembers > 0 ? totalSpent / totalMembers : 0

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
            <Users className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold">จัดการสมาชิก</h2>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-700">สมาชิกทั้งหมด</p>
                <h3 className="text-xl font-bold text-blue-900">{totalMembers}</h3>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Gift className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-700">แต้มรวมทั้งหมด</p>
                <h3 className="text-xl font-bold text-green-900">{totalPoints.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-700">ยอดซื้อรวม</p>
                <h3 className="text-xl font-bold text-purple-900">฿{totalSpent.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-orange-700">ยอดซื้อเฉลี่ย</p>
                <h3 className="text-xl font-bold text-orange-900">฿{averageSpent.toFixed(0)}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาสมาชิก..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
          >
            <option value="all">ทุกระดับ</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบสมาชิก</h3>
            <p className="text-gray-500">ยังไม่มีสมาชิกในระบบ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สมาชิก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ติดต่อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ระดับ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    แต้มสะสม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดซื้อรวม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เข้าร่วมเมื่อ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold text-sm">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">ID: {member.id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {member.phone}
                      </div>
                      {member.email && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Mail className="h-4 w-4 mr-1" />
                          {member.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(member.tier)}`}>
                        <span className="mr-1">{getTierIcon(member.tier)}</span>
                        {member.tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.points.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">฿{member.totalSpent.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {member.joinDate?.toDate ? 
                          new Date(member.joinDate.toDate()).toLocaleDateString('th-TH') : 
                          'ไม่ระบุ'
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
