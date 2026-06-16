
// ============================================================
// EXPENSE WORLD — analysis.js
// ------------------------------------------------------------
// Handles Analysis section:
// - Weekly / Monthly / Custom period
// - Category chart
// - Person chart
// - Spend over time chart
// - Top 10 items
// - Special tracking: Fish, Egg, Oil, Rice
// ============================================================

const analysisEls = {
  periodButtons: document.querySelectorAll(".period-btn"),
  customDateRange: document.getElementById("customDateRange"),
  analysisStartDate: document.getElementById("analysisStartDate"),
  analysisEndDate: document.getElementById("analysisEndDate"),
  applyAnalysisBtn: document.getElementById("applyAnalysisBtn"),

  categoryChart: document.getElementById("categoryChart"),
  personChart: document.getElementById("personChart"),
  spendOverTimeChart: document.getElementById("spendOverTimeChart"),

  topItemsList: document.getElementById("topItemsList"),

  trackFish: document.getElementById("trackFish"),
  trackEgg: document.getElementById("trackEgg"),
  trackOil: document.getElementById("trackOil"),
  trackRice: document.getElementById("trackRice")
};

let selectedAnalysisPeriod = "monthly";

let categoryChartInstance = null;
let personChartInstance = null;
let spendOverTimeChartInstance = null;

// ============================================================
// GET ANALYSIS FILTERS
// ============================================================

function getAnalysisFilters() {
  const filters = {
    period: selectedAnalysisPeriod
  };

  if (selectedAnalysisPeriod === "custom") {
    filters.startDate = analysisEls.analysisStartDate.value;
    filters.endDate = analysisEls.analysisEndDate.value;
  }

  return filters;
}

// ============================================================
// LOAD ANALYSIS DATA
// ============================================================

async function loadAnalysis() {
  try {
    setEmptyMessage(analysisEls.topItemsList, "Loading analysis...");

    const filters = getAnalysisFilters();
    const data = await api.getAnalysis(filters);

    renderAnalysis(data);

  } catch (error) {
    console.error("Analysis load failed:", error);
    setEmptyMessage(
      analysisEls.topItemsList,
      "Could not load analysis. Check API URL or internet."
    );
  }
}

// ============================================================
// RENDER FULL ANALYSIS
// ============================================================

function renderAnalysis(data) {
  renderCategoryChart(data.categoryTotals || []);
  renderPersonChart(data.personTotals || []);
  renderSpendOverTimeChart(data.timeTotals || []);
  renderTopItems(data.topItems || []);
  renderSpecialTracking(data.special || {});
}

// ============================================================
// CHART HELPERS
// ============================================================

function destroyChart(chartInstance) {
  if (chartInstance) {
    chartInstance.destroy();
  }
}

function createBarChart(canvas, labels, values, labelText) {
  if (!canvas) return null;

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: labelText,
          data: values
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return formatMoney(context.raw);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return APP_CONFIG.CURRENCY_SYMBOL + value;
            }
          }
        }
      }
    }
  });
}

function createPieChart(canvas, labels, values) {
  if (!canvas) return null;

  return new Chart(canvas, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${formatMoney(context.raw)}`;
            }
          }
        }
      }
    }
  });
}

function createLineChart(canvas, labels, values) {
  if (!canvas) return null;

  return new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Spend",
          data: values,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return formatMoney(context.raw);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return APP_CONFIG.CURRENCY_SYMBOL + value;
            }
          }
        }
      }
    }
  });
}

// ============================================================
// CATEGORY CHART
// ============================================================

function renderCategoryChart(categoryTotals) {
  destroyChart(categoryChartInstance);

  const labels = categoryTotals.map(row => row.category);
  const values = categoryTotals.map(row => row.amount);

  categoryChartInstance = createPieChart(
    analysisEls.categoryChart,
    labels,
    values
  );
}

// ============================================================
// PERSON CHART
// ============================================================

function renderPersonChart(personTotals) {
  destroyChart(personChartInstance);

  const labels = personTotals.map(row => row.person);
  const values = personTotals.map(row => row.amount);

  personChartInstance = createBarChart(
    analysisEls.personChart,
    labels,
    values,
    "Person-wise contribution"
  );
}

// ============================================================
// SPEND OVER TIME CHART
// ============================================================

function renderSpendOverTimeChart(timeTotals) {
  destroyChart(spendOverTimeChartInstance);

  // Sort date/week/month labels old → new
  const sorted = [...timeTotals].sort((a, b) => {
    return String(a.date).localeCompare(String(b.date));
  });

  const labels = sorted.map(row => row.date);
  const values = sorted.map(row => row.amount);

  spendOverTimeChartInstance = createLineChart(
    analysisEls.spendOverTimeChart,
    labels,
    values
  );
}

// ============================================================
// TOP ITEMS
// ============================================================

function renderTopItems(topItems) {
  const container = analysisEls.topItemsList;
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(topItems) || topItems.length === 0) {
    setEmptyMessage(container, "No item data found.");
    return;
  }

  topItems.forEach((item, index) => {
    container.appendChild(
      createListRow(
        `${index + 1}. ${item.item}`,
        formatMoney(item.amount)
      )
    );
  });
}

// ============================================================
// SPECIAL TRACKING
// ============================================================

function renderTrackCard(element, title, data) {
  if (!element) return;

  const total = data?.total || 0;
  const count = data?.count || 0;
  const quantity = data?.quantity || 0;

  element.innerHTML = `
    <h4>${title}</h4>
    <p class="card-value-small">${formatMoney(total)}</p>
    <p class="expense-meta">Times: ${escapeHtml(count)}</p>
    <p class="expense-meta">Qty: ${escapeHtml(quantity)}</p>
  `;
}

function renderSpecialTracking(special) {
  renderTrackCard(analysisEls.trackFish, "🐟 Fish", special.Fish);
  renderTrackCard(analysisEls.trackEgg, "🥚 Egg", special.Egg);
  renderTrackCard(analysisEls.trackOil, "🛢️ Oil", special.Oil);
  renderTrackCard(analysisEls.trackRice, "🍚 Rice", special.Rice);
}

// ============================================================
// PERIOD BUTTONS
// ============================================================

function setActivePeriodButton(period) {
  analysisEls.periodButtons.forEach(btn => {
    const isActive = btn.dataset.period === period;
    btn.classList.toggle("active", isActive);
  });
}

function handlePeriodClick(event) {
  const period = event.currentTarget.dataset.period;

  selectedAnalysisPeriod = period;

  setActivePeriodButton(period);

  if (period === "custom") {
    showElement(analysisEls.customDateRange);
  } else {
    hideElement(analysisEls.customDateRange);
    loadAnalysis();
  }
}

// ============================================================
// INIT
// ============================================================

function initAnalysis() {
  if (!analysisEls.topItemsList) return;

  analysisEls.periodButtons.forEach(btn => {
    btn.addEventListener("click", handlePeriodClick);
  });

  analysisEls.applyAnalysisBtn?.addEventListener("click", () => {
    if (!analysisEls.analysisStartDate.value || !analysisEls.analysisEndDate.value) {
      showToast("Select start and end date.", "warning");
      return;
    }

    loadAnalysis();
  });

  setActivePeriodButton(selectedAnalysisPeriod);
  hideElement(analysisEls.customDateRange);

  loadAnalysis();
}

document.addEventListener("DOMContentLoaded", initAnalysis);

