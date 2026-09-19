const eventList = document.querySelector('#event-list');
const bookingList = document.querySelector('#booking-list');
const searchEvents = document.querySelector('#search-events');
const categoryFilter = document.querySelector('#category-filter');
const priceFilter = document.querySelector('#price-filter');
const minPrice = document.querySelector('#min-price');
const maxPrice = document.querySelector('#max-price');
const dateFilter = document.querySelector('#date-filter');
const sortEvents = document.querySelector('#sort-events');
const eventModal = document.querySelector('#event-modal');
const bookingModal = document.querySelector('#booking-modal');
const eventDetails = document.querySelector('#event-details');
let events = JSON.parse(localStorage.getItem('eventHubEvents')) || Array.from({ length: 25 }, (_, index) => ({
    id: index + 1,
    name: ['Web Summit', 'Indie Concert', 'Design Workshop', 'City Run', 'Learning Day'][index % 5],
    organizer: ['Bright Labs', 'Open Stage', 'Makers Club'][index % 3],
    category: ['Tech', 'Music', 'Workshop', 'Sports', 'Education'][index % 5],
    date: new Date(Date.now() + (index + 1) * 86400000).toISOString().slice(0, 10),
    venue: ['Main Hall', 'River Center', 'Online'][index % 3],
    price: index % 4 === 0 ? 0 : 15 + index,
    seats: 40 + index
}));
let bookings = JSON.parse(localStorage.getItem('eventHubBookings')) || [];
let selectedEvent = null;
let editingBookingId = null;
let editingOriginalTickets = 0;
const savedPreferences = JSON.parse(localStorage.getItem('eventHubPreferences')) || {};

categoryFilter.value = savedPreferences.category || 'all';
priceFilter.value = savedPreferences.price || 'all';
minPrice.value = savedPreferences.minimum || '';
maxPrice.value = savedPreferences.maximum || '';
dateFilter.value = savedPreferences.date || '';
sortEvents.value = savedPreferences.sort || 'newest';

function save() {
    localStorage.setItem('eventHubEvents', JSON.stringify(events));
    localStorage.setItem('eventHubBookings', JSON.stringify(bookings));
}

function visibleEvents() {
    const term = searchEvents.value.toLowerCase().trim();
    const result = events.filter((event) => {
        const textMatch = `${event.name} ${event.organizer} ${event.venue}`.toLowerCase().includes(term);
        const categoryMatch = categoryFilter.value === 'all' || event.category === categoryFilter.value;
        const priceMatch = priceFilter.value === 'all' || (priceFilter.value === 'free' ? event.price === 0 : event.price > 0);
        const minimumMatch = !minPrice.value || event.price >= Number(minPrice.value);
        const maximumMatch = !maxPrice.value || event.price <= Number(maxPrice.value);
        const dateMatch = !dateFilter.value || event.date === dateFilter.value;
        return textMatch && categoryMatch && priceMatch && minimumMatch && maximumMatch && dateMatch;
    });
    return result.sort((a, b) => sortEvents.value === 'oldest' ? a.date.localeCompare(b.date) : sortEvents.value === 'low' ? a.price - b.price : sortEvents.value === 'high' ? b.price - a.price : sortEvents.value === 'az' ? a.name.localeCompare(b.name) : b.date.localeCompare(a.date));
}

function renderEvents() {
    const result = visibleEvents();
    eventList.innerHTML = result.length ? result.map((event) => `<article class="event-card"><img src="https://picsum.photos/seed/event-${event.id}/320/180" alt="${event.name} event"><div><h3>${event.name}</h3><p>${event.organizer} | ${event.category} | ${event.date}</p><p>${event.venue} | ${event.price ? `$${event.price}` : 'Free'} | ${event.seats} seats</p></div><div class="event-actions"><button type="button" data-id="${event.id}">View event</button><button type="button" data-book="${event.id}">Book now</button></div></article>`).join('') : '<p class="empty-state">No events found.</p>';
}

function renderBookings() {
    bookingList.innerHTML = bookings.length ? bookings.map((booking) => `<article class="booking-card"><h3>${booking.eventName}</h3><p>Booking ID: ${booking.id} | ${booking.date}</p><p>Tickets: ${booking.tickets} | Status: ${booking.status}</p><button type="button" data-edit="${booking.id}">Edit booking</button><button type="button" data-cancel="${booking.id}">Cancel booking</button></article>`).join('') : '<p class="empty-state">No bookings yet.</p>';
    document.querySelector('#total-events').textContent = events.length;
    document.querySelector('#upcoming-events').textContent = events.filter((event) => event.date >= new Date().toISOString().slice(0, 10)).length;
    document.querySelector('#total-bookings').textContent = bookings.length;
    document.querySelector('#today-events').textContent = events.filter((event) => event.date === new Date().toISOString().slice(0, 10)).length;
}

