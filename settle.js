
// ============================================================
// EXPENSE WORLD — settle.js
// ------------------------------------------------------------
// This file handles:
//
// 1. Settlement preview
// 2. Current cycle summary
// 3. Clear Payment flow
// 4. Type CLEAR confirmation
// 5. Clear History rendering
//
// Depends on:
// - config.js
// - api.js
// - auth.js
// ============================================================

// ============================================================
// 1. DOM ELEMENTS
// ============================================================

const settleEls = {
settlePreview: document.getElementById("settlePreview"),
clearPaymentBtn: document.getElementById("clearPaymentBtn"),

clearConfirmModal: document.getElementById("clearConfirmModal"),
clearConfirmDetails: document.getElementById("clearConfirmDetails"),
clearConfirmInput: document.getElementById("clearConfirmInput"),

clearConfirmCancelBtn: document.getElementById("clearConfirmCancelBtn"),
clearConfirmSubmitBtn: document.getElementById("clearConfirmSubmitBtn"),

clearHistoryList: document.getElementById("clearHistoryList")
};

// ============================================================
// 2. LOCAL CACHE
// ============================================================

let currentSettlementSummary = null;
let clearHistoryCache = [];

// ============================================================
// 3. LOAD SETTLEMENT PREVIEW
// ------------------------------------------------------------
// Uses:
// api.getSummary()
//
// Expected:
// {
//   totalActive,
//   equalShare,
//   personWisePaid,
//   settlements
// }
// ============================================================

async function loadSettlePreview() {
try {

setEmptyMessage(
  settleEls.settlePreview,
  "Loading settlement summary..."
);

const summary = await api.getSummary();

currentSettlementSummary = summary;

renderSettlementPreview(summary);

} catch (error) {

console.error(
  "Settlement preview load failed:",
  error
);

setEmptyMessage(
  settleEls.settlePreview,
  "Could not load settlement preview."
);

}
}

// ============================================================
// 4. RENDER SETTLEMENT PREVIEW
// ============================================================

function renderSettlementPreview(summary) {

const container = settleEls.settlePreview;

if (!container) return;

container.innerHTML = "";

if (!summary) {
setEmptyMessage(
container,
"No active expense data available."
);
return;
}

container.appendChild(
createListRow(
"Total Active Expense",
formatMoney(summary.totalActive || 0)
)
);

container.appendChild(
createListRow(
"Equal Share",
formatMoney(summary.equalShare || 0)
)
);

// Person wise paid
const personWisePaid =
summary.personWisePaid || {};

Object.entries(personWisePaid)
.forEach(([name, amount]) => {

  container.appendChild(
    createListRow(
      `${name} Paid`,
      formatMoney(amount)
    )
  );

});

// Settlement Suggestions
const settlements =
summary.settlements || [];

if (settlements.length > 0) {

settlements.forEach((item) => {

  container.appendChild(
    createListRow(
      `${item.from} → ${item.to}`,
      formatMoney(item.amount)
    )
  );

});

} else {

container.appendChild(
  createListRow(
    "Settlement",
    "All settled up"
  )
);

}
}

// ============================================================
// 5. OPEN CLEAR MODAL
// ============================================================

function openClearModal() {

if (!currentSettlementSummary) {
showToast(
"Load summary first.",
"warning"
);
return;
}

settleEls.clearConfirmInput.value = "";

renderClearModalDetails(
currentSettlementSummary
);

showElement(
settleEls.clearConfirmModal
);
}

// ============================================================
// 6. CLOSE CLEAR MODAL
// ============================================================

function closeClearModal() {

hideElement(
settleEls.clearConfirmModal
);

settleEls.clearConfirmInput.value = "";
}

// ============================================================
// 7. RENDER CLEAR MODAL DETAILS
// ============================================================

