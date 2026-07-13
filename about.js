/* ===========================
   Animated Counter
=========================== */

const counters = document.querySelectorAll(".counter");

const startCounter = () => {

    counters.forEach(counter => {

        const target = +counter.dataset.target;

        let count = 0;

        const speed = target / 120;

        const updateCounter = () => {

            count += speed;

            if (count < target) {

                counter.innerText = Math.ceil(count).toLocaleString();

                requestAnimationFrame(updateCounter);

            } else {

                counter.innerText = target.toLocaleString() + "+";

            }

        };

        updateCounter();

    });

};

const statsSection = document.querySelector(".stats");

let started = false;

window.addEventListener("scroll", () => {

    if (!started && window.scrollY > statsSection.offsetTop - 500) {

        started = true;

        startCounter();

    }

});