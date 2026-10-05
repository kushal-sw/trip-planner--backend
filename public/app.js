/**
 * TripPlanner Web Application Logic
 * Integrates REST API and Socket.io real-time collaboration
 */

let state = {
  token: null,
  user: null,
  currentTripId: null,
  currentItineraryId: null,
  trips: [],
  socket: null,
};

// DOM Elements
const tripsList = document.getElementById('tripsList');
const selectedTripSection = document.getElementById('selectedTripSection');
const detailTripDest = document.getElementById('detailTripDest');
const detailTripTitle = document.getElementById('detailTripTitle');
const detailTripDates = document.getElementById('detailTripDates');
const daysList = document.getElementById('daysList');
const expenseTripSelect = document.getElementById('expenseTripSelect');
const shareTripSelect = document.getElementById('shareTripSelect');
const liveRoomInput = document.getElementById('liveRoomInput');
const liveNoteArea = document.getElementById('liveNoteArea');
const liveEventStream = document.getElementById('liveEventStream');
const toastContainer = document.getElementById('toastContainer');
const socketStatus = document.getElementById('socketStatus');
const socketText = document.getElementById('socketText');
const userNamePill = document.getElementById('userName');

// Helper: Show Toast Notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

// API Helper
async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(endpoint, { ...options, headers });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'API request failed');
    }
    return json;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
}

// Initialize Auth
async function initAuth() {
  try {
    // Attempt auto-login demo user Alex
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@example.com', password: 'userPassword123' }),
    });
    const json = await res.json();

    if (json.success && json.data.token) {
      state.token = json.data.token;
      state.user = json.data.user;
      userNamePill.innerText = state.user.name;
      showToast(`Welcome back, ${state.user.name}!`);
      initSocket();
      loadTrips();
      loadBookings();
      loadWeather('Tokyo');
      loadTips();
      loadNotifications();
    }
  } catch (err) {
    console.error('Auto-login error:', err);
  }
}

// Initialize Socket.io
function initSocket() {
  if (state.socket) state.socket.disconnect();

  state.socket = io({
    auth: { token: state.token },
  });

  state.socket.on('connect', () => {
    socketStatus.style.borderColor = 'var(--accent-green)';
    socketText.innerText = 'Live Sync Active';
    addLiveLog('System', 'Socket connected to collaborative server');
  });

  state.socket.on('disconnect', () => {
    socketStatus.style.borderColor = 'var(--accent-rose)';
    socketText.innerText = 'Sync Disconnected';
    addLiveLog('System', 'Socket disconnected');
  });

  state.socket.on('itinerary-updated', ({ updatedBy, data }) => {
    addLiveLog(updatedBy.name, 'Updated Itinerary Note', data.notes || JSON.stringify(data));
    if (data.notes && liveNoteArea) {
      liveNoteArea.value = data.notes;
    }
  });

  state.socket.on('activity-added', ({ addedBy, activity }) => {
    addLiveLog(addedBy, 'Added Activity', activity.name || 'New activity');
    if (state.currentTripId) loadItineraries(state.currentTripId);
  });

  state.socket.on('room-users-updated', ({ users }) => {
    addLiveLog('Presence', `Collaborators in room: ${users.map((u) => u.name).join(', ')}`);
  });
}

function addLiveLog(author, action, detail = '') {
  if (!liveEventStream) return;
  const time = new Date().toLocaleTimeString();
  const item = document.createElement('div');
  item.style.padding = '0.3rem 0';
  item.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
  item.innerHTML = `<span style="color:var(--text-dim);">[${time}]</span> <strong style="color:var(--accent-cyan);">${author}</strong>: ${action} ${
    detail ? `<span style="color:var(--text-muted);">(${detail})</span>` : ''
  }`;
  if (liveEventStream.children.length === 1 && liveEventStream.children[0].innerText.includes('Socket.io ready')) {
    liveEventStream.innerHTML = '';
  }
  liveEventStream.prepend(item);
}

// --- TAB 1: TRIPS & ITINERARIES ---

