const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/error');
const ApiError = require('./utils/ApiError');

const app = express();

// Security HTTP headers (CSP disabled so Swagger & test-fcm CDN scripts load smoothly)
app.use(helmet({ contentSecurityPolicy: false }));

// Serve FCM service worker at root domain (required by browser push service)
app.get('/firebase-messaging-sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, '../public/firebase-messaging-sw.js'));
});

// Serve public static frontend
app.use(express.static(path.join(__dirname, '../public')));

// Enable CORS
app.use(cors());

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger API Documentation
const { setupSwagger } = require('./config/swagger');
setupSwagger(app);

// Mount all API routes
app.use('/api', routes);

// Handle 404 for unmatched routes
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
