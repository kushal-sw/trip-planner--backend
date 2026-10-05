# 🗺️ TripPlanner — Backend Implementation Plan

> **Case Study 71: Smart Travel Itinerary Planner**
> **Stack:** Node.js · Express.js · MongoDB (Mongoose) · Firebase · Socket.io
> **Goal:** Build the backend to 100% completion across all required and advanced features.

---

## 📁 Final Project Structure

```
backend-final/
├── src/
│   ├── app.js                     # Express app (middleware, routes)
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   ├── firebase.js            # Firebase Admin SDK init
│   │   └── env.js                 # Environment variable loader
│   ├── models/
│   │   ├── User.js
│   │   ├── Trip.js
│   │   ├── Itinerary.js
│   │   ├── Activity.js
│   │   ├── Booking.js
│   │   ├── Expense.js
│   │   ├── Destination.js
│   │   ├── Tip.js
│   │   ├── Share.js
│   │   ├── Notification.js
│   │   └── PhotoJournal.js
│   ├── routes/
│   │   ├── index.js               # Mounts all per-resource route files
│   │   ├── auth.js
│   │   ├── trips.js
│   │   ├── itineraries.js
│   │   ├── activities.js
│   │   ├── bookings.js
│   │   ├── flights.js
│   │   ├── hotels.js
│   │   ├── expenses.js
│   │   ├── share.js
│   │   ├── destinations.js
│   │   ├── weather.js
│   │   ├── tips.js
│   │   ├── notifications.js
│   │   └── photos.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── trip.controller.js
│   │   ├── itinerary.controller.js
│   │   ├── activity.controller.js
│   │   ├── booking.controller.js
│   │   ├── expense.controller.js
│   │   ├── destination.controller.js
│   │   ├── weather.controller.js
│   │   ├── tips.controller.js
│   │   ├── share.controller.js
│   │   ├── notification.controller.js
│   │   └── photoJournal.controller.js
│   ├── middleware/
│   │   ├── auth.js                # JWT verification
│   │   ├── role.js                # Role-based authorization
│   │   ├── validate.js            # Request validation (express-validator)
│   │   └── error.js               # Global error handler
│   ├── utils/
│   │   ├── ApiError.js            # Custom error class
│   │   ├── asyncHandler.js        # Try-catch wrapper
│   │   ├── canAccessTrip.js       # Shared ownership/permission helper
│   │   ├── mockData.js            # Mock flight/hotel data generator
│   │   ├── notifyUser.js          # Safe FCM notification helper (fail-silent)
│   │   └── weatherApi.js          # Weather API helper
│   ├── seeds/
│   │   └── seed.js                # Database seed script
│   └── socket/
│       └── collaborative.js       # Socket.io collaborative editing
├── docs/
│   └── swagger.yaml               # Swagger/OpenAPI spec
├── .env.example
├── .gitignore
├── package.json
├── server.js                      # HTTP server, DB connect, Socket.io attach
├── README.md
└── implementationplan.md
```

---

## ✅ Completion Checklist — All 40 Endpoints

