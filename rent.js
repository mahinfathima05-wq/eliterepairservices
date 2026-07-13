import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const rentalsContainer = document.getElementById("rentalsContainer");
const rentSearch = document.getElementById("rentSearch");
const rentSort = document.getElementById("rentSort");
const rentFilter = document.getElementById("rentFilter");
const rentCategoryBar = document.getElementById("rentCategoryBar");
const rentModal = document.getElementById("rentModal");
const closeRentModal = document.getElementById("closeRentModal");
const rentForm = document.getElementById("rentForm");

let rentals = [];
let categoryFilter = 'all';

function renderRentals() {
  const searchTerm = rentSearch.value.toLowerCase();
  const filterValue = rentFilter.value;

    const filteredRentals = rentals.filter((item) => {
    const matchesSearch = `${item.name || ""} ${item.brand || ""} ${item.category || ""}`.toLowerCase().includes(searchTerm);
    const matchesFilter = filterValue === "all" || item.status === filterValue;
    const matchesCategory = categoryFilter === "all" || (item.category || "").toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesFilter && matchesCategory;
  });

  const sortedRentals = filteredRentals.slice();
  if (rentSort.value === 'priceLow') {
    sortedRentals.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (rentSort.value === 'priceHigh') {
    sortedRentals.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (rentSort.value === 'available') {
    sortedRentals.sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'Available' ? -1 : 1;
    });
  }

  if (!filteredRentals.length) {
    rentalsContainer.innerHTML = '<p class="empty-state">No rentals match your search right now.</p>';
    return;
  }

  rentalsContainer.innerHTML = sortedRentals.map((item) => `
    <article class="rental-card">
      <div class="rental-image">
        <img src="${item.image || 'images/hero.jpg'}" alt="${item.name || 'Rental appliance'}">
        <span class="category-tag">${item.category || 'General'}</span>
      </div>
      <div class="rental-info">
        <h3>${item.name || "Rental Appliance"}</h3>
        <p class="rent-brand">${item.brand || "Premium Brand"}</p>
        <p>${item.description || "Reliable appliance for short-term use."}</p>
        <div class="rent-meta">
          <span class="price">₹${item.price || 0}/month</span>
          <span class="status ${item.status === 'Booked' ? 'booked' : 'available'}">${item.status || 'Available'}</span>
        </div>
        <div class="rental-details">
          <span>Capacity: ${item.capacity || 'N/A'}</span>
          <span>Condition: ${item.condition || 'Good'}</span>
        </div>
        <button class="rent-btn" type="button" data-id="${item.id}">Rent Now</button>
      </div>
    </article>
  `).join('');

  document.querySelectorAll('.rent-btn').forEach((button) => {
    button.addEventListener('click', (ev) => {
      const id = ev.currentTarget.getAttribute('data-id');
      const selected = rentals.find(r => r.id === id) || {};
      openRentModal(selected);
    });
  });

  // Make image or card click open modal and prefill
  document.querySelectorAll('.rental-card img, .rental-card .rental-info h3').forEach((el, idx) => {
    el.addEventListener('click', () => {
      const item = filteredRentals[idx];
      if (!item) return;
      openRentModal(item);
    });
  });
}

async function loadRentals() {
  try {
    const snapshot = await getDocs(collection(db, "rentals"));
    rentals = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderRentals();
  } catch (error) {
    console.error(error);
    rentalsContainer.innerHTML = '<p class="empty-state">Unable to load rentals right now.</p>';
  }
}

function openRentModal(item) {
  const applianceInput = document.getElementById('selectedAppliance');
  const priceInput = document.getElementById('selectedPrice');
  if (applianceInput) applianceInput.value = item.name || '';
  if (priceInput) priceInput.value = item.price ? `₹${item.price}/month` : '';
  rentModal.classList.add('active');
  rentModal.setAttribute('aria-hidden', 'false');
}

rentSearch.addEventListener('input', renderRentals);
rentSort.addEventListener('change', renderRentals);
rentFilter.addEventListener('change', renderRentals);

closeRentModal.addEventListener('click', () => {
  rentModal.classList.remove('active');
  rentModal.setAttribute('aria-hidden', 'true');
});

rentModal.addEventListener('click', (event) => {
  if (event.target === rentModal) {
    rentModal.classList.remove('active');
    rentModal.setAttribute('aria-hidden', 'true');
  }
});

rentForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const request = {
    name: rentForm[0].value.trim(),
    phone: rentForm[1].value.trim(),
    email: rentForm[2].value.trim(),
    duration: rentForm[3].value.trim(),
    details: rentForm[4].value.trim(),
    createdAt: new Date().toLocaleString()
  };

  const existingRequests = JSON.parse(localStorage.getItem('rentRequests') || '[]');
  existingRequests.push(request);
  localStorage.setItem('rentRequests', JSON.stringify(existingRequests));

  // Attempt to sync immediately, but keep saved locally if offline/fails
  (async () => {
    try {
      await syncLocalRentRequests();
    } catch (e) {
      console.warn('Immediate sync failed', e);
    }
  })();

  alert('Your rental request has been received. We will contact you soon.');
  rentForm.reset();
  rentModal.classList.remove('active');
  rentModal.setAttribute('aria-hidden', 'true');
});

loadRentals();

if (rentCategoryBar) {
  rentCategoryBar.addEventListener('click', (event) => {
    const button = event.target.closest('.category-chip');
    if (!button) return;
    document.querySelectorAll('.category-chip').forEach((chip) => chip.classList.remove('active'));
    button.classList.add('active');
    categoryFilter = button.dataset.category || 'all';
    renderRentals();
  });
}

// Sync any saved local rent requests to Firestore
async function syncLocalRentRequests() {
  const key = 'rentRequests';
  const stored = JSON.parse(localStorage.getItem(key) || '[]');
  if (!stored.length) return;

  const remaining = [];
  for (const req of stored) {
    try {
      await addDoc(collection(db, 'rentRequests'), req);
    } catch (e) {
      console.warn('Failed to sync rent request to Firestore', e);
      remaining.push(req);
    }
  }

  if (remaining.length) {
    localStorage.setItem(key, JSON.stringify(remaining));
  } else {
    localStorage.removeItem(key);
  }
}

window.addEventListener('online', () => {
  console.info('Browser online — attempting to sync local rent requests');
  syncLocalRentRequests();
});