const form = document.querySelector('#transaction-form');
const transactionList = document.querySelector('#transaction-list');
const searchInput = document.querySelector('#search-transaction');
const typeFilter = document.querySelector('#filter-type');
const categoryFilter = document.querySelector('#filter-category');
const dateFilter = document.querySelector('#filter-date');
const sortSelect = document.querySelector('#sort-transactions');

let transactions = JSON.parse(localStorage.getItem('financeTransactions')) || [];
let editingId = null;

function saveTransactions() {
	localStorage.setItem('financeTransactions', JSON.stringify(transactions));
}

function updateSummary() {
	const income = transactions
		.filter((transaction) => transaction.type === 'income')
		.reduce((total, transaction) => total + transaction.amount, 0);
	const expense = transactions
		.filter((transaction) => transaction.type === 'expense')
		.reduce((total, transaction) => total + transaction.amount, 0);

	document.querySelector('#total-income').textContent = `$${income.toFixed(2)}`;
	document.querySelector('#total-expense').textContent = `$${expense.toFixed(2)}`;
	document.querySelector('#total-balance').textContent = `$${(income - expense).toFixed(2)}`;
}

function getVisibleTransactions() {
	const searchTerm = searchInput.value.trim().toLowerCase();
	const visibleTransactions = transactions.filter((transaction) => {
		const matchesSearch = transaction.title.toLowerCase().includes(searchTerm);
		const matchesType = typeFilter.value === 'all' || transaction.type === typeFilter.value;
		const matchesCategory = categoryFilter.value === 'all' || transaction.category === categoryFilter.value;
		const matchesDate = !dateFilter.value || transaction.date === dateFilter.value;
		return matchesSearch && matchesType && matchesCategory && matchesDate;
	});

	return visibleTransactions.sort((first, second) => {
		if (sortSelect.value === 'oldest') return new Date(first.date) - new Date(second.date);
		if (sortSelect.value === 'highest') return second.amount - first.amount;
		if (sortSelect.value === 'lowest') return first.amount - second.amount;
		return new Date(second.date) - new Date(first.date);
	});
}

function renderTransactions() {
	const visibleTransactions = getVisibleTransactions();
	transactionList.innerHTML = '';

	if (visibleTransactions.length === 0) {
		transactionList.innerHTML = '<p class="empty-state">No transactions found.</p>';
		return;
	}

	visibleTransactions.forEach((transaction) => {
		const card = document.createElement('article');
		card.className = `transaction-card ${transaction.type}`;
		card.innerHTML = `
			<div>
				<h3>${transaction.title}</h3>
				<p>${transaction.category} &middot; ${transaction.date}</p>
			</div>
			<strong>${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}</strong>
			<div class="transaction-actions">
				<button type="button" data-action="edit" data-id="${transaction.id}">Edit</button>
				<button type="button" data-action="delete" data-id="${transaction.id}">Delete</button>
			</div>
		`;
		transactionList.append(card);
	});
}

function resetForm() {
	form.reset();
	editingId = null;
	form.querySelector('button[type="submit"]').textContent = 'Add Transaction';
}

form.addEventListener('submit', (event) => {
	event.preventDefault();
	const data = new FormData(form);
	const transaction = {
		id: editingId || Date.now().toString(),
		title: data.get('title').trim(),
		amount: Number(data.get('amount')),
		category: data.get('category'),
		date: data.get('date'),
		type: data.get('type')
	};

	if (!transaction.title || transaction.amount <= 0 || !transaction.date || !transaction.type) return;

	if (editingId) {
		transactions = transactions.map((item) => item.id === editingId ? transaction : item);
	} else {
		transactions.push(transaction);
	}

	saveTransactions();
	updateSummary();
	renderTransactions();
	resetForm();
});

transactionList.addEventListener('click', (event) => {
	const button = event.target.closest('button[data-action]');
	if (!button) return;

	const transaction = transactions.find((item) => item.id === button.dataset.id);
	if (!transaction) return;

	if (button.dataset.action === 'delete') {
		if (!window.confirm('Delete this transaction?')) return;
		transactions = transactions.filter((item) => item.id !== transaction.id);
		saveTransactions();
		updateSummary();
		renderTransactions();
		return;
	}

	editingId = transaction.id;
	form.elements.title.value = transaction.title;
	form.elements.amount.value = transaction.amount;
	form.elements.category.value = transaction.category;
	form.elements.date.value = transaction.date;
	form.elements.type.value = transaction.type;
	form.querySelector('button[type="submit"]').textContent = 'Update Transaction';
	form.scrollIntoView({ behavior: 'smooth' });
});

[searchInput, typeFilter, categoryFilter, dateFilter, sortSelect]
	.forEach((control) => control.addEventListener('input', renderTransactions));

updateSummary();
renderTransactions();