| # | Module | Endpoints | Phase |
|---|--------|-----------|-------|
| 1 | **Auth** | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/firebase-login`, `PUT /api/auth/fcm-token` | 1 |
| 2 | **Trips** | `GET /api/trips`, `GET /api/trips/:id`, `POST /api/trips`, `PUT /api/trips/:id`, `DELETE /api/trips/:id` | 2 |
| 3 | **Itineraries** | `POST /api/itineraries`, `GET /api/itineraries`, `GET /api/itineraries/trip/:id`, `PUT /api/itineraries/:id` | 2 |
| 4 | **Activities** | `POST /api/activities`, `GET /api/activities`, `GET /api/activities/itinerary/:id` | 2 |
| 5 | **Flights** | `GET /api/flights` (mock search) | 3 |
| 6 | **Hotels** | `GET /api/hotels` (mock search) | 3 |
| 7 | **Bookings** | `POST /api/bookings`, `GET /api/bookings`, `GET /api/bookings/trip/:id` | 3 |
| 8 | **Expenses** | `POST /api/expenses`, `GET /api/expenses`, `GET /api/expenses/trip/:id` | 3 |
| 9 | **Destinations** | `GET /api/admin/destinations`, `POST /api/admin/destinations` | 4 |
| 10 | **Weather** | `GET /api/weather`, `GET /api/weather/destination/:id` | 4 |
| 11 | **Tips** | `GET /api/tips`, `GET /api/tips/destination/:id` | 4 |
| 12 | **Share** | `POST /api/share`, `GET /api/share/trip/:id` | 4 |
| 13 | **Notifications** | `POST /api/notifications/send` | 5 |
| 14 | **Photo Journal** | *(Optional Bonus)* `POST /api/photos`, `GET /api/photos/trip/:id`, `DELETE /api/photos/:id` | 6 |

---

## 🏗️ PHASE 1 — Foundation & Authentication `CORE`

> **Goal:** Project setup, database connection, Firebase Admin SDK, and fully working auth system.

### 1.1 Project Initialization

- [ ] Run `npm init -y`
- [ ] Install core dependencies:
  ```bash
  npm install express mongoose dotenv cors helmet morgan
  npm install jsonwebtoken bcryptjs firebase-admin
  npm install express-validator
  npm install -D nodemon
  ```
- [ ] Create `.env` file with:
  ```env
  PORT=5000
  MONGO_URI=mongodb://localhost:27017/tripplanner
  JWT_SECRET=your_jwt_secret_key
  JWT_EXPIRES_IN=7d
  NODE_ENV=development
  FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
  ```
- [ ] Create `.env.example` (same keys, no values)
- [ ] Create `.gitignore` (`node_modules/`, `.env`, `*.log`, `firebase-service-account.json`)
- [ ] Add scripts to `package.json`:
  ```json
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node src/seeds/seed.js"
  }
  ```

### 1.2 Server & Database Setup

- [ ] **`src/app.js`** — Express app:
  - Import and use `cors`, `helmet`, `morgan`, `express.json()`
  - Mount all routes via `src/routes/index.js` under `/api/`
  - Attach global error handling middleware as last middleware
  - Export the `app` instance (do NOT listen here)
- [ ] **`server.js`** — HTTP server:
  - Import `app` from `src/app.js`
  - Connect to MongoDB via `src/config/db.js`
  - Create `http.createServer(app)`
  - Attach Socket.io to the HTTP server (placeholder for Phase 6)
  - Listen on `process.env.PORT`
- [ ] **`src/routes/index.js`** — Central router that mounts per-resource route files:
  ```js
  router.use('/auth', require('./auth'));
  router.use('/trips', require('./trips'));
  // ... etc.
  ```
- [ ] **`src/config/db.js`** — Mongoose connection using `process.env.MONGO_URI`, with retry logic and event listeners
- [ ] **`src/config/env.js`** — Validate required env vars (`MONGO_URI`, `JWT_SECRET`) exist at startup
- [ ] **`src/config/firebase.js`** — Initialize Firebase Admin SDK:
  - Parse `process.env.FIREBASE_SERVICE_ACCOUNT` (JSON string) via `JSON.parse()`
  - In development, optionally fall back to a local `firebase-service-account.json` file
  - Export `admin` and `admin.messaging()` instances
  - **Never commit the JSON file** — load from env var in production
- [ ] **`src/middleware/error.js`** — Global error handler returning `{ success: false, message }`. Include `stack` only when `NODE_ENV === 'development'`.
- [ ] **`src/utils/ApiError.js`** — Custom error class with `statusCode` and `message`
- [ ] **`src/utils/asyncHandler.js`** — Wraps async route handlers to catch errors

### 1.3 User Model & Auth Endpoints

- [ ] **`src/models/User.js`** — Mongoose schema:
  ```
  Fields: name, email (unique), password (hashed),
          role (enum: 'user'|'admin', default: 'user'),
          firebaseUid (optional, unique, sparse),
          fcmToken (String, optional),
          avatar, createdAt, updatedAt
  Pre-save hook: hash password with bcryptjs (salt rounds = 10)
  Instance method: comparePassword(candidatePassword)
  ```
- [ ] **`src/controllers/auth.controller.js`**:
  - `register` — validate input → **strip any `role` field from req.body** (always set to 'user') → check if email exists → create user → generate JWT → return `{ success, data: { token, user } }`
  - `login` — validate input → find user by email → compare password → generate JWT → return `{ success, data: { token, user } }`
  - `firebaseLogin` — extract Firebase ID token from body → verify with `admin.auth().verifyIdToken()` → find user by `firebaseUid` OR create new user (name from Firebase displayName, email from Firebase email, random password, firebaseUid) → generate our own JWT → return `{ success, data: { token, user } }`
  - `updateFcmToken` — (protected) save `req.body.fcmToken` on `req.user` → return `{ success, message }`
- [ ] **`src/routes/auth.js`**:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/firebase-login`
  - `PUT /api/auth/fcm-token` (protected)
