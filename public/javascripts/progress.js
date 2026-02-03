// Order of your pages (must match your routes)
const pages = ["index", "om-mig", "erfarenheter", "projekt", "lia", "kontakt"];

const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");

if (!progressBar || !progressText) {
  console.warn("Progress elements not found in header");
} else {
  // Get current page from URL
  function getCurrentPage() {
    const path = window.location.pathname;

    if (path === "/" || path === "/index") {
      return "index";
    }

    return path.replace(/^\/|\/$/g, "");
  }

  // Update progress bar
  function updateProgress() {
    const currentPage = getCurrentPage();
    const pageIndex = pages.indexOf(currentPage);

    if (pageIndex === -1) {
      progressBar.style.width = "0%";
      progressBar.setAttribute("aria-valuenow", "0");
      progressText.textContent = "Utforska mer";
      return;
    }

    const progress = ((pageIndex + 1) / pages.length) * 100;
    const roundedProgress = Math.round(progress);
    progressBar.style.width = progress + "%";
    progressBar.setAttribute("aria-valuenow", String(roundedProgress));

    if (pageIndex === pages.length - 1) {
      progressText.textContent = "✅ Utforskat klart – kontakta mig!";
    } else {
      progressText.textContent = `Utforska mer (${pageIndex + 1}/${pages.length})`;
    }
  }

  // Run on load
  updateProgress();
}
