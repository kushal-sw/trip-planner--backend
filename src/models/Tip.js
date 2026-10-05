const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema(
  {
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: [true, 'destinationId is required'],
    },
    category: {
      type: String,
      enum: ['safety', 'food', 'transport', 'culture', 'currency', 'general'],
      default: 'general',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Tip text is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

tipSchema.index({ destinationId: 1 });

const Tip = mongoose.model('Tip', tipSchema);

module.exports = Tip;