- [ ] **`src/middleware/auth.js`**:
  - Extract token from `Authorization: Bearer <token>` header
  - Verify with `jwt.verify()` → attach `req.user`
  - Return 401 if invalid/missing
- [ ] **`src/middleware/role.js`**:
  - Factory function: `authorize(...roles)` → check `req.user.role`
  - Return 403 if unauthorized
- [ ] **`src/middleware/validate.js`**:
  - Use `express-validator` to validate request body/params
  - Return 400 with detailed validation errors

### 1.4 Phase 1 Testing (Postman)

- [ ] Register with valid data → expect 201 + token
- [ ] Register with `role: 'admin'` in body → expect 201 but role is `'user'`
- [ ] Register with duplicate email → expect 400
- [ ] Login with correct credentials → expect 200 + token
- [ ] Login with wrong password → expect 401
- [ ] Firebase login with valid Firebase ID token → expect 200 + our JWT
- [ ] PUT /api/auth/fcm-token with token → expect 200
- [ ] Protected route without token → expect 401
- [ ] Protected route with invalid token → expect 401

### 📌 Phase 1 Deliverable
> Working auth system with register/login, Firebase login, FCM token storage, JWT middleware, role middleware, and global error handling.

---

## 🏗️ PHASE 2 — Core Trip Management (Trips, Itineraries, Activities) `CORE`

> **Goal:** Full CRUD for trips with nested itineraries and activities.

### 2.1 Shared Access Helper

- [ ] **`src/utils/canAccessTrip.js`** — Export `canAccessTrip(userId, tripId)`:
  - Returns `true` if the user owns the trip OR has a Share record for that trip
  - Also export `canEditTrip(userId, tripId)` — returns `true` if owner OR shared with `permission: 'edit'`
  - Use this helper in **every** controller that reads/writes trip-scoped data (itineraries, activities, bookings, expenses)

### 2.2 Trip Model & Endpoints

- [ ] **`src/models/Trip.js`** — Mongoose schema:
  ```
  Fields: title, description, destination, startDate, endDate,
          duration (virtual/computed), coverImage, budget,
          currency (default: 'INR'),
          status (enum: 'planning'|'ongoing'|'completed'),
          userId (ref: User), tags [String], isPublic (Boolean),
          createdAt, updatedAt
  Indexes: userId, destination
  ```
- [ ] **`src/controllers/trip.controller.js`**:
  - `createTrip` — validate → create → return `{ success, data }`
  - `getAllTrips` — return trips the user owns OR is shared on, with pagination (page, limit query params)
  - `getTripById` — find by id → use `canAccessTrip()` → return
  - `updateTrip` — find → use `canEditTrip()` → update → return
  - `deleteTrip` — find → ensure **ownership only** (not just edit) → cascade delete itineraries, activities, bookings, expenses, shares, photos → return
- [ ] **`src/routes/trips.js`** (all protected):
  - `POST /api/trips`
  - `GET /api/trips`
  - `GET /api/trips/:id`
  - `PUT /api/trips/:id`
  - `DELETE /api/trips/:id`

### 2.3 Itinerary Model & Endpoints

- [ ] **`src/models/Itinerary.js`** — Mongoose schema:
  ```
  Fields: tripId (ref: Trip), dayNumber, date,
          title (e.g., "Day 1: Paris"), notes,
          transport { mode, from, to, details },
          userId (ref: User), createdAt, updatedAt
  Index: tripId
  ```
- [ ] **`src/controllers/itinerary.controller.js`**:
  - `createItinerary` — use `canEditTrip()` → create itinerary for that day
  - `getAllItineraries` — return all itineraries for trips the user can access
  - `getItinerariesByTrip` — use `canAccessTrip()` → return itineraries sorted by `dayNumber`
  - `updateItinerary` — use `canEditTrip()` on parent trip → update
- [ ] **`src/routes/itineraries.js`** (all protected):
  - `POST /api/itineraries`
  - `GET /api/itineraries`
  - `GET /api/itineraries/trip/:id`
  - `PUT /api/itineraries/:id`

