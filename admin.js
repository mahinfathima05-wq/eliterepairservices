import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db, auth } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.getElementById("todayDate").textContent = new Date().toLocaleDateString();

const tbody = document.getElementById("bookingTableBody");
const bookingCount = document.getElementById("bookingCount");
const pendingCount = document.getElementById("pendingCount");
const completedCount = document.getElementById("completedCount");
const customerCount = document.getElementById("customerCount");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const contactSearchInput = document.getElementById("contactSearchInput");
const modal = document.getElementById("bookingModal");
const modalBody = document.getElementById("bookingModalBody");
const closeButtons = document.querySelectorAll(".close");
const rentRequestTableBody = document.getElementById("rentRequestTableBody");
const sellRequestTableBody = document.getElementById("sellRequestTableBody");
const contactMessageTableBody = document.getElementById("contactMessageTableBody");
const customerTableBody = document.getElementById("customerTableBody");

let allBookings = [];

function renderRows() {
  const searchTerm = searchInput.value.toLowerCase();
  const filterValue = statusFilter.value;

  tbody.innerHTML = "";

  const filteredBookings = allBookings.filter((booking) => {
    const matchesSearch = `${booking.name || ""} ${booking.phone || ""} ${booking.bookingId || ""} ${booking.service || ""}`.toLowerCase().includes(searchTerm);
    const matchesStatus = filterValue === "All" || booking.status === filterValue;
    return matchesSearch && matchesStatus;
  });

  filteredBookings.forEach((booking) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${booking.bookingId || "-"}</td>
      <td>${booking.name || "-"}</td>
      <td>${booking.phone || "-"}</td>
      <td>${booking.service || "-"}</td>
      <td>${booking.serviceDate || "-"}</td>
      <td>${booking.serviceTime || "-"}</td>
      <td><span class="${booking.status === "Completed" ? "completed" : "pending"}">${booking.status || "Pending"}</span></td>
      <td>
        <button class="view-btn" onclick="viewBooking('${booking.id}')">View</button>
        <button class="complete-btn" onclick="completeBooking('${booking.id}')">Complete</button>
        <button class="delete-btn" onclick="deleteBooking('${booking.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateSummary(snapshot) {
  const bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const pending = bookings.filter((booking) => booking.status !== "Completed").length;
  const completed = bookings.filter((booking) => booking.status === "Completed").length;

  bookingCount.textContent = bookings.length;
  pendingCount.textContent = pending;
  completedCount.textContent = completed;
  customerCount.textContent = bookings.length;
  allBookings = bookings;
  renderRows();
}

let contactMessages = [];

function renderContactMessages(messages) {
  contactMessageTableBody.innerHTML = "";
  const contactList = document.getElementById('contactMessageList');
  if (contactList) contactList.innerHTML = '';

  if (!messages.length) {
    contactMessageTableBody.innerHTML = '<tr><td colspan="6">No contact messages yet.</td></tr>';
    if (contactList) contactList.innerHTML = '<div class="contact-card">No contact messages yet.</div>';
    return;
  }

  messages.forEach((message) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${message.name || "-"}</td>
      <td>${message.email || "-"}</td>
      <td>${message.phone || "-"}</td>
      <td>${message.topic || "-"}</td>
      <td>${message.message || "-"}</td>
      <td>${message.createdAt || "-"}</td>
    `;
    contactMessageTableBody.appendChild(row);

    if (contactList) {
      const card = document.createElement('div');
      card.className = 'contact-card';
      card.innerHTML = `
        <h4>${message.name || '-'}</h4>
        <p class="meta">${message.topic || ''} • ${message.createdAt || ''}</p>
        <p>${message.message || '-'}</p>
        <p class="meta">Email: ${message.email || '-'} • Phone: ${message.phone || '-'}</p>
      `;
      contactList.appendChild(card);
    }
  });
}

function filterContactMessages() {
  const searchTerm = contactSearchInput.value.toLowerCase();
  const filtered = contactMessages.filter((message) => {
    return `${message.name || ""} ${message.email || ""} ${message.phone || ""} ${message.topic || ""} ${message.message || ""}`.toLowerCase().includes(searchTerm);
  });
  renderContactMessages(filtered);
}

async function loadContactMessages() {
  contactMessageTableBody.innerHTML = "";
  const contactCount = document.getElementById("contactCount");

  try {
    const snapshot = await getDocs(collection(db, "contactMessages"));
    contactMessages = [];

    snapshot.forEach((docSnap) => {
      contactMessages.push({ id: docSnap.id, ...docSnap.data() });
    });

    // merge any locally saved contact messages from the client
    try {
      const local = JSON.parse(localStorage.getItem('contactMessagesLocal') || '[]');
      if (local && local.length) {
        // mark local entries so admin can see which are pending sync
        const mapped = local.map((m, idx) => ({ _local: true, id: `local-${idx}-${m.createdAt || ''}`, ...m }));
        contactMessages = [...mapped, ...contactMessages];
      }
    } catch (e) {
      console.warn('Failed to read local contact messages', e);
    }

    if (contactCount) {
      contactCount.textContent = contactMessages.length;
    }

    renderContactMessages(contactMessages);
  } catch (e) {
    console.warn("Could not fetch contactMessages from Firestore:", e);
    // fallback to local only
    try {
      const local = JSON.parse(localStorage.getItem('contactMessagesLocal') || '[]');
      contactMessages = local.map((m, idx) => ({ _local: true, id: `local-${idx}-${m.createdAt || ''}`, ...m }));
      if (contactCount) contactCount.textContent = contactMessages.length;
      renderContactMessages(contactMessages);
    } catch (err) {
      console.warn('No local contact messages available', err);
      contactMessageTableBody.innerHTML = '<tr><td colspan="6">Unable to load contact messages.</td></tr>';
    }
  }
}

function loadBookings() {
  onSnapshot(collection(db, "bookings"), (snapshot) => {
    updateSummary(snapshot);
  });
}
async function loadCustomers() {

  const snapshot = await getDocs(collection(db, "bookings"));

  const customers = {};

  snapshot.forEach((docSnap) => {

    const booking = docSnap.data();
    const phone = booking.phone;

    if (!customers[phone]) {

      customers[phone] = {
        name: booking.name || "-",
        phone: booking.phone || "-",
        email: booking.email || "-",
        total: 1
      };

    } else {

      customers[phone].total++;

    }

  });

  customerTableBody.innerHTML = "";

  Object.values(customers).forEach((customer) => {

    customerTableBody.innerHTML += `
      <tr>
        <td>${customer.name}</td>
        <td>${customer.phone}</td>
        <td>${customer.email}</td>
        <td>${customer.total}</td>
      </tr>
    `;

  });

}

function loadRentRequests() {
  const storedRequests = JSON.parse(localStorage.getItem("rentRequests") || "[]");
  const storedOrders = JSON.parse(localStorage.getItem("rentOrders") || "[]");
  const requests = [...storedRequests, ...storedOrders];
  rentRequestTableBody.innerHTML = "";

  if (!requests.length) {
    rentRequestTableBody.innerHTML = '<tr><td colspan="6">No rental requests yet.</td></tr>';
    return;
  }

  requests.forEach((request) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${request.name || "-"}</td>
      <td>${request.phone || "-"}</td>
      <td>${request.email || "-"}</td>
      <td>${request.duration || "-"}</td>
      <td>${request.details || "-"}</td>
      <td>${request.createdAt || "-"}</td>
    `;
    rentRequestTableBody.appendChild(row);
  });
}