eventList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    selectedEvent = events.find((item) => item.id === Number(button.dataset.id));
    eventDetails.innerHTML = `<h2>${selectedEvent.name}</h2><p>Full description: Join this ${selectedEvent.category.toLowerCase()} event for practical ideas, conversation, and community.</p><p>Organizer details: ${selectedEvent.organizer} hosts local experiences and welcomes new attendees.</p><p>Schedule: ${selectedEvent.date}, 6:00 PM</p><p>Venue: ${selectedEvent.venue}</p><p>Speakers: Community guests</p><p>Available seats: ${selectedEvent.seats}</p><p>Ticket price: ${selectedEvent.price ? `$${selectedEvent.price}` : 'Free'}</p>`;
    document.querySelector('#book-button').disabled = selectedEvent.seats === 0;
    eventModal.classList.remove('hidden');
});

eventList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-book]');
    if (!button) return;
    selectedEvent = events.find((item) => item.id === Number(button.dataset.book));
    editingBookingId = null;
    document.querySelector('#booking-form button[type="submit"]').textContent = 'Confirm booking';
    bookingModal.classList.remove('hidden');
});

document.querySelector('#book-button').addEventListener('click', () => { eventModal.classList.add('hidden'); editingBookingId = null; document.querySelector('#booking-form button[type="submit"]').textContent = 'Confirm booking'; bookingModal.classList.remove('hidden'); });
document.querySelector('#booking-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const tickets = Number(data.get('tickets'));
    if (tickets > selectedEvent.seats) return alert('Not enough seats available.');
    selectedEvent.seats -= tickets;
    if (editingBookingId) {
        const booking = bookings.find((item) => item.id === editingBookingId);
        booking.tickets = tickets;
        booking.name = data.get('name');
        booking.email = data.get('email');
        booking.phone = data.get('phone');
    } else {
        bookings.push({ id: `BK-${Date.now()}`, eventId: selectedEvent.id, eventName: selectedEvent.name, date: selectedEvent.date, tickets, name: data.get('name'), email: data.get('email'), phone: data.get('phone'), status: 'Confirmed' });
    }
    editingBookingId = null;
    editingOriginalTickets = 0;
    save(); renderEvents(); renderBookings(); event.target.reset(); bookingModal.classList.add('hidden');
});

bookingList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-cancel], button[data-edit]');
    if (!button) return;
    const booking = bookings.find((item) => item.id === button.dataset.cancel);
    if (button.dataset.edit) {
        const existingBooking = bookings.find((item) => item.id === button.dataset.edit);
        selectedEvent = events.find((item) => item.id === existingBooking.eventId) || events.find((item) => item.name === existingBooking.eventName);
        selectedEvent.seats += existingBooking.tickets;
        editingBookingId = existingBooking.id;
        editingOriginalTickets = existingBooking.tickets;
        document.querySelector('#booking-form').elements.name.value = existingBooking.name || '';
        document.querySelector('#booking-form').elements.email.value = existingBooking.email || '';
        document.querySelector('#booking-form').elements.phone.value = existingBooking.phone || '';
        document.querySelector('#booking-form').elements.tickets.value = existingBooking.tickets;
        document.querySelector('#booking-form button[type="submit"]').textContent = 'Update booking';
        bookingModal.classList.remove('hidden');
        return;
    }
    const eventItem = events.find((item) => item.id === booking.eventId) || events.find((item) => item.name === booking.eventName);
    if (eventItem) eventItem.seats += booking.tickets;
    bookings = bookings.filter((item) => item.id !== booking.id);
    save(); renderEvents(); renderBookings();
});

document.querySelectorAll('.close').forEach((button) => button.addEventListener('click', () => {
    if (editingBookingId && selectedEvent) {
        selectedEvent.seats -= editingOriginalTickets;
        save();
        editingBookingId = null;
        editingOriginalTickets = 0;
    }
    eventModal.classList.add('hidden');
    bookingModal.classList.add('hidden');
}));
[searchEvents, categoryFilter, priceFilter, minPrice, maxPrice, dateFilter, sortEvents].forEach((control) => control.addEventListener('input', () => {
    localStorage.setItem('eventHubPreferences', JSON.stringify({ category: categoryFilter.value, price: priceFilter.value, minimum: minPrice.value, maximum: maxPrice.value, date: dateFilter.value, sort: sortEvents.value }));
    renderEvents();
}));
renderBookings();
eventList.innerHTML = '<p class="skeleton">Loading events...</p>';
setTimeout(renderEvents, 250);
