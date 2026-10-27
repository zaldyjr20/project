// ==================== GLOBAL STATE ====================
let isRegistering = false;
let currentUser = null;

const $ = (id) => document.getElementById(id);

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP'
});

// ==================== LOCAL STORAGE ====================
function getUsers() {
  return JSON.parse(localStorage.getItem('app_users') || '{}');
}

function setUsers(users) {
  localStorage.setItem('app_users', JSON.stringify(users));
}

function getUserData(username) {
  return JSON.parse(
    localStorage.getItem(`data_${username}`) ||
    '{"budget":0,"expenses":[]}'
  );
}

function setUserData(username, data) {
  localStorage.setItem(`data_${username}`, JSON.stringify(data));
}

// ==================== LOGIN PAGE ====================
function showLogin() {
  currentUser = null;
  isRegistering = false;

  $('dashboard-section').classList.add('hidden');
  $('auth-section').classList.remove('hidden');

  $('auth-form').reset();

  $('auth-title').textContent = 'Welcome to BudgetWise';
  $('auth-btn').textContent = 'Login';
  $('auth-toggle-btn').textContent = 'Create Account';

  $('name-group').classList.add('hidden');
  $('confirm-password-group').classList.add('hidden');

  $('reg-name').required = false;
  $('confirm-password').required = false;

  $('auth-message').textContent = '';
}

// ==================== TOGGLE LOGIN / REGISTER ====================
$('auth-toggle-btn').addEventListener('click', () => {
  isRegistering = !isRegistering;

  $('auth-title').textContent = isRegistering
    ? 'Create Account'
    : 'Welcome to BudgetWise';

  $('auth-btn').textContent = isRegistering
    ? 'Register'
    : 'Login';

  $('auth-toggle-btn').textContent = isRegistering
    ? 'Back to Login'
    : 'Create Account';

  $('name-group').classList.toggle('hidden', !isRegistering);

  $('confirm-password-group').classList.toggle(
    'hidden',
    !isRegistering
  );

  $('reg-name').required = isRegistering;
  $('confirm-password').required = isRegistering;

  $('confirm-password').value = '';
  $('auth-message').textContent = '';
});

// ==================== PROCESS LOGIN / REGISTER ====================
$('auth-form').addEventListener('submit', (event) => {
  event.preventDefault();

  const username = $('auth-username').value.trim().toLowerCase();
  const password = $('auth-password').value;
  const confirmPassword = $('confirm-password').value;
  const name = $('reg-name').value.trim();

  if (!username || !password) {
    alert('Please enter your username and password.');
    return;
  }

  const users = getUsers();

  // REGISTER ACCOUNT
  if (isRegistering) {
    if (!name) {
      alert('Please enter your full name.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      $('confirm-password').focus();
      return;
    }

    if (users[username]) {
      alert('Username already exists. Please choose another.');
      return;
    }

    // Save the new account
    users[username] = {
      name: name,
      password: password
    };

    setUsers(users);

    // IMPORTANT: Do not automatically log in.
    alert('Account created successfully! Please log in.');

    // Return to the login page
    showLogin();

    // Keep the username for convenience
    $('auth-username').value = username;

    return;
  }

  // LOGIN ACCOUNT
  if (
    !users[username] ||
    users[username].password !== password
  ) {
    alert('Invalid username or password.');
    return;
  }

  currentUser = username;
  loadDashboard();
});

// ==================== LOAD DASHBOARD ====================
function loadDashboard() {
  if (!currentUser) return;

  const users = getUsers();

  $('user-display-name').textContent =
    users[currentUser].name || currentUser;

  $('auth-section').classList.add('hidden');
  $('dashboard-section').classList.remove('hidden');

  renderData();
}

// ==================== LOGOUT ====================
$('logout-btn').addEventListener('click', () => {
  showLogin();
});

// ==================== SET BUDGET ====================
$('budget-form').addEventListener('submit', (event) => {
  event.preventDefault();

  if (!currentUser) {
    alert('Please log in first.');
    return;
  }

  const input = $('monthly-budget');
  const limit = Number(input.value);

  if (
    input.value.trim() === '' ||
    !Number.isFinite(limit) ||
    limit <= 0
  ) {
    alert('Please enter a budget greater than zero.');
    return;
  }

  const data = getUserData(currentUser);

  data.budget = limit;
  setUserData(currentUser, data);

  renderData();

  alert('Monthly budget saved successfully!');
});

// ==================== ADD EXPENSE ====================
$('expense-form').addEventListener('submit', (event) => {
  event.preventDefault();

  if (!currentUser) {
    alert('Please log in first.');
    return;
  }

  const amount = Number($('expense-amount').value);
  const category = $('expense-category').value;
  const date = $('expense-date').value;
  const note = $('expense-note').value.trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    alert('Please enter an amount greater than zero.');
    return;
  }

  if (!category || !date) {
    alert('Please complete all required fields.');
    return;
  }

  const data = getUserData(currentUser);

  data.expenses.push({
    id: Date.now(),
    amount: amount,
    category: category,
    date: date,
    note: note
  });

  setUserData(currentUser, data);

  $('expense-form').reset();
  $('expense-date').valueAsDate = new Date();

  renderData();
});

