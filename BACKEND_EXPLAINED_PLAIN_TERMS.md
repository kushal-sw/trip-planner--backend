# 🧭 Complete Line-by-Line Code Breakdown (Plain Terms)

> Every single backend file in **TripPlanner** explained line by line in plain English. No heavy academic jargon, just straightforward explanations of what each line does, why it exists, and how the parts connect together.

---

## 📑 Table of Contents
1. [Core Engine: server.js & src/app.js](#1-core-engine-serverjs--srcappjs)
2. [Configuration: src/config/](#2-configuration-srcconfig)
3. [Middleware (Security & Guards): src/middleware/](#3-middleware-security--guards-srcmiddleware)
4. [Utilities (Helpers): src/utils/](#4-utilities-helpers-srcutils)
5. [Database Models: src/models/](#5-database-models-srcmodels)
6. [Real-Time Collaboration: src/socket/collaborative.js](#6-real-time-collaboration-srcsocketcollaborativejs)
7. [Controllers & API Routes](#7-controllers--api-routes)
8. [Database Seeder: src/seeds/seed.js](#8-database-seeder-srcseedsseedjs)

---

# 1. Core Engine: `server.js` & `src/app.js`

---

### 📄 `server.js` (The Server Starter)

```javascript
1: // Load and validate environment variables first
2: require('./src/config/env');
3: 
4: const http = require('http');
5: const app = require('./src/app');
6: const connectDB = require('./src/config/db');
7: 
8: // Connect to MongoDB
9: connectDB();
10: 
11: // Create HTTP server
12: const server = http.createServer(app);
13: 
14: // Attach Socket.io to HTTP server
15: const { Server } = require('socket.io');
16: const setupSocket = require('./src/socket/collaborative');
17: 
18: const io = new Server(server, {
19:   cors: {
20:     origin: '*',
21:     methods: ['GET', 'POST'],
22:   },
23: });
24: 
25: setupSocket(io);
26: 
27: const PORT = process.env.PORT || 5000;
28: 
29: server.listen(PORT, () => {
30:   console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
31: });
32: 
33: // Handle unhandled promise rejections
34: process.on('unhandledRejection', (err) => {
35:   console.error(`❌ Unhandled Rejection: ${err.message}`);
36:   // In production, close server gracefully
37:   server.close(() => process.exit(1));
38: });
39: 
40: // Handle uncaught exceptions
41: process.on('uncaughtException', (err) => {
42:   console.error(`❌ Uncaught Exception: ${err.message}`);
43:   process.exit(1);
44: });
```

#### Line-by-Line Explanation:
* **Line 2 (`require('./src/config/env')`)**: Runs our environment checker right away before anything else. It makes sure secret passwords and database URLs in `.env` exist. If any are missing, it stops immediately.
* **Line 4 (`const http = require('http')`)**: Imports Node's built-in web server builder.
* **Line 5 (`const app = require('./src/app')`)**: Imports the Express app (which holds all our API routes and middleware).
* **Line 6 (`const connectDB = require('./src/config/db')`)**: Imports the function that connects us to our MongoDB database.
* **Line 9 (`connectDB()`)**: Calls the function to connect to MongoDB in the background.
* **Line 12 (`const server = http.createServer(app)`)**: Wraps our Express app into an HTTP server. We do this so that both Express (normal web requests) and Socket.io (live real-time chats/updates) can share the exact same port.
* **Line 15 (`const { Server } = require('socket.io')`)**: Imports the Socket.io WebSocket library.
* **Line 16 (`const setupSocket = require('./src/socket/collaborative')`)**: Imports our real-time trip collaboration logic.
* **Lines 18–23 (`const io = new Server(...)`)**: Starts Socket.io on top of our HTTP server. `cors: { origin: '*' }` means users connecting from any web browser or phone app are allowed to connect.
* **Line 25 (`setupSocket(io)`)**: Turns on our real-time listeners for rooms, user typing badges, and live trip updates.
* **Line 27 (`const PORT = process.env.PORT || 5000`)**: Uses the port number given by the host (like Render or Heroku), or port `5000` if running on your laptop.
* **Lines 29–31 (`server.listen(PORT, ...)`)**: Starts listening for incoming web traffic. When ready, it prints `🚀 Server running...` in the terminal.
* **Lines 34–38 (`process.on('unhandledRejection', ...)`)**: Safety net for async errors. If an async function fails and nobody caught it with `.catch()`, this logs the error and shuts down the server cleanly without hanging in an unknown broken state.
* **Lines 41–44 (`process.on('uncaughtException', ...)`)**: Safety net for regular code errors. If an unexpected JavaScript crash happens, it logs it and exits so your server manager (like PM2 or Docker) can restart a fresh instance.

---

### 📄 `src/app.js` (The Express App Setup)

```javascript
1: const path = require('path');
2: const express = require('express');
3: const cors = require('cors');
4: const helmet = require('helmet');
5: const morgan = require('morgan');
6: const routes = require('./routes');
7: const errorHandler = require('./middleware/error');
8: const ApiError = require('./utils/ApiError');
9: 
10: const app = express();
11: 
12: // Security HTTP headers
13: app.use(helmet({ contentSecurityPolicy: false }));
14: 
15: // Serve FCM service worker at root domain
16: app.get('/firebase-messaging-sw.js', (req, res) => {
17:   res.setHeader('Content-Type', 'application/javascript');
18:   res.setHeader('Service-Worker-Allowed', '/');
19:   res.sendFile(path.join(__dirname, '../public/firebase-messaging-sw.js'));
20: });
21: 
22: // Serve public static frontend
23: app.use(express.static(path.join(__dirname, '../public')));
24: 
25: // Enable CORS
26: app.use(cors());
27: 
28: // HTTP request logger
29: if (process.env.NODE_ENV === 'development') {
30:   app.use(morgan('dev'));
31: } else {
32:   app.use(morgan('combined'));
33: }
34: 
35: // Body parsers
36: app.use(express.json());
37: app.use(express.urlencoded({ extended: true }));
38: 
39: // Swagger API Documentation
40: const { setupSwagger } = require('./config/swagger');
41: setupSwagger(app);
42: 
43: // Mount API routes
44: app.use('/api', routes);
45: 
46: // Catch-all for undefined routes
47: app.use((req, res, next) => {
48:   next(new ApiError(404, `Route ${req.originalUrl} not found`));
49: });
50: 
51: // Centralized error handling middleware
52: app.use(errorHandler);
53: 
54: module.exports = app;
```

#### Line-by-Line Explanation:
* **Lines 1–8**: Imports core Node modules and third-party packages:
  * `path`: For managing folder paths across Windows/Mac/Linux.
  * `express`: The main web framework.
  * `cors`: Cross-Origin Resource Sharing (allows browsers on other domains to call this API).
  * `helmet`: Adds security headers to prevent common web attacks.
  * `morgan`: Logs every request in the terminal (e.g. `GET /api/trips 200`).
  * `routes`: The master router containing all `/api` endpoints.
  * `errorHandler`: Catches any error and turns it into clean JSON.
  * `ApiError`: Our custom error helper.
* **Line 10 (`const app = express()`)**: Creates our Express application.
* **Line 13 (`app.use(helmet(...))`)**: Adds security headers. We turn off `contentSecurityPolicy` so Swagger documentation scripts and Firebase notification scripts can load without being blocked.
* **Lines 16–20 (`app.get('/firebase-messaging-sw.js', ...)`)**: Browsers require push notification service workers to live at the root `/` URL to receive push messages for the whole website. This route serves that file.
* **Line 23 (`app.use(express.static(...))`)**: Automatically serves our frontend files (HTML, CSS, images, and client JS) from the `public` folder.
* **Line 26 (`app.use(cors())`)**: Allows our frontend or mobile apps to send requests freely to the backend.
* **Lines 29–33 (`if (process.env.NODE_ENV === 'development') ...`)**: In dev mode, prints colorful short logs. In production mode, prints full detailed server logs with IPs and timestamps.
* **Lines 36–37 (`app.use(express.json())`)**: Tells Express to automatically translate incoming JSON data in request bodies into `req.body`.
* **Lines 40–41 (`setupSwagger(app)`)**: Turns on the interactive Swagger API documentation at `/api/docs`.
* **Line 44 (`app.use('/api', routes)`)**: Mounts all our routes under `/api` (for example: `/api/trips`, `/api/auth`, etc.).
* **Lines 47–49**: If a user requests a URL that doesn't exist, creates a `404 Route Not Found` error and passes it along.
* **Line 52 (`app.use(errorHandler)`)**: The final catch-all error responder.
* **Line 54 (`module.exports = app`)**: Exports the configured app for `server.js`.

---

# 2. Configuration: `src/config/`

---

### 📄 `src/config/env.js` (Environment Validator)
```javascript
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Fatal Error: Environment variable ${envVar} is not defined.`);
    process.exit(1);
  }
}
```
* **What it does**:
  1. Loads the `.env` file from the project root into `process.env`.
  2. Loops through `requiredEnvVars` (`MONGO_URI` and `JWT_SECRET`).
  3. If either is missing, it prints an error message and stops the server (`process.exit(1)`). This prevents the server from running in a broken state where logins or databases can't work.

---

### 📄 `src/config/db.js` (MongoDB Database Connection)
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```
* **What it does**:
  * Uses Mongoose to connect to your MongoDB cluster via `process.env.MONGO_URI`.
  * If successful, prints the hostname of the database server.
  * If connection fails (e.g. wrong password or internet down), logs the error and stops the app.

---

### 📄 `src/config/firebase.js` (Firebase Cloud Messaging Setup)
```javascript
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let serviceAccount = null;
const keyPath = path.resolve(__dirname, '../../serviceAccountKey.json');

if (fs.existsSync(keyPath)) {
  serviceAccount = require(keyPath);
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    console.warn('⚠️ Could not parse FIREBASE_SERVICE_ACCOUNT env var');
  }
}

if (serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK initialized');
  } catch (err) {
    console.warn(`⚠️ Firebase Admin initialization failed: ${err.message}`);
  }
}
```
* **What it does**:
  * Checks if `serviceAccountKey.json` exists on disk, or if the credentials are provided as a JSON environment variable (common in production hosting like Render).
  * Initializes the Firebase Admin SDK.
  * This allows the backend to send **FCM Web Push notifications** to users' devices when a trip is shared or a booking is made.

---

### 📄 `src/config/swagger.js` & `src/config/swaggerPaths.js`
* `swagger.js`: Creates the OpenAPI 3.0 specification, defines security headers (Bearer JWT token), and attaches Swagger UI at `/api/docs`.
* `swaggerPaths.js`: The dictionary that details every endpoint, its query parameters, example bodies, and responses for the documentation UI.

---

# 3. Middleware (Security & Guards): `src/middleware/`

---

### 📄 `src/middleware/auth.js` (The Login & Token Checker)
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { admin } = require('../config/firebase');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authorized — no token provided');
  }

  const token = authHeader.split(' ')[1];

  // Strategy 1: Attempt Internal JWT Verification
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded && decoded.id) {
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        req.authType = 'jwt';
        return next();
      }
      throw new ApiError(401, 'Not authorized — user no longer exists');
    }
  } catch (jwtErr) {
    if (jwtErr instanceof ApiError) throw jwtErr;
  }

  // Strategy 2: Attempt Firebase ID Token Verification
  if (admin && typeof admin.auth === 'function') {
    try {
      const decodedFirebase = await admin.auth().verifyIdToken(token);
      if (decodedFirebase && decodedFirebase.uid) {
        const { uid, email, name, picture } = decodedFirebase;
        let user = await User.findOne({ $or: [{ firebaseUid: uid }, ...(email ? [{ email }] : [])] });
        if (user) {
          if (!user.firebaseUid) { user.firebaseUid = uid; await user.save(); }
        } else {
          user = await User.create({
            name: name || (email ? email.split('@')[0] : 'Firebase User'),
            email: email || `${uid}@firebase.local`,
            password: crypto.randomBytes(16).toString('hex'),
            firebaseUid: uid,
            avatar: picture || '',
            role: 'user',
          });
        }
        req.user = user;
        req.authType = 'firebase';
        return next();
      }
    } catch (firebaseErr) {}
  }

  throw new ApiError(401, 'Not authorized — token is invalid or expired');
});

