const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sharedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view',
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: tripId + sharedWith
shareSchema.index({ tripId: 1, sharedWith: 1 }, { unique: true });

const Share = mongoose.model('Share', shareSchema);

module.exports = Share;
