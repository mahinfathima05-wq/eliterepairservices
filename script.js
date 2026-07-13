// Protect dashboard
if (localStorage.getItem("adminLoggedIn") !== "true") {
    window.location.href = "login.html";
}

// Show today's date
document.getElementById("todayDate").textContent =
new Date().toLocaleDateString();

// Load bookings
let bookings =
JSON.parse(localStorage.getItem("bookings")) || [];

document.getElementById("bookingCount").textContent =
bookings.length;

// Display bookings
let bookingsHTML = "";

bookings.forEach((booking, index) => {

    bookingsHTML += `
    <div class="card" style="margin:20px 0;">
        <h3>Booking ${index + 1}</h3>

        <p><strong>Name:</strong> ${booking.name}</p>

        <p><strong>Phone:</strong> ${booking.phone}</p>

        <p><strong>Appliance:</strong> ${booking.appliance}</p>

        <p><strong>Problem:</strong> ${booking.problem}</p>

        <p><strong>Date:</strong> ${booking.date}</p>
    </div>
    `;
});

document.getElementById("bookingsData").innerHTML =
bookingsHTML;

// Logout button
document.getElementById("logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUsername");

    window.location.href = "login.html";
});