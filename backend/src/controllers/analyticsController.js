const AnalyticsService = require('../services/analyticsService');
const User = require('../models/User');

/**
 * @desc    Get system-wide or service-specific operational analytics
 * @route   GET /api/analytics
 * @access  Staff or Admin
 */
const getAnalytics = async (req, res, next) => {
  try {
    const { serviceId } = req.query;
    const metrics = await AnalyticsService.getOverviewMetrics(serviceId);

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all staff members for assignment workflows
 * @route   GET /api/analytics/staff
 * @access  Admin only
 */
const getStaffList = async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $in: ['staff', 'admin'] } }).select('-passwordHash');
    res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (with role filters)
 * @route   GET /api/analytics/users
 * @access  Admin only
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role or active status
 * @route   PATCH /api/analytics/users/:id
 * @access  Admin only
 */
const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const updateData = {};

    if (role && ['customer', 'staff', 'admin'].includes(role)) {
      updateData.role = role;
    }
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new user with any role
 * @route   POST /api/analytics/users
 * @access  Admin only
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const assignedRole = ['admin', 'staff', 'customer'].includes(role) ? role : 'customer';
    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: assignedRole,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `User created successfully with role "${assignedRole}".`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset and reseed initial demo data from admin panel
 * @route   POST /api/analytics/reseed
 * @access  Admin only
 */
const reseedData = async (req, res, next) => {
  try {
    const { runSeed } = require('../services/seedService');
    const result = await runSeed();

    res.status(200).json({
      success: true,
      message: 'Initial demo services, users, and active tokens restored successfully.',
      result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
  getStaffList,
  getAllUsers,
  updateUser,
  createUser,
  reseedData,
};