async function loadTrips() {
  try {
    const res = await api('/api/trips');
    state.trips = res.data.trips || [];

    expenseTripSelect.innerHTML = '<option value="">Select a trip...</option>';
    shareTripSelect.innerHTML = '<option value="">Select a trip...</option>';

    if (state.trips.length === 0) {
      tripsList.innerHTML = `<div style="color: var(--text-dim); padding: 1rem;">No trips found. Click "Plan New Trip" above!</div>`;
      return;
    }

    tripsList.innerHTML = state.trips
      .map(
        (t) => `
        <div class="trip-card ${state.currentTripId === t._id ? 'selected' : ''}" onclick="selectTrip('${t._id}')">
          <div class="trip-dest">${t.destination}</div>
          <div class="trip-name">${t.title}</div>
          <div class="trip-meta">
            <span>📅 ${new Date(t.startDate).toLocaleDateString()} - ${new Date(t.endDate).toLocaleDateString()}</span>
            <span style="color:var(--accent-green); font-weight:700;">₹${(t.budget || 0).toLocaleString()}</span>
          </div>
        </div>
      `
      )
      .join('');

    state.trips.forEach((t) => {
      const opt1 = document.createElement('option');
      opt1.value = t._id;
      opt1.innerText = `${t.title} (${t.destination})`;
      expenseTripSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = t._id;
      opt2.innerText = `${t.title} (${t.destination})`;
      shareTripSelect.appendChild(opt2);
    });

    if (!state.currentTripId && state.trips.length > 0) {
      selectTrip(state.trips[0]._id);
    }
  } catch (err) {
    console.error('Failed to load trips:', err);
  }
}

async function selectTrip(tripId) {
  state.currentTripId = tripId;
  const trip = state.trips.find((t) => t._id === tripId);
  if (!trip) return;

  // Highlight selected card
  document.querySelectorAll('.trip-card').forEach((el) => el.classList.remove('selected'));
  const foundCard = Array.from(document.querySelectorAll('.trip-card')).find((c) =>
    c.innerHTML.includes(trip.title)
  );
  if (foundCard) foundCard.classList.add('selected');

  selectedTripSection.style.display = 'block';
  detailTripDest.innerText = trip.destination;
  detailTripTitle.innerText = trip.title;
  detailTripDates.innerText = `📅 ${new Date(trip.startDate).toLocaleDateString()} to ${new Date(
    trip.endDate
  ).toLocaleDateString()} | Budget: ₹${(trip.budget || 0).toLocaleString()}`;

  expenseTripSelect.value = tripId;
  shareTripSelect.value = tripId;

  loadItineraries(tripId);
  loadTripExpenses(tripId);
  loadSharedBuddies(tripId);
}

