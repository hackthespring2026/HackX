import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  increment,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDeid19pY5TWQTcSLsYRwRLlxK7sPtwOPo",
  authDomain: "dealsnow-659cf.firebaseapp.com",
  projectId: "dealsnow-659cf",
  storageBucket: "dealsnow-659cf.firebasestorage.app",
  messagingSenderId: "927818394413",
  appId: "1:927818394413:web:d9187f1ec7135b30b141a4",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let userLat = null;
let userLng = null;
let surpriseDeal = null;
export let allDeals = [];

document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("register-btn");
  const loginBtn = document.getElementById("login-btn");
  const authBox = document.getElementById("auth-box");
  const profileBtn = document.getElementById("profile-btn");
  const profileModal = document.getElementById("profile-modal");
  const profileEmail = document.getElementById("profile-email");
  const closeProfile = document.getElementById("close-profile");
  const logoutProfileBtn = document.getElementById("logout-btn-profile");

  const locationScreen = document.getElementById("location-screen");
  const appScreen = document.getElementById("app-screen");
  const enableLocationBtn = document.getElementById("enable-location-btn");
  const dailyDealSection = document.getElementById("daily-deal");

  registerBtn?.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => alert("User Registered Successfully!"))
      .catch((error) => alert(error.message));
  });

  loginBtn?.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => alert("Login Successful!"))
      .catch((error) => alert(error.message));
  });

  profileBtn?.addEventListener("click", () => {
    profileModal.style.display = "flex";
  });

  closeProfile?.addEventListener("click", () => {
    profileModal.style.display = "none";
  });

  logoutProfileBtn?.addEventListener("click", () => {
    signOut(auth);
  });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      authBox.style.display = "none";
      profileBtn.style.display = "inline-block";
      profileEmail.innerText = user.email;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        document.getElementById("profile-points").innerText =
          userSnap.data().points || 0;
      } else {
        await setDoc(userRef, { points: 0 });
        document.getElementById("profile-points").innerText = 0;
      }
    } else {
      authBox.style.display = "block";
      profileBtn.style.display = "none";
    }
  });

  enableLocationBtn?.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;

        document.getElementById("user-location").innerText =
          "📍 Location enabled";

        locationScreen.style.display = "none";
        appScreen.style.display = "block";

        getDeals();
      },
      () => alert("Please enable location access."),
    );
  });

  document.querySelectorAll(".categories button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".categories button")
        .forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");
      const filter = btn.dataset.filter;

      document.querySelectorAll(".nearby-card").forEach((card) => {
        card.style.display =
          filter === "all" || card.dataset.category === filter
            ? "block"
            : "none";
      });
    });
  });

  dailyDealSection?.addEventListener("click", () => {
    if (!surpriseDeal) {
      alert("No surprise deal today!");
      return;
    }

    openDealModal(surpriseDeal.id, surpriseDeal.name, surpriseDeal.data, true);
  });

  const searchInput = document.getElementById("search-input");

  searchInput?.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();

    const filtered = allDeals.filter((docSnap) => {
      const d = docSnap.data;
      const name = (d.shop || d.name || "").toLowerCase();
      return name.includes(value);
    });

    renderDeals(filtered);
  });
});

// async function getDeals() {
//   const container = document.querySelector(".nearby-grid");
//   const countEl = document.getElementById("deal-count");

//   container.innerHTML = "";

//   const snapshot = await getDocs(collection(db, "deals"));
//   allDeals = snapshot.docs;

//   countEl.innerText = `${snapshot.size} offers`;

//   snapshot.forEach((docSnap) => {
//     const d = docSnap.data();

//     if (d.isSurprise === true) {
//       surpriseDeal = {
//         id: docSnap.id,
//         name: d.shop || d.name || "Daily Surprise",
//         data: d,
//       };
//     }
//   });

//   // snapshot.forEach((docSnap) => {
//   //   const d = docSnap.data();

//   //   const card = document.createElement("div");
//   //   card.className = "nearby-card";
//   //   card.dataset.category = d.category || "all";

//   //   if (d.isSurprise === true) {
//   //     surpriseDeal = {
//   //       id: docSnap.id,
//   //       name: d.shop || d.name || "Daily Surprise",
//   //       data: d,
//   //     };
//   //   }

//   //   card.innerHTML = `
//   //     <img src="${d.image || ""}" class="nearby-img">
//   //     <span class="badge">${d.discount || ""}</span>
//   //     <h4>${d.shop || d.name || "Shop"}</h4>
//   //     <p>${d.description || ""}</p>
//   //     <p class="deal-timer" data-minutes="${d.minutes || 60}">
//   //       ${d.minutes || 60}:00
//   //     </p>
//   //     <button class="directions-btn"
//   //       data-lat="${d.lat || ""}"
//   //       data-lng="${d.lng || ""}">
//   //       Get Directions
//   //     </button>
//   //   `;

//   //   card.addEventListener("click", (e) => {
//   //     if (e.target.classList.contains("directions-btn")) return;
//   //     openDealModal(docSnap.id, d.shop || d.name, d, false);
//   //   });

//   //   container.appendChild(card);
//   // });

