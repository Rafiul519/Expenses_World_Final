
// ============================================================
// EXPENSE WORLD — auth.js
// ------------------------------------------------------------
// This file handles:
// 1. Password modal open/close
// 2. Password verification with Apps Script
// 3. sessionStorage password caching
// 4. requirePassword() helper
//
// IMPORTANT:
// Any write action should call:
//
// await requirePassword();
//
// Examples:
// - Add Expense
// - Edit Expense
// - Delete Expense
// - Clear Payment
//
// Read-only actions DO NOT need password.
// ============================================================

// ============================================================
// GLOBAL VARIABLES
// ============================================================

let passwordResolve = null;
let passwordReject = null;

// ============================================================
// DOM ELEMENTS
// ============================================================

const passwordModal = document.getElementById("passwordModal");
const passwordInput = document.getElementById("passwordInput");
const passwordError = document.getElementById("passwordError");

const passwordSubmitBtn = document.getElementById("passwordSubmitBtn");
const passwordCancelBtn = document.getElementById("passwordCancelBtn");

// ============================================================
// OPEN PASSWORD MODAL
// ============================================================

function openPasswordModal() {
if (!passwordModal) return;

passwordInput.value = "";
hideElement(passwordError);

showElement(passwordModal);

setTimeout(() => {
passwordInput.focus();
}, 100);
}

// ============================================================
// CLOSE PASSWORD MODAL
// ============================================================

function closePasswordModal() {
if (!passwordModal) return;

hideElement(passwordModal);

passwordInput.value = "";
hideElement(passwordError);
}

// ============================================================
// SAVE PASSWORD TO SESSION
// ------------------------------------------------------------
// Password stays only until browser tab closes.
// Much safer than localStorage.
// ============================================================

function saveSessionPassword(password) {
sessionStorage.setItem(
APP_CONFIG.PASSWORD_KEY,
password
);
}

// ============================================================
// GET SAVED PASSWORD
// ============================================================

function getSessionPassword() {
return sessionStorage.getItem(
APP_CONFIG.PASSWORD_KEY
);
}

// ============================================================
// CLEAR SAVED PASSWORD
// ============================================================

function clearSessionPassword() {
sessionStorage.removeItem(
APP_CONFIG.PASSWORD_KEY
);
}

// ============================================================
// VERIFY PASSWORD WITH APPS SCRIPT
// ------------------------------------------------------------
// We call:
// api.verifyPassword(password)
//
// Apps Script should return:
// { valid: true }
// ============================================================

async function verifyPassword(password) {
try {
const result = await api.verifyPassword(password);

return result?.valid === true;

} catch (error) {
console.error("Password verification failed:", error);

return false;

}
}

// ============================================================
// MAIN PASSWORD FUNCTION
// ------------------------------------------------------------
// Any write action should call:
//
// await requirePassword();
//
// If already unlocked:
// returns immediately
//
// If not:
// opens modal
// waits for user input
// verifies password
// saves password in sessionStorage
// ============================================================

async function requirePassword() {
const existingPassword = getSessionPassword();

// Already unlocked this session
if (existingPassword) {
return existingPassword;
}

return new Promise((resolve, reject) => {
passwordResolve = resolve;
passwordReject = reject;

openPasswordModal();

});
}

// ============================================================
// SUBMIT PASSWORD
// ============================================================

async function handlePasswordSubmit() {
const password = passwordInput.value.trim();

if (!password) {
showElement(passwordError);
passwordError.textContent = "Password required.";
return;
}

setButtonLoading(
passwordSubmitBtn,
true,
"Checking..."
);

const isValid = await verifyPassword(password);

setButtonLoading(
passwordSubmitBtn,
false
);

if (!isValid) {
showElement(passwordError);
passwordError.textContent =
"Incorrect password. Please try again.";

passwordInput.focus();
return;

}

saveSessionPassword(password);

closePasswordModal();

showToast(
"Password accepted.",
"success"
);

if (passwordResolve) {
passwordResolve(password);
}

passwordResolve = null;
passwordReject = null;
}

// ============================================================
// CANCEL PASSWORD
// ============================================================

function handlePasswordCancel() {
closePasswordModal();

if (passwordReject) {
passwordReject(
new Error("Password entry cancelled")
);
}

passwordResolve = null;
passwordReject = null;
}

// ============================================================
// LOGOUT / LOCK AGAIN
// ------------------------------------------------------------
// Useful future feature:
//
// <button onclick="logoutSession()">
//   Lock App
// </button>
// ============================================================

function logoutSession() {
clearSessionPassword();

showToast(
"Session locked.",
"warning"
);
}

// ============================================================
// KEYBOARD SUPPORT
// ------------------------------------------------------------
// Press Enter to submit password.
// ============================================================

function handlePasswordKeydown(event) {
if (event.key === "Enter") {
handlePasswordSubmit();
}

if (event.key === "Escape") {
handlePasswordCancel();
}
}

// ============================================================
// INIT
// ============================================================

function initAuth() {
if (!passwordModal) return;

passwordSubmitBtn?.addEventListener(
"click",
handlePasswordSubmit
);

passwordCancelBtn?.addEventListener(
"click",
handlePasswordCancel
);

passwordInput?.addEventListener(
"keydown",
handlePasswordKeydown
);

// Click outside modal closes it
passwordModal?.addEventListener(
"click",
(event) => {
if (event.target === passwordModal) {
handlePasswordCancel();
}
}
);
}

// ============================================================
// START
// ============================================================

document.addEventListener(
"DOMContentLoaded",
initAuth
);