### 2.4 Activity Model & Endpoints

- [ ] **`src/models/Activity.js`** — Mongoose schema:
  ```
  Fields: itineraryId (ref: Itinerary), name, description,
          type (enum: 'sightseeing'|'food'|'adventure'|'shopping'|'transport'|'other'),
          location { name, address, coordinates { lat, lng } },
          startTime, endTime, cost, currency, notes,
          userId (ref: User), createdAt, updatedAt
  Index: itineraryId
  ```
- [ ] **`src/controllers/activity.controller.js`**:
  - `createActivity` — look up parent itinerary → use `canEditTrip()` on its tripId → create
  - `getAllActivities` — return user's activities
  - `getActivitiesByItinerary` — use `canAccessTrip()` on parent trip → return sorted by `startTime`
- [ ] **`src/routes/activities.js`** (all protected):
  - `POST /api/activities`
  - `GET /api/activities`
  - `GET /api/activities/itinerary/:id`

### 2.5 Phase 2 Testing

- [ ] Create a trip → expect 201
- [ ] Get all trips (ensure pagination works)
- [ ] Get trip by ID → expect populated data
- [ ] Update trip title → expect 200
- [ ] Delete trip → expect cascade deletion of itineraries, activities, bookings, expenses, shares, photos
- [ ] Create itinerary under a trip → expect 201
- [ ] Get itineraries by trip ID → expect sorted by dayNumber
- [ ] Create activity under itinerary → expect 201
- [ ] Get activities by itinerary ID → expect sorted by startTime
- [ ] Verify user cannot access another user's trip → expect 403/404

### 📌 Phase 2 Deliverable
> Complete trip lifecycle: create trip → add day-by-day itineraries → add activities per day. All with ownership/sharing validation via `canAccessTrip`.

---

## 🏗️ PHASE 3 — Booking & Expense System `CORE`

> **Goal:** Mock flight/hotel search, unified booking, and expense tracking. Bookings auto-create expenses.

### 3.1 Mock Data Utility

- [ ] **`src/utils/mockData.js`** — Generate mock data (no DB models for flights/hotels):
  - `generateFlights(from, to, date)` — returns array of 5-10 mock flights with airline, flightNumber, price, departure, arrival, duration, class
  - `generateHotels(destination, checkIn, checkOut)` — returns array of 5-10 mock hotels with name, rating, pricePerNight, amenities, roomType, totalPrice
  - Use hardcoded data arrays for realistic results

### 3.2 Flight & Hotel Search Endpoints (Mock Only — No DB Models)

- [ ] **`src/controllers/booking.controller.js`** (search functions):
  - `searchFlights` — accept query params (from, to, date) → return mock data from `mockData.js`
  - `searchHotels` — accept query params (destination, checkIn, checkOut) → return mock data
- [ ] **`src/routes/flights.js`** (protected):
  - `GET /api/flights` (search with query params — returns mock data, nothing saved)
- [ ] **`src/routes/hotels.js`** (protected):
  - `GET /api/hotels` (search with query params — returns mock data, nothing saved)

### 3.3 Booking Model & Endpoints (Unified — Single Model)

- [ ] **`src/models/Booking.js`** — Mongoose schema:
  ```
  Fields: userId (ref: User), tripId (ref: Trip),
          type (enum: 'flight'|'hotel'),
          bookingRef (unique string, auto-generated),
          status (enum: 'confirmed'|'cancelled', default: 'confirmed'),
          totalAmount (Number), currency (default: 'INR'),
          details (Mixed — full snapshot of the selected flight/hotel),
          createdAt
  Index: userId, tripId
  ```
  > **No separate Flight or Hotel models.** The `details` field stores a snapshot of whatever was booked.
- [ ] **`src/controllers/booking.controller.js`**:
  - `createBooking` — validate tripId (use `canEditTrip()`) → accept `type` + `details` + `totalAmount` → save Booking → **auto-create an Expense** (category: 'accommodation' for hotel, 'transport' for flight) so the trip total stays accurate → trigger notification (fail-silent) → return `{ success, data: booking }`
  - `getAllBookings` — return user's bookings with pagination
  - `getBookingsByTrip` — use `canAccessTrip()` → return bookings for that trip
- [ ] **`src/routes/bookings.js`** (all protected):
  - `POST /api/bookings`
  - `GET /api/bookings`
  - `GET /api/bookings/trip/:id`

