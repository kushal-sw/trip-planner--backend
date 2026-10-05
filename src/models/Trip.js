const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a trip title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    destination: {
      type: String,
      required: [true, 'Please provide a destination'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide a start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide an end date'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    budget: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['planning', 'ongoing', 'completed'],
      default: 'planning',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
tripSchema.index({ userId: 1 });
tripSchema.index({ destination: 1 });

// Virtual: duration in days
tripSchema.virtual('duration').get(function () {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  return 0;
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
