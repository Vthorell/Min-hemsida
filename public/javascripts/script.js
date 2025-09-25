const hamburgerBtn = document.getElementById("hamburgerBtn");
const fullscreenMenu = document.getElementById("fullscreenMenu");
const closeBtn = document.getElementById("closeBtn");

hamburgerBtn.addEventListener("click", () => {
  fullscreenMenu.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
  fullscreenMenu.classList.add("hidden");
});

const img = document.getElementById("signImg");
const bubble = document.getElementById("bubble");

if (img && bubble) {
  img.addEventListener("click", () => {
    bubble.classList.toggle("show");
  });
}