### 3.4 Expense Model & Endpoints

- [ ] **`src/models/Expense.js`** — Mongoose schema:
  ```
  Fields: tripId (ref: Trip), userId (ref: User),
          category (enum: 'food'|'transport'|'accommodation'|'activities'|'shopping'|'other'),
          description, amount, currency (default: 'INR'), date,
          bookingRef (optional — links to auto-created booking expense),
          receipt (URL), createdAt
  Index: tripId
  ```
- [ ] **`src/controllers/expense.controller.js`**:
  - `createExpense` — use `canEditTrip()` → create expense entry
  - `getAllExpenses` — return user's expenses with pagination
  - `getExpensesByTrip` — use `canAccessTrip()` → return expenses for a trip + compute `totalSpent` via aggregation
- [ ] **`src/routes/expenses.js`** (all protected):
  - `POST /api/expenses`
  - `GET /api/expenses`
  - `GET /api/expenses/trip/:id`

### 3.5 Phase 3 Testing

- [ ] Search flights → expect array of mock flights (nothing saved to DB)
- [ ] Search hotels → expect array of mock hotels (nothing saved to DB)
- [ ] POST /api/bookings with type 'flight' + details → expect booking confirmation with bookingRef
- [ ] Verify auto-created Expense exists with matching amount and category 'transport'
- [ ] POST /api/bookings with type 'hotel' + details → expect booking confirmation
- [ ] Verify auto-created Expense with category 'accommodation'
- [ ] Get all bookings → expect both flight & hotel bookings
- [ ] Get bookings by trip → expect filtered results
- [ ] Manually create expense → expect 201
- [ ] Get expenses by trip → expect totalSpent aggregation
- [ ] Shared user with 'view' can read bookings/expenses → expect 200
- [ ] Shared user with 'view' cannot create booking → expect 403

### 📌 Phase 3 Deliverable
> Mock search for flights/hotels. Unified Booking model (no separate Flight/Hotel models). Bookings auto-create Expenses. Expense tracking with totalSpent aggregation.

---

## 🏗️ PHASE 4 — Destinations, Weather, Tips & Sharing `CORE`

> **Goal:** Admin destination management (needed by Weather & Tips), weather data, local tips, and trip sharing.

### 4.1 Destination Model & Admin Endpoints

- [ ] **`src/models/Destination.js`** — Mongoose schema:
  ```
  Fields: name, country, description, imageUrl, popularAttractions [String],
          bestTimeToVisit, averageBudget, currency, tags [String],
          partnerships [{ partnerName, type, discount, validUntil }],
          isActive (Boolean, default: true),
          createdBy (ref: User), createdAt, updatedAt
  Index: country, name (unique)
  ```
- [ ] **`src/controllers/destination.controller.js`**:
  - `getDestinations` — return all active destinations (with search & filter by country). **Public or protected — your choice.**
  - `createDestination` — validate → create destination (**admin only**)
- [ ] **`src/routes/destinations.js`** (protected + admin role for POST):
  - `GET /api/admin/destinations`
  - `POST /api/admin/destinations`

### 4.2 Tip Model & Endpoints

- [ ] **`src/models/Tip.js`** — Mongoose schema:
  ```
  Fields: destinationId (ref: Destination), category (enum: 'safety'|'food'|'transport'|'culture'|'currency'|'general'),
          text (String, required), createdAt
  Index: destinationId
  ```
- [ ] **Seed tips** for each destination via the seed script (Phase 6). Each destination gets 3-5 tips across categories.
- [ ] **`src/controllers/tips.controller.js`**:
  - `getAllTips` — return all tips with pagination
  - `getTipsByDestination` — accept destination ID → return tips for that destination
- [ ] **`src/routes/tips.js`** (protected):
  - `GET /api/tips`
  - `GET /api/tips/destination/:id`

### 4.3 Weather Integration

- [ ] **`src/utils/weatherApi.js`** — Weather helper:
  - Option A: Use OpenWeatherMap free tier API
  - Option B: Return mock weather data for any destination
  - Returns: temperature, condition, humidity, forecast array
- [ ] **`src/controllers/weather.controller.js`**:
  - `getWeather` — accept query params (city/destination) → return current weather
  - `getWeatherByDestination` — accept destination ID → look up destination name → fetch weather
