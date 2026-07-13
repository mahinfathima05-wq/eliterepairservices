// booking.js

import { db } from "./firebase.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.toggleMenu = function () {
  document.getElementById("navMenu").classList.toggle("active");
};

const bookingForm = document.getElementById("bookingForm");
const formMessage = document.getElementById("formMessage");

function showMessage(message, type = "success") {
  if (!formMessage) return;
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const bookingId = `ER${Date.now().toString().slice(-8)}`;
    const photoInput = document.getElementById("photo");
    const photoName = photoInput && photoInput.files[0] ? photoInput.files[0].name : "No photo uploaded";

    const booking = {
      bookingId,
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim(),
      address: document.getElementById("address").value.trim(),
      service: document.getElementById("appliance").value,
      problem: document.getElementById("problem").value.trim(),
      serviceDate: document.getElementById("serviceDate").value,
      serviceTime: document.getElementById("serviceTime").value,
      photoName,
      status: "Pending",
      bookingDate: new Date().toLocaleString()
    };

    try {
      await addDoc(collection(db, "bookings"), booking);

      const savedBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
      savedBookings.push(booking);
      localStorage.setItem("bookings", JSON.stringify(savedBookings));

      showMessage(`Booking submitted successfully. Your booking ID is ${bookingId}.`, "success");
      bookingForm.reset();
    } catch (error) {
      console.error(error);
      showMessage("Unable to submit booking right now. Please try again later.", "error");
    }
  });
}