// ==================== DELETE EXPENSE ====================
function deleteExpense(id) {
  if (!currentUser) return;

  const data = getUserData(currentUser);

  data.expenses = data.expenses.filter(
    expense => expense.id !== id
  );

  setUserData(currentUser, data);

  renderData();
}

// ==================== DATE HELPERS ====================
function parseExpenseDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

function isCurrentWeek(date) {
  const now = new Date();
  const monday = new Date(now);

  const daysFromMonday = (now.getDay() + 6) % 7;

  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);

  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return date >= monday && date <= sunday;
}

// ==================== RENDER DATA ====================
function renderData() {
  if (!currentUser) return;

  const data = getUserData(currentUser);

  const expenses = Array.isArray(data.expenses)
    ? data.expenses
    : [];

  const budget = Number(data.budget) || 0;
  const today = new Date();

  let dailyTotal = 0;
  let weeklyTotal = 0;
  let overallTotal = 0;
  let monthlyTotal = 0;

  $('monthly-budget').value = budget || '';

  const tbody = $('expense-list');
  tbody.innerHTML = '';

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  sortedExpenses.forEach((expense) => {
    const amount = Number(expense.amount) || 0;
    const expenseDate = parseExpenseDate(expense.date);

    overallTotal += amount;

    if (isSameDay(expenseDate, today)) {
      dailyTotal += amount;
    }

    if (isCurrentWeek(expenseDate)) {
      weeklyTotal += amount;
    }

    if (
      expenseDate.getFullYear() === today.getFullYear() &&
      expenseDate.getMonth() === today.getMonth()
    ) {
      monthlyTotal += amount;
    }

    const row = document.createElement('tr');

    const dateCell = document.createElement('td');
    dateCell.textContent = expense.date;

    const categoryCell = document.createElement('td');
    categoryCell.textContent = expense.category;

    const noteCell = document.createElement('td');
    noteCell.textContent = expense.note || '-';

    const amountCell = document.createElement('td');
    amountCell.textContent = peso.format(amount);

    const actionCell = document.createElement('td');
    const deleteButton = document.createElement('button');

    deleteButton.type = 'button';
    deleteButton.className = 'btn-danger';
    deleteButton.textContent = 'Delete';

    deleteButton.addEventListener('click', () => {
      deleteExpense(expense.id);
    });

    actionCell.appendChild(deleteButton);

    row.append(
      dateCell,
      categoryCell,
      noteCell,
      amountCell,
      actionCell
    );

    tbody.appendChild(row);
  });

  // Empty expense message
  $('empty-message').style.display =
    expenses.length === 0 ? 'block' : 'none';

  // Expense totals
  $('daily-total').textContent = peso.format(dailyTotal);
  $('weekly-total').textContent = peso.format(weeklyTotal);
  $('overall-total').textContent = peso.format(overallTotal);

  // Monthly budget progress
  const percentage = budget > 0
    ? (monthlyTotal / budget) * 100
    : 0;

  const remaining = budget - monthlyTotal;

  $('budget-progress-bar').style.width =
    `${Math.min(percentage, 100)}%`;

  $('budget-progress-bar').style.backgroundColor =
    percentage >= 100
      ? 'var(--danger)'
      : 'var(--accent)';

  $('budget-status-text').textContent =
    `Spent: ${peso.format(monthlyTotal)} / ${peso.format(budget)} ` +
    `(${percentage.toFixed(1)}%) | Remaining: ${peso.format(remaining)}`;
}

// ==================== INITIAL SETUP ====================
$('expense-date').valueAsDate = new Date();

showLogin();