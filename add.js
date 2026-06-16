// ============================================================
// EXPENSE WORLD — add.js
// ------------------------------------------------------------
// This file handles the Add Expense section:
//
// 1. Loads Roommates into "Paid By" dropdown
// 2. Loads Categories into category dropdowns
// 3. Adds/removes item rows
// 4. Auto-detects category using aliases
// 5. Saves expenses using addExpenseBatch API
// 6. If internet fails, saves draft in localStorage
// 7. Sync Later button retries saved draft
//
// Depends on:
// - config.js
// - api.js
// - auth.js
// ============================================================

// ============================================================
// 1. ADD EXPENSE DOM ELEMENTS
// ============================================================

const addEls = {
expenseDate: document.getElementById("expenseDate"),
paidBySelect: document.getElementById("paidBySelect"),
itemRowsContainer: document.getElementById("itemRowsContainer"),
itemRowTemplate: document.getElementById("itemRowTemplate"),
itemNameSuggestions: document.getElementById("itemNameSuggestions"),
addAnotherBtn: document.getElementById("addAnotherItemBtn"),
saveBtn: document.getElementById("saveExpensesBtn"),
draftMessage: document.getElementById("draftMessage"),
syncLaterBtn: document.getElementById("syncLaterBtn")
};

// ============================================================
// 2. LOCAL CACHE
// ------------------------------------------------------------
// These arrays are filled from Google Sheets.
// ============================================================

let addCategories = [];
let addRoommates = [];
let previousItemNames = [];

// ============================================================
// 3. DEFAULT CATEGORY SEED
// ------------------------------------------------------------
// This is fallback data. Later Google Sheet Categories tab
// can override/add more aliases.
// ============================================================

const DEFAULT_CATEGORY_ALIASES = [
{
CategoryName: "Fish",
Aliases: "fish, mash, mas, mach, machh",
TrackSeparately: true
},
{
CategoryName: "Chicken",
Aliases: "chicken, boiler, boilar, bhol"
},
{
CategoryName: "Mirchi",
Aliases: "mirchi, mirsi, moris, maris, morcha"
},
{
CategoryName: "Lemon",
Aliases: "lemon, nebu, nimo, nemo"
},
{
CategoryName: "Soybean",
Aliases: "soybean, soyabin, suabin, sabin"
},
{
CategoryName: "Vegetables",
Aliases: "alu, allu, piyaj, tomato, tometo, begun, bagun, khira, jika, jinga, lau, potol, vendi"
},
{
CategoryName: "Oil",
Aliases: "oil, tel, anupam oil",
TrackSeparately: true
},
{
CategoryName: "Egg",
Aliases: "egg, anda, onda",
TrackSeparately: true
},
{
CategoryName: "Rice",
Aliases: "rice, chawal, rich",
TrackSeparately: true
},
{
CategoryName: "Gas",
Aliases: "gas, ges"
},
{
CategoryName: "Transport",
Aliases: "car, gari, auto, vara, bhara"
},
{
CategoryName: "Household",
Aliases: "sabun, brush, brash, vim, agarbati, jharu"
},
{
CategoryName: "Other",
Aliases: ""
}
];

// ============================================================
// 4. LOAD STARTUP DATA
// ------------------------------------------------------------
// Loads roommates and categories.
// If API fails, we use default fallback data.
// ============================================================

async function loadAddFormData() {
try {
const [roommates, categories] = await Promise.all([
api.getRoommates(),
api.getCategories()
]);

addRoommates = Array.isArray(roommates) ? roommates : [];
addCategories =
  Array.isArray(categories) && categories.length > 0
    ? categories
    : DEFAULT_CATEGORY_ALIASES;

} catch (error) {
console.warn("Using fallback add form data:", error);

addRoommates = [
  { UserID: "Rafiul", Name: "Rafiul", Active: true },
  { UserID: "Chetry", Name: "Chetry", Active: true }
];

addCategories = DEFAULT_CATEGORY_ALIASES;

}

renderPaidByDropdown();
renderCategoryDropdowns();
}

// ============================================================
// 5. RENDER PAID BY DROPDOWN
// ============================================================

function renderPaidByDropdown() {
if (!addEls.paidBySelect) return;

addEls.paidBySelect.innerHTML = "";

const activeRoommates = addRoommates.filter((person) => {
return person.Active === true || String(person.Active).toLowerCase() === "true";
});

activeRoommates.forEach((person) => {
const option = document.createElement("option");
option.value = person.Name || person.UserID;
option.textContent = person.Name || person.UserID;

addEls.paidBySelect.appendChild(option);

});
}