async function loadItineraries(tripId) {
  try {
    const res = await api(`/api/itineraries/trip/${tripId}`);
    const days = res.data || [];

    if (days.length === 0) {
      daysList.innerHTML = `<div style="color: var(--text-dim); padding: 1.5rem; text-align: center;">No days added to this itinerary yet. Click "Add Day Schedule"!</div>`;
      return;
    }

    state.currentItineraryId = days[0]._id;
    liveRoomInput.value = `itinerary_${days[0]._id}`;
    if (state.socket) {
      state.socket.emit('join-itinerary', { itineraryId: days[0]._id });
    }

    // Fetch activities for each day
    daysList.innerHTML = '';
    for (const d of days) {
      const actRes = await api(`/api/activities/itinerary/${d._id}`);
      const activities = actRes.data || [];

      const dayEl = document.createElement('div');
      dayEl.className = 'day-box';
      dayEl.innerHTML = `
        <div class="day-header">
          <div>
            <span class="day-title">Day ${d.dayNumber}: ${d.title}</span>
            <span style="font-size:0.75rem; color:var(--text-dim); margin-left:0.5rem;">(${new Date(d.date).toLocaleDateString()})</span>
          </div>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-secondary btn-sm" onclick="openAddActivityModal('${d._id}')">➕ Activity</button>
            <button class="btn btn-danger btn-sm" onclick="deleteDay('${d._id}')">🗑️</button>
          </div>
        </div>
        ${d.notes ? `<p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">📝 ${d.notes}</p>` : ''}
        <div class="activities-sublist">
          ${
            activities.length === 0
              ? `<span style="font-size:0.75rem; color:var(--text-dim);">No activities scheduled yet.</span>`
              : activities
                  .map(
                    (a) => `
              <div class="activity-item">
                <div>
                  <strong style="color:var(--text-main);">${a.name}</strong>
                  <span class="activity-badge">${a.type}</span>
                  ${a.startTime ? `<span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.4rem;">⏰ ${a.startTime}</span>` : ''}
                </div>
                <div>
                  ${a.cost ? `<span style="color:var(--accent-green); font-size:0.8rem; margin-right:0.5rem;">₹${a.cost}</span>` : ''}
                  <button class="btn btn-danger btn-sm" style="padding:0.15rem 0.4rem;" onclick="deleteActivity('${a._id}')">✕</button>
                </div>
              </div>
            `
                  )
                  .join('')
          }
        </div>
      `;
      daysList.appendChild(dayEl);
    }
  } catch (err) {
    console.error('Failed to load itineraries:', err);
  }
}

// Download Offline Bundle
document.getElementById('btnDownloadOffline').addEventListener('click', async () => {
  if (!state.currentTripId) return;
  try {
    const res = await api(`/api/trips/${state.currentTripId}/offline`);
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-bundle-${state.currentTripId}.json`;
    a.click();
    showToast('Offline Trip Bundle downloaded successfully!');
  } catch (err) {
    showToast('Failed to download offline bundle', 'error');
  }
});

// Modals: Trip
const modalNewTrip = document.getElementById('modalNewTrip');
document.getElementById('btnNewTrip').addEventListener('click', () => modalNewTrip.classList.add('open'));
document.getElementById('btnCloseTripModal').addEventListener('click', () => modalNewTrip.classList.remove('open'));

document.getElementById('btnCreateTripSubmit').addEventListener('click', async () => {
  const title = document.getElementById('tripTitleInput').value.trim();
  const destination = document.getElementById('tripDestInput').value.trim();
  const startDate = document.getElementById('tripStartInput').value;
  const endDate = document.getElementById('tripEndInput').value;
  const budget = parseFloat(document.getElementById('tripBudgetInput').value) || 0;

  if (!title || !destination) return showToast('Please enter title and destination', 'error');

  try {
    const res = await api('/api/trips', {
      method: 'POST',
      body: JSON.stringify({ title, destination, startDate, endDate, budget }),
    });
    modalNewTrip.classList.remove('open');
    showToast('Trip created successfully!');
    await loadTrips();
    selectTrip(res.data._id);
  } catch (err) {}
});

// Add Day
document.getElementById('btnAddDay').addEventListener('click', async () => {
  if (!state.currentTripId) return;
  const trip = state.trips.find((t) => t._id === state.currentTripId);
  const currentDaysCount = daysList.querySelectorAll('.day-box').length;
  const nextDay = currentDaysCount + 1;

  try {
    await api('/api/itineraries', {
      method: 'POST',
      body: JSON.stringify({
        tripId: state.currentTripId,
        dayNumber: nextDay,
        date: trip ? trip.startDate : new Date().toISOString(),
        title: `Day ${nextDay} Exploration`,
      }),
    });
    showToast(`Day ${nextDay} schedule added!`);
    loadItineraries(state.currentTripId);
  } catch (err) {}
});

// Delete Day
window.deleteDay = async (id) => {
  if (!confirm('Are you sure you want to delete this day and all its activities?')) return;
  try {
    await api(`/api/itineraries/${id}`, { method: 'DELETE' });
    showToast('Day schedule deleted');
    loadItineraries(state.currentTripId);
  } catch (err) {}
};

// Activity Modal
const modalNewActivity = document.getElementById('modalNewActivity');
window.openAddActivityModal = (itinId) => {
  document.getElementById('actItineraryId').value = itinId;
  modalNewActivity.classList.add('open');
};
document.getElementById('btnCloseActivityModal').addEventListener('click', () => modalNewActivity.classList.remove('open'));

document.getElementById('btnCreateActivitySubmit').addEventListener('click', async () => {
  const itineraryId = document.getElementById('actItineraryId').value;
  const name = document.getElementById('actNameInput').value.trim();
  const type = document.getElementById('actTypeInput').value;
  const cost = parseFloat(document.getElementById('actCostInput').value) || 0;
  const startTime = document.getElementById('actStartInput').value.trim();
  const endTime = document.getElementById('actEndInput').value.trim();

  if (!name) return showToast('Please enter an activity name', 'error');

  try {
    await api('/api/activities', {
      method: 'POST',
      body: JSON.stringify({ itineraryId, name, type, cost, startTime, endTime }),
    });
    modalNewActivity.classList.remove('open');
    showToast('Activity added to schedule!');
    document.getElementById('actNameInput').value = '';
    loadItineraries(state.currentTripId);

    // Broadcast over socket
    if (state.socket) {
      state.socket.emit('activity-added', {
        itineraryId,
        activity: { name, type, cost, startTime },
      });
    }
  } catch (err) {}
});

window.deleteActivity = async (id) => {
  if (!confirm('Delete this activity?')) return;
  try {
    await api(`/api/activities/${id}`, { method: 'DELETE' });
    showToast('Activity removed');
    loadItineraries(state.currentTripId);
  } catch (err) {}
};

// --- TAB 2: FLIGHTS & HOTEL BOOKINGS ---

const searchType = document.getElementById('searchType');
const lblFrom = document.getElementById('lblFrom');
const searchFrom = document.getElementById('searchFrom');
const searchResults = document.getElementById('searchResults');
const bookingsList = document.getElementById('bookingsList');

searchType.addEventListener('change', () => {
  if (searchType.value === 'hotel') {
    lblFrom.style.display = 'none';
    searchFrom.style.display = 'none';
  } else {
    lblFrom.style.display = 'block';
    searchFrom.style.display = 'block';
  }
});

document.getElementById('btnSearch').addEventListener('click', async () => {
  const type = searchType.value;
  const to = document.getElementById('searchTo').value.trim();
  const date = document.getElementById('searchDate').value;

  searchResults.innerHTML = `<div style="color:var(--text-dim);">Searching ${type}s...</div>`;

  try {
    let endpoint =
      type === 'flight'
        ? `/api/flights?from=${searchFrom.value}&to=${to}&date=${date}`
        : `/api/hotels?destination=${to}&checkIn=${date}`;

    const res = await api(endpoint);
    const items = res.data || [];

    if (items.length === 0) {
      searchResults.innerHTML = `<div style="color:var(--text-dim);">No results found.</div>`;
      return;
    }

    searchResults.innerHTML = items
      .map((item) => {
        const title = type === 'flight' ? `${item.airline} (${item.flightNumber})` : item.name;
        const sub =
          type === 'flight'
            ? `${item.departureTime} → ${item.arrivalTime} (${item.duration})`
            : `⭐ ${item.rating} Stars | ${item.amenities ? item.amenities.slice(0, 3).join(', ') : ''}`;
        const price = item.price;

        return `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:8px; padding:0.65rem 0.85rem; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; font-size:0.85rem; color:var(--text-main);">${title}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${sub}</div>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-weight:700; color:var(--accent-green); font-size:0.9rem;">₹${price.toLocaleString()}</span>
            <button class="btn btn-primary btn-sm" onclick='bookItem("${type}", ${JSON.stringify(item).replace(/'/g, "\\'")})'>Book</button>
          </div>
        </div>
      `;
      })
      .join('');
  } catch (err) {
    searchResults.innerHTML = `<div style="color:var(--accent-rose);">Search failed.</div>`;
  }
});

window.bookItem = async (type, details) => {
  if (!state.currentTripId) {
    return showToast('Please select a trip first under "Trips" tab!', 'error');
  }

  try {
    const res = await api('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        tripId: state.currentTripId,
        type,
        totalAmount: details.price,
        currency: 'INR',
        details,
      }),
    });

    showToast(`Booking ${res.data.bookingRef} confirmed! Expense recorded & push notification sent!`);
    loadBookings();
    loadTripExpenses(state.currentTripId);
    loadNotifications();
  } catch (err) {}
};

async function loadBookings() {
  try {
    const res = await api('/api/bookings');
    const bookings = res.data.bookings || [];

    if (bookings.length === 0) {
      bookingsList.innerHTML = `<div style="color:var(--text-dim); font-size:0.85rem;">No active bookings found.</div>`;
      return;
    }

    bookingsList.innerHTML = bookings
      .map(
        (b) => `
      <div style="background:#090e1a; border:1px solid var(--border-color); border-radius:8px; padding:0.75rem;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-size:0.7rem; font-weight:700; color:var(--accent-cyan); text-transform:uppercase;">${b.type} • ${b.bookingRef}</span>
            <div style="font-weight:700; font-size:0.95rem;">${b.type === 'flight' ? b.details?.airline || 'Flight' : b.details?.name || 'Hotel'}</div>
          </div>
          <div>
            <span style="font-size:0.75rem; padding:0.2rem 0.5rem; border-radius:4px; font-weight:600; ${
              b.status === 'confirmed' ? 'background:rgba(16,185,129,0.15); color:var(--accent-green);' : 'background:rgba(244,63,94,0.15); color:var(--accent-rose);'
            }">${b.status.toUpperCase()}</span>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; font-size:0.8rem; color:var(--text-muted);">
          <span>Amount: <strong style="color:var(--text-main);">₹${(b.totalAmount || 0).toLocaleString()}</strong></span>
          ${
            b.status === 'confirmed'
              ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking('${b._id}')">Cancel Booking</button>`
              : `<button class="btn btn-secondary btn-sm" onclick="deleteBooking('${b._id}')">Remove</button>`
          }
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {}
}

