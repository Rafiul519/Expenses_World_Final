// ============================================================
// EXPENSE WORLD — dashboard.js
// Clean replacement version
// ============================================================

const dashboardEls = {
  currentActiveBill: document.getElementById("currentActiveBill"),
  lastClearedText: document.getElementById("lastClearedText"),
  personWisePaidList: document.getElementById("personWisePaidList"),
  equalShareAmount: document.getElementById("equalShareAmount"),
  settlementSuggestionList: document.getElementById("settlementSuggestionList"),
  dailyAverage: document.getElementById("dailyAverage"),
  weeklyAverage: document.getElementById("weeklyAverage"),
  monthlyAverage: document.getElementById("monthlyAverage"),
  refreshBtn: document.getElementById("refreshDashboardBtn")
};

function renderLastCleared(clearHistory) {
  if (!dashboardEls.lastClearedText) return;

  if (!Array.isArray(clearHistory) || clearHistory.length === 0) {
    dashboardEls.lastClearedText.textContent = "Last Cleared: Not cleared yet";
    return;
  }

  const sorted = clearHistory.slice().sort(function (a, b) {
    return new Date(b.ClearDate) - new Date(a.ClearDate);
  });

  dashboardEls.lastClearedText.textContent =
    "Last Cleared: " + formatDateForDisplay(sorted[0].ClearDate);
}

function renderPersonWisePaid(personWisePaid) {
  const container = dashboardEls.personWisePaidList;
  if (!container) return;

  container.innerHTML = "";

  if (!personWisePaid || Object.keys(personWisePaid).length === 0) {
    setEmptyMessage(container, "No active expenses yet.");
    return;
  }

  Object.keys(personWisePaid).forEach(function (person) {
    container.appendChild(
      createListRow(person, formatMoney(personWisePaid[person]))
    );
  });
}

function renderSettlementSuggestions(settlements) {
  const container = dashboardEls.settlementSuggestionList;
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(settlements) || settlements.length === 0) {
    setEmptyMessage(container, "All settled up!");
    return;
  }

  settlements.forEach(function (settlement) {
    const fromName = settlement.from || settlement.From || settlement.payFrom || "Unknown";
    const toName = settlement.to || settlement.To || settlement.payTo || "Unknown";
    const amount = settlement.amount || settlement.Amount || settlement.payAmount || 0;

    container.appendChild(
      createListRow(fromName + " → " + toName, formatMoney(amount))
    );
  });
}

function renderAverages(averages) {
  averages = averages || {};

  if (dashboardEls.dailyAverage) {
    dashboardEls.dailyAverage.textContent = formatMoney(averages.daily || 0);
  }

  if (dashboardEls.weeklyAverage) {
    dashboardEls.weeklyAverage.textContent = formatMoney(averages.weekly || 0);
  }

  if (dashboardEls.monthlyAverage) {
    dashboardEls.monthlyAverage.textContent = formatMoney(averages.monthly || 0);
  }
}

function renderDashboard(summary, clearHistory) {
  summary = summary || {};

  const totalActive = summary.totalActive || 0;

  if (dashboardEls.currentActiveBill) {
    animateMoneyCount(dashboardEls.currentActiveBill, totalActive);
  }

  if (dashboardEls.equalShareAmount) {
    dashboardEls.equalShareAmount.textContent = formatMoney(summary.equalShare || 0);
  }

  renderLastCleared(clearHistory || []);
  renderPersonWisePaid(summary.personWisePaid || {});
  renderSettlementSuggestions(summary.settlements || []);
  renderAverages(summary.averages || {});
}

function renderDashboardLoading() {
  if (dashboardEls.currentActiveBill) dashboardEls.currentActiveBill.textContent = "...";
  if (dashboardEls.lastClearedText) dashboardEls.lastClearedText.textContent = "Last Cleared: Loading...";
  if (dashboardEls.equalShareAmount) dashboardEls.equalShareAmount.textContent = "...";
  if (dashboardEls.dailyAverage) dashboardEls.dailyAverage.textContent = "...";
  if (dashboardEls.weeklyAverage) dashboardEls.weeklyAverage.textContent = "...";
  if (dashboardEls.monthlyAverage) dashboardEls.monthlyAverage.textContent = "...";

  setEmptyMessage(dashboardEls.personWisePaidList, "Loading paid amounts...");
  setEmptyMessage(dashboardEls.settlementSuggestionList, "Loading settlement...");
}

async function loadDashboard() {
  try {
    renderDashboardLoading();
    setButtonLoading(dashboardEls.refreshBtn, true, "Refreshing...");

    const summary = await api.getSummary();
    const clearHistory = await api.getClearHistory();

    renderDashboard(summary, clearHistory);
  } catch (error) {
    console.error("Dashboard load failed:", error);

    if (dashboardEls.currentActiveBill) {
      dashboardEls.currentActiveBill.textContent = formatMoney(0);
    }

    if (dashboardEls.lastClearedText) {
      dashboardEls.lastClearedText.textContent = "Last Cleared: Unable to load";
    }

    setEmptyMessage(dashboardEls.personWisePaidList, "Dashboard data could not be loaded.");
    setEmptyMessage(dashboardEls.settlementSuggestionList, "Check API URL or internet.");
  } finally {
    setButtonLoading(dashboardEls.refreshBtn, false);
  }
}

function initDashboard() {
  if (dashboardEls.refreshBtn) {
    dashboardEls.refreshBtn.addEventListener("click", loadDashboard);
  }

  loadDashboard();
}

document.addEventListener("DOMContentLoaded", initDashboard);