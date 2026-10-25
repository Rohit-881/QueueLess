const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      minlength: [3, 'Service name must be at least 3 characters'],
      maxlength: [100, 'Service name cannot exceed 100 characters'],
    },
    codePrefix: {
      type: String,
      required: [true, 'Token prefix code is required (e.g., ADM, OPD)'],
      trim: true,
      uppercase: true,
      minlength: [2, 'Prefix must be at least 2 characters'],
      maxlength: [5, 'Prefix cannot exceed 5 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      enum: ['Healthcare', 'Education', 'Banking & Finance', 'Salon & Wellness', 'Public Administration', 'Other'],
      default: 'Education',
    },
    location: {
      type: String,
      required: [true, 'Physical location or counter is required'],
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    averageServiceDuration: {
      type: Number,
      required: [true, 'Average service duration (in minutes) is required'],
      min: [1, 'Service duration must be at least 1 minute'],
      max: [180, 'Service duration cannot exceed 180 minutes'],
      default: 10,
    },
    maximumQueueCapacity: {
      type: Number,
      required: [true, 'Maximum queue capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [1000, 'Capacity cannot exceed 1000'],
      default: 50,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedStaffIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for active services lookup
serviceSchema.index({ isActive: 1, name: 1 });

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;
