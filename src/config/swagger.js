const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerPaths = require('./swaggerPaths');

const port = process.env.PORT || 5001;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TripPlanner API — Smart Travel Itinerary Planner',
      version: '1.0.0',
      description:
        'Complete REST API and real-time collaboration backend for TripPlanner (Case Study 71). Includes authentication, trips, day-by-day itineraries, activities, bookings, expenses, destinations & partnerships, tips, weather, trip sharing, push notifications, and photo journaling.',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server',
      },
      {
        url: 'https://tripplanner-api.onrender.com',
        description: 'Render Production server',
      },
    ],
    tags: [
      { name: 'System', description: 'System health check' },
      { name: 'Authentication', description: 'User registration, login, Firebase auth, FCM device token' },
      { name: 'Trips', description: 'Trip itinerary containers & offline bundle downloads' },
      { name: 'Itineraries', description: 'Day-by-day itinerary schedules' },
      { name: 'Activities', description: 'Scheduled activities per itinerary day' },
      { name: 'Travel Search', description: 'Flight & hotel mock search engine' },
      { name: 'Bookings', description: 'Flight and hotel bookings with automated expense & push sync' },
      { name: 'Expenses', description: 'Trip budgeting, expense logging, and category aggregation' },
      { name: 'Destinations', description: 'Destination guides & partner perks' },
      { name: 'Admin Destinations', description: 'Destination & partnership management (Admin only)' },
      { name: 'Weather', description: 'Destination current weather and 5-day forecasts' },
      { name: 'Local Tips', description: 'Destination travel tips, customs & local advice' },
      { name: 'Trip Sharing', description: 'Share trips with buddies (view/edit access)' },
      { name: 'Notifications', description: 'Firebase Cloud Messaging push alerts & notification history' },
      { name: 'Photo Journal', description: 'Trip photo journal memories & uploads' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token (or Firebase ID token) in the format: Bearer <token>',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    paths: swaggerPaths,
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'TripPlanner API Docs',
    })
  );
};

module.exports = {
  setupSwagger,
  swaggerSpec,
};
