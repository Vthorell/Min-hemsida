// ================= HAMBURGER MENU =================
const hamburgerBtn = document.getElementById("hamburgerBtn");
const fullscreenMenu = document.getElementById("fullscreenMenu");
const closeBtn = document.getElementById("closeBtn");

if (fullscreenMenu) {
  fullscreenMenu.classList.add("hidden");
}

if (hamburgerBtn && fullscreenMenu) {
  hamburgerBtn.addEventListener("click", () => {
    fullscreenMenu.classList.remove("hidden");
  });
}

if (closeBtn && fullscreenMenu) {
  closeBtn.addEventListener("click", () => {
    fullscreenMenu.classList.add("hidden");
  });
}


// ================= DARK MODE =================
// ================= DARK MODE (med minne + ikon) =================
const darkModeBtn = document.getElementById("darkModeBtn");

// kolla om darkmode redan är sparat
if (localStorage.getItem("darkmode") === "on") {
  document.body.classList.add("dark");
  document.documentElement.classList.add("dark");
  darkModeBtn.innerHTML = "☀️"; // rätt ikon vid start
} else {
  darkModeBtn.innerHTML = "🌙";
}

if (darkModeBtn) {
  darkModeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    document.documentElement.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    // spara läge
    localStorage.setItem("darkmode", isDark ? "on" : "off");

    // byt ikon
    darkModeBtn.innerHTML = isDark ? "☀️" : "🌙";
  });
}




// ================= SPEECH BUBBLE =================
const signImg = document.getElementById("signImg");
const bubble = document.getElementById("bubble");

if (signImg && bubble) {
  signImg.addEventListener("click", () => {
    bubble.classList.toggle("show");
  });
}