module.exports = protect;
```
#### Plain Terms Explanation:
* **The Hybrid System**: Supports **both** traditional email/password JWT tokens AND Google Firebase login tokens!
* **Step 1**: Looks at the `Authorization` header. If it's missing or doesn't say `Bearer ...`, it throws `401 Unauthorized`.
* **Step 2 (Strategy 1)**: First tries to decode the token using our `JWT_SECRET`. If valid, it fetches the user from MongoDB (without password) and attaches them to `req.user`.
* **Step 3 (Strategy 2)**: If Strategy 1 fails, it tries checking if it's a Firebase Google Token. If valid, it automatically finds or creates that user in our MongoDB database so their trips and bookings work seamlessly.
* **Step 4**: Calls `next()` to let the user proceed to the controller.

---

### 📄 `src/middleware/role.js` (The Admin Guard)
```javascript
const ApiError = require('../utils/ApiError');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `User role '${req.user?.role}' is not authorized to access this route`)
      );
    }
    next();
  };
};

module.exports = authorize;
```
* **Plain Terms**: Checks if `req.user.role` matches the required role (like `'admin'`). If a regular user tries to delete a city guide, it stops them with `403 Forbidden`.

---

### 📄 `src/middleware/validate.js` (Form Validation Checker)
```javascript
const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors,
    });
  };
};