// ============================================================
// 6. FILL CATEGORY SELECT
// ============================================================

function fillCategorySelect(selectElement, selectedCategory = "") {
if (!selectElement) return;

selectElement.innerHTML = "";

addCategories.forEach((category) => {
const name = category.CategoryName || category.categoryName || category.name;

if (!name) return;

const option = document.createElement("option");
option.value = name;
option.textContent = name;

if (name === selectedCategory) {
  option.selected = true;
}

selectElement.appendChild(option);

});

// Ensure Other exists
if (![...selectElement.options].some((opt) => opt.value === "Other")) {
const option = document.createElement("option");
option.value = "Other";
option.textContent = "Other";
selectElement.appendChild(option);
}
}

// ============================================================
// 7. RENDER CATEGORY DROPDOWNS IN ALL ROWS
// ============================================================

function renderCategoryDropdowns() {
const selects = addEls.itemRowsContainer?.querySelectorAll(
".item-category-select"
);

selects?.forEach((select) => {
const currentValue = select.value;
fillCategorySelect(select, currentValue || "Other");
});
}

// ============================================================
// 8. DETECT CATEGORY FROM ITEM NAME
// ------------------------------------------------------------
// Example:
// "mash" -> Fish
// "anda" -> Egg
// "anupam oil" -> Oil
// ============================================================

function detectCategory(itemName) {
const text = String(itemName || "").toLowerCase().trim();

if (!text) return APP_CONFIG.DEFAULT_CATEGORY;

for (const category of addCategories) {
const categoryName =
category.CategoryName || category.categoryName || category.name;

const aliasesText =
  category.Aliases || category.aliases || "";

const aliases = aliasesText
  .split(",")
  .map((alias) => alias.trim().toLowerCase())
  .filter(Boolean);

for (const alias of aliases) {
  // Match if item contains alias
  // Example: "anupam oil 1 litre" contains "oil"
  if (text.includes(alias)) {
    return categoryName || APP_CONFIG.DEFAULT_CATEGORY;
  }
}

}

return APP_CONFIG.DEFAULT_CATEGORY;
}

// ============================================================
// 9. ADD ONE ITEM ROW
// ============================================================

function addItemRow(data = {}) {
if (!addEls.itemRowTemplate || !addEls.itemRowsContainer) return;

const templateContent = addEls.itemRowTemplate.content.cloneNode(true);
const row = templateContent.querySelector(".item-row");

const itemNameInput = row.querySelector(".item-name-input");
const amountInput = row.querySelector(".item-amount-input");
const categorySelect = row.querySelector(".item-category-select");
const quantityInput = row.querySelector(".item-quantity-input");
const noteInput = row.querySelector(".item-note-input");
const removeBtn = row.querySelector(".remove-row-btn");

fillCategorySelect(categorySelect, data.category || "Other");

itemNameInput.value = data.itemName || "";
amountInput.value = data.amount || "";
quantityInput.value = data.quantity || "";
noteInput.value = data.note || "";

if (data.category) {
categorySelect.value = data.category;
} else if (data.itemName) {
categorySelect.value = detectCategory(data.itemName);
}

// Auto-detect category whenever item name changes
itemNameInput.addEventListener("input", () => {
const detected = detectCategory(itemNameInput.value);
categorySelect.value = detected;
});

removeBtn.addEventListener("click", () => {
const rows = addEls.itemRowsContainer.querySelectorAll(".item-row");

// Keep at least one row
if (rows.length <= 1) {
  showToast("At least one item row is required.", "warning");
  return;
}

row.remove();

});

addEls.itemRowsContainer.appendChild(row);
}

// ============================================================
// 10. COLLECT FORM DATA
// ------------------------------------------------------------
// Converts the form into API payload.
// ============================================================

function collectExpenseFormData() {
const date = addEls.expenseDate.value;
const paidBy = addEls.paidBySelect.value;

const rows = [...addEls.itemRowsContainer.querySelectorAll(".item-row")];

const items = rows.map((row) => {
return {
itemName: row.querySelector(".item-name-input").value.trim(),
amount: safeNumber(row.querySelector(".item-amount-input").value),
category: row.querySelector(".item-category-select").value,
quantity: row.querySelector(".item-quantity-input").value,
note: row.querySelector(".item-note-input").value.trim()
};
}).filter((item) => {
// Only keep rows with item name and amount
return item.itemName && item.amount > 0;
});

return {
date,
paidBy,
items
};
}

// ============================================================
// 11. VALIDATE FORM DATA
// ============================================================

