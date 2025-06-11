"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { BarChart3, QrCode, Utensils, DollarSign, Star, MenuIcon, Bell, Settings, LogOut, X, ChevronDown, Save, Loader, Store, Phone, Mail, FileText, Calendar, Clock, TrendingUp, Receipt, Users, Gift } from 'lucide-react';
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  orderBy,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import MenuManagement from "./menu-management";
import OrdersManagement from "./orders-management";
import { createMultipleTestOrders } from "@/scripts/generate-test-data";
import QRCodeGenerator from "./qr-code-generator";
import BillsManagement from "./bills-management";
import QRPaymentSettings from "./components/qr-payment-settings";
import ReceiptsManagement from "./components/receipts-management";
import MembersManagement from "./components/members-management"
import PromotionsManagement from "./components/promotions-management"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState({
    restaurantName: "",
    phoneNumber: "",
    email: "",
    storeName: "",
    phone: "",
  });
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const router = useRouter();
  const [recommendedMenuItems, setRecommendedMenuItems] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState<
    { date: string; amount: number }[]
  >([]);
  const [isGeneratingTestData, setIsGeneratingTestData] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [prevPendingOrdersCount, setPrevPendingOrdersCount] = useState(0);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const [popularMenuItems, setPopularMenuItems] = useState<any[]>([]);
  const [staffCalls, setStaffCalls] = useState<any[]>([]);

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          router.push("/setup"); // หรือ path ที่เหมาะสม
          return;
        }

        const userData = userSnap.data();
        if (!userData.isPaid) {
          router.push("/pricing"); // หรือหน้าแจ้งเตือนให้จ่ายเงิน
          return;
        }

        setUser(currentUser);
        fetchUserProfile(currentUser.uid);
        setupRealTimeListeners(currentUser.uid);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    let unsubscribeStaffCall: (() => void) | undefined;
    if (user) {
      const staffCallQuery = query(
        collection(db, "users", user.uid, "call_staff"),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );
      unsubscribeStaffCall = onSnapshot(staffCallQuery, (snapshot) => {
        const calls: any[] = [];
        snapshot.forEach((doc) => {
          calls.push({ id: doc.id, ...doc.data() });
        });
        setStaffCalls(calls);
      });
    }
    return () => {
      if (unsubscribeStaffCall) unsubscribeStaffCall();
    };
  }, [user]);

  // Setup real-time listeners for various data
  const setupRealTimeListeners = (userId: string) => {
    // Real-time listener for recommended menu items
    const recommendedMenuQuery = query(
      collection(db, "users", userId, "menu"),
      where("isRecommended", "==", true),
      where("isAvailable", "==", true)
    );

    const unsubscribeMenu = onSnapshot(
      recommendedMenuQuery,
      (snapshot) => {
        const items: any[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setRecommendedMenuItems(items);
      },
      (error) => {
        console.error("Error in menu real-time listener:", error);
      }
    );

    // Real-time listener for pending orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingOrdersQuery = query(
      collection(db, "users", userId, "orders"),
      where("status", "==", "pending")
    );

    const unsubscribeOrders = onSnapshot(
      pendingOrdersQuery,
      (snapshot) => {
        const orders: any[] = [];
        snapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() });
        });
        setPendingOrders(orders);
      },
      (error) => {
        console.error("Error in orders real-time listener:", error);
      }
    );

    // Real-time listener for today's revenue (only completed orders)
    const todayOrdersQuery = query(
      collection(db, "users", userId, "orders"),
      where("createdAt", ">=", today),
      where("status", "==", "completed") // Only count completed orders
    );

    const unsubscribeRevenue = onSnapshot(
      todayOrdersQuery,
      (snapshot) => {
        let revenue = 0;
        let orderCount = 0;

        snapshot.forEach((doc) => {
          const orderData = doc.data();
          revenue += orderData.totalAmount || 0;
          orderCount++;
        });

        setTodayRevenue(revenue);
        setTodayOrders(orderCount);
      },
      (error) => {
        console.error("Error in revenue real-time listener:", error);
      }
    );

    // Get weekly revenue data (last 7 days)
    const fetchWeeklyRevenue = async () => {
      try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const weeklyOrdersQuery = query(
          collection(db, "users", userId, "orders"),
          where("status", "==", "completed"),
          where("createdAt", ">=", weekAgo),
          orderBy("createdAt", "asc")
        );

        const snapshot = await getDocs(weeklyOrdersQuery);

        // Group by date
        const revenueByDate = snapshot.docs.reduce(
          (acc: Record<string, number>, doc) => {
            const data = doc.data();
            const date = data.createdAt?.toDate
              ? new Date(data.createdAt.toDate()).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0];

            if (!acc[date]) {
              acc[date] = 0;
            }
            acc[date] += data.totalAmount || 0;
            return acc;
          },
          {}
        );

        // Convert to array format
        const revenueArray = Object.entries(revenueByDate).map(
          ([date, amount]) => ({
            date,
            amount,
          })
        );

        setWeeklyRevenue(revenueArray);
      } catch (error) {
        console.error("Error fetching weekly revenue:", error);
      }
    };

    // Fetch popular menu items
    const fetchPopularMenuItems = async () => {
      try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const ordersQuery = query(
          collection(db, "users", userId, "orders"),
          where("status", "==", "completed"),
          where("createdAt", ">=", weekAgo)
        );

        const snapshot = await getDocs(ordersQuery);
        const itemCounts: Record<
          string,
          { name: string; count: number; revenue: number }
        > = {};

        snapshot.forEach((doc) => {
          const orderData = doc.data();
          if (orderData.items) {
            orderData.items.forEach((item: any) => {
              if (!itemCounts[item.id]) {
                itemCounts[item.id] = {
                  name: item.name,
                  count: 0,
                  revenue: 0,
                };
              }
              itemCounts[item.id].count += item.quantity;
              itemCounts[item.id].revenue += item.price * item.quantity;

              // Add options revenue
              if (item.selectedOptions) {
                item.selectedOptions.forEach((option: any) => {
                  itemCounts[item.id].revenue += option.price * item.quantity;
                });
              }
            });
          }
        });

        // Convert to array and sort by count
        const popularItems = Object.entries(itemCounts)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5 items

        setPopularMenuItems(popularItems);
      } catch (error) {
        console.error("Error fetching popular menu items:", error);
      }
    };

    fetchWeeklyRevenue();
    fetchPopularMenuItems();

    // Set up interval to refresh data every hour
    const weeklyInterval = setInterval(() => {
      fetchWeeklyRevenue();
      fetchPopularMenuItems();
    }, 3600000);

    // Return cleanup function to unsubscribe from all listeners
    return () => {
      unsubscribeMenu();
      unsubscribeOrders();
      unsubscribeRevenue();
      clearInterval(weeklyInterval);
    };
  };

  // Fetch user profile data from Firebase
  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      const userRef = doc(db, "users", userId);

      // Set up real-time listener for profile data
      const unsubscribeProfile = onSnapshot(
        userRef,
        (userSnap) => {
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setProfileData({
              restaurantName: userData.restaurantName || "",
              phoneNumber: userData.phoneNumber || "",
              email: userData.email || "",
              storeName: userData.storeName || "",
              phone: userData.phone || "",
            });
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error in profile real-time listener:", error);
          showNotification("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้", "error");
          setLoading(false);
        }
      );

      return unsubscribeProfile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      showNotification("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้", "error");
      setLoading(false);
      return () => {};
    }
  };

  // Update user profile in Firebase
  const updateUserProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        restaurantName: profileData.restaurantName,
        phoneNumber: profileData.phoneNumber,
        storeName: profileData.storeName,
        phone: profileData.phone,
        updatedAt: serverTimestamp(),
      });

      showNotification("อัปเดตข้อมูลโปรไฟล์สำเร็จ", "success");
      setProfileModalOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      showNotification("ไม่สามารถอัปเดตข้อมูลโปรไฟล์ได้", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Show notification
  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Handle profile form input changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Effect for notification sound
  useEffect(() => {
    // Create audio element
    notificationSoundRef.current = new Audio("/notification.mp3");

    return () => {
      if (notificationSoundRef.current) {
        notificationSoundRef.current = null;
      }
    };
  }, []);

  // Effect to detect new orders and play notification
  useEffect(() => {
    // Check if there are new pending orders
    if (
      pendingOrders.length > prevPendingOrdersCount &&
      prevPendingOrdersCount > 0
    ) {
      // Play notification sound
      if (notificationSoundRef.current) {
        notificationSoundRef.current
          .play()
          .catch((err) =>
            console.error("Error playing notification sound:", err)
          );
      }

      // Show notification
      showNotification(
        `มีออเดอร์ใหม่ ${pendingOrders.length - prevPendingOrdersCount} รายการ`,
        "success"
      );
    }

    // Update previous count
    setPrevPendingOrdersCount(pendingOrders.length);
  }, [pendingOrders.length]);

  // Function to generate test data (for development only)
  const handleGenerateTestData = async () => {
    if (!user || isGeneratingTestData) return;

    try {
      setIsGeneratingTestData(true);
      await createMultipleTestOrders(user.uid, 5);
      showNotification("สร้างข้อมูลทดสอบสำเร็จ", "success");
    } catch (error) {
      console.error("Error generating test data:", error);
      showNotification("ไม่สามารถสร้างข้อมูลทดสอบได้", "error");
    } finally {
      setIsGeneratingTestData(false);
    }
  };

  // Toggle developer tools with keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setShowDevTools((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const renderEmptyState = (
    title: string,
    description: string,
    icon: React.ReactNode
  ) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-100 p-4 rounded-full mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mb-6">{description}</p>
    </div>
  );

  // Simple revenue chart component
  const RevenueChart = ({
    data,
  }: {
    data: { date: string; amount: number }[];
  }) => {
    if (!data || data.length === 0) return null;

    const maxAmount = Math.max(...data.map((item) => item.amount));
    const chartHeight = 200;

    return (
      <div className="relative h-64 w-full mt-4">
        <div className="flex items-end justify-between h-full w-full">
          {data.map((item, index) => {
            const height = (item.amount / maxAmount) * chartHeight || 0;
            const formattedDate = new Date(item.date).toLocaleDateString(
              "th-TH",
              {
                day: "numeric",
                month: "short",
              }
            );

            return (
              <div
                key={index}
                className="flex flex-col items-center"
                style={{ flex: "1" }}
              >
                <div
                  className="bg-blue-500 rounded-t-sm w-12 transition-all duration-500 ease-in-out"
                  style={{ height: `${height}px` }}
                  title={`฿${item.amount.toFixed(2)}`}
                ></div>
                <div className="text-xs text-gray-600 mt-2 rotate-45 origin-left">
                  {formattedDate}
                </div>
              </div>
            );
          })}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
          <span>฿{maxAmount.toFixed(0)}</span>
          <span>฿{(maxAmount / 2).toFixed(0)}</span>
          <span>฿0</span>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">รายได้วันนี้</p>
                    <h3 className="text-xl md:text-2xl font-bold mt-1">
                      ฿{todayRevenue.toFixed(2)}
                    </h3>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">
                      จำนวนออเดอร์ที่เสร็จสิ้น
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold mt-1">
                      {todayOrders}
                    </h3>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Utensils className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">
                      มูลค่าเฉลี่ยต่อออเดอร์
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold mt-1">
                      ฿
                      {todayOrders > 0
                        ? (todayRevenue / todayOrders).toFixed(2)
                        : "0.00"}
                    </h3>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">ออเดอร์ที่รอยืนยัน</p>
                    <h3 className="text-xl md:text-2xl font-bold mt-1">
                      {pendingOrders.length}
                    </h3>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Clock className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <h3 className="font-bold mb-2 sm:mb-0">รายได้</h3>
                </div>
                {weeklyRevenue.length > 0 ? (
                  <RevenueChart data={weeklyRevenue} />
                ) : (
                  renderEmptyState(
                    "ยังไม่มีข้อมูลรายได้",
                    "รายได้จะแสดงเมื่อมีออเดอร์ที่เสร็จสิ้นแล้วเท่านั้น",
                    <BarChart3 className="h-8 w-8 text-gray-400" />
                  )
                )}
              </div>

              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 h-[500px] overflow-y-auto">
                <h3 className="font-bold mb-4">ออเดอร์ที่รอการยืนยัน</h3>
                {pendingOrders.length > 0 ? (
                  <div className="space-y-3">
                    {pendingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">
                            โต๊ะ {order.table || "-"}
                          </span>
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                            รอยืนยัน
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {order.items?.length || 0} รายการ · ฿
                          {order.totalAmount?.toFixed(2) || "0"}
                        </p>
                        <div className="flex justify-end">
                          <button
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md"
                            onClick={() => setActiveTab("orders")}
                          >
                            ดูรายละเอียด
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  renderEmptyState(
                    "ไม่มีออเดอร์ที่รอการยืนยัน",
                    "ออเดอร์ใหม่จะปรากฏที่นี่เมื่อลูกค้าสั่งอาหาร",
                    <FileText className="h-8 w-8 text-gray-400" />
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px] overflow-y-auto">
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <h3 className="font-bold mb-2 sm:mb-0">เมนูยอดนิยม </h3>
                </div>

                {popularMenuItems.length > 0 ? (
                  <div className="space-y-3">
                    {popularMenuItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-bold text-sm">
                              #{index + 1}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              สั่ง {item.count} ครั้ง
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            ฿{item.revenue.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">รายได้</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  renderEmptyState(
                    "ยังไม่มีข้อมูลเมนูยอดนิยม",
                    "ข้อมูลจะแสดงเมื่อมีออเดอร์ที่เสร็จสิ้นแล้ว",
                    <TrendingUp className="h-8 w-8 text-gray-400" />
                  )
                )}
              </div>

              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 h-[500px] overflow-y-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <h3 className="font-bold mb-2 sm:mb-0">เมนูแนะนำ</h3>
                </div>

                {recommendedMenuItems.length > 0 ? (
                  <div className="space-y-3">
                    {recommendedMenuItems.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-lg mr-3 overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Utensils className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.name}
                          </h4>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-blue-600 font-medium">
                              ฿{item.price?.toFixed(2)}
                            </span>
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              แนะนำ
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  renderEmptyState(
                    "ยังไม่มีเมนูแนะนำ",
                    "เพิ่มเมนูแนะนำเพื่อแสดงที่นี่",
                    <Star className="h-8 w-8 text-gray-400" />
                  )
                )}
              </div>
            </div>
          </div>
        );
      case "call-staff":
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-2">🚨</span>
              <h3 className="font-bold text-orange-600">
                แจ้งเตือนเรียกพนักงาน
              </h3>
            </div>
            {staffCalls.length === 0 ? (
              <div className="text-gray-500">ยังไม่มีการเรียกพนักงาน</div>
            ) : (
              <ul className="space-y-2">
                {staffCalls.map((call) => (
                  <li
                    key={call.id}
                    className="flex justify-between items-center border p-3 rounded bg-orange-50"
                  >
                    <div>
                      <div className="font-bold">โต๊ะ {call.table}</div>
                      <div className="text-xs text-gray-500">
                        {call.createdAt?.toDate
                          ? new Date(
                              call.createdAt.toDate()
                            ).toLocaleTimeString("th-TH")
                          : ""}
                      </div>
                    </div>
                    <button
                      className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 font-bold"
                      onClick={async () => {
                        await deleteDoc(
                          doc(db, "users", user.uid, "call_staff", call.id)
                        );
                        showNotification(
                          "รับเรื่องเรียกพนักงานแล้ว",
                          "success"
                        );
                      }}
                    >
                      รับเรื่องแล้ว
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      case "qrcode":
        return <QRCodeGenerator />;
      case "orders":
        return <OrdersManagement />;
      case "revenue":
        return (
          <div className="space-y-6">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-0">
                  สรุปรายได้
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-xs md:text-sm rounded-md">
                    วันนี้
                  </button>

                  <div className="relative">
                    <input
                      type="date"
                      className="pl-3 pr-10 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
                    />
                    <Calendar className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-blue-700">รายได้รวม</p>
                  <h3 className="text-xl md:text-2xl font-bold text-blue-900 mt-1">
                    ฿{todayRevenue.toFixed(2)}
                  </h3>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-green-700">
                    จำนวนออเดอร์
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold text-green-900 mt-1">
                    {todayOrders}
                  </h3>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-purple-700">
                    มูลค่าเฉลี่ยต่อออเดอร์
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold text-purple-900 mt-1">
                    ฿
                    {todayOrders > 0
                      ? (todayRevenue / todayOrders).toFixed(2)
                      : "0.00"}
                  </h3>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold mb-4">รายได้ตามช่วงเวลา</h3>
                {weeklyRevenue.length > 0 ? (
                  <RevenueChart data={weeklyRevenue} />
                ) : (
                  renderEmptyState(
                    "ยังไม่มีข้อมูลรายได้",
                    "เริ่มรับออเดอร์เพื่อดูข้อมูลรายได้ตามช่วงเวลา",
                    <BarChart3 className="h-8 w-8 text-gray-400" />
                  )
                )}
              </div>
            </div>
          </div>
        );

      case "menu":
        return <MenuManagement />;
      case "bills":
        return <BillsManagement />;
      case "qr-settings":
        return <QRPaymentSettings />;
      case "receipts":
        return <ReceiptsManagement />;
      case "call-staff":
        return "เรียกพนักงาน";
         case "members":
        return <MembersManagement />
      case "promotions":
        return <PromotionsManagement />
      default:
        return <div>เลือกเมนูเพื่อดูข้อมูล</div>;
    }
  };

  // Helper function to get page title based on active tab
  const getPageTitle = (tab: string): string => {
    switch (tab) {
      case "overview":
        return "ภาพรวม";
      case "qrcode":
        return "สร้าง QR Code";
      case "orders":
        return "ออเดอร์";
      case "revenue":
        return "รายได้";
      case "menu":
        return "จัดการเมนู";
      case "bills":
        return "จัดการบิล";
      case "qr-settings":
        return "ตั้งค่า QR Code รับเงิน";
      case "receipts":
        return "ใบเสร็จลูกค้า";
        case "members":
        return "จัดการสมาชิก"
      case "promotions":
        return "จัดการโปรโมชั่น"
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              className="text-gray-500 hover:text-gray-700 mr-2"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center text-white mr-2">
                <Utensils className="h-5 w-5" />
              </div>
              <h1 className="text-lg font-bold">
                {profileData.storeName || "ร้านอาหาร"}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setActiveTab("orders")}
                className="text-gray-500 hover:text-gray-700"
              >
                <Bell className="h-6 w-6" />
              </button>
              {pendingOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {pendingOrders.length}
                </span>
              )}
            </div>
            <button onClick={() => setProfileModalOpen(true)}>
              <img
                src="/placeholder.svg?height=32&width=32"
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 w-64 fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center text-white mr-2">
              <Utensils className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">
              {profileData.storeName || "ร้านอาหาร"}
            </h1>
          </div>
          <button
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-1">
            <button
              className={`w-full flex items-center px-3 py-2 rounded-md ${
                activeTab === "overview"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("overview");
                setSidebarOpen(false);
              }}
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              <span>ภาพรวม</span>
            </button>
            <button
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                activeTab === "orders"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("orders");
                setSidebarOpen(false);
              }}
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-3" />
                <span>ออเดอร์</span>
              </div>
              {pendingOrders.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {pendingOrders.length}
                </span>
              )}
            </button>
            <button
              className={`w-full flex items-center px-3 py-2 rounded-md ${
                activeTab === "menu"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("menu");
                setSidebarOpen(false);
              }}
            >
              <Utensils className="h-5 w-5 mr-3" />
              <span>เมนู</span>
            </button>
            <button
              className={`w-full flex items-center px-3 py-2 rounded-md ${
                activeTab === "qrcode"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("qrcode");
                setSidebarOpen(false);
              }}
            >
              <QrCode className="h-5 w-5 mr-3" />
              <span>QR Code</span>
            </button>
            <button
              className={`w-full flex items-center px-3 py-2 rounded-md ${
                activeTab === "revenue"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("revenue");
                setSidebarOpen(false);
              }}
            >
              <DollarSign className="h-5 w-5 mr-3" />
              <span>รายได้</span>
            </button>
            <button
              className={`w-full flex items-center px-3 py-2 rounded-md ${
                activeTab === "bills"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("bills");
                setSidebarOpen(false);
              }}
            >
              <Receipt className="h-5 w-5 mr-3" />
              <span>บิล</span>
            </button>
            <button
              className={`w-full flex items-center px-3 py-2 rounded-md ${
                activeTab === "qr-settings"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("qr-settings");
                setSidebarOpen(false);
              }}
            >
              <QrCode className="h-5 w-5 mr-3" />
              <span>ตั้งค่า QR Code</span>
            </button>
            <button
              className={`w-full flex items-center px-3 py-2 rounded-md ${
                activeTab === "receipts"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("receipts");
                setSidebarOpen(false);
              }}
            >
              <Receipt className="h-5 w-5 mr-3" />
              <span>ใบเสร็จลูกค้า</span>
            </button>
            <button
              className={`w-full flex items-center px-3 py-2 rounded-md ${
                activeTab === "members"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("members");
                setSidebarOpen(false);
              }}
            >
              <Users className="h-5 w-5 mr-3" />
              <span>จัดการสมาชิก</span>
            </button>
            <button
              className={`w-full flex items-center px-3 py-2 rounded-md ${
                activeTab === "promotions"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("promotions");
                setSidebarOpen(false);
              }}
            >
              <Gift className="h-5 w-5 mr-3" />
              <span>จัดการโปรโมชั่น</span>
            </button>
            <button
              className={`w-full flex items-center px-3 py-2 rounded-md ${
                activeTab === "call-staff"
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("call-staff");
                setSidebarOpen(false);
              }}
            >
              <Bell className="h-5 w-5 mr-3 text-orange-500" />
              <span>เรียกพนักงาน</span>
              {/* แสดง badge ถ้ามีแจ้งเตือน */}
              {staffCalls.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                  {staffCalls.length}
                </span>
              )}
            </button>
          </div>

          <div className="mt-8">
            <p className="px-3 text-xs font-medium text-gray-400 uppercase mb-2">
              บัญชี
            </p>
            <button
              className="w-full flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setProfileModalOpen(true);
                setSidebarOpen(false);
              }}
            >
              <Settings className="h-5 w-5 mr-3" />
              <span>ตั้งค่าโปรไฟล์</span>
            </button>
            <button
              className="w-full flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Desktop Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 hidden md:block">
          <div className="flex items-center justify-between px-6 py-3">
            <h2 className="text-lg font-bold">{getPageTitle(activeTab)}</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Bell className="h-6 w-6" />
                </button>
                {pendingOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
                    {pendingOrders.length}
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <button
                  className="flex items-center space-x-2 focus:outline-none"
                  onClick={() => setProfileModalOpen(true)}
                >
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">
                      {profileData.storeName || "ร้านอาหารของคุณ"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profileData.phone ||
                        profileData.phoneNumber ||
                        "เบอร์โทรศัพท์"}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          {renderTabContent()}

          {/* Developer Tools (hidden by default, press Ctrl+Shift+D to show) */}
          {showDevTools && process.env.NODE_ENV !== "production" && (
            <div className="fixed bottom-4 left-4 md:left-68 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold">Developer Tools</h3>
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowDevTools(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                <button
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center text-sm"
                  onClick={handleGenerateTestData}
                  disabled={isGeneratingTestData}
                >
                  {isGeneratingTestData ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-2"></div>
                      กำลังสร้างข้อมูลทดสอบ...
                    </>
                  ) : (
                    "สร้างข้อมูลออเดอร์ทดสอบ (5 รายการ)"
                  )}
                </button>
                <p className="text-xs text-gray-400">
                  หมายเหตุ: ใช้สำหรับการทดสอบเท่านั้น
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Profile Settings Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">ตั้งค่าโปรไฟล์</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setProfileModalOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อร้านอาหาร
                  </label>
                  <div className="relative">
                    <Store className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="storeName"
                      value={profileData.storeName}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ชื่อร้านอาหารของคุณ"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <div className="relative">
                    <Phone className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="เบอร์โทรศัพท์"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมล
                  </label>
                  <div className="relative">
                    <Mail className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ไม่สามารถเปลี่ยนอีเมลได้
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  onClick={() => setProfileModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  onClick={updateUserProfile}
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
                      บันทึก
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
  );
}