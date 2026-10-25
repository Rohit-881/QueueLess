const mongoose = require('mongoose');

const queueSessionSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service reference is required'],
    },
    businessDate: {
      type: String,
      required: [true, 'Business date is required (YYYY-MM-DD)'],
      default: () => new Date().toISOString().split('T')[0],
    },
    status: {
      type: String,
      enum: ['open', 'paused', 'closed'],
      default: 'open',
    },
    lastSequence: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeTokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      default: null,
    },
    maximumCapacity: {
      type: Number,
      required: [true, 'Session capacity is required'],
      min: 1,
      default: 50,
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active sessions by service and status
queueSessionSchema.index({ serviceId: 1, status: 1 });
queueSessionSchema.index({ serviceId: 1, businessDate: 1, status: 1 });

const QueueSession = mongoose.model('QueueSession', queueSessionSchema);
module.exports = QueueSession;