module.exports = validate;
```
* **Plain Terms**: Runs rules set by `express-validator` (e.g. "email must be valid", "title cannot be empty"). If anything fails, it returns a clean `400 Bad Request` list showing which field failed and why.

---

### 📄 `src/middleware/error.js` (The Global Safety Net)
```javascript
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new ApiError(400, `Invalid format for ID: ${err.value}`);
  }

  // Mongoose duplicate key (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ApiError(409, `Duplicate value for field '${field}'. Please use another value.`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = new ApiError(400, message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
```
* **Plain Terms**:
  * Turns MongoDB's raw technical errors into friendly messages.
  * For example, if someone enters an invalid ID, it returns: `Invalid format for ID`.
  * If someone signs up with an email that is already taken, it returns: `Duplicate value for field 'email'`.
  * In development mode, includes the code stack trace for easy debugging.

---

# 4. Utilities (Helpers): `src/utils/`

---

### 📄 `src/utils/ApiError.js`
```javascript
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = ApiError;
```
* **Plain Terms**: Custom JavaScript error class that pairs an HTTP status code (like `404` or `401`) with an error message so controllers can simply write `throw new ApiError(404, 'Trip not found')`.

---

### 📄 `src/utils/asyncHandler.js`
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
module.exports = asyncHandler;
```
* **Plain Terms**: Eliminates ugly `try { ... } catch (err) { next(err) }` blocks around every controller method. Any error thrown inside an async function gets caught and sent to `errorHandler` automatically.

