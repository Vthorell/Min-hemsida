// ================= HAMBURGER MENU =================
const hamburgerBtn = document.getElementById('hamburgerBtn');
const fullscreenMenu = document.getElementById('fullscreenMenu');
const closeBtn = document.getElementById('closeBtn');

const toggleMenu = (shouldOpen) => {
  if (!(fullscreenMenu && hamburgerBtn)) {
    return;
  }

  if (shouldOpen) {
    fullscreenMenu.classList.remove('hidden');
    fullscreenMenu.setAttribute('aria-hidden', 'false');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    const firstLink = fullscreenMenu.querySelector('a');
    if (firstLink) {
      firstLink.focus();
    }
  } else {
    fullscreenMenu.classList.add('hidden');
    fullscreenMenu.setAttribute('aria-hidden', 'true');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.focus();
  }
};

if (hamburgerBtn && fullscreenMenu) {
  hamburgerBtn.addEventListener('click', () => toggleMenu(true));
}

if (closeBtn && fullscreenMenu) {
  closeBtn.addEventListener('click', () => toggleMenu(false));
}

if (fullscreenMenu) {
  fullscreenMenu.addEventListener('click', (event) => {
    if (event.target.matches('a')) {
      toggleMenu(false);
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && fullscreenMenu && !fullscreenMenu.classList.contains('hidden')) {
    toggleMenu(false);
  }
});

// ================= DARK MODE =================
const darkModeBtn = document.getElementById('darkModeBtn');
const prefersDarkScheme = window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: dark)').matches
  : false;

const safeStorage = (() => {
  try {
    const storage = window.localStorage;
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return storage;
  } catch (_) {
    return null;
  }
})();

const setDarkModeState = (isDark) => {
  document.body.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('dark', isDark);
  if (darkModeBtn) {
    darkModeBtn.textContent = isDark ? '☀️' : '🌙';
    darkModeBtn.setAttribute('aria-pressed', String(isDark));
  }
  if (safeStorage) {
    safeStorage.setItem('darkmode', isDark ? 'on' : 'off');
  }
};

const initializeDarkMode = () => {
  if (!darkModeBtn) {
    return;
  }

  const storedPreference = safeStorage ? safeStorage.getItem('darkmode') : null;
  const shouldEnableDarkMode =
    storedPreference === 'on' || (storedPreference === null && prefersDarkScheme);

  setDarkModeState(shouldEnableDarkMode);

  darkModeBtn.addEventListener('click', () => {
    const currentlyDark = document.body.classList.contains('dark');
    setDarkModeState(!currentlyDark);
  });
};

initializeDarkMode();

// ================= SPEECH BUBBLE =================
const signImg = document.getElementById('signImg');
const bubble = document.getElementById('bubble');

if (signImg && bubble) {
  signImg.addEventListener('click', () => {
    bubble.classList.toggle('show');
  });
}

// ================= FAQ ACCORDION =================
const faqTrigger = document.getElementById('faqAccordionTrigger');
const faqPanel = document.getElementById('faqAccordionPanel');

if (faqTrigger && faqPanel) {
  faqTrigger.addEventListener('click', () => {
    const isOpen = faqTrigger.getAttribute('aria-expanded') === 'true';
    faqTrigger.setAttribute('aria-expanded', !isOpen);
    faqPanel.setAttribute('aria-hidden', isOpen);
    faqPanel.classList.toggle('faq-panel-open', !isOpen);
    faqTrigger.classList.toggle('faq-open', !isOpen);
  });
}
