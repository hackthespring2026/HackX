// firebase.js

// 🔥 Import Firebase SDKs (Modular v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔐 Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeid19pY5TWQTcSLsYRwRLlxK7sPtwOPo",
  authDomain: "dealsnow-659cf.firebaseapp.com",
  projectId: "dealsnow-659cf",
  storageBucket: "dealsnow-659cf.firebasestorage.app",
  messagingSenderId: "927818394413",
  appId: "1:927818394413:web:d9187f1ec7135b30b141a4",
};

// 🚀 Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔑 Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);

// 📦 Export so other files can use
export { app, auth, db };