---

### 📄 `src/utils/canAccessTrip.js` (Trip Access Rights)
```javascript
const Trip = require('../models/Trip');
const Share = require('../models/Share');

const canAccessTrip = async (userId, tripId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) return false;
  if (trip.userId.toString() === userId.toString()) return true; // Owner
  if (trip.isPublic) return true; // Public trip
  const share = await Share.findOne({ tripId, sharedWith: userId });
  return !!share; // Invited friend
};

const canEditTrip = async (userId, tripId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) return false;
  if (trip.userId.toString() === userId.toString()) return true; // Owner
  const share = await Share.findOne({ tripId, sharedWith: userId, permission: 'edit' });
  return !!share; // Collaborator with edit rights
};

module.exports = { canAccessTrip, canEditTrip };
```
* **Plain Terms**:
  * `canAccessTrip`: Returns `true` if you created the trip, if the trip is marked public, or if someone shared it with you.
  * `canEditTrip`: Returns `true` only if you own the trip or were given `'edit'` permission (people with view-only cannot edit activities or delete items).

---

### 📄 `src/utils/notifyUser.js` (Push & Database Notifications)
```javascript
const User = require('../models/User');
const Notification = require('../models/Notification');
const { messaging } = require('../config/firebase');

const notifyUser = async (userId, { title, body, type = 'general', data = {} }) => {
  try {
    // 1. Save notification record in MongoDB
    const notificationRecord = await Notification.create({ userId, title, body, type, data });

    // 2. Fetch user's phone/browser FCM token
    const user = await User.findById(userId).select('fcmToken');
    if (!user || !user.fcmToken) return notificationRecord;

    // 3. Send real push notification via Firebase
    if (messaging) {
      await messaging.send({
        token: user.fcmToken,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      });
    }
    return notificationRecord;
  } catch (err) {
    console.warn(`Failed notification for user ${userId}: ${err.message}`);
    return null;
  }
};
module.exports = notifyUser;
```
* **Plain Terms**: Whenever an event occurs (like booking a flight or receiving a trip invite), this saves an in-app notification in MongoDB AND sends a real push notification to the user's device via Firebase Cloud Messaging.