function validateExpenseData(data) {
if (!data.date) {
showToast("Please select date.", "warning");
return false;
}

if (!data.paidBy) {
showToast("Please select Paid By.", "warning");
return false;
}

if (!Array.isArray(data.items) || data.items.length === 0) {
showToast("Add at least one valid item and amount.", "warning");
return false;
}

return true;
}

// ============================================================
// 12. RESET FORM
// ============================================================

function resetAddExpenseForm() {
addEls.expenseDate.value = getTodayInputDate();
addEls.itemRowsContainer.innerHTML = "";
addItemRow();
}

// ============================================================
// 13. SAVE DRAFT LOCALLY
// ============================================================

function saveDraftLocally(data) {
localStorage.setItem(
APP_CONFIG.DRAFT_KEY,
JSON.stringify(data)
);

showElement(addEls.draftMessage);
showElement(addEls.syncLaterBtn);

showToast(
"Internet failed. Draft saved locally.",
"warning"
);
}

// ============================================================
// 14. GET LOCAL DRAFT
// ============================================================

function getLocalDraft() {
const raw = localStorage.getItem(APP_CONFIG.DRAFT_KEY);

if (!raw) return null;

try {
return JSON.parse(raw);
} catch (error) {
localStorage.removeItem(APP_CONFIG.DRAFT_KEY);
return null;
}
}

// ============================================================
// 15. CLEAR LOCAL DRAFT
// ============================================================

function clearLocalDraft() {
localStorage.removeItem(APP_CONFIG.DRAFT_KEY);

hideElement(addEls.draftMessage);
hideElement(addEls.syncLaterBtn);
}

// ============================================================
// 16. SAVE EXPENSES TO API
// ============================================================

async function saveExpenses(data) {
const password = await requirePassword();

return api.addExpenseBatch({
...data,
password
});
}

// ============================================================
// 17. HANDLE SAVE BUTTON
// ============================================================

async function handleSaveExpenses() {
const data = collectExpenseFormData();

if (!validateExpenseData(data)) return;

try {
setButtonLoading(addEls.saveBtn, true, "Saving...");

await saveExpenses(data);

clearLocalDraft();
resetAddExpenseForm();

showToast("Expenses saved successfully.", "success");

// Refresh other sections if functions exist
if (typeof loadDashboard === "function") loadDashboard();
if (typeof loadHistory === "function") loadHistory();
if (typeof loadSettlePreview === "function") loadSettlePreview();

} catch (error) {
console.error("Save expense failed:", error);

if (error.isOffline) {
  saveDraftLocally(data);
}

} finally {
setButtonLoading(addEls.saveBtn, false);
}
}

// ============================================================
// 18. SYNC SAVED DRAFT
// ============================================================

async function syncSavedDraft() {
const draft = getLocalDraft();

if (!draft) {
showToast("No saved draft found.", "warning");
return;
}

try {
setButtonLoading(addEls.syncLaterBtn, true, "Syncing...");

await saveExpenses(draft);

clearLocalDraft();

showToast("Draft synced successfully.", "success");

if (typeof loadDashboard === "function") loadDashboard();
if (typeof loadHistory === "function") loadHistory();
if (typeof loadSettlePreview === "function") loadSettlePreview();

} catch (error) {
console.error("Draft sync failed:", error);

if (error.isOffline) {
  showToast("Still offline. Try again later.", "warning");
}

} finally {
setButtonLoading(addEls.syncLaterBtn, false);
}
}

// ============================================================
// 19. CHECK DRAFT ON STARTUP
// ============================================================

function checkDraftOnStartup() {
const draft = getLocalDraft();

if (!draft) return;

showElement(addEls.draftMessage);
showElement(addEls.syncLaterBtn);

showToast("You have an unsynced draft.", "warning");
}

// ============================================================
// 20. INIT ADD EXPENSE SECTION
// ============================================================

async function initAddExpense() {
if (!addEls.itemRowsContainer) return;

addEls.expenseDate.value = getTodayInputDate();

await loadAddFormData();

addItemRow();

checkDraftOnStartup();

addEls.addAnotherBtn?.addEventListener("click", () => {
addItemRow();
});

addEls.saveBtn?.addEventListener("click", handleSaveExpenses);

addEls.syncLaterBtn?.addEventListener("click", syncSavedDraft);

// If internet comes back, automatically try syncing saved draft.
window.addEventListener("online", () => {
const draft = getLocalDraft();
if (draft) {
syncSavedDraft();
}
});
}

// ============================================================
// 21. START
// ============================================================

document.addEventListener("DOMContentLoaded", initAddExpense);

