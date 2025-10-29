const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

const form = document.getElementById("transaction-form");
const list = document.getElementById("transaction-list");
const incomeEl = document.getElementById("total-income");
const expenseEl = document.getElementById("total-expense");
const balanceEl = document.getElementById("net-balance");

const categoryCtx = document.getElementById("categoryChart");
const monthlyCtx = document.getElementById("monthlyChart");
const categorySelect = document.getElementById("category");

const themeToggle = document.getElementById("theme-toggle");
const modeLabel = document.getElementById("mode-label");

// Default categories
const categories = {
  income: ["Salary", "Bonus", "Freelance", "Investment", "Other"],
  expense: ["Food", "Rent", "Utilities", "Shopping", "Entertainment", "Other"],
};

// Populate category options based on selected type
function updateCategoryOptions() {
  const type = document.getElementById("type").value;
  categorySelect.innerHTML = categories[type]
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("");
}
document.getElementById("type").addEventListener("change", updateCategoryOptions);
updateCategoryOptions();

// Theme setup
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.checked = true;
  modeLabel.textContent = "Dark";
}

themeToggle.addEventListener("change", () => {
  const dark = themeToggle.checked;
  document.body.classList.toggle("dark", dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
  modeLabel.textContent = dark ? "Dark" : "Light";
  document.body.animate([{ opacity: 0.6 }, { opacity: 1 }], { duration: 400 });
});

// Add transaction
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  // Validation: Title should contain only letters, spaces, hyphens, and ampersands
  const titlePattern = /^[A-Za-z\s\-&]+$/;
  if (!titlePattern.test(title)) {
    alert("Title should only contain letters (A-Z) and spaces, not numbers.");
    return;
  }

  if (!title || isNaN(amount) || !date) {
    alert("Please fill all fields correctly.");
    return;
  }

  const newTransaction = {
    id: Date.now(),
    title,
    amount,
    type,
    category,
    date,
  };

  transactions.push(newTransaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  form.reset();
  updateCategoryOptions();
  render();
});


// Delete transaction
function deleteTransaction(id) {
  const index = transactions.findIndex((t) => t.id === id);
  if (index !== -1) {
    transactions.splice(index, 1);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    render();
  }
}

// Render
function render() {
  list.innerHTML = "";
  let income = 0, expense = 0;

  transactions.forEach((t) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${t.title} (${t.category}) - ${t.date}</span>
      <span>
        <span style="color:${t.type === "income" ? "var(--income)" : "var(--expense)"}">
          ${t.type === "income" ? "+" : "-"}₹${t.amount}
        </span>
        <button class="delete-btn" title="Delete" onclick="deleteTransaction(${t.id})">❌</button>
      </span>`;
    list.appendChild(li);
    t.type === "income" ? (income += t.amount) : (expense += t.amount);
  });

  const balance = income - expense;
  incomeEl.textContent = `₹${income}`;
  expenseEl.textContent = `₹${expense}`;
  balanceEl.textContent = `₹${balance}`;
  updateCharts();
}

// Charts
let categoryChart, monthlyChart;
function updateCharts() {
  if (categoryChart) categoryChart.destroy();
  if (monthlyChart) monthlyChart.destroy();

  const catTotals = {};
  const months = {};

  transactions.forEach((t) => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    const month = t.date.slice(0, 7);
    if (!months[month]) months[month] = { income: 0, expense: 0 };
    months[month][t.type] += t.amount;
  });

  categoryChart = new Chart(categoryCtx, {
    type: "pie",
    data: {
      labels: Object.keys(catTotals),
      datasets: [
        {
          data: Object.values(catTotals),
          backgroundColor: [
            "#7C4DFF", "#36A2EB", "#4BC0C0", "#FFCE56", "#9575CD", "#FF9F40",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } },
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  monthlyChart = new Chart(monthlyCtx, {
    type: "bar",
    data: {
      labels: Object.keys(months),
      datasets: [
        {
          label: "Income",
          data: Object.values(months).map((m) => m.income),
          backgroundColor: "#7C4DFF",
        },
        {
          label: "Expense",
          data: Object.values(months).map((m) => m.expense),
          backgroundColor: "#E53935",
        },
      ],
    },
    options: {
      scales: {
        y: { beginAtZero: true, grid: { display: false } },
        x: { grid: { display: false } },
      },
      plugins: { legend: { position: "bottom" } },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

// Reset All Data
const resetBtn = document.createElement("button");
resetBtn.id = "reset-btn";
resetBtn.textContent = "Reset All Data";
document.querySelector("#charts").appendChild(resetBtn);
resetBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear all data?")) {
    localStorage.removeItem("transactions");
    transactions.length = 0;
    render();
  }
});

render();
