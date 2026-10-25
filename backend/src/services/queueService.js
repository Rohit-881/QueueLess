const mongoose = require('mongoose');
const Token = require('../models/Token');
const QueueSession = require('../models/QueueSession');
const Service = require('../models/Service');
const { formatTokenNumber } = require('../utils/tokenGenerator');
const { getIO } = require('../sockets/socketHandler');

class QueueService {
  /**
   * Helper to broadcast real-time queue updates
   */
  static async broadcastQueueUpdate(queueSessionId) {
    try {
      const io = getIO();
      const statusData = await QueueService.getQueueSummary(queueSessionId);
      io.to(`queue:${queueSessionId}`).emit('queue:updated', statusData);
      return statusData;
    } catch (err) {
      console.error('[Socket Broadcast Error]:', err.message);
    }
  }

  /**
   * Get real-time summary for a queue session
   */
  static async getQueueSummary(queueSessionId) {
    const session = await QueueSession.findById(queueSessionId).populate('serviceId');
    if (!session) return null;

    const waitingTokens = await Token.find({
      queueSessionId,
      status: 'waiting',
    })
      .sort({ queueSequence: 1 })
      .populate('userId', 'name email');

    let activeToken = null;
    if (session.activeTokenId) {
      activeToken = await Token.findById(session.activeTokenId).populate('userId', 'name email');
    }

    const todayServedCount = await Token.countDocuments({
      queueSessionId,
      status: 'completed',
    });

    const avgDuration = session.serviceId?.averageServiceDuration || 10;
    const waitingCount = waitingTokens.length;

    // Remaining wait time calculation
    let activeTokenRemainingTime = 0;
    if (activeToken) {
      if (activeToken.status === 'serving' && activeToken.serviceStartedAt) {
        const elapsedMinutes = Math.floor((Date.now() - new Date(activeToken.serviceStartedAt).getTime()) / 60000);
        activeTokenRemainingTime = Math.max(1, avgDuration - elapsedMinutes);
      } else {
        activeTokenRemainingTime = avgDuration;
      }
    }

    const totalEstimatedWaitMinutes = activeTokenRemainingTime + waitingCount * avgDuration;

    return {
      queueSessionId: session._id,
      service: {
        id: session.serviceId?._id,
        name: session.serviceId?.name,
        codePrefix: session.serviceId?.codePrefix,
        location: session.serviceId?.location,
        averageServiceDuration: avgDuration,
      },
      status: session.status,
      maximumCapacity: session.maximumCapacity,
      waitingCount,
      todayServedCount,
      totalEstimatedWaitMinutes,
      activeToken: activeToken
        ? {
            id: activeToken._id,
            tokenNumber: activeToken.tokenNumber,
            queueSequence: activeToken.queueSequence,
            status: activeToken.status,
            customerName: activeToken.userId?.name || 'Customer',
            calledAt: activeToken.calledAt,
            serviceStartedAt: activeToken.serviceStartedAt,
          }
        : null,
      waitingTokens: waitingTokens.map((t, idx) => ({
        id: t._id,
        tokenNumber: t.tokenNumber,
        queueSequence: t.queueSequence,
        status: t.status,
        customerName: t.userId?.name || 'Customer',
        position: idx + 1,
        joinedAt: t.joinedAt,
      })),
      updatedAt: new Date(),
    };
  }

  /**
   * Find or initialize today's active session for a service
   */
  static async getOrCreateTodaySession(serviceId) {
    const today = new Date().toISOString().split('T')[0];
    let session = await QueueSession.findOne({
      serviceId,
      businessDate: today,
      status: { $in: ['open', 'paused'] },
    });

    if (!session) {
      const service = await Service.findById(serviceId);
      if (!service || !service.isActive) {
        const error = new Error('Service is not active or does not exist');
        error.statusCode = 404;
        error.code = 'SERVICE_NOT_FOUND';
        throw error;
      }

      session = await QueueSession.create({
        serviceId: service._id,
        businessDate: today,
        status: 'open',
        maximumCapacity: service.maximumQueueCapacity,
        lastSequence: 0,
        openedAt: new Date(),
      });
    }

    return session;
  }

