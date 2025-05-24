import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query, where, orderBy } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";  

const firebaseConfig = {
  apiKey: "AIzaSyBdnWr8bkOF5oP2gSsjo9pXbrZbJO-QzDc",
  authDomain: "fastorder-8f143.firebaseapp.com",
  projectId: "fastorder-8f143",
  storageBucket: "fastorder-8f143.firebasestorage.app",
  messagingSenderId: "827965800193",
  appId: "1:827965800193:web:1d9ff91b5f6adb90bf6500",
  measurementId: "G-2LXXJM6W59"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);
const functions = getFunctions(app);  

export { auth, provider, signInWithPopup, db, doc, setDoc, getDoc, onSnapshot, collection, query, where, orderBy, storage, functions };
