const mongoose = require('mongoose');

const photoJournalSchema = new mongoose.Schema(
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
    imageUrl: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    takenAt: {
      type: Date,
      default: Date.now,
    },
    tags: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

photoJournalSchema.index({ tripId: 1 });

const PhotoJournal = mongoose.model('PhotoJournal', photoJournalSchema);

module.exports = PhotoJournal;