  /**
   * Customer joins virtual queue
   */
  static async joinQueue(userId, serviceId) {
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      const error = new Error('Selected service is not currently available');
      error.statusCode = 400;
      error.code = 'SERVICE_INACTIVE';
      throw error;
    }

    // Get or open today's session
    const session = await QueueService.getOrCreateTodaySession(serviceId);

    if (session.status !== 'open') {
      const error = new Error(`Queue is currently ${session.status}. New customers cannot join.`);
      error.statusCode = 400;
      error.code = 'QUEUE_CLOSED';
      throw error;
    }

    // Verify duplicate active token for this user
    const existingActiveToken = await Token.findOne({
      userId,
      queueSessionId: session._id,
      status: { $in: ['waiting', 'called', 'serving'] },
    });

    if (existingActiveToken) {
      const error = new Error(`You already have an active token (${existingActiveToken.tokenNumber}) in this queue.`);
      error.statusCode = 409;
      error.code = 'DUPLICATE_ACTIVE_TOKEN';
      error.token = existingActiveToken;
      throw error;
    }

    // Verify queue capacity
    const currentWaitingCount = await Token.countDocuments({
      queueSessionId: session._id,
      status: 'waiting',
    });

    if (currentWaitingCount >= session.maximumCapacity) {
      const error = new Error('Queue has reached its maximum capacity for today.');
      error.statusCode = 400;
      error.code = 'QUEUE_FULL';
      throw error;
    }

    // Atomically increment lastSequence on queue session
    const updatedSession = await QueueSession.findOneAndUpdate(
      { _id: session._id, status: 'open' },
      { $inc: { lastSequence: 1 } },
      { new: true }
    );

    if (!updatedSession) {
      const error = new Error('Queue session closed while processing request.');
      error.statusCode = 409;
      error.code = 'SESSION_STATE_CONFLICT';
      throw error;
    }

    const nextSequence = updatedSession.lastSequence;
    const tokenNumber = formatTokenNumber(service.codePrefix, nextSequence);

    // Persist new token in MongoDB
    const token = await Token.create({
      userId,
      queueSessionId: session._id,
      serviceId: service._id,
      tokenNumber,
      queueSequence: nextSequence,
      status: 'waiting',
      joinedAt: new Date(),
    });

    // Populate user and service for rich return
    await token.populate(['userId', 'serviceId']);

    // Calculate customer's specific position and wait time
    const position = await QueueService.calculatePosition(token);

    // Broadcast real-time update
    await QueueService.broadcastQueueUpdate(session._id);

