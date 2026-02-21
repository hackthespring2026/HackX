import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ================= REGISTER SHOP ================= */

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const shopName = document.getElementById("shopName").value;
    const businessType = document.getElementById("businessType").value;
    const currentOffer = document.getElementById("currentOffer").value;
    const email = document.getElementById("email").value;
    const mobile = document.getElementById("mobile").value;
    const identity = document.getElementById("identity").value;
    const address = document.getElementById("address").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await setDoc(doc(db, "shops", user.uid), {
        shopName,
        businessType,
        currentOffer,
        email,
        mobile,
        identity,
        address,
        createdAt: serverTimestamp(),
      });

      alert("Account created successfully!");
      window.location.href = "shoplogin.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

/* ================= LOGIN SHOP ================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      window.location.href = "updatedeal.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

/* ================= ADD DEAL ================= */

const dealForm = document.getElementById("dealForm");

if (dealForm) {
  dealForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const category = document.getElementById("dealCategory").value;
    const title = document.getElementById("dealTitle").value;
    const price = document.getElementById("dealPrice").value;

    const user = auth.currentUser;

    if (!user) {
      alert("You must login first.");
      return;
    }

    try {
      await addDoc(collection(db, "deals"), {
        shopId: user.uid,
        title,
        price,
        category,
        createdAt: serverTimestamp(),
      });

      alert("Deal saved successfully!");
      window.location.href = "index.html";
    } catch (error) {
      alert(error.message);
    }
  });
}