document.getElementById('btnRefreshBookings').addEventListener('click', loadBookings);

window.cancelBooking = async (id) => {
  if (!confirm('Cancel this booking? A cancellation push alert will be sent.')) return;
  try {
    await api(`/api/bookings/${id}/cancel`, { method: 'PATCH' });
    showToast('Booking cancelled! Cancellation notification sent.');
    loadBookings();
    loadNotifications();
  } catch (err) {}
};

window.deleteBooking = async (id) => {
  try {
    await api(`/api/bookings/${id}`, { method: 'DELETE' });
    showToast('Booking record deleted');
    loadBookings();
  } catch (err) {}
};

// --- TAB 3: BUDGET & EXPENSES ---

expenseTripSelect.addEventListener('change', () => {
  if (expenseTripSelect.value) {
    selectTrip(expenseTripSelect.value);
  }
});

async function loadTripExpenses(tripId) {
  try {
    const res = await api(`/api/expenses/trip/${tripId}`);
    const { expenses, totalSpent, budget, remainingBudget, categoryBreakdown } = res.data;

    document.getElementById('statBudget').innerText = `₹${(budget || 0).toLocaleString()}`;
    document.getElementById('statSpent').innerText = `₹${(totalSpent || 0).toLocaleString()}`;
    document.getElementById('statRemaining').innerText = `₹${(remainingBudget || 0).toLocaleString()}`;

    const pct = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0;
    document.getElementById('budgetPercent').innerText = `${pct}% utilized`;
    const bar = document.getElementById('budgetBarFill');
    bar.style.width = `${pct}%`;
    bar.style.background = pct > 90 ? 'var(--accent-rose)' : 'var(--accent-gradient)';

    const table = document.getElementById('expensesTable');
    if (expenses.length === 0) {
      table.innerHTML = `<div style="color:var(--text-dim); font-size:0.85rem;">No expenses logged for this trip yet.</div>`;
      return;
    }

    table.innerHTML = expenses
      .map(
        (e) => `
      <div style="background:#090e1a; border:1px solid var(--border-color); border-radius:8px; padding:0.6rem 0.8rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; font-size:0.85rem;">${e.description}</div>
          <span style="font-size:0.7rem; color:var(--text-dim); text-transform:uppercase;">${e.category} ${
          e.bookingRef ? `• ${e.bookingRef}` : ''
        }</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span style="color:var(--accent-rose); font-weight:700; font-size:0.9rem;">₹${e.amount.toLocaleString()}</span>
          <button class="btn btn-danger btn-sm" style="padding:0.2rem 0.4rem;" onclick="deleteExpense('${e._id}')">✕</button>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {}
}

document.getElementById('btnAddExpense').addEventListener('click', async () => {
  if (!state.currentTripId) return showToast('Please select a trip first!', 'error');

  const category = document.getElementById('expCategory').value;
  const description = document.getElementById('expDesc').value.trim();
  const amount = parseFloat(document.getElementById('expAmount').value) || 0;

  if (!description || amount <= 0) return showToast('Please provide description and valid amount', 'error');

  try {
    await api('/api/expenses', {
      method: 'POST',
      body: JSON.stringify({
        tripId: state.currentTripId,
        category,
        description,
        amount,
        currency: 'INR',
      }),
    });
    showToast('Expense recorded successfully!');
    document.getElementById('expDesc').value = '';
    document.getElementById('expAmount').value = '';
    loadTripExpenses(state.currentTripId);
  } catch (err) {}
});

window.deleteExpense = async (id) => {
  if (!confirm('Delete this expense?')) return;
  try {
    await api(`/api/expenses/${id}`, { method: 'DELETE' });
    showToast('Expense deleted');
    loadTripExpenses(state.currentTripId);
  } catch (err) {}
};

// --- TAB 4: SHARING & REAL-TIME COLLABORATION ---

shareTripSelect.addEventListener('change', () => {
  if (shareTripSelect.value) {
    selectTrip(shareTripSelect.value);
  }
});

async function loadSharedBuddies(tripId) {
  try {
    const res = await api(`/api/share/trip/${tripId}`);
    const shares = res.data || [];
    const container = document.getElementById('sharedBuddiesList');

    if (shares.length === 0) {
      container.innerHTML = `<div style="color:var(--text-dim); font-size:0.8rem;">No buddies invited to this trip yet.</div>`;
      return;
    }

    container.innerHTML = shares
      .map(
        (s) => `
      <div style="background:#090e1a; border:1px solid var(--border-color); border-radius:8px; padding:0.5rem 0.75rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:600; font-size:0.85rem;">${s.sharedWith?.name || 'Travel Buddy'} (${s.sharedWith?.email})</div>
          <span style="font-size:0.7rem; color:var(--accent-purple);">Permission: ${s.permission}</span>
        </div>
        <button class="btn btn-danger btn-sm" onclick="revokeShare('${s._id}')">Revoke</button>
      </div>
    `
      )
      .join('');
  } catch (err) {}
}

document.getElementById('btnShareTrip').addEventListener('click', async () => {
  const tripId = shareTripSelect.value || state.currentTripId;
  const emails = document.getElementById('shareEmail').value.trim();
  const permission = document.getElementById('sharePermission').value;

  if (!tripId) return showToast('Please select a trip to share', 'error');
  if (!emails) return showToast('Please enter a buddy email address', 'error');

  try {
    await api('/api/share', {
      method: 'POST',
      body: JSON.stringify({ tripId, emails: [emails], permission }),
    });
    showToast(`Trip shared with ${emails}! Push notification dispatched.`);
    document.getElementById('shareEmail').value = '';
    loadSharedBuddies(tripId);
    loadNotifications();
  } catch (err) {}
});

window.revokeShare = async (id) => {
  if (!confirm('Revoke access for this buddy?')) return;
  try {
    await api(`/api/share/${id}`, { method: 'DELETE' });
    showToast('Share access revoked');
    if (state.currentTripId) loadSharedBuddies(state.currentTripId);
  } catch (err) {}
};

// Real-time broadcast note
document.getElementById('btnSendLiveUpdate').addEventListener('click', () => {
  const note = liveNoteArea.value.trim();
  if (!note || !state.currentItineraryId || !state.socket) {
    return showToast('Select an itinerary day to broadcast updates', 'error');
  }

  state.socket.emit('itinerary-update', {
    itineraryId: state.currentItineraryId,
    data: { notes: note, updatedAt: new Date().toISOString() },
  });

  addLiveLog('You (Local)', 'Broadcasted Note Update', note);
  showToast('Broadcasted live update over WebSocket!');
});

// --- TAB 5: WEATHER & TIPS ---

document.getElementById('btnFetchWeather').addEventListener('click', () => {
  const city = document.getElementById('weatherQuery').value.trim() || 'Tokyo';
  loadWeather(city);
});

async function loadWeather(city) {
  const display = document.getElementById('weatherDisplay');
  try {
    const res = await api(`/api/weather?city=${city}`);
    const w = res.data;

    display.innerHTML = `
      <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:12px; padding:1.25rem; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:0.75rem; text-transform:uppercase; color:var(--accent-cyan); font-weight:700;">Current Weather • ${w.destination}</span>
          <div style="font-size:2.2rem; font-weight:800; margin-top:0.2rem;">${w.current.temperature}${w.current.unit}</div>
          <div style="color:var(--text-muted); font-size:0.85rem;">${w.current.condition} • Humidity: ${w.current.humidity} • Wind: ${w.current.windSpeed}</div>
        </div>
        <div style="font-size:3.5rem;">${w.current.icon}</div>
      </div>

      <div style="font-size:0.85rem; font-weight:700; margin-bottom:0.5rem; color:var(--text-muted);">5-Day Outlook:</div>
      <div class="grid-3" style="gap:0.5rem;">
        ${w.forecast
          .map(
            (f) => `
          <div style="background:#090e1a; border:1px solid var(--border-color); border-radius:8px; padding:0.6rem; text-align:center;">
            <div style="font-size:0.7rem; color:var(--text-dim);">${f.date}</div>
            <div style="font-size:1.5rem; margin:0.2rem 0;">${f.icon}</div>
            <div style="font-size:0.8rem; font-weight:700;">${f.temperature.max}° / ${f.temperature.min}°</div>
            <div style="font-size:0.68rem; color:var(--text-muted);">${f.condition}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  } catch (err) {
    display.innerHTML = `<div style="color:var(--accent-rose);">Failed to load weather.</div>`;
  }
}

async function loadTips() {
  const display = document.getElementById('tipsDisplay');
  try {
    const res = await api('/api/tips');
    const tips = res.data.tips || [];

    if (tips.length === 0) {
      display.innerHTML = `<div style="color:var(--text-dim);">No tips found.</div>`;
      return;
    }

    display.innerHTML = tips
      .map(
        (t) => `
      <div style="background:#090e1a; border:1px solid var(--border-color); border-radius:8px; padding:0.75rem;">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
          <span style="font-weight:700; font-size:0.85rem; color:var(--accent-cyan);">${t.category.toUpperCase()}</span>
          <span style="font-size:0.75rem; color:var(--text-dim);">${t.destinationId?.name || 'General Advice'}</span>
        </div>
        <p style="font-size:0.82rem; color:var(--text-muted);">${t.content}</p>
      </div>
    `
      )
      .join('');
  } catch (err) {}
}

document.getElementById('btnRefreshTips').addEventListener('click', loadTips);

// --- TAB 6: NOTIFICATIONS ---

async function loadNotifications() {
  const stream = document.getElementById('notificationsStream');
  try {
    const res = await api('/api/notifications');
    const list = res.data || [];
    document.getElementById('notifCount').innerText = list.length;

    if (list.length === 0) {
      stream.innerHTML = `<div style="color:var(--text-dim); padding:1rem;">No notifications recorded yet.</div>`;
      return;
    }

    stream.innerHTML = list
      .map(
        (n) => `
      <div class="feed-card">
        <div class="feed-header">
          <span>${n.title}</span>
          <span class="feed-time">${new Date(n.sentAt || n.createdAt).toLocaleTimeString()}</span>
        </div>
        <div style="color:var(--text-muted);">${n.body}</div>
        ${
          n.data && Object.keys(n.data).length > 0
            ? `<pre style="font-size:0.7rem; color:var(--text-dim); margin-top:0.3rem;">${JSON.stringify(
                n.data
              )}</pre>`
            : ''
        }
      </div>
    `
      )
      .join('');
  } catch (err) {}
}

// --- TAB SWITCHING ---
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

    btn.classList.add('active');
    const target = document.getElementById(`tab-${btn.dataset.tab}`);
    if (target) target.classList.add('active');
  });
});

// Boot application
initAuth();