---

### 📄 `src/utils/geminiService.js` (Google Gemini AI Integration)
```javascript
const GEMINI_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
        }),
      });
      if (!response.ok) continue;
      const json = await response.json();
      return JSON.parse(json.candidates[0].content.parts[0].text);
    } catch (e) {
      continue;
    }
  }
  return null;
}
```
* **Plain Terms**: Calls Google's Gemini Generative AI REST API with automatic fallback: if one model is overloaded, it automatically tries the next one in the list. It returns structured JSON advice (clothing recommendations, packing checklists, and local etiquette).

---

### 📄 `src/utils/weatherApi.js` & `src/utils/mockData.js`
* `weatherApi.js`: Calls the OpenWeatherMap API for live destination forecasts (temperature, humidity, condition). If an API key isn't provided, it falls back to realistic weather data based on the city.
* `mockData.js`: A rich list of flights (airlines, flight numbers, departure times, prices) and hotels (ratings, amenities, pricing) used for search lookups.

---

# 5. Database Models: `src/models/`

---

### 📄 `src/models/User.js`
* `name`, `email` (unique, validated regex), `password` (hashed with `bcrypt`, `select: false` so it's hidden from queries), `role` (`'user'` or `'admin'`), `firebaseUid`, `fcmToken`, `avatar`.
* Includes `pre('save')` hook to automatically encrypt passwords and `comparePassword()` method for logging in.

### 📄 `src/models/Trip.js`
* `userId`: Reference to the creator.
* `title`, `description`, `destination`, `startDate`, `endDate`.
* `budget`, `currency` (e.g. `'USD'`, `'INR'`, `'EUR'`).
* `status`: `'planning'`, `'ongoing'`, `'completed'`, or `'cancelled'`.
* `tags`: Array of strings (e.g. `['beach', 'summer']`).
* `isPublic`: Boolean flag (if true, anyone can view it via read-only link).

### 📄 `src/models/Itinerary.js`
* `tripId`: Reference to the parent Trip.
* `dayNumber`: Integer (Day 1, Day 2, etc.).
* `date`: The calendar date of that day.
* `title`: Summary of the day (e.g., "Exploring Old Town").
* `transport`: Mode of travel (metro, car, walking) and departure times.
* `notes`: General daily advice or reminders.

### 📄 `src/models/Activity.js`
* `itineraryId`: Reference to the specific day.
* `name`: Activity title (e.g., "Louvre Museum").
* `type`: `'sightseeing'`, `'food'`, `'adventure'`, `'shopping'`, `'transport'`, or `'other'`.
* `startTime`, `endTime`.
* `location`: Name and GPS coordinates (`lat`, `lng`).
* `cost`: Expected price.
* `notes`: Booking numbers or instructions.

### 📄 `src/models/Booking.js`
* `tripId`, `userId`.
* `type`: `'flight'` or `'hotel'`.
* `details`: Object storing airline/hotel name, room type, check-in dates, confirmation code.
* `totalAmount`: Price paid.
* `status`: `'confirmed'` or `'cancelled'`.

### 📄 `src/models/Expense.js`
* `tripId`, `userId`.
* `category`: `'food'`, `'transport'`, `'accommodation'`, `'activities'`, `'shopping'`, `'other'`.
* `amount`, `currency`, `description`, `date`.

### 📄 `src/models/Destination.js`
* `name`, `country`, `description`, `imageUrl`, `bestTimeToVisit`, `highlights` (array of top attractions), `coordinates` (`lat`, `lng`).

### 📄 `src/models/Share.js`
* `tripId`: Trip being shared.
* `sharedBy`: User who sent the invite.
* `sharedWith`: User who received the invite.
* `permission`: `'view'` (read-only) or `'edit'` (can modify days/activities).

### 📄 `src/models/Notification.js`
* `userId`, `title`, `body`, `type` (`booking_confirmed`, `trip_shared`, `reminder`, `general`), `data` (custom payload), `isRead` (boolean).

### 📄 `src/models/PhotoJournal.js`
* `tripId`, `userId`, `imageUrl` (path to uploaded photo), `caption`, `location`.

### 📄 `src/models/Tip.js`
* `destinationId` (optional link to city), `category` (`packing`, `safety`, `budget`, `cultural`), `title`, `content`.

---

# 6. Real-Time Collaboration: `src/socket/collaborative.js`

This file powers live multi-user collaboration using WebSockets:

* **Authentication Handshake (`io.use`)**: When a browser connects with Socket.io, it checks their JWT or Firebase token just like standard API requests. Unauthenticated sockets are rejected.
* **Rooms (`socket.join(roomKey)`)**: Each trip has its own communication room (`trip:<tripId>`).
* **Active User Badges (`join_trip` / `leave_trip`)**: Keeps an in-memory map of who is currently looking at the trip. Whenever someone joins or leaves, emits `active_users` so their avatar lights up on friends' screens.
* **Typing Indicator (`collaborator_typing`)**: When a friend starts typing a note, emits a real-time event so everyone else sees *"Alice is editing Day 2..."*.
* **Live Sync (`itinerary_updated`)**: When one collaborator adds, deletes, or changes an activity, this event broadcasts the changes immediately so everyone's screen updates without page reloads.

---

# 7. Controllers & API Routes

Controllers hold the code that runs when an endpoint is hit.

| Route File | Controller File | Method & Path | What it does |
| :--- | :--- | :--- | :--- |
| `auth.js` | `auth.controller.js` | `POST /api/auth/register` | Registers new user, hashes password, returns JWT. |
| `auth.js` | `auth.controller.js` | `POST /api/auth/login` | Verifies credentials, returns JWT. |
| `auth.js` | `auth.controller.js` | `POST /api/auth/firebase-login` | Logs in user with Google ID token, provisions user in MongoDB. |
| `auth.js` | `auth.controller.js` | `PUT /api/auth/fcm-token` | Updates device push notification token. |
| `trips.js` | `trip.controller.js` | `POST /api/trips` | Creates a new trip owned by the user. |
| `trips.js` | `trip.controller.js` | `GET /api/trips` | Returns all trips the user created or was invited to. |
| `trips.js` | `trip.controller.js` | `GET /api/trips/:id` | Returns single trip with summary counts. |
| `trips.js` | `trip.controller.js` | `GET /api/trips/:id/offline` | Bundles trip, days, activities, bookings, expenses into one JSON file for offline mode. |
| `trips.js` | `trip.controller.js` | `PUT /api/trips/:id` | Updates trip details. |
| `trips.js` | `trip.controller.js` | `DELETE /api/trips/:id` | Cascades delete for trip, itineraries, activities, bookings, expenses. |
| `itineraries.js`| `itinerary.controller.js` | `POST /api/itineraries` | Adds a day to a trip. |
| `itineraries.js`| `itinerary.controller.js` | `GET /api/itineraries/trip/:id`| Gets all days and child activities for a trip. |
| `itineraries.js`| `itinerary.controller.js` | `PUT /api/itineraries/:id` | Updates an itinerary day. |
| `itineraries.js`| `itinerary.controller.js` | `DELETE /api/itineraries/:id` | Deletes an itinerary day and its activities. |
| `activities.js` | `activity.controller.js` | `POST /api/activities` | Adds an activity item (e.g. Museum tour) to a day. |
| `activities.js` | `activity.controller.js` | `PUT /api/activities/:id` | Updates an activity item. |
| `activities.js` | `activity.controller.js` | `DELETE /api/activities/:id` | Deletes an activity item. |
| `bookings.js` | `booking.controller.js` | `POST /api/bookings` | Confirms flight/hotel booking; triggers push notification. |
| `bookings.js` | `booking.controller.js` | `GET /api/bookings/trip/:id` | Lists all bookings for a trip. |
| `bookings.js` | `booking.controller.js` | `PATCH /api/bookings/:id/cancel`| Cancels a booking. |
| `flights.js` | `booking.controller.js` | `GET /api/flights` | Searches flights from mock data catalog. |
| `hotels.js` | `booking.controller.js` | `GET /api/hotels` | Searches hotels from mock data catalog. |
| `expenses.js` | `expense.controller.js` | `POST /api/expenses` | Adds expense item. |
| `expenses.js` | `expense.controller.js` | `GET /api/expenses/trip/:id` | Lists expenses and calculates total spending vs budget. |
| `destinations.js`| `destination.controller.js`| `GET /api/destinations` | Searches travel guides. |
| `destinations.js`| `destination.controller.js`| `POST /api/destinations` | Admin-only: creates a new destination guide. |
| `weather.js` | `weather.controller.js` | `GET /api/weather?city=...` | Fetches live weather + AI packing/travel advice. |
| `tips.js` | `tips.controller.js` | `GET /api/tips` | Lists categorized travel tips. |
| `tips.js` | `tips.controller.js` | `GET /api/tips/ai` | Generates insider destination tips using Gemini AI. |
| `share.js` | `share.controller.js` | `POST /api/share` | Shares trip with friend via email (`view` or `edit`). |
| `share.js` | `share.controller.js` | `DELETE /api/share/:id` | Revokes collaborator access. |
| `notifications.js`| `notification.controller.js`| `GET /api/notifications` | Returns user's in-app notification history. |
| `photos.js` | `photoJournal.controller.js`| `POST /api/photos` | Uploads photo file via Multer to `public/uploads/`. |
| `photos.js` | `photoJournal.controller.js`| `GET /api/photos/trip/:id` | Retrieves all photo memories for a trip. |

---

# 8. Database Seeder: `src/seeds/seed.js`

* **What it does**: A development helper script executed via `npm run seed`.
* **Step-by-step logic**:
  1. Connects to MongoDB using `src/config/db.js`.
  2. Clears existing data from all collections (`User.deleteMany()`, `Trip.deleteMany()`, etc.).
  3. Inserts pre-configured accounts:
     * **Admin user**: `admin@tripplanner.com` / `admin123`
     * **Regular test user**: `john@example.com` / `password123`
  4. Inserts popular global destinations (Tokyo, Paris, New York, Bali) with high-res photos, descriptions, and top sights.
  5. Inserts sample trips with day-by-day itineraries, scheduled activities, flight/hotel bookings, expenses, and travel tips.
  6. Prints `✅ Database Seeded Successfully` and safely exits with code `0`.
