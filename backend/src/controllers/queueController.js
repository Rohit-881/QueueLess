const QueueService = require('../services/queueService');
const QueueSession = require('../models/QueueSession');
const Service = require('../models/Service');
const { getIO } = require('../sockets/socketHandler');

/**
 * @desc    Get live summary for a queue session
 * @route   GET /api/queues/:sessionId/summary
 * @access  Public / Authenticated
 */
const getQueueSummary = async (req, res, next) => {
  try {
    const summary = await QueueService.getQueueSummary(req.params.sessionId);
    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Queue session not found',
        code: 'SESSION_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get queue sessions (for admin / staff)
 * @route   GET /api/queues/sessions
 * @access  Staff or Admin
 */
const getQueueSessions = async (req, res, next) => {
  try {
    const { serviceId, businessDate, status } = req.query;
    const filter = {};

    if (serviceId) filter.serviceId = serviceId;
    if (businessDate) filter.businessDate = businessDate;
    if (status) filter.status = status;

    const sessions = await QueueSession.find(filter)
      .populate('serviceId', 'name codePrefix location averageServiceDuration maximumQueueCapacity')
      .populate('activeTokenId', 'tokenNumber status serviceStartedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update queue session status (open, close, pause)
 * @route   PATCH /api/queues/:sessionId/status
 * @access  Staff or Admin
 */
const updateQueueStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['open', 'closed', 'paused'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'open', 'closed', or 'paused'",
        code: 'INVALID_STATUS',
      });
    }

    const session = await QueueSession.findById(req.params.sessionId).populate('serviceId');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Queue session not found',
        code: 'SESSION_NOT_FOUND',
      });
    }

    // Check staff authorization
    QueueService.validateStaffAuthorization(session.serviceId, req.user);

    session.status = status;
    if (status === 'closed') {
      session.closedAt = new Date();
    } else {
      session.closedAt = null;
    }
    await session.save();

    // Broadcast status change
    const io = getIO();
    io.to(`queue:${session._id}`).emit('queue:status_changed', {
      queueSessionId: session._id,
      status: session.status,
    });

    await QueueService.broadcastQueueUpdate(session._id);

    res.status(200).json({
      success: true,
      message: `Queue session is now ${status}.`,
      session,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueueSummary,
  getQueueSessions,
  updateQueueStatus,
};