- [ ] **`src/routes/weather.js`** (protected):
  - `GET /api/weather`
  - `GET /api/weather/destination/:id`

### 4.4 Share Model & Endpoints

- [ ] **`src/models/Share.js`** — Mongoose schema:
  ```
  Fields: tripId (ref: Trip), sharedBy (ref: User), sharedWith (ref: User),
          permission (enum: 'view'|'edit', default: 'view'),
          sharedAt (default: Date.now)
  Index: { tripId, sharedWith } (compound unique)
  ```
  > **No pending/accepted/declined status.** Shares take effect immediately.
- [ ] **`src/controllers/share.controller.js`**:
  - `shareTrip` — accept tripId + array of user emails + permission → for each email:
    - Look up user by email → if not found, return **404 with message: `"User with email xxx@yyy.com is not registered"`**
    - Ensure requester owns the trip
    - Create Share record (upsert if already shared, update permission)
    - Trigger notification to shared user (fail-silent via `notifyUser`)
  - `getSharesByTrip` — return who a trip is shared with (populate user name/email)
- [ ] **`src/routes/share.js`** (all protected):
  - `POST /api/share`
  - `GET /api/share/trip/:id`
- [ ] **Verify `canAccessTrip` is already used everywhere** — shared users with 'view' or 'edit' can read itineraries, activities, expenses, bookings for that trip

### 4.5 Phase 4 Testing

- [ ] Create destination as admin → expect 201
- [ ] Create destination as regular user → expect 403
- [ ] Get all destinations → expect list
- [ ] Get tips by destination ID → expect tips array
- [ ] Get weather for destination → expect weather data
- [ ] Share trip with registered user → expect 201
- [ ] Share trip with unregistered email → expect 404 with clear message
- [ ] Shared user with 'view' can read trip, itineraries, activities, expenses, bookings → expect 200
- [ ] Shared user with 'view' cannot update trip → expect 403
- [ ] Shared user with 'edit' can update trip → expect 200

### 📌 Phase 4 Deliverable
> Admin-managed destinations. Tips queryable by destination ID. Weather data. Sharing with immediate effect, permission enforcement via `canAccessTrip`, and 404 for unregistered buddies.

---

## 🏗️ PHASE 5 — Push Notifications `CORE`

> **Goal:** Firebase push notifications for bookings and sharing, plus a manual send endpoint.

### 5.1 Fail-Silent Notification Utility

- [ ] **`src/utils/notifyUser.js`** — Export `notifyUser(userId, { title, body, data })`:
  - Look up user by ID → if no `fcmToken`, **return silently** (do not throw)
  - Call `admin.messaging().send({ token: user.fcmToken, notification: { title, body }, data })`
  - Wrap in try-catch → on error, **log warning but do not throw** (never fail the main request)
  - Save a Notification record in DB regardless of FCM success

### 5.2 Notification Model & Endpoint

- [ ] **`src/models/Notification.js`** — Mongoose schema:
  ```
  Fields: userId (ref: User), title, body,
          type (enum: 'booking_confirmed'|'trip_shared'|'reminder'|'general'),
          data (Mixed), isRead (Boolean, default: false), sentAt (default: Date.now)
  Index: userId
  ```
- [ ] **`src/controllers/notification.controller.js`**:
  - `sendNotification` — **admin-only OR limited to `req.user._id` as the target** → accept userId, title, body, type, data → call `notifyUser()` → return `{ success, data: notification }`
- [ ] **`src/routes/notifications.js`** (protected):
  - `POST /api/notifications/send`

### 5.3 Integrate Notifications into Existing Flows

- [ ] **After `POST /api/bookings`** (in booking controller) → call `notifyUser(userId, { title: 'Booking Confirmed', body: bookingRef, type: 'booking_confirmed' })`
- [ ] **After `POST /api/share`** (in share controller) → call `notifyUser(sharedWithUserId, { title: 'Trip Shared', body: tripTitle, type: 'trip_shared' })`
- [ ] Both integrations use try-catch internally — **main request always succeeds** even if FCM fails

### 5.4 Phase 5 Testing

- [ ] Send notification to user with fcmToken → expect Firebase message sent + DB record
- [ ] Send notification to user without fcmToken → expect DB record created, no error
- [ ] Send notification as regular user to another user → expect 403
- [ ] Send notification as admin → expect 200
- [ ] Book a flight → expect auto-notification (check DB)
- [ ] Share trip → expect auto-notification to shared user (check DB)
- [ ] FCM failure (bad token) → expect booking/share still succeeds (main request 200/201)

