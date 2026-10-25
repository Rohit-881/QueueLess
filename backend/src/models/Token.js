const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    queueSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueueSession',
      required: [true, 'Queue session reference is required'],
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service reference is required'],
    },
    tokenNumber: {
      type: String,
      required: [true, 'Token number is required'],
      trim: true,
    },
    queueSequence: {
      type: Number,
      required: [true, 'Queue sequence number is required'],
      min: 1,
    },
    status: {
      type: String,
      enum: ['waiting', 'called', 'serving', 'completed', 'cancelled', 'skipped', 'no_show'],
      default: 'waiting',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    serviceStartedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    skippedAt: {
      type: Date,
      default: null,
    },
    noShowAt: {
      type: Date,
      default: null,
    },
    resolutionReason: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high performance and integrity:
// 1. Unique sequence number per queue session
tokenSchema.index({ queueSessionId: 1, queueSequence: 1 }, { unique: true });

// 2. Efficient lookup of ordered tokens in a queue session by status
tokenSchema.index({ queueSessionId: 1, status: 1, queueSequence: 1 });

// 3. Prevent duplicate ACTIVE tokens for the same user in the same queue session
tokenSchema.index(
  { userId: 1, queueSessionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['waiting', 'called', 'serving'] },
    },
  }
);

// 4. Customer history queries
tokenSchema.index({ userId: 1, joinedAt: -1 });

const Token = mongoose.model('Token', tokenSchema);
module.exports = Token;
