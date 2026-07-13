import { db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const contactForm = document.getElementById("contactForm");
const contactMessage = document.getElementById("contactMessage");

const LOCAL_KEY = 'contactMessagesLocal';

function showContactMessage(text, success = true) {
  if (!contactMessage) return;
  contactMessage.textContent = text;
  contactMessage.className = `form-message ${success ? 'success' : 'error'}`;
}

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const payload = {
      name: formData.get("name")?.toString().trim() || "",
      email: formData.get("email")?.toString().trim() || "",
      phone: formData.get("phone")?.toString().trim() || "",
      topic: formData.get("topic")?.toString().trim() || "",
      message: formData.get("message")?.toString().trim() || "",
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "contactMessages"), payload);
      // also try to sync any locally saved messages
      await syncLocalContactMessages();
      showContactMessage("✅ Your message has been sent successfully.", true);
      contactForm.reset();
    } catch (error) {
      console.error("Contact form submit error:", error);
      // Save locally as a fallback so messages aren't lost
      try {
        const stored = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
        stored.push(payload);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(stored));
        showContactMessage("⚠️ Message saved locally and will be sent when online.", true);
        contactForm.reset();
      } catch (e) {
        console.error('Failed to save locally', e);
        showContactMessage("❌ Failed to send message. Please try again later.", false);
      }
    }
  });
}

async function syncLocalContactMessages() {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    if (!stored.length) return;
    const remaining = [];
    for (const msg of stored) {
      try {
        await addDoc(collection(db, "contactMessages"), msg);
      } catch (e) {
        console.warn('Failed to sync local contact message, keeping local copy.', e);
        remaining.push(msg);
      }
    }
    if (remaining.length) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(LOCAL_KEY);
    }
  } catch (e) {
    console.error('syncLocalContactMessages error', e);
  }
}

// Attempt to sync when the script loads and when back online
syncLocalContactMessages();
window.addEventListener('online', () => syncLocalContactMessages());
