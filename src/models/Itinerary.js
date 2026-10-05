const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Please provide a tripId'],
    },
    dayNumber: {
      type: Number,
      required: [true, 'Please provide a dayNumber'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide a date'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    notes: {
      type: String,
      default: '',
    },
    transport: {
      mode: {
        type: String,
        default: '',
      },
      from: {
        type: String,
        default: '',
      },
      to: {
        type: String,
        default: '',
      },
      details: {
        type: String,
        default: '',
      },
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

itinerarySchema.index({ tripId: 1 });

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

module.exports = Itinerary;
