const mongoose = require('mongoose');
const Token = require('../models/Token');
const Service = require('../models/Service');
const QueueSession = require('../models/QueueSession');

class AnalyticsService {
  /**
   * Get comprehensive dashboard metrics for admin / staff
   */
  static async getOverviewMetrics(serviceId = null) {
    const filter = {};
    if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
      filter.serviceId = new mongoose.Types.ObjectId(serviceId);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayFilter = {
      ...filter,
      createdAt: { $gte: todayStart },
    };

    // 1. Overall counts
    const totalServices = await Service.countDocuments({ isActive: true });
    const openQueues = await QueueSession.countDocuments({ status: 'open' });
    const waitingCustomers = await Token.countDocuments({ ...filter, status: 'waiting' });
    const servedToday = await Token.countDocuments({ ...todayFilter, status: 'completed' });
    const totalCreatedToday = await Token.countDocuments(todayFilter);

    // 2. Average Waiting Time Pipeline: (serviceStartedAt - joinedAt) in minutes for completed/serving tokens
    const waitTimeAgg = await Token.aggregate([
      {
        $match: {
          ...filter,
          serviceStartedAt: { $exists: true, $ne: null },
          joinedAt: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          waitDurationMs: { $subtract: ['$serviceStartedAt', '$joinedAt'] },
        },
      },
      {
        $match: { waitDurationMs: { $gte: 0 } },
      },
      {
        $group: {
          _id: null,
          avgWaitMinutes: { $avg: { $divide: ['$waitDurationMs', 60000] } },
          minWaitMinutes: { $min: { $divide: ['$waitDurationMs', 60000] } },
          maxWaitMinutes: { $max: { $divide: ['$waitDurationMs', 60000] } },
          sampleCount: { $sum: 1 },
        },
      },
    ]);

    const avgWaitMinutes = waitTimeAgg.length > 0 ? Math.round(waitTimeAgg[0].avgWaitMinutes * 10) / 10 : 0;

    // 3. Average Service Duration Pipeline: (completedAt - serviceStartedAt) in minutes
    const serviceDurationAgg = await Token.aggregate([
      {
        $match: {
          ...filter,
          status: 'completed',
          completedAt: { $exists: true, $ne: null },
          serviceStartedAt: { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          serviceDurationMs: { $subtract: ['$completedAt', '$serviceStartedAt'] },
        },
      },
      {
        $match: { serviceDurationMs: { $gte: 0 } },
      },
      {
        $group: {
          _id: null,
          avgDurationMinutes: { $avg: { $divide: ['$serviceDurationMs', 60000] } },
          sampleCount: { $sum: 1 },
        },
      },
    ]);

    const avgServiceDurationMinutes =
      serviceDurationAgg.length > 0 ? Math.round(serviceDurationAgg[0].avgDurationMinutes * 10) / 10 : 0;

    // 4. Cancellation Rate
    const totalTokensCount = await Token.countDocuments(filter);
    const cancelledCount = await Token.countDocuments({ ...filter, status: 'cancelled' });
    const cancellationRate =
      totalTokensCount > 0 ? Math.round((cancelledCount / totalTokensCount) * 1000) / 10 : 0;

    // 5. Token Status Distribution (Donut Chart)
    const statusDistributionAgg = await Token.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusColors = {
      completed: '#0D9488', // Teal
      waiting: '#F59E0B',   // Amber
      serving: '#4F46E5',   // Indigo
      called: '#6366F1',    // Soft Indigo
      cancelled: '#EF4444', // Red
      skipped: '#94A3B8',   // Slate
      no_show: '#DC2626',   // Dark Red
    };

    const statusDistribution = statusDistributionAgg.map((item) => ({
      status: item._id,
      label: item._id.charAt(0).toUpperCase() + item._id.slice(1).replace('_', ' '),
      count: item.count,
      color: statusColors[item._id] || '#64748B',
    }));

    // 6. Volume by Hour Today (Line Chart)
    const volumeByHourAgg = await Token.aggregate([
      { $match: todayFilter },
      {
        $group: {
          _id: { $hour: { date: '$createdAt', timezone: 'UTC' } },
          joined: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    // Build standard 8am to 6pm buckets
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const hourDataMap = new Map();
    volumeByHourAgg.forEach((h) => hourDataMap.set(h._id, h));

    const volumeByHour = hours.map((hour) => {
      const found = hourDataMap.get(hour) || { joined: 0, completed: 0 };
      const displayHour = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
      return {
        hour: displayHour,
        joined: found.joined || 0,
        completed: found.completed || 0,
      };
    });

    // 7. Customers Served by Service (Bar Chart)
    const serviceBreakdownAgg = await Token.aggregate([
      {
        $group: {
          _id: '$serviceId',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          waiting: {
            $sum: { $cond: [{ $eq: ['$status', 'waiting'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          serviceName: { $ifNull: ['$service.name', 'General'] },
          total: 1,
          completed: 1,
          waiting: 1,
        },
      },
    ]);

    return {
      summary: {
        totalServices,
        openQueues,
        waitingCustomers,
        servedToday,
        totalCreatedToday,
        avgWaitMinutes,
        avgServiceDurationMinutes,
        cancellationRate,
      },
      charts: {
        volumeByHour,
        statusDistribution,
        serviceBreakdown: serviceBreakdownAgg,
      },
    };
  }
}

module.exports = AnalyticsService;
