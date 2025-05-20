import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query, where, orderBy } from "firebase/firestore";
import { getStorage } from "firebase/storage"




// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBdnWr8bkOF5oP2gSsjo9pXbrZbJO-QzDc",
  authDomain: "fastorder-8f143.firebaseapp.com",
  projectId: "fastorder-8f143",
  storageBucket: "fastorder-8f143.firebasestorage.app",
  messagingSenderId: "827965800193",
  appId: "1:827965800193:web:1d9ff91b5f6adb90bf6500",
  measurementId: "G-2LXXJM6W59"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
export const storage = getStorage(app)

export { auth, provider, signInWithPopup, db, doc, setDoc, getDoc, onSnapshot, collection, query, where, orderBy };

