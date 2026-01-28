// Order of your pages (must match your routes)
const pages = ["index", "om-mig", "erfarenheter", "projekt", "lia", "kontakt"];

const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");

if (!progressBar || !progressText) {
  console.error("Progress elements not found in header");
}

// Get current page from URL
function getCurrentPage() {
  const path = window.location.pathname;

  if (path === "/" || path === "/index") return "index";

  return path.replace("/", "");
}

// Update progress bar
function updateProgress() {
  const currentPage = getCurrentPage();
  const pageIndex = pages.indexOf(currentPage);

  if (pageIndex === -1) return;

  const progress = ((pageIndex + 1) / pages.length) * 100;
  progressBar.style.width = progress + "%";

  if (pageIndex === pages.length - 1) {
    progressText.textContent = "✅ Utforskat klart – kontakta mig!";
  } else {
    progressText.textContent = `Utforska mer (${pageIndex + 1}/${pages.length})`;
  }
}

// Run on load
updateProgress();