### 📌 Phase 5 Deliverable
> Firebase push notifications fire on bookings and sharing. Manual send endpoint (admin or self only). All notifications fail silently — never break the main request.

---

## 🏗️ PHASE 6 — Deliverables & Advanced Features

> **Goal:** API documentation, seed script, README, deployment (required deliverables), plus optional bonus features.

### 6.1 API Documentation (Swagger/Postman) `REQUIRED DELIVERABLE`

- [ ] Install Swagger tools:
  ```bash
  npm install swagger-ui-express swagger-jsdoc
  ```
- [ ] Create **`docs/swagger.yaml`** or use JSDoc annotations in route files
- [ ] Configure Swagger UI at `GET /api-docs`
- [ ] Document every endpoint with description, request/response schema, auth requirements, examples
- [ ] **Also export** a Postman collection (`TripPlanner.postman_collection.json`)

### 6.2 Seed Script `REQUIRED DELIVERABLE`

- [ ] **`src/seeds/seed.js`** — Seed script that:
  - Creates 2 users: 1 admin (`role: 'admin'`), 1 regular user — **this is the only way to create admins**
  - Creates 3-5 sample destinations with partnerships
  - Creates 3-5 tips per destination across categories
  - Creates a sample trip with itineraries, activities, bookings, and expenses
  - Prints created credentials to console for testing
- [ ] Run via `npm run seed`

### 6.3 README `REQUIRED DELIVERABLE`

- [ ] **`README.md`** — Include:
  - Project overview & features
  - Tech stack
  - Prerequisites (Node.js, MongoDB, Firebase project)
  - Installation steps (`npm install`, env setup)
  - Environment variables guide (all vars explained)
  - How to run (`npm run dev`, `npm run seed`)
  - API endpoints table (all 40 endpoints)
  - Example user flow (matching the case study flow)
  - Folder structure
  - Deployment instructions (Render)

### 6.4 Deployment (Render) `REQUIRED DELIVERABLE`

- [ ] Ensure `process.env.PORT` is used (not hardcoded)
- [ ] Switch MongoDB to **Atlas** (cloud `MONGO_URI` in env)
- [ ] Firebase service account: set `FIREBASE_SERVICE_ACCOUNT` env var as a JSON string on Render (no file needed)
- [ ] Deploy to **Render** (free tier):
  1. Push to GitHub
  2. Create Web Service on Render → connect repo
  3. Build command: `npm install`
  4. Start command: `node server.js`
  5. Set all environment variables
  6. Deploy
- [ ] Test all endpoints on deployed URL
- [ ] Add live URL to README

### 6.5 Collaborative Editing — Socket.io `OPTIONAL BONUS — Priority 1`

- [ ] Install Socket.io:
  ```bash
  npm install socket.io
  ```
- [ ] **`src/socket/collaborative.js`**:
  - Setup Socket.io on the HTTP server (in `server.js`)
  - JWT authentication in socket middleware (`socket.handshake.auth.token`)
  - Room-based collaboration: each itinerary = one room
  - **Room access control:** only the trip owner OR users shared with `'edit'` permission may join (use `canEditTrip`)
  - Events:
    - `join-itinerary` — verify permission → join room → broadcast user list
    - `leave-itinerary` — leave the room → broadcast updated user list
    - `itinerary-update` — broadcast changes to all users in the room
    - `activity-added` — notify room when new activity is added
    - `activity-updated` — notify room when activity is modified
  - Track active users per room
- [ ] **Update `server.js`** — Attach Socket.io to the HTTP server

### 6.6 Offline Access API `OPTIONAL BONUS — Priority 2`

- [ ] Add to **`src/controllers/trip.controller.js`**:
  - `GET /api/trips/:id/offline` — use `canAccessTrip()` → return complete trip data bundle:
  ```json
  {
    "success": true,
    "data": {
      "trip": {},
      "itineraries": [{ "day": 1, "activities": [] }],
      "bookings": [],
      "expenses": { "items": [], "total": 50000 }
    }
  }
  ```

### 6.7 Photo Journal API `OPTIONAL BONUS — Priority 3`

- [ ] Install dependencies:
  ```bash
  npm install multer cloudinary
  ```
