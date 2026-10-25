const Token = require('../models/Token');
const QueueService = require('../services/queueService');

/**
 * @desc    Customer joins virtual queue
 * @route   POST /api/tokens/join
 * @access  Private (Customer)
 */
const joinQueue = async (req, res, next) => {
  try {
    const { serviceId } = req.body;
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'serviceId is required to join a queue.',
        code: 'MISSING_SERVICE_ID',
      });
    }

    const result = await QueueService.joinQueue(req.user._id, serviceId);

    res.status(201).json({
      success: true,
      message: `Successfully joined queue. Your token is ${result.token.tokenNumber}.`,
      token: result.token,
      position: result.position,
      peopleAhead: result.peopleAhead,
      estimatedWaitMinutes: result.estimatedWaitMinutes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer's current active token (live state)
 * @route   GET /api/tokens/my-active
 * @access  Private (Customer)
 */
const getMyActiveToken = async (req, res, next) => {
  try {
    const token = await Token.findOne({
      userId: req.user._id,
      status: { $in: ['waiting', 'called', 'serving'] },
    })
      .populate('serviceId', 'name codePrefix location averageServiceDuration')
      .populate('queueSessionId', 'status maximumCapacity activeTokenId');

    if (!token) {
      return res.status(200).json({
        success: true,
        hasActiveToken: false,
        token: null,
      });
    }

    // Dynamic position calculation
    const positionData = await QueueService.calculatePosition(token);

    // Get current serving token details for the session
    let currentlyServingNumber = null;
    if (token.queueSessionId?.activeTokenId) {
      const active = await Token.findById(token.queueSessionId.activeTokenId);
      currentlyServingNumber = active?.tokenNumber || null;
    }

    res.status(200).json({
      success: true,
      hasActiveToken: true,
      token,
      position: positionData.position,
      peopleAhead: positionData.peopleAhead,
      estimatedWaitMinutes: positionData.estimatedWaitMinutes,
      currentlyServingToken: currentlyServingNumber,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer's full token history
 * @route   GET /api/tokens/my-history
 * @access  Private (Customer)
 */
const getMyTokenHistory = async (req, res, next) => {
  try {
    const tokens = await Token.find({ userId: req.user._id })
      .populate('serviceId', 'name codePrefix location')
      .sort({ joinedAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: tokens.length,
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single token details by ID
 * @route   GET /api/tokens/:id
 * @access  Private
 */
const getTokenById = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate('serviceId', 'name codePrefix location averageServiceDuration')
      .populate('userId', 'name email');

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
        code: 'TOKEN_NOT_FOUND',
      });
    }

    // Ownership or staff/admin check
    const isOwner = token.userId._id.toString() === req.user._id.toString();
    const isStaffOrAdmin = ['staff', 'admin'].includes(req.user.role);

    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this token.',
        code: 'FORBIDDEN',
      });
    }

    const positionData = await QueueService.calculatePosition(token);

    res.status(200).json({
      success: true,
      token,
      position: positionData.position,
      peopleAhead: positionData.peopleAhead,
      estimatedWaitMinutes: positionData.estimatedWaitMinutes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an active waiting token
 * @route   POST /api/tokens/:id/cancel
 * @access  Private (Customer or Admin)
 */
const cancelToken = async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    const token = await QueueService.cancelToken(req.params.id, req.user._id, reason);

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} has been successfully cancelled.`,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Issue a walk-in token directly (Staff or Admin)
 * @route   POST /api/tokens/walk-in
 * @access  Private (Staff or Admin)
 */
const createWalkInToken = async (req, res, next) => {
  try {
    const { serviceId, customerName } = req.body;
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'serviceId is required.',
      });
    }

    const User = require('../models/User');
    let targetUserId = req.user._id;

    if (customerName && customerName.trim()) {
      const guest = await User.create({
        name: customerName.trim(),
        email: `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}@queueless.local`,
        passwordHash: await User.hashPassword('WalkIn@123'),
        role: 'customer',
        isActive: true,
      });
      targetUserId = guest._id;
    }

    const result = await QueueService.joinQueue(targetUserId, serviceId);

    res.status(201).json({
      success: true,
      message: `Walk-in token ${result.token.tokenNumber} issued successfully.`,
      token: result.token,
      position: result.position,
      peopleAhead: result.peopleAhead,
      estimatedWaitMinutes: result.estimatedWaitMinutes,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  joinQueue,
  getMyActiveToken,
  getMyTokenHistory,
  getTokenById,
  cancelToken,
  createWalkInToken,
};
