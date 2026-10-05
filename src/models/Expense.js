const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    bookingRef: {
      type: String,
      default: null,
    },
    receipt: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ tripId: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
