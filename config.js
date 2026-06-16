const APP_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyT9JayTrgqZnCu_0yIV9GhBEb9UNvfNhCFWM7TDziiqCbYwKiOLZ3mIoGXmiN4RqHd/exec",
  CURRENCY_SYMBOL: "₹",
  DRAFT_KEY: "expense_world_unsaved_draft",
  PASSWORD_KEY: "expense_world_password",
  DEFAULT_CATEGORY: "Other"
};

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function showElement(element) {
  if (!element) return;
  element.classList.remove("hidden");
}

function hideElement(element) {
  if (!element) return;
  element.classList.add("hidden");
}

function showToast(message, type = "default") {
  const toast = document.getElementById("toast");
  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.remove("hidden");

  if (type === "success") toast.style.backgroundColor = "#1F8A70";
  else if (type === "error") toast.style.backgroundColor = "#D6483B";
  else if (type === "warning") toast.style.backgroundColor = "#F2542D";
  else toast.style.backgroundColor = "#1E2A26";

  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 3000);
}

function formatMoney(value) {
  const number = Number(value);
  if (Number.isNaN(number) || !Number.isFinite(number)) {
    return APP_CONFIG.CURRENCY_SYMBOL + "0";
  }

  return APP_CONFIG.CURRENCY_SYMBOL + number.toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function formatDateForDisplay(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getTodayInputDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isNaN(number) || !Number.isFinite(number) ? 0 : number;
}

function animateMoneyCount(selectorOrElement, finalValue, duration = 500) {
  const element =
    typeof selectorOrElement === "string"
      ? document.querySelector(selectorOrElement)
      : selectorOrElement;

  if (!element) return;

  const target = safeNumber(finalValue);
  const startTime = performance.now();

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const currentValue = Math.round(target * progress);

    element.textContent = formatMoney(currentValue);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatMoney(target);
    }
  }

  requestAnimationFrame(update);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createListRow(label, value) {
  const row = document.createElement("div");
  row.className = "list-row";

  row.innerHTML = `
    <span class="label">${escapeHtml(label)}</span>
    <span class="value">${escapeHtml(value)}</span>
  `;

  return row;
}

function setEmptyMessage(container, message) {
  if (!container) return;

  container.innerHTML = `
    <p class="empty-message">${escapeHtml(message)}</p>
  `;
}

function setButtonLoading(button, isLoading, loadingText = "Please wait...") {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    button.style.opacity = "0.7";
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.style.opacity = "1";
  }
}

function initScrollTopButton() {
  const scrollBtn = document.getElementById("scrollTopBtn");
  if (!scrollBtn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 350) {
      scrollBtn.classList.remove("hidden");
      scrollBtn.classList.add("show");
    } else {
      scrollBtn.classList.remove("show");

      setTimeout(() => {
        if (window.scrollY <= 350) {
          scrollBtn.classList.add("hidden");
        }
      }, 300);
    }
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initScrollTopButton();
});
function initCalculator() {
  const fab = document.getElementById("calculatorFab");
  const modal = document.getElementById("calculatorModal");
  const closeBtn = document.getElementById("calculatorCloseBtn");
  const display = document.getElementById("calculatorDisplay");
  const buttons = document.querySelectorAll("[data-calc]");

  if (!fab || !modal || !display) return;

  let expression = "";

  fab.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.calc;

      if (value === "C") {
        expression = "";
        display.value = "0";
        return;
      }

      if (value === "DEL") {
        expression = expression.slice(0, -1);
        display.value = expression || "0";
        return;
      }

      if (value === "=") {
        try {
          expression = String(Function("return " + expression)());
          display.value = expression;
        } catch {
          display.value = "Error";
          expression = "";
        }
        return;
      }

      expression += value;
      display.value = expression;
    });
  });
}

document.addEventListener("DOMContentLoaded", initCalculator);


function initQuickTabs() {
  const HEADER_OFFSET = 78; // tab/header height adjust
  const tabs = document.querySelectorAll(".quick-tabs button");
  const sections = document.querySelectorAll("main section");

  function setActiveTab(sectionId) {
    tabs.forEach(function (tab) {
      tab.classList.remove("active");

      if (tab.dataset.target === sectionId) {
        tab.classList.add("active");
      }
    });
  }

  tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const targetId = btn.dataset.target;
      const section = document.getElementById(targetId);

      if (!section) return;

      setActiveTab(targetId);

      const y = section.offsetTop - HEADER_OFFSET;

      window.scrollTo({
        top: y,
        behavior: "smooth"
      });
    });
  });

  window.addEventListener("scroll", function () {
    let currentSection = "";

    sections.forEach(function (section) {
      const sectionTop = section.offsetTop - HEADER_OFFSET - 20;

      if (window.scrollY >= sectionTop) {
        currentSection = section.id;
      }
    });

    if (currentSection) {
      setActiveTab(currentSection);
    }
  });

  if (tabs.length > 0) {
    tabs[0].classList.add("active");
  }
}

document.addEventListener("DOMContentLoaded", initQuickTabs);