function loadSellRequests() {
  (async () => {
    sellRequestTableBody.innerHTML = "";

    // Load from Firestore (if available)
    const requests = [];
    try {
      const snapshot = await getDocs(collection(db, "sellRequests"));
      snapshot.forEach((docSnap) => requests.push({ id: docSnap.id, ...docSnap.data() }));
    } catch (e) {
      console.warn("Could not fetch sellRequests from Firestore:", e);
    }

    // Load local fallback entries
    const local = JSON.parse(localStorage.getItem("sellRequests") || "[]");

    const merged = [...local.map((r) => ({ ...r, _local: true })), ...requests];

    if (!merged.length) {
      sellRequestTableBody.innerHTML = '<tr><td colspan="7">No sell requests yet.</td></tr>';
      return;
    }

    merged.forEach((request) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${request.name || "-"}</td>
        <td>${request.phone || "-"}</td>
        <td>${request.email || "-"}</td>
        <td>${request.appliance || "-"}</td>
        <td>${request.price || "-"}</td>
        <td>${request.condition || "-"}</td>
        <td>${request.createdAt || "-"}${request._local ? ' <em>(local)</em>' : ''}</td>
      `;
      sellRequestTableBody.appendChild(row);
    });
  })();
}

window.completeBooking = async function (id) {
  const bookingRef = doc(db, "bookings", id);
  await updateDoc(bookingRef, {
    status: "Completed",
    completedAt: new Date().toLocaleString()
  });
};

window.deleteBooking = async function (id) {
  if (!confirm("Are you sure you want to delete this booking?")) return;
  const bookingRef = doc(db, "bookings", id);
  await deleteDoc(bookingRef);
};

window.viewBooking = async function (id) {
  const bookingRef = doc(db, "bookings", id);
  const bookingSnap = await getDoc(bookingRef);
  if (!bookingSnap.exists()) return;

  const booking = bookingSnap.data();
  modalBody.innerHTML = `
    <p><strong>Booking ID:</strong> ${booking.bookingId || "-"}</p>
    <p><strong>Name:</strong> ${booking.name || "-"}</p>
    <p><strong>Phone:</strong> ${booking.phone || "-"}</p>
    <p><strong>Email:</strong> ${booking.email || "-"}</p>
    <p><strong>Address:</strong> ${booking.address || "-"}</p>
    <p><strong>Service:</strong> ${booking.service || "-"}</p>
    <p><strong>Problem:</strong> ${booking.problem || "-"}</p>
    <p><strong>Preferred Date:</strong> ${booking.serviceDate || "-"}</p>
    <p><strong>Preferred Time:</strong> ${booking.serviceTime || "-"}</p>
    <p><strong>Status:</strong> ${booking.status || "Pending"}</p>
    <p><strong>Booked On:</strong> ${booking.bookingDate || "-"}</p>
  `;
  modal.style.display = "block";
};

searchInput.addEventListener("keyup", renderRows);
statusFilter.addEventListener("change", renderRows);
if (contactSearchInput) {
  contactSearchInput.addEventListener("keyup", filterContactMessages);
}

closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    modal.style.display = "none";
  });
});

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

loadBookings();
loadCustomers();
loadRentRequests();
loadSellRequests();
loadContactMessages();

// Show / hide sections from sidebar
window.showSection = function (sectionId) {
  const sections = [
    "dashboardSection",
    "bookingsSection",
    "customersSection",
    "sellSection",
    "rentSection",
    "contactSection",
    "settingsSection"
  ];

  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = id === sectionId ? "block" : "none";
  });

  // scroll the shown section into view (account for topbar)
  const target = document.getElementById(sectionId);
  if (target) {
    const topbar = document.querySelector('.topbar');
    const offset = topbar ? topbar.offsetHeight + 12 : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  // toggle active class on sidebar
  const links = document.querySelectorAll('.sidebar ul li');
  links.forEach((li) => {
    li.classList.remove('active');
    const a = li.querySelector('a');
    if (a && a.getAttribute('onclick') && a.getAttribute('onclick').includes(sectionId)) {
      li.classList.add('active');
    }
  });
};

// Logout handler (tries Firebase auth signOut if available, otherwise redirects)
window.logoutUser = async function () {
  console.log('logoutUser called');
  try {
    if (typeof signOut === 'function' && auth) {
      await signOut(auth);
      console.log('Firebase signOut succeeded');
    } else {
      console.log('Firebase signOut not available, proceeding to local cleanup');
    }
  } catch (e) {
    console.error('Sign out error:', e);
  }
  // attempt to clear common auth/session keys
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('adminSettings');
  } catch (e) {
    console.warn('localStorage cleanup failed', e);
  }
  // force navigation
  window.location.assign('login.html');
};

// wire top and sidebar logout buttons
const topLogout = document.getElementById('logoutBtn');
const sidebarLogout = document.getElementById('sidebarLogoutBtn');
if (topLogout) topLogout.addEventListener('click', (e) => { e.preventDefault(); logoutUser(); });
if (sidebarLogout) sidebarLogout.addEventListener('click', (e) => { e.preventDefault(); logoutUser(); });