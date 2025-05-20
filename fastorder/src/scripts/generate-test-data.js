// Test data generator for FastOrder
// This script can be used to generate test data for the real-time features

import { db, auth } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  getDocs,
  query,
  where,
  doc
} from 'firebase/firestore';

// Function to generate a random order
const generateRandomOrder = (userId, menuItems) => {
  // Random number of items between 1 and 5
  const itemCount = Math.floor(Math.random() * 5) + 1;
  const orderItems = [];
  let totalAmount = 0;
  
  // Select random items from the menu
  for (let i = 0; i < itemCount; i++) {
    if (menuItems.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * menuItems.length);
    const menuItem = menuItems[randomIndex];
    const quantity = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
    
    orderItems.push({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: quantity,
      subtotal: menuItem.price * quantity
    });
    
    totalAmount += menuItem.price * quantity;
    
    // Remove item from array to avoid duplicates
    menuItems.splice(randomIndex, 1);
  }
  
  // Random table number between 1 and 20
  const tableNumber = Math.floor(Math.random() * 20) + 1;
  
  // Random status (60% pending, 10% cooking, 10% served, 10% completed, 10% cancelled)
  const statusRandom = Math.random();
  let status = "pending";
  if (statusRandom > 0.6 && statusRandom <= 0.7) {
    status = "cooking";
  } else if (statusRandom > 0.7 && statusRandom <= 0.8) {
    status = "served";
  } else if (statusRandom > 0.8 && statusRandom <= 0.9) {
    status = "completed";
  } else if (statusRandom > 0.9) {
    status = "cancelled";
  }
  
  return {
    table: tableNumber.toString(),
    items: orderItems,
    totalAmount: totalAmount,
    status: status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    userId: userId
  };
};

// Function to create a test order in Firestore
export const createTestOrder = async (userId) => {
  if (!userId) {
    console.error("No user ID provided");
    return;
  }
  
  try {
    // First, get the menu items for this user
    const menuQuery = query(
      collection(db, "users", userId, "menu"),
      where("isAvailable", "==", true)
    );
    
    const menuSnapshot = await getDocs(menuQuery);
    const menuItems = [];
    
    menuSnapshot.forEach((doc) => {
      menuItems.push({ id: doc.id, ...doc.data() });
    });
    
    if (menuItems.length === 0) {
      console.error("No menu items found. Please add menu items first.");
      return;
    }
    
    // Generate a random order
    const orderData = generateRandomOrder(userId, [...menuItems]);
    
    // Add the order to Firestore
    const orderRef = await addDoc(
      collection(db, "users", userId, "orders"),
      orderData
    );
    
    console.log("Test order created with ID:", orderRef.id);
    return orderRef.id;
    
  } catch (error) {
    console.error("Error creating test order:", error);
  }
};

// Create multiple test orders
export const createMultipleTestOrders = async (userId, count = 5) => {
  if (!userId) {
    console.error("No user ID provided");
    return;
  }
  
  try {
    const orderIds = [];
    for (let i = 0; i < count; i++) {
      const orderId = await createTestOrder(userId);
      if (orderId) orderIds.push(orderId);
    }
    
    console.log(`Created ${orderIds.length} test orders`);
    return orderIds;
  } catch (error) {
    console.error("Error creating multiple test orders:", error);
  }
};

// Usage example:
// import { createTestOrder, createMultipleTestOrders } from './src/scripts/generate-test-data';
// const userId = auth.currentUser.uid;
// createTestOrder(userId);
// createMultipleTestOrders(userId, 5); 