function renderClearModalDetails(summary) {

const container =
settleEls.clearConfirmDetails;

if (!container) return;

container.innerHTML = "";

container.appendChild(
createListRow(
"Total Expense",
formatMoney(summary.totalActive || 0)
)
);

container.appendChild(
createListRow(
"Equal Share",
formatMoney(summary.equalShare || 0)
)
);

const settlements =
summary.settlements || [];

settlements.forEach((item) => {

container.appendChild(
  createListRow(
    `${item.from} → ${item.to}`,
    formatMoney(item.amount)
  )
);

});
}

// ============================================================
// 8. HANDLE CLEAR PAYMENT
// ------------------------------------------------------------
// User must type:
//
// CLEAR
//
// before we allow clearing.
// ============================================================

async function handleClearPayment() {

const confirmation =
settleEls.clearConfirmInput.value.trim();

if (confirmation !== "CLEAR") {

showToast(
  "Type CLEAR to continue.",
  "warning"
);

return;

}

try {

const password =
  await requirePassword();

setButtonLoading(
  settleEls.clearConfirmSubmitBtn,
  true,
  "Clearing..."
);

await api.clearPayment({
  password
});

closeClearModal();

showToast(
  "Payment cleared successfully.",
  "success"
);

// Refresh everything
if (typeof loadDashboard === "function") {
  loadDashboard();
}

if (typeof loadHistory === "function") {
  loadHistory();
}

loadSettlePreview();
loadClearHistory();

} catch (error) {

console.error(
  "Clear payment failed:",
  error
);

} finally {

setButtonLoading(
  settleEls.clearConfirmSubmitBtn,
  false
);

}
}

// ============================================================
// 9. LOAD CLEAR HISTORY
// ============================================================

async function loadClearHistory() {

try {

const history =
  await api.getClearHistory();

clearHistoryCache =
  Array.isArray(history)
    ? history
    : [];

renderClearHistory(
  clearHistoryCache
);

} catch (error) {

console.error(
  "Clear history load failed:",
  error
);

setEmptyMessage(
  settleEls.clearHistoryList,
  "Could not load clear history."
);

}
}

// ============================================================
// 10. RENDER CLEAR HISTORY
// ============================================================

function renderClearHistory(history) {

const container =
settleEls.clearHistoryList;

if (!container) return;

container.innerHTML = "";

if (
!Array.isArray(history) ||
history.length === 0
) {

setEmptyMessage(
  container,
  "No clear cycles yet."
);

return;

}

history.forEach((record) => {

const card =
  document.createElement("div");

card.className = "card";

const clearDate =
  formatDateForDisplay(
    record.ClearDate
  );

const total =
  formatMoney(
    record.TotalAmount || 0
  );

const clearId =
  record.ClearID || "-";

card.innerHTML = `
  <h4>${escapeHtml(clearId)}</h4>

  <div class="expense-meta">
    Cleared On:
    ${escapeHtml(clearDate)}
  </div>

  <div class="expense-meta">
    Period:
    ${escapeHtml(record.PeriodStart || "-")}
    →
    ${escapeHtml(record.PeriodEnd || "-")}
  </div>

  <div class="expense-amount">
    ${escapeHtml(total)}
  </div>
`;

container.appendChild(card);

});
}

// ============================================================
// 11. INIT EVENTS
// ============================================================

function initSettleEvents() {

settleEls.clearPaymentBtn
?.addEventListener(
"click",
openClearModal
);

settleEls.clearConfirmCancelBtn
?.addEventListener(
"click",
closeClearModal
);

settleEls.clearConfirmSubmitBtn
?.addEventListener(
"click",
handleClearPayment
);

settleEls.clearConfirmModal
?.addEventListener(
"click",
(event) => {

    if (
      event.target ===
      settleEls.clearConfirmModal
    ) {

      closeClearModal();
    }
  }
);

}

// ============================================================
// 12. INIT
// ============================================================

async function initSettle() {

if (!settleEls.settlePreview) {
return;
}

initSettleEvents();

await loadSettlePreview();

await loadClearHistory();
}

// ============================================================
// 13. START
// ============================================================

document.addEventListener(
"DOMContentLoaded",
initSettle
);

