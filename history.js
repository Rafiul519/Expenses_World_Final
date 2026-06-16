const historyEls = {
  filterStatus: document.getElementById("filterStatus"),
  filterCategory: document.getElementById("filterCategory"),
  filterStartDate: document.getElementById("filterStartDate"),
  filterEndDate: document.getElementById("filterEndDate"),
  applyFiltersBtn: document.getElementById("applyFiltersBtn"),
  historyList: document.getElementById("historyList"),

  editModal: document.getElementById("editExpenseModal"),
  editExpenseId: document.getElementById("editExpenseId"),
  editDate: document.getElementById("editDate"),
  editPaidBy: document.getElementById("editPaidBy"),
  editItemName: document.getElementById("editItemName"),
  editCategory: document.getElementById("editCategory"),
  editAmount: document.getElementById("editAmount"),
  editQuantity: document.getElementById("editQuantity"),
  editNote: document.getElementById("editNote"),
  editCancelBtn: document.getElementById("editCancelBtn"),
  editSaveBtn: document.getElementById("editSaveBtn")
};

let historyCategories = [];
let historyRoommates = [];

async function initHistory() {
  if (!historyEls.historyList) {
    return;
  }

  await loadHistoryMeta();
 // await loadHistory();

  historyEls.applyFiltersBtn.addEventListener("click", function () {
    loadHistory();
  });

  historyEls.editCancelBtn.addEventListener("click", closeEditModal);
  historyEls.editSaveBtn.addEventListener("click", saveEditedExpense);
}

async function loadHistoryMeta() {
  try {
    historyCategories = await api.getCategories();
    historyRoommates = await api.getRoommates();
  } catch (err) {
    historyCategories = [];
    historyRoommates = [{ Name: "Rafiul" }, { Name: "Chetry" }];
  }

  fillCategoryFilter();
  fillEditDropdowns();
}

function fillCategoryFilter() {
  historyEls.filterCategory.innerHTML = '<option value="">All Categories</option>';

  historyCategories.forEach(function (cat) {
    const name = cat.CategoryName || cat.name;
    if (!name) return;

    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    historyEls.filterCategory.appendChild(opt);
  });
}

function fillEditDropdowns() {
  historyEls.editPaidBy.innerHTML = "";
  historyRoommates.forEach(function (p) {
    const name = p.Name || p.UserID;
    if (!name) return;

    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    historyEls.editPaidBy.appendChild(opt);
  });

  historyEls.editCategory.innerHTML = "";
  historyCategories.forEach(function (cat) {
    const name = cat.CategoryName || cat.name;
    if (!name) return;

    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    historyEls.editCategory.appendChild(opt);
  });
}

function getFilters() {
  return {
    status: historyEls.filterStatus.value || "All",
    category: historyEls.filterCategory.value || "",
    startDate: historyEls.filterStartDate.value || "",
    endDate: historyEls.filterEndDate.value || ""
  };
}

async function loadHistory() {
  try {
    historyEls.historyList.innerHTML = '<p class="empty-message">Loading history...</p>';

    const filters = getFilters();
    const expenses = await api.getExpenses(filters);
    renderHistory(expenses);
  } catch (err) {
    alert("History error: " + err.message);
    historyEls.historyList.innerHTML = '<p class="empty-message">Could not load history.</p>';
  }
}

function renderHistory(expenses) {
  historyEls.historyList.innerHTML = "";

  if (!expenses || expenses.length === 0) {
    historyEls.historyList.innerHTML = '<p class="empty-message">No expenses found.</p>';
    return;
  }

  expenses.forEach(function (expense) {
    const card = createExpenseCard(expense);
    historyEls.historyList.appendChild(card);
  });
}

function createExpenseCard(expense) {
  const card = document.createElement("div");
  card.className = "card expense-item";

  const id = expense.ExpenseID;
  const status = expense.Status || "Active";
  const canEdit = status === "Active";

  const title = escapeHtml(expense.ItemName || "");
  const category = escapeHtml(expense.Category || "Other");
  const amount = formatMoney(expense.Amount || 0);
  const paidBy = escapeHtml(expense.PaidBy || "");
  const date = escapeHtml(formatDateForDisplay(expense.Date));
  const note = escapeHtml(expense.Note || "");
  const qty = escapeHtml(expense.Quantity || "");

  card.innerHTML =
    '<div class="expense-top-row">' +
      '<div>' +
        '<strong>' + title + '</strong>' +
        '<div><span class="category-tag">' + category + '</span></div>' +
      '</div>' +
      '<div class="expense-amount">' + amount + '</div>' +
    '</div>' +
    '<div class="expense-meta">' + date + ' • Paid by ' + paidBy + ' • Status: ' + escapeHtml(status) + '</div>' +
    '<div class="expense-meta">' +
      (qty ? 'Qty: ' + qty + ' ' : '') +
      (note ? 'Note: ' + note : '') +
    '</div>' +
    '<div class="expense-actions">' +
      '<button class="btn btn-secondary edit-btn" type="button">Edit</button>' +
      '<button class="btn btn-danger delete-btn" type="button">Delete</button>' +
    '</div>';

  const editBtn = card.querySelector(".edit-btn");
  const deleteBtn = card.querySelector(".delete-btn");

  if (!canEdit) {
    editBtn.disabled = true;
    deleteBtn.disabled = true;
    editBtn.style.opacity = "0.5";
    deleteBtn.style.opacity = "0.5";
  }

  editBtn.addEventListener("click", function () {
    openEditModal(expense);
  });

  deleteBtn.addEventListener("click", function () {
    deleteExpense(id);
  });

  return card;
}

function openEditModal(expense) {
  historyEls.editExpenseId.value = expense.ExpenseID;
  historyEls.editDate.value = dateToInput(expense.Date);
  historyEls.editPaidBy.value = expense.PaidBy || "";
  historyEls.editItemName.value = expense.ItemName || "";
  historyEls.editCategory.value = expense.Category || "Other";
  historyEls.editAmount.value = expense.Amount || "";
  historyEls.editQuantity.value = expense.Quantity || "";
  historyEls.editNote.value = expense.Note || "";

  showElement(historyEls.editModal);
}

function closeEditModal() {
  hideElement(historyEls.editModal);
}

function dateToInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value).slice(0, 10);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

async function saveEditedExpense() {
  try {
    const password = await requirePassword();

    await api.editExpense({
      password: password,
      expenseId: historyEls.editExpenseId.value,
      date: historyEls.editDate.value,
      paidBy: historyEls.editPaidBy.value,
      itemName: historyEls.editItemName.value,
      category: historyEls.editCategory.value,
      amount: historyEls.editAmount.value,
      quantity: historyEls.editQuantity.value,
      note: historyEls.editNote.value
    });

    closeEditModal();
    showToast("Expense updated.", "success");
    loadHistory();
    if (typeof loadDashboard === "function") loadDashboard();
  } catch (err) {
    alert("Edit error: " + err.message);
  }
}

async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;

  try {
    const password = await requirePassword();

    await api.deleteExpense({
      password: password,
      expenseId: id
    });

    showToast("Expense deleted.", "success");
    loadHistory();
    if (typeof loadDashboard === "function") loadDashboard();
  } catch (err) {
    alert("Delete error: " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", initHistory);