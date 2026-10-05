const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    itineraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Itinerary',
      required: [true, 'Please provide an itineraryId'],
    },
    name: {
      type: String,
      required: [true, 'Please provide an activity name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['sightseeing', 'food', 'adventure', 'shopping', 'transport', 'other'],
      default: 'sightseeing',
    },
    location: {
      name: {
        type: String,
        default: '',
      },
      address: {
        type: String,
        default: '',
      },
      coordinates: {
        lat: {
          type: Number,
          default: null,
        },
        lng: {
          type: Number,
          default: null,
        },
      },
    },
    startTime: {
      type: String,
      default: '',
    },
    endTime: {
      type: String,
      default: '',
    },
    cost: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    notes: {
      type: String,
      default: '',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ itineraryId: 1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
