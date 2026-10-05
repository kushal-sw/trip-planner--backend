module.exports = {
  '/api/health': {
    get: {
      tags: ['System'],
      summary: 'System health check',
      responses: {
        200: { description: 'Server is healthy' },
      },
    },
  },
  '/api/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'password'],
              properties: {
                name: { type: 'string', example: 'Alex Traveler' },
                email: { type: 'string', example: 'alex@example.com' },
                password: { type: 'string', minLength: 6, example: 'userPassword123' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'User registered successfully with JWT' },
        400: { description: 'Validation error / email already in use' },
      },
    },
  },
  '/api/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Login with email & password',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', example: 'alex@example.com' },
                password: { type: 'string', example: 'userPassword123' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Login successful' },
        401: { description: 'Invalid email or password' },
      },
    },
  },
  '/api/auth/firebase-login': {
    post: {
      tags: ['Authentication'],
      summary: 'Authenticate with Firebase ID Token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['idToken'],
              properties: {
                idToken: { type: 'string', description: 'Firebase client ID token' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Firebase authenticated and app JWT issued' },
        401: { description: 'Invalid Firebase ID token' },
      },
    },
  },
  '/api/auth/fcm-token': {
    put: {
      tags: ['Authentication'],
      summary: 'Update user FCM device token for push notifications',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['fcmToken'],
              properties: {
                fcmToken: { type: 'string', example: 'dAjfbiAmMctsF4e...' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'FCM token updated' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/api/trips': {
    post: {
      tags: ['Trips'],
      summary: 'Create a new trip',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'destination', 'startDate', 'endDate'],
              properties: {
                title: { type: 'string', example: 'European Vacation' },
                destination: { type: 'string', example: 'Paris, France' },
                startDate: { type: 'string', format: 'date', example: '2026-07-01' },
                endDate: { type: 'string', format: 'date', example: '2026-07-10' },
                budget: { type: 'number', example: 150000 },
                currency: { type: 'string', default: 'INR', example: 'INR' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Trip created successfully' },
      },
    },
    get: {
      tags: ['Trips'],
      summary: 'Get all trips for the authenticated user',
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
      ],
      responses: {
        200: { description: 'Trips list with pagination' },
      },
    },
  },
  '/api/trips/{id}': {
    get: {
      tags: ['Trips'],
      summary: 'Get trip details by ID',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Trip details' },
        404: { description: 'Trip not found' },
      },
    },
    put: {
      tags: ['Trips'],
      summary: 'Update trip details',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' },
                budget: { type: 'number' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Trip updated successfully' },
      },
    },
    delete: {
      tags: ['Trips'],
      summary: 'Delete trip and all related data',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Trip deleted successfully' },
      },
    },
  },
  '/api/trips/{id}/offline': {
    get: {
      tags: ['Trips'],
      summary: 'Download complete offline itinerary & booking bundle',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Consolidated JSON bundle for offline viewing' },
      },
    },
  },
  '/api/itineraries': {
    post: {
      tags: ['Itineraries'],
      summary: 'Create daily itinerary schedule',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['tripId', 'dayNumber', 'date', 'title'],
              properties: {
                tripId: { type: 'string' },
                dayNumber: { type: 'integer', example: 1 },
                date: { type: 'string', format: 'date', example: '2026-07-01' },
                title: { type: 'string', example: 'Arrival and Eiffel Tower Tour' },
                notes: { type: 'string' },
                transport: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Itinerary created' },
      },
    },
    get: {
      tags: ['Itineraries'],
      summary: 'Get all itineraries accessible by user',
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: 'List of itineraries' },
      },
    },
  },
  '/api/itineraries/trip/{id}': {
    get: {
      tags: ['Itineraries'],
      summary: 'Get all itinerary days for a specific trip',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Sorted daily schedules' },
      },
    },
  },
  '/api/itineraries/{id}': {
    get: {
      tags: ['Itineraries'],
      summary: 'Get single itinerary with activities',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Itinerary day details' },
      },
    },
    put: {
      tags: ['Itineraries'],
      summary: 'Update itinerary day',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                notes: { type: 'string' },
                dayNumber: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Itinerary updated' },
      },
    },
    delete: {
      tags: ['Itineraries'],
      summary: 'Delete itinerary and cascade delete its activities',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Itinerary deleted' },
      },
    },
  },
  '/api/activities': {
    post: {
      tags: ['Activities'],
      summary: 'Create activity under an itinerary',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['itineraryId', 'name'],
              properties: {
                itineraryId: { type: 'string' },
                name: { type: 'string', example: 'Louvre Museum Guided Tour' },
                type: { type: 'string', enum: ['sightseeing', 'food', 'adventure', 'shopping', 'transport', 'other'] },
                startTime: { type: 'string', example: '10:00 AM' },
                endTime: { type: 'string', example: '01:00 PM' },
                cost: { type: 'number', example: 2500 },
                currency: { type: 'string', default: 'INR' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Activity created' },
      },
    },
    get: {
      tags: ['Activities'],
      summary: 'Get all activities by user',
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: 'Activities list' },
      },
    },
  },
  '/api/activities/itinerary/{id}': {
    get: {
      tags: ['Activities'],
      summary: 'Get activities for an itinerary day',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Activities sorted by time' },
      },
    },
  },
  '/api/activities/{id}': {
    get: {
      tags: ['Activities'],
      summary: 'Get activity details',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Activity details' },
      },
    },
    put: {
      tags: ['Activities'],
      summary: 'Update activity details',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                cost: { type: 'number' },
                notes: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Activity updated' },
      },
    },
    delete: {
      tags: ['Activities'],
      summary: 'Delete activity',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Activity deleted' },
      },
    },
  },
  '/api/flights': {
    get: {
      tags: ['Travel Search'],
      summary: 'Search mock flight options',
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'from', in: 'query', schema: { type: 'string', example: 'DEL' } },
        { name: 'to', in: 'query', schema: { type: 'string', example: 'CDG' } },
        { name: 'date', in: 'query', schema: { type: 'string', example: '2026-07-01' } },
      ],
      responses: {
        200: { description: 'Available flights' },
      },
    },
  },
  '/api/hotels': {
    get: {
      tags: ['Travel Search'],
      summary: 'Search mock hotel options',
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'destination', in: 'query', schema: { type: 'string', example: 'Paris' } },
        { name: 'checkIn', in: 'query', schema: { type: 'string', example: '2026-07-01' } },
        { name: 'checkOut', in: 'query', schema: { type: 'string', example: '2026-07-05' } },
      ],
      responses: {
        200: { description: 'Available hotels' },
      },
    },
  },
  '/api/bookings': {
    post: {
      tags: ['Bookings'],
      summary: 'Book flight/hotel (auto-creates expense & triggers push notification)',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['tripId', 'type', 'details', 'totalAmount'],
              properties: {
                tripId: { type: 'string' },
                type: { type: 'string', enum: ['flight', 'hotel'] },
                totalAmount: { type: 'number', example: 18500 },
                currency: { type: 'string', default: 'INR' },
                details: {
                  type: 'object',
                  example: { airline: 'Air France', flightNumber: 'AF-226' },
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Booking confirmed and expense recorded' },
      },
    },
    get: {
      tags: ['Bookings'],
      summary: 'Get all bookings for the logged-in user',
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: 'User bookings list' },
      },
    },
  },
  '/api/bookings/trip/{id}': {
    get: {
      tags: ['Bookings'],
      summary: 'Get all bookings for a specific trip',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Trip bookings' },
      },
    },
  },
  '/api/bookings/{id}': {
    get: {
      tags: ['Bookings'],
      summary: 'Get single booking details',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Booking details' },
      },
    },
    delete: {
      tags: ['Bookings'],
      summary: 'Delete booking record',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Booking deleted' },
      },
    },
  },
  '/api/bookings/{id}/cancel': {
    patch: {
      tags: ['Bookings'],
      summary: 'Cancel a booking and dispatch cancellation push alert',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Booking cancelled' },
      },
    },
  },
  '/api/expenses': {
    post: {
      tags: ['Expenses'],
      summary: 'Add an expense entry to a trip',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['tripId', 'category', 'description', 'amount'],
              properties: {
                tripId: { type: 'string' },
                category: {
                  type: 'string',
                  enum: ['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'],
                },
                description: { type: 'string', example: 'Dinner at Le Petit Retro' },
                amount: { type: 'number', example: 3400 },
                currency: { type: 'string', default: 'INR' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Expense added' },
      },
    },
    get: {
      tags: ['Expenses'],
      summary: 'Get all expenses logged by user',
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: 'List of expenses' },
      },
    },
  },
  '/api/expenses/trip/{id}': {
    get: {
      tags: ['Expenses'],
      summary: 'Get trip expenses with aggregated total & category breakdown',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Trip expenses and budget calculations' },
      },
    },
  },
  '/api/expenses/{id}': {
    get: {
      tags: ['Expenses'],
      summary: 'Get single expense details',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Expense details' },
      },
    },
    put: {
      tags: ['Expenses'],
      summary: 'Update an expense entry',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                description: { type: 'string' },
                amount: { type: 'number' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Expense updated' },
      },
    },
    delete: {
      tags: ['Expenses'],
      summary: 'Delete an expense entry',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Expense deleted' },
      },
    },
  },
  '/api/destinations': {
    get: {
      tags: ['Destinations'],
      summary: 'Search & filter active destinations',
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'country', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Destinations list with partnerships' },
      },
    },
  },
  '/api/destinations/{id}': {
    get: {
      tags: ['Destinations'],
      summary: 'Get destination details by ID',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Destination details' },
      },
    },
  },
  '/api/admin/destinations': {
    post: {
      tags: ['Admin Destinations'],
      summary: 'Create a destination with partnerships (Admin only)',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'country'],
              properties: {
                name: { type: 'string', example: 'Kyoto' },
                country: { type: 'string', example: 'Japan' },
                description: { type: 'string' },
                bestTimeToVisit: { type: 'string', example: 'March to May' },
                averageBudget: { type: 'number', example: 120000 },
                partnerships: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      partnerName: { type: 'string' },
                      type: { type: 'string', default: 'hotel' },
                      discount: { type: 'string', default: '15%' },
                      validUntil: { type: 'string', format: 'date' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Destination created' },
        403: { description: 'Admin role required' },
      },
    },
  },
  '/api/admin/destinations/{id}': {
    put: {
      tags: ['Admin Destinations'],
      summary: 'Update destination and manage partnerships (Admin only)',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Destination updated' },
      },
    },
    delete: {
      tags: ['Admin Destinations'],
      summary: 'Delete or deactivate destination (Admin only)',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Destination deleted' },
      },
    },
  },
  '/api/weather': {
    get: {
      tags: ['Weather'],
      summary: 'Get 5-day weather forecast by destination query',
      security: [{ BearerAuth: [] }],
      parameters: [
        { name: 'city', in: 'query', schema: { type: 'string', example: 'Tokyo' } },
      ],
      responses: {
        200: { description: 'Weather and 5-day forecast' },
      },
    },
  },
  '/api/tips': {
    get: {
      tags: ['Local Tips'],
      summary: 'Get travel tips with pagination',
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: 'List of tips' },
      },
    },
  },
  '/api/tips/destination/{id}': {
    get: {
      tags: ['Local Tips'],
      summary: 'Get travel tips for a specific destination',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Destination tips' },
      },
    },
  },
  '/api/share': {
    post: {
      tags: ['Trip Sharing'],
      summary: 'Share trip with travel buddies by email',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['tripId', 'emails'],
              properties: {
                tripId: { type: 'string' },
                emails: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['buddy@example.com'],
                },
                permission: { type: 'string', enum: ['view', 'edit'], default: 'view' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Trip shared and notifications sent' },
      },
    },
  },
  '/api/share/trip/{id}': {
    get: {
      tags: ['Trip Sharing'],
      summary: 'Get buddies a trip is shared with',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'List of shared buddies' },
      },
    },
  },
  '/api/share/{id}': {
    delete: {
      tags: ['Trip Sharing'],
      summary: 'Revoke trip share access',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Share access revoked' },
      },
    },
  },
  '/api/notifications/send': {
    post: {
      tags: ['Notifications'],
      summary: 'Send FCM push notification (Admin or Self)',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'body'],
              properties: {
                title: { type: 'string', example: 'Trip Update' },
                body: { type: 'string', example: 'Your flight has been scheduled!' },
                type: { type: 'string', default: 'general' },
                data: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Push notification processed' },
      },
    },
  },
  '/api/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'Get notifications for logged-in user',
      security: [{ BearerAuth: [] }],
      responses: {
        200: { description: 'Recent notifications' },
      },
    },
  },
  '/api/photos': {
    post: {
      tags: ['Photo Journal'],
      summary: 'Upload trip photo memory',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                tripId: { type: 'string' },
                caption: { type: 'string' },
                location: { type: 'string' },
                image: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Photo uploaded' },
      },
    },
  },
  '/api/photos/trip/{id}': {
    get: {
      tags: ['Photo Journal'],
      summary: 'Get photo memories for a trip',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Trip photos' },
      },
    },
  },
  '/api/photos/{id}': {
    delete: {
      tags: ['Photo Journal'],
      summary: 'Delete photo memory',
      security: [{ BearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Photo deleted' },
      },
    },
  },
};
