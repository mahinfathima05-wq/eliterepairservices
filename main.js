// ================================
// Mobile Menu
// ================================

function toggleMenu() {
    document.getElementById("navMenu").classList.toggle("active");
}

window.toggleMenu = toggleMenu;

// ================================
// Hero Slider
// ================================

const hero = document.querySelector(".hero");

const images = [

    "images/hero1.jpg",

    "images/hero2.jpg",

    "images/hero3.jpg"

];

let current = 0;

function changeHero() {

    hero.style.background =
        `linear-gradient(rgba(15,23,42,.75),rgba(15,23,42,.75)),
        url('${images[current]}') center/cover`;

    current++;

    if(current >= images.length){

        current = 0;

    }

}

setInterval(changeHero,4000);

changeHero();

// ================================
// Scroll Button
// ================================

const topBtn = document.getElementById("topBtn");

window.onscroll = function(){

    if(document.body.scrollTop > 300 ||
       document.documentElement.scrollTop > 300){

        topBtn.style.display="block";

    }

    else{

        topBtn.style.display="none";

    }

}

function topFunction(){

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

}

window.topFunction = topFunction;