    return {
      token,
      position: position.position,
      peopleAhead: position.peopleAhead,
      estimatedWaitMinutes: position.estimatedWaitMinutes,
    };
  }

  /**
   * Calculate exact position and estimated wait time for a given token
   */
  static async calculatePosition(token) {
    if (token.status === 'called' || token.status === 'serving') {
      return { position: 0, peopleAhead: 0, estimatedWaitMinutes: 0 };
    }

    if (token.status !== 'waiting') {
      return { position: null, peopleAhead: 0, estimatedWaitMinutes: 0 };
    }

    const session = await QueueSession.findById(token.queueSessionId).populate('serviceId');
    const avgDuration = session?.serviceId?.averageServiceDuration || 10;

    // Count how many eligible waiting tokens have a strictly lower sequence number
    const peopleAhead = await Token.countDocuments({
      queueSessionId: token.queueSessionId,
      status: 'waiting',
      queueSequence: { $lt: token.queueSequence },
    });

    let activeTokenRemainingTime = 0;
    if (session?.activeTokenId) {
      const active = await Token.findById(session.activeTokenId);
      if (active && (active.status === 'called' || active.status === 'serving')) {
        if (active.status === 'serving' && active.serviceStartedAt) {
          const elapsed = Math.floor((Date.now() - new Date(active.serviceStartedAt).getTime()) / 60000);
          activeTokenRemainingTime = Math.max(1, avgDuration - elapsed);
        } else {
          activeTokenRemainingTime = avgDuration;
        }
      }
    }

    const estimatedWaitMinutes = activeTokenRemainingTime + peopleAhead * avgDuration;

    return {
      position: peopleAhead + 1,
      peopleAhead,
      estimatedWaitMinutes,
    };
  }

  /**
   * Staff action: Call next customer in queue
   */
  static async callNext(queueSessionId, staffUser) {
    const session = await QueueSession.findById(queueSessionId).populate('serviceId');
    if (!session) {
      const error = new Error('Queue session not found');
      error.statusCode = 404;
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }

    if (session.status !== 'open') {
      const error = new Error(`Queue session is currently ${session.status}`);
      error.statusCode = 400;
      error.code = 'QUEUE_NOT_OPEN';
      throw error;
    }

    // Verify staff assignment
    QueueService.validateStaffAuthorization(session.serviceId, staffUser);

    // Verify that single active counter is free
    if (session.activeTokenId) {
      const currentActive = await Token.findById(session.activeTokenId);
      if (currentActive && ['called', 'serving'].includes(currentActive.status)) {
        const error = new Error(
          `Counter busy: Token ${currentActive.tokenNumber} is currently active (${currentActive.status}). Complete or resolve it before calling next.`
        );
        error.statusCode = 409;
        error.code = 'COUNTER_OCCUPIED';
        error.activeToken = currentActive;
        throw error;
      }
    }

    // Atomically find and claim the earliest eligible waiting token
    const nextToken = await Token.findOneAndUpdate(
      {
        queueSessionId: session._id,
        status: 'waiting',
      },
      {
        $set: {
          status: 'called',
          calledAt: new Date(),
        },
      },
      {
        sort: { queueSequence: 1 },
        new: true,
      }
    ).populate(['userId', 'serviceId']);

    if (!nextToken) {
      const error = new Error('No waiting customers in the queue');
      error.statusCode = 404;
      error.code = 'NO_CUSTOMERS_WAITING';
      throw error;
    }

    // Update queue session active token
    session.activeTokenId = nextToken._id;
    await session.save();

    // Emit real-time events
    const io = getIO();
    io.to(`queue:${session._id}`).emit('token:called', {
      tokenId: nextToken._id,
      tokenNumber: nextToken.tokenNumber,
      customerName: nextToken.userId?.name,
      calledAt: nextToken.calledAt,
    });
    // Direct private event to customer
    io.to(`user:${nextToken.userId?._id}`).emit('your_token:called', {
      tokenId: nextToken._id,
      tokenNumber: nextToken.tokenNumber,
      serviceName: nextToken.serviceId?.name,
      location: nextToken.serviceId?.location,
    });

    await QueueService.broadcastQueueUpdate(session._id);

    return nextToken;
  }

  /**
   * Staff action: Start service for called token
   */
  static async startService(tokenId, staffUser) {
    const token = await Token.findById(tokenId).populate(['serviceId', 'userId']);
    if (!token) {
      const error = new Error('Token not found');
      error.statusCode = 404;
      error.code = 'TOKEN_NOT_FOUND';
      throw error;
    }

    if (token.status !== 'called') {
      const error = new Error(`Cannot start service. Token status is '${token.status}' (expected 'called').`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    QueueService.validateStaffAuthorization(token.serviceId, staffUser);

    token.status = 'serving';
    token.serviceStartedAt = new Date();
    await token.save();

    const io = getIO();
    io.to(`queue:${token.queueSessionId}`).emit('token:started', {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
      startedAt: token.serviceStartedAt,
    });

    await QueueService.broadcastQueueUpdate(token.queueSessionId);

    return token;
  }

  /**
   * Staff action: Complete service for serving token
   */
  static async completeService(tokenId, staffUser, resolutionReason = 'Completed successfully') {
    const token = await Token.findById(tokenId).populate(['serviceId', 'userId']);
    if (!token) {
      const error = new Error('Token not found');
      error.statusCode = 404;
      error.code = 'TOKEN_NOT_FOUND';
      throw error;
    }

    if (token.status !== 'serving') {
      const error = new Error(`Cannot complete service. Token status is '${token.status}' (expected 'serving').`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    QueueService.validateStaffAuthorization(token.serviceId, staffUser);

    token.status = 'completed';
    token.completedAt = new Date();
    token.resolutionReason = resolutionReason;
    await token.save();

    // Release counter on session
    await QueueSession.findOneAndUpdate(
      { _id: token.queueSessionId, activeTokenId: token._id },
      { activeTokenId: null }
    );

    const io = getIO();
    io.to(`queue:${token.queueSessionId}`).emit('token:completed', {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
      completedAt: token.completedAt,
    });

    await QueueService.broadcastQueueUpdate(token.queueSessionId);

    return token;
  }

  /**
   * Staff action: Skip called or waiting token
   */
  static async skipToken(tokenId, staffUser, reason = 'Customer not present') {
    const token = await Token.findById(tokenId).populate(['serviceId', 'userId']);
    if (!token) {
      const error = new Error('Token not found');
      error.statusCode = 404;
      error.code = 'TOKEN_NOT_FOUND';
      throw error;
    }

    if (!['called', 'waiting'].includes(token.status)) {
      const error = new Error(`Cannot skip token in '${token.status}' state.`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    QueueService.validateStaffAuthorization(token.serviceId, staffUser);

    token.status = 'skipped';
    token.skippedAt = new Date();
    token.resolutionReason = reason;
    await token.save();

    await QueueSession.findOneAndUpdate(
      { _id: token.queueSessionId, activeTokenId: token._id },
      { activeTokenId: null }
    );

    const io = getIO();
    io.to(`queue:${token.queueSessionId}`).emit('token:skipped', {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
      reason,
    });

    await QueueService.broadcastQueueUpdate(token.queueSessionId);

    return token;
  }

  /**
   * Staff action: Mark as No-Show
   */
  static async markNoShow(tokenId, staffUser, reason = 'Customer did not appear') {
    const token = await Token.findById(tokenId).populate(['serviceId', 'userId']);
    if (!token) {
      const error = new Error('Token not found');
      error.statusCode = 404;
      error.code = 'TOKEN_NOT_FOUND';
      throw error;
    }

    if (!['called', 'waiting'].includes(token.status)) {
      const error = new Error(`Cannot mark token in '${token.status}' state as no-show.`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    QueueService.validateStaffAuthorization(token.serviceId, staffUser);

    token.status = 'no_show';
    token.noShowAt = new Date();
    token.resolutionReason = reason;
    await token.save();

    await QueueSession.findOneAndUpdate(
      { _id: token.queueSessionId, activeTokenId: token._id },
      { activeTokenId: null }
    );

    const io = getIO();
    io.to(`queue:${token.queueSessionId}`).emit('token:no_show', {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
      reason,
    });

    await QueueService.broadcastQueueUpdate(token.queueSessionId);

    return token;
  }

  /**
   * Customer action: Cancel an active waiting token
   */
  static async cancelToken(tokenId, userId, reason = 'Cancelled by customer') {
    const token = await Token.findById(tokenId).populate('serviceId');
    if (!token) {
      const error = new Error('Token not found');
      error.statusCode = 404;
      error.code = 'TOKEN_NOT_FOUND';
      throw error;
    }

    // Verify ownership
    if (token.userId.toString() !== userId.toString()) {
      const error = new Error('You are not authorized to cancel this token');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    // Only waiting tokens can be cancelled
    if (token.status !== 'waiting') {
      const error = new Error(`Cannot cancel a token with status '${token.status}'. Only waiting tokens can be cancelled.`);
      error.statusCode = 400;
      error.code = 'CANCELLATION_NOT_ALLOWED';
      throw error;
    }

    token.status = 'cancelled';
    token.cancelledAt = new Date();
    token.resolutionReason = reason;
    await token.save();

    const io = getIO();
    io.to(`queue:${token.queueSessionId}`).emit('token:cancelled', {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
    });

    await QueueService.broadcastQueueUpdate(token.queueSessionId);

    return token;
  }

  /**
   * Helper: check if staff member is assigned to the service (or is admin)
   */
  static validateStaffAuthorization(service, user) {
    if (user.role === 'admin') return true;

    if (user.role !== 'staff') {
      const error = new Error('Access denied: Staff or Admin role required');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    // Check service assignment if assignedStaffIds is configured
    if (service && service.assignedStaffIds && service.assignedStaffIds.length > 0) {
      const isAssigned = service.assignedStaffIds.some(
        (id) => id.toString() === user._id.toString()
      );
      if (!isAssigned) {
        const error = new Error(`Staff member is not assigned to service '${service.name}'`);
        error.statusCode = 403;
        error.code = 'STAFF_NOT_ASSIGNED';
        throw error;
      }
    }

    return true;
  }
}

module.exports = QueueService;