- [ ] **`src/models/PhotoJournal.js`** — Mongoose schema:
  ```
  Fields: tripId (ref: Trip), userId (ref: User), imageUrl (Cloudinary URL),
          caption, location, takenAt, tags [String], createdAt
  Index: tripId
  ```
- [ ] **`src/controllers/photoJournal.controller.js`**:
  - `uploadPhoto` — accept multipart file → upload to **Cloudinary** (not local disk — Render wipes local files) → save record with Cloudinary URL
  - `getPhotosByTrip` — use `canAccessTrip()` → return all photos for a trip
  - `deletePhoto` — verify ownership → delete from Cloudinary → remove DB record
- [ ] **`src/routes/photos.js`** (protected):
  - `POST /api/photos` (multipart)
  - `GET /api/photos/trip/:id`
  - `DELETE /api/photos/:id`
- [ ] Add to `.env`:
  ```env
  CLOUDINARY_CLOUD_NAME=your_cloud
  CLOUDINARY_API_KEY=your_key
  CLOUDINARY_API_SECRET=your_secret
  ```

### 6.8 Phase 6 Testing

- [ ] Open `/api-docs` → verify Swagger UI renders all endpoints
- [ ] Run `npm run seed` → verify data is populated, admin credentials printed
- [ ] Deploy to Render → test all endpoints on live URL
- [ ] *(If Socket.io built)* Connect two clients → join same itinerary room → verify real-time updates
- [ ] *(If Socket.io built)* Non-shared user tries to join → expect rejection
- [ ] *(If offline built)* Get offline trip bundle → verify complete data
- [ ] *(If photos built)* Upload photo → verify Cloudinary URL stored and retrievable

### 📌 Phase 6 Deliverable
> **Required:** Swagger/Postman docs, seed script, README, Render deployment.
> **Optional Bonus (in priority order):** Socket.io collaborative editing → offline access → photo journal.

---

## 📊 Phase Completion Summary

| Phase | Name | Label | Endpoints | Status |
|-------|------|-------|-----------|--------|
| **1** | Foundation & Auth | `CORE` | 4 endpoints + middleware | ⬜ Not Started |
| **2** | Core Trip Management | `CORE` | 12 endpoints | ⬜ Not Started |
| **3** | Booking & Expense System | `CORE` | 8 endpoints | ⬜ Not Started |
| **4** | Destinations, Weather, Tips & Sharing | `CORE` | 10 endpoints | ⬜ Not Started |
| **5** | Push Notifications | `CORE` | 1 endpoint + integrations | ⬜ Not Started |
| **6** | Deliverables & Advanced | `REQUIRED` + `BONUS` | 5+ endpoints + docs + deploy | ⬜ Not Started |
| | **TOTAL** | | **40 endpoints** | **0%** |

---

## 🔧 Full Dependency List

```
express
mongoose
dotenv
cors
helmet
morgan
jsonwebtoken
bcryptjs
express-validator
firebase-admin
socket.io          (Phase 6 — optional bonus)
multer             (Phase 6 — optional bonus)
cloudinary         (Phase 6 — optional bonus)
swagger-ui-express (Phase 6 — required deliverable)
swagger-jsdoc      (Phase 6 — required deliverable)
nodemon            (devDependency)
```

---

## 📋 Quality Checklist (Apply to Every Phase)

- [ ] All endpoints return proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- [ ] All endpoints have input validation via `express-validator`
- [ ] All protected routes use `middleware/auth.js`
- [ ] Admin-only routes use `middleware/role.js`
- [ ] Errors are handled by global error middleware (no unhandled promise rejections)
- [ ] Error stack traces shown **only** when `NODE_ENV === 'development'`
- [ ] `register` always ignores `role` in request body
- [ ] Mongoose models have proper indexes for query performance
- [ ] Pagination implemented on all GET (list) endpoints
- [ ] Consistent response format: `{ success, data, message }`
- [ ] All trip-scoped reads use `canAccessTrip()`, writes use `canEditTrip()`
- [ ] Auto-triggered notifications never fail the main request
- [ ] No hardcoded secrets (everything in `.env`, Firebase from JSON env var)
- [ ] Code follows modular MVC architecture (routes → controllers → models)
- [ ] Env var is `MONGO_URI` (not MONGODB_URI)

---

> **Start with Phase 1 and proceed sequentially. Each phase builds on the previous one. Mark checkboxes as you complete each task to track your progress to 100%.**
