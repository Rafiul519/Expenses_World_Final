
// ============================================================
// EXPENSE WORLD — api.js
// ------------------------------------------------------------
// This file has ONE main job:
// Talk to Google Apps Script.
//
// Every frontend file should use callApi() instead of writing
// fetch() again and again.
//
// Example use:
// const summary = await callApi("getSummary");
//
// const result = await callApi("addExpenseBatch", {
//   date: "2026-06-14",
//   paidBy: "Rafiul",
//   items: [...],
//   password: "1234"
// });
//
// IMPORTANT:
// config.js must load before this file because we use APP_CONFIG.
// ============================================================

// ============================================================
// 1. CHECK API URL
// ------------------------------------------------------------
// Before calling Apps Script, we check if the URL is added.
// This prevents confusing errors for beginners.
// ============================================================

function isApiUrlReady() {
return Boolean(APP_CONFIG.APPS_SCRIPT_URL && APP_CONFIG.APPS_SCRIPT_URL.trim() !== "");
}

// ============================================================
// 2. MAIN API FUNCTION
// ------------------------------------------------------------
// action  = API action name, like "getSummary"
// payload = data we want to send
//
// This function sends JSON to Apps Script:
// {
//   action: "getSummary",
//   payload: {...}
// }
//
// Apps Script should return:
// { success: true, data: ... }
// or
// { success: false, error: "message" }
// ============================================================

async function callApi(action, payload = {}) {
if (!isApiUrlReady()) {
const message = "Apps Script URL missing. Add it in js/config.js";
showToast(message, "error");
throw new Error(message);
}

try {
const response = await fetch(APP_CONFIG.APPS_SCRIPT_URL, {
method: "POST",

  // Apps Script accepts text/plain more easily than application/json
  // in many Web App deployments, so we send JSON as plain text.
  headers: {
    "Content-Type": "text/plain;charset=utf-8"
  },

  body: JSON.stringify({
    action,
    payload
  })
});

if (!response.ok) {
  throw new Error(`Server error: ${response.status}`);
}

const result = await response.json();

if (!result.success) {
  throw new Error(result.error || "Unknown API error");
}

return result.data;

} catch (error) {
// If internet is off, browser usually throws TypeError: Failed to fetch.
const isOffline =
!navigator.onLine ||
error.message.includes("Failed to fetch") ||
error.message.includes("NetworkError");

if (isOffline) {
  showToast("Internet connection failed.", "warning");
  error.isOffline = true;
} else {
  showToast(error.message || "Something went wrong.", "error");
}

throw error;

}
}

// ============================================================
// 3. SMALL WRAPPER FUNCTIONS
// ------------------------------------------------------------
// These are optional but make code cleaner in other files.
// Instead of callApi("getSummary"), we can use api.getSummary().
// ============================================================

const api = {
getExpenses(filters = {}) {
return callApi("getExpenses", filters);
},

addExpense(expense) {
return callApi("addExpense", expense);
},

addExpenseBatch(data) {
return callApi("addExpenseBatch", data);
},

editExpense(data) {
return callApi("editExpense", data);
},

deleteExpense(data) {
return callApi("deleteExpense", data);
},

getSummary() {
return callApi("getSummary");
},

clearPayment(data) {
return callApi("clearPayment", data);
},

getClearHistory() {
return callApi("getClearHistory");
},

getAnalysis(filters = {}) {
return callApi("getAnalysis", filters);
},

getCategories() {
return callApi("getCategories");
},

getRoommates() {
return callApi("getRoommates");
},

verifyPassword(password) {
return callApi("verifyPassword", { password });
}
};

// ============================================================
// 4. OPTIONAL TEST FUNCTION
// ------------------------------------------------------------
// You can test from browser console later:
//
// testApiConnection()
//
// It will call getRoommates and show result in console.
// ============================================================

async function testApiConnection() {
try {
const roommates = await api.getRoommates();
console.log("API working. Roommates:", roommates);
showToast("API connected successfully.", "success");
} catch (error) {
console.error("API test failed:", error);
}
}

