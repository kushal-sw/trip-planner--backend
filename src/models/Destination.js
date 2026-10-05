const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Destination name is required'],
      trim: true,
      unique: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    popularAttractions: [
      {
        type: String,
        trim: true,
      },
    ],
    bestTimeToVisit: {
      type: String,
      default: '',
    },
    averageBudget: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    partnerships: [
      {
        partnerName: { type: String, required: true },
        type: { type: String, default: 'hotel' },
        discount: { type: String, default: '10%' },
        validUntil: { type: Date },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

destinationSchema.index({ country: 1 });

const Destination = mongoose.model('Destination', destinationSchema);

module.exports = Destination;
