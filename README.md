# 🗺️ TripPlanner — Smart Travel Itinerary Planner (Backend)

> **Case Study 71: Smart Travel Itinerary Planner Backend**  
> Complete Node.js, Express, MongoDB, Firebase, and Socket.io backend API.

---

## 🚀 Tech Stack

- **Runtime & Framework:** Node.js (v18+) · Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens) · bcryptjs · Firebase Admin SDK (Google OAuth ID Token verification)
- **Real-time Collaboration:** Socket.io (room-based itinerary collaboration)
- **Cloud & Storage:** Cloudinary (photo journaling) · Firebase Cloud Messaging (FCM Push Notifications)
- **Documentation:** Swagger UI (`/api-docs`) · Postman Collection (`TripPlanner.postman_collection.json`)

---

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (Local instance or MongoDB Atlas URI)
3. *(Optional)* Firebase Project service account for push notifications
4. *(Optional)* Cloudinary account for media upload

---

## ⚙️ Installation & Setup

1. **Clone & Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/tripplanner
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   FIREBASE_SERVICE_ACCOUNT=
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```

3. **Seed Database:**
   Populate initial admin, test users, destinations, tips, sample trips, and itineraries:
   ```bash
   npm run seed
   ```

4. **Start Server:**
   - **Development (with hot-reload):**
     ```bash
     npm run dev
     ```
   - **Production:**
     ```bash
     npm start
     ```

---

## 📖 API Documentation & Swagger

- **Interactive Swagger UI:** Visit `http://localhost:5000/api-docs` when the server is running.
- **Postman Collection:** Import `TripPlanner.postman_collection.json` into Postman.

---

## 🛣️ API Endpoints Summary (40 Endpoints)

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user (role forced to `user`) | Public |
| `POST` | `/api/auth/login` | Login with email and password | Public |
| `POST` | `/api/auth/firebase-login` | Authenticate using Firebase ID Token | Public |
| `PUT` | `/api/auth/fcm-token` | Save/update FCM device push token | Protected |

### 2. Trips (`/api/trips`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/trips` | Create a new trip | Protected |
| `GET` | `/api/trips` | Get user's trips + shared trips (paginated) | Protected |
| `GET` | `/api/trips/:id` | Get trip details (with access validation) | Protected |
| `PUT` | `/api/trips/:id` | Update trip (owner or `edit` permission) | Protected |
| `DELETE` | `/api/trips/:id` | Delete trip (cascade deletes all children) | Protected (Owner only) |
| `GET` | `/api/trips/:id/offline` | Complete offline data bundle | Protected |

### 3. Itineraries (`/api/itineraries`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/itineraries` | Create day-by-day itinerary | Protected |
| `GET` | `/api/itineraries` | Get all itineraries user has access to | Protected |
| `GET` | `/api/itineraries/trip/:id` | Get itineraries for trip (sorted by `dayNumber`) | Protected |
| `PUT` | `/api/itineraries/:id` | Update an itinerary | Protected |

### 4. Activities (`/api/activities`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/activities` | Create activity under an itinerary | Protected |
| `GET` | `/api/activities` | Get current user's activities | Protected |
| `GET` | `/api/activities/itinerary/:id` | Get activities for itinerary (sorted by `startTime`) | Protected |

### 5. Bookings & Search (`/api/flights`, `/api/hotels`, `/api/bookings`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/flights` | Search mock flights | Protected |
| `GET` | `/api/hotels` | Search mock hotels | Protected |
| `POST` | `/api/bookings` | Book flight/hotel (auto-creates expense & notification) | Protected |
| `GET` | `/api/bookings` | Get user's bookings | Protected |
| `GET` | `/api/bookings/trip/:id` | Get bookings for trip | Protected |

### 6. Expenses (`/api/expenses`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/expenses` | Manually log an expense | Protected |
| `GET` | `/api/expenses` | Get user's expenses | Protected |
| `GET` | `/api/expenses/trip/:id` | Get expenses + aggregated totalSpent & categories | Protected |

### 7. Destinations & Tips (`/api/admin/destinations`, `/api/tips`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/admin/destinations` | Get active destinations (search & filter) | Protected |
| `POST` | `/api/admin/destinations` | Create destination | Protected (Admin only) |
| `GET` | `/api/tips` | Get all travel tips | Protected |
| `GET` | `/api/tips/destination/:id` | Get tips for destination | Protected |

### 8. Weather & Sharing (`/api/weather`, `/api/share`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/weather` | Get current weather & forecast | Protected |
| `GET` | `/api/weather/destination/:id`| Get weather for destination by ID | Protected |
| `POST` | `/api/share` | Share trip with user emails (`view` / `edit`) | Protected (Owner only) |
| `GET` | `/api/share/trip/:id` | Get share list for a trip | Protected |

### 9. Notifications & Photos (`/api/notifications`, `/api/photos`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/notifications/send` | Send notification (Admin to any, user to self) | Protected |
| `GET` | `/api/notifications` | View current user's notifications | Protected |
| `POST` | `/api/photos` | Upload trip photo (Cloudinary) | Protected |
| `GET` | `/api/photos/trip/:id` | Get photos for a trip | Protected |
| `DELETE` | `/api/photos/:id` | Delete photo | Protected (Owner only) |

---

## ⚡ Real-Time Collaboration (Socket.io)

Socket.io is integrated on the HTTP server with JWT authentication.
- **Connection:** Provide Bearer token in handshake auth: `{ auth: { token: "<JWT>" } }`
- **Room Events:**
  - `join-itinerary` — Joins itinerary room (requires owner or `'edit'` share permission).
  - `leave-itinerary` — Leaves itinerary room.
  - `itinerary-update` — Real-time changes broadcast to all peers in the room.
  - `activity-added` / `activity-updated` — Broadcast updates when activities change.

---

## ☁️ Deployment Guide (Render)

1. Push your repository to GitHub.
2. In Render, select **New > Web Service** and connect the repository.
3. Configure the service:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Set Environment Variables in Render:
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster.mongodb.net/tripplanner`
   - `JWT_SECRET`: A secure random string
   - `NODE_ENV`: `production`
   - `FIREBASE_SERVICE_ACCOUNT`: Full JSON string of service account (no files needed)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
5. Click **Deploy Web Service**.
