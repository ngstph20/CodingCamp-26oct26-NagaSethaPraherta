// ---------- Constants & state ----------
const TX_KEY = 'ebv-transactions';
const LIMIT_KEY = 'ebv-limit';
const THEME_KEY = 'ebv-theme';
const CATEGORIES = ['Food', 'Transport', 'Fun'];
const COLORS = { Food: '#d99a2b', Transport: '#3a6fb0', Fun: '#b04f7e' };

let transactions = readJSON(TX_KEY, []);
let limit = Number(localStorage.getItem(LIMIT_KEY)) || 0;
let selectedMonth = monthKey(new Date());
let chart = null;

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const form = $('expense-form');
const nameInput = $('item-name');
const amountInput = $('amount');
const categoryInput = $('category');
const formError = $('form-error');
const list = $('list');
const listEmpty = $('list-empty');
const totalEl = $('total');
const balanceCard = $('balance-card');
const limitNote = $('limit-note');
const limitInput = $('limit-input');
const canvas = $('chart');
const chartEmpty = $('chart-empty');
const monthSelect = $('month-select');
const monthTotal = $('month-total');
const monthCount = $('month-count');
const breakdown = $('breakdown');
const themeToggle = $('theme-toggle');

// ---------- Helpers ----------
function readJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch (e) {
    return fallback;
  }
}

function save() {
  try {
    localStorage.setItem(TX_KEY, JSON.stringify(transactions));
  } catch (e) { /* storage full or blocked: app still works for this session */ }
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});
const fmt = (n) => rupiah.format(n);

const sum = (items) => items.reduce((total, t) => total + t.amount, 0);

function pad(n) { return String(n).padStart(2, '0'); }
function monthKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
function today() {
  const d = new Date();
  return monthKey(d) + '-' + pad(d.getDate());
}
function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function categoryTotals(items) {
  const totals = { Food: 0, Transport: 0, Fun: 0 };
  items.forEach((t) => { totals[t.category] += t.amount; });
  return totals;
}

// ---------- Render ----------
function render() {
  const total = sum(transactions);
  const over = limit > 0 && total > limit;

  totalEl.textContent = fmt(total);
  balanceCard.classList.toggle('over', over);
  limitNote.hidden = limit <= 0;
  if (limit > 0) {
    limitNote.textContent = over
      ? 'Over your limit by ' + fmt(total - limit) + ' (limit ' + fmt(limit) + ')'
      : fmt(limit - total) + ' left before your ' + fmt(limit) + ' limit';
  }

  renderList();
  renderChart();
  renderMonthly();
}

function renderList() {
  listEmpty.hidden = transactions.length > 0;
  list.replaceChildren(...transactions.map((t) => {
    const li = document.createElement('li');
    li.className = 'item';

    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = COLORS[t.category];

    const main = document.createElement('div');
    main.className = 'item-main';
    const name = document.createElement('span');
    name.className = 'item-name';
    name.textContent = t.name;
    const cat = document.createElement('span');
    cat.className = 'item-cat';
    cat.textContent = t.category + ' \u00b7 ' + t.date;
    main.append(name, cat);

    const amount = document.createElement('span');
    amount.className = 'item-amount';
    amount.textContent = fmt(t.amount);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'item-del';
    del.textContent = 'Delete';
    del.setAttribute('aria-label', 'Delete ' + t.name);
    del.addEventListener('click', () => removeTransaction(t.id));

    li.append(dot, main, amount, del);
    return li;
  }));
}

function renderChart() {
  const hasData = transactions.length > 0;
  chartEmpty.hidden = hasData;
  canvas.hidden = !hasData;

  if (!hasData) {
    if (chart) { chart.destroy(); chart = null; }
    return;
  }
  if (typeof Chart === 'undefined') {
    chartEmpty.hidden = false;
    chartEmpty.textContent = 'The chart could not load. Check your internet connection.';
    canvas.hidden = true;
    return;
  }

  const totals = categoryTotals(transactions);
  const data = CATEGORIES.map((c) => totals[c]);

  if (chart) {
    chart.data.datasets[0].data = data;
    chart.update();
    return;
  }

  const styles = getComputedStyle(document.documentElement);
  chart = new Chart(canvas, {
    type: 'pie',
    data: {
      labels: CATEGORIES,
      datasets: [{
        data: data,
        backgroundColor: CATEGORIES.map((c) => COLORS[c]),
        borderColor: styles.getPropertyValue('--surface').trim(),
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { color: styles.getPropertyValue('--text').trim() } },
        tooltip: { callbacks: { label: (ctx) => ' ' + ctx.label + ': ' + fmt(ctx.parsed) } }
      }
    }
  });
}

function renderMonthly() {
  const months = Array.from(new Set(transactions.map((t) => t.date.slice(0, 7))));
  const current = monthKey(new Date());
  if (!months.includes(current)) months.push(current);
  months.sort().reverse();
  if (!months.includes(selectedMonth)) selectedMonth = current;

  monthSelect.replaceChildren(...months.map((m) => {
    const option = document.createElement('option');
    option.value = m;
    option.textContent = monthLabel(m);
    option.selected = m === selectedMonth;
    return option;
  }));

  const items = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const total = sum(items);
  monthTotal.textContent = fmt(total);
  monthTotal.classList.toggle('over', limit > 0 && total > limit);
  monthCount.textContent = items.length + (items.length === 1 ? ' transaction' : ' transactions');

  const totals = categoryTotals(items);
  breakdown.replaceChildren(...CATEGORIES.map((c) => {
    const li = document.createElement('li');
    const head = document.createElement('div');
    head.className = 'break-head';
    const label = document.createElement('span');
    label.textContent = c;
    const value = document.createElement('span');
    value.textContent = fmt(totals[c]);
    head.append(label, value);

    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('span');
    fill.style.width = (total > 0 ? (totals[c] / total) * 100 : 0) + '%';
    fill.style.background = COLORS[c];
    bar.append(fill);

    li.append(head, bar);
    return li;
  }));
}

// ---------- Actions ----------
function addTransaction(e) {
  e.preventDefault();
  const name = nameInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;

  if (!name || !amountInput.value || !category) {
    return showError('Please fill in item name, amount, and category.');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return showError('Amount must be greater than 0.');
  }

  transactions.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    name: name,
    amount: amount,
    category: category,
    date: today()
  });
  save();
  form.reset();
  formError.hidden = true;
  render();
  nameInput.focus();
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function removeTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  save();
  render();
}

function saveLimit() {
  const value = Number(limitInput.value);
  limit = Number.isFinite(value) && value > 0 ? value : 0;
  try { localStorage.setItem(LIMIT_KEY, String(limit)); } catch (e) { /* ignore */ }
  render();
}

// ---------- Theme ----------
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  if (chart) { chart.destroy(); chart = null; renderChart(); }
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
  applyTheme(next);
}

// ---------- Init ----------
form.addEventListener('submit', addTransaction);
$('limit-save').addEventListener('click', saveLimit);
themeToggle.addEventListener('click', toggleTheme);
monthSelect.addEventListener('change', () => {
  selectedMonth = monthSelect.value;
  renderMonthly();
});

const savedTheme = localStorage.getItem(THEME_KEY);
applyTheme(savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
if (limit > 0) limitInput.value = limit;
render();
