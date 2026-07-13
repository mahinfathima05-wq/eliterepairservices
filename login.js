import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Already logged in
if (localStorage.getItem("adminLoggedIn") === "true") {
    window.location.href = "dashboard.html";
}

const loginForm =
document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
    document.getElementById("email").value;

    const password =
    document.getElementById("password").value;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        localStorage.setItem(
            "adminLoggedIn",
            "true"
        );

        window.location.href =
        "dashboard.html";

    } catch (error) {

        console.error(error);

        document.getElementById("error")
        .textContent =
        "Invalid Email or Password";

    }

});