//   renderDeals(allDeals);
// }
async function getDeals() {
  const container = document.querySelector(".nearby-grid");
  const countEl = document.getElementById("deal-count");

  container.innerHTML = "";

  const snapshot = await getDocs(collection(db, "deals"));

  allDeals = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const dealData = docSnap.data();

      // ✅ SET SURPRISE DEAL HERE
      if (dealData.isSurprise === true) {
        surpriseDeal = {
          id: docSnap.id,
          name: dealData.shop || dealData.name || "Daily Surprise",
          data: dealData,
        };
      }

      let lowestPrice = 0;

      const productsSnap = await getDocs(
        collection(db, "deals", docSnap.id, "products"),
      );

      if (!productsSnap.empty) {
        lowestPrice = Math.min(
          ...productsSnap.docs.map((p) => p.data().OfferPrice || 0),
        );
      }

      return {
        doc: docSnap,
        data: dealData,
        bestPrice: lowestPrice,
      };
    }),
  );

  countEl.innerText = `${allDeals.length} offers`;

  renderDeals(allDeals);
}
export function renderDeals(dealsArray) {
  const container = document.querySelector(".nearby-grid");
  const countEl = document.getElementById("deal-count");

  container.innerHTML = "";
  countEl.innerText = `${dealsArray.length} offers`;

  dealsArray.forEach((item) => {
    const docSnap = item.doc;
    const d = item.data;

    const card = document.createElement("div");
    card.className = "nearby-card";
    card.dataset.category = d.category || "all";

    card.innerHTML = `
      <img src="${d.image || ""}" class="nearby-img">
      <span class="badge">${d.discount || ""}</span>
      <h4>${d.shop || d.name || "Shop"}</h4>
      <p>${d.description || ""}</p>
      <p class="deal-timer" data-minutes="${d.minutes || 60}">
        ${d.minutes || 60}:00
      </p>
      <button class="directions-btn"
        data-lat="${d.lat || ""}"
        data-lng="${d.lng || ""}">
        Get Directions
      </button>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("directions-btn")) return;
      openDealModal(docSnap.id, d.shop || d.name, d, false);
    });

    container.appendChild(card);
  });

  startTimers();
}

async function openDealModal(dealId, dealName, dealData, isSurprise) {
  const modal = document.getElementById("deal-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalProducts = document.getElementById("modal-products");
  const shopInfoContainer = document.getElementById("shop-info");

  modalTitle.innerText = dealName;
  modalProducts.innerHTML = "Loading products...";
  modal.style.display = "flex";

  document.getElementById("close-modal").onclick = () =>
    (modal.style.display = "none");

  shopInfoContainer.innerHTML = `
    ${dealData?.phone ? `<p>📞 <a href="tel:${dealData.phone}">${dealData.phone}</a></p>` : ""}
    ${dealData?.timings ? `<p>🕒 ${dealData.timings}</p>` : ""}
  `;

  const snapshot = await getDocs(collection(db, "deals", dealId, "products"));

  modalProducts.innerHTML = "";

  if (snapshot.empty) {
    modalProducts.innerHTML = "<p>No products available.</p>";
    return;
  }

  snapshot.forEach((docSnap) => {
    const p = docSnap.data();

    const productDiv = document.createElement("div");
    productDiv.className = "product-card";

    productDiv.innerHTML = `
      <h4>${p.name || ""}</h4>
      <p>
        <del>₹${p.OriginalPrice || 0}</del>
        <strong> ₹${p.OfferPrice || 0}</strong>
        <strong style="color:green;"> ${p.discount || ""}</strong>
      </p>
      <div class="rating-stars" data-product="${docSnap.id}">
        ${generateStars(p.rating || 0)}
      </div>

      ${
        isSurprise
          ? `<button class="directions-btn"
              data-lat="${dealData?.lat || ""}"
              data-lng="${dealData?.lng || ""}">
              Get Directions
            </button>`
          : ""
      }
    `;

    modalProducts.appendChild(productDiv);
  });

  enableRating(dealId);
}

function generateStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += `<span data-star="${i}" class="${i <= rating ? "active" : ""}">★</span>`;
  }
  return stars;
}

function enableRating(dealId) {
  document.querySelectorAll(".rating-stars").forEach((container) => {
    container.onclick = async (e) => {
      if (!e.target.dataset.star) return;

      const rating = Number(e.target.dataset.star);
      const productId = container.dataset.product;

      await updateDoc(doc(db, "deals", dealId, "products", productId), {
        rating,
      });

      container.innerHTML = generateStars(rating);
    };
  });
}

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("directions-btn")) return;

  const lat = e.target.dataset.lat;
  const lng = e.target.dataset.lng;

  if (!lat || !lng) return;

  // 🔥 ADD POINTS IF USER IS LOGGED IN
  const user = auth.currentUser;

  if (user) {
    const userRef = doc(db, "users", user.uid);

    await updateDoc(userRef, {
      points: increment(2),
    });

    // Update UI instantly
    const currentPoints = Number(
      document.getElementById("profile-points").innerText,
    );

    document.getElementById("profile-points").innerText = currentPoints + 2;
  }

  let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  if (userLat && userLng) {
    url += `&origin=${userLat},${userLng}&travelmode=walking`;
  }

  window.open(url, "_blank");
});

function startTimers() {
  document.querySelectorAll(".deal-timer").forEach((timer) => {
    let totalSeconds = parseInt(timer.dataset.minutes || 60) * 60;

    const interval = setInterval(() => {
      if (totalSeconds <= 0) {
        timer.innerText = "⏳ Expired";
        clearInterval(interval);
        return;
      }

      totalSeconds--;
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;

      timer.innerText = `${mins}:${secs.toString().padStart(2, "0")}`;
    }, 1000);
  });
}
