const QueueService = require('../services/queueService');
const Service = require('../models/Service');
const QueueSession = require('../models/QueueSession');
const Token = require('../models/Token');

/**
 * @desc    Get staff dashboard overview & assigned services
 * @route   GET /api/staff/dashboard
 * @access  Staff or Admin
 */
const getStaffDashboard = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let serviceFilter = { isActive: true };

    // If staff, filter by assigned services unless admin
    if (req.user.role === 'staff') {
      serviceFilter.assignedStaffIds = req.user._id;
    }

    const assignedServices = await Service.find(serviceFilter);

    // If staff has no services assigned yet, fallback to all active services for smooth demo experience
    let activeServices = assignedServices;
    if (activeServices.length === 0 && req.user.role === 'staff') {
      activeServices = await Service.find({ isActive: true });
    }

    // For each service, get today's queue session
    const serviceQueueData = await Promise.all(
      activeServices.map(async (service) => {
        let session = await QueueSession.findOne({
          serviceId: service._id,
          businessDate: today,
          status: { $in: ['open', 'paused'] },
        }).populate('activeTokenId');

        if (!session) {
          // auto-create today session if not existing
          session = await QueueService.getOrCreateTodaySession(service._id);
        }

        const waitingTokens = await Token.find({
          queueSessionId: session._id,
          status: 'waiting',
        })
          .sort({ queueSequence: 1 })
          .populate('userId', 'name email');

        const servedTodayCount = await Token.countDocuments({
          queueSessionId: session._id,
          status: 'completed',
        });

        let activeToken = null;
        if (session.activeTokenId) {
          activeToken = await Token.findById(session.activeTokenId).populate('userId', 'name email');
        }

        return {
          service,
          session,
          waitingCount: waitingTokens.length,
          servedTodayCount,
          activeToken,
          waitingTokens,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: serviceQueueData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Call next waiting customer
 * @route   POST /api/staff/queues/:sessionId/call-next
 * @access  Staff or Admin
 */
const callNext = async (req, res, next) => {
  try {
    const token = await QueueService.callNext(req.params.sessionId, req.user);

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} has been called.`,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Start service for called token
 * @route   POST /api/staff/tokens/:tokenId/start
 * @access  Staff or Admin
 */
const startService = async (req, res, next) => {
  try {
    const token = await QueueService.startService(req.params.tokenId, req.user);

    res.status(200).json({
      success: true,
      message: `Service started for token ${token.tokenNumber}.`,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete service for serving token
 * @route   POST /api/staff/tokens/:tokenId/complete
 * @access  Staff or Admin
 */
const completeService = async (req, res, next) => {
  try {
    const { resolutionReason } = req.body;
    const token = await QueueService.completeService(req.params.tokenId, req.user, resolutionReason);

    res.status(200).json({
      success: true,
      message: `Service completed for token ${token.tokenNumber}.`,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Skip token
 * @route   POST /api/staff/tokens/:tokenId/skip
 * @access  Staff or Admin
 */
const skipToken = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const token = await QueueService.skipToken(req.params.tokenId, req.user, reason);

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} skipped.`,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark token as No-Show
 * @route   POST /api/staff/tokens/:tokenId/no-show
 * @access  Staff or Admin
 */
const markNoShow = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const token = await QueueService.markNoShow(req.params.tokenId, req.user, reason);

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} marked as no-show.`,
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStaffDashboard,
  callNext,
  startService,
  completeService,
  skipToken,
  markNoShow,
};
