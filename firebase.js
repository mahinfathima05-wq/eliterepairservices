// ===============================
// Firebase Configuration
// firebase.js
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {

  apiKey: "AIzaSyBwOQ2e1DApJJH7XqPU99d36lcB1evt9hE",

  authDomain: "elite-repair-and-service.firebaseapp.com",

  projectId: "elite-repair-and-service",

  storageBucket: "elite-repair-and-service.firebasestorage.app",

  messagingSenderId: "507098499960",

  appId: "1:507098499960:web:2fe0d6f1e68b65f6bed68d",

  measurementId: "G-ERHJP069RW"

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

export { db, auth };