const Service = require('../models/Service');
const QueueSession = require('../models/QueueSession');
const Token = require('../models/Token');
const User = require('../models/User');

/**
 * @desc    Get all active services (with current queue status)
 * @route   GET /api/services
 * @access  Public / Authenticated
 */
const getAllServices = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const services = await Service.find({ isActive: true }).populate('assignedStaffIds', 'name email');

    // Attach active queue status to each service
    const servicesWithQueue = await Promise.all(
      services.map(async (service) => {
        const session = await QueueSession.findOne({
          serviceId: service._id,
          businessDate: today,
          status: { $in: ['open', 'paused'] },
        });

        let waitingCount = 0;
        let activeTokenNumber = null;

        if (session) {
          waitingCount = await Token.countDocuments({
            queueSessionId: session._id,
            status: 'waiting',
          });

          if (session.activeTokenId) {
            const activeToken = await Token.findById(session.activeTokenId);
            activeTokenNumber = activeToken?.tokenNumber || null;
          }
        }

        const estWaitMinutes = session
          ? waitingCount * service.averageServiceDuration + (activeTokenNumber ? Math.ceil(service.averageServiceDuration / 2) : 0)
          : 0;

        return {
          ...service.toObject(),
          queueSession: session
            ? {
                id: session._id,
                status: session.status,
                maximumCapacity: session.maximumCapacity,
                waitingCount,
                activeTokenNumber,
                estimatedWaitMinutes: estWaitMinutes,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: servicesWithQueue.length,
      services: servicesWithQueue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate('assignedStaffIds', 'name email');
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        code: 'SERVICE_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new service
 * @route   POST /api/services
 * @access  Admin only
 */
const createService = async (req, res, next) => {
  try {
    const {
      name,
      codePrefix,
      description,
      category,
      location,
      averageServiceDuration,
      maximumQueueCapacity,
      assignedStaffIds,
    } = req.body;

    const existingPrefix = await Service.findOne({ codePrefix: codePrefix?.toUpperCase()?.trim() });
    if (existingPrefix) {
      return res.status(409).json({
        success: false,
        message: `Service with prefix code '${codePrefix}' already exists.`,
        code: 'DUPLICATE_PREFIX',
      });
    }

    const service = await Service.create({
      name,
      codePrefix,
      description,
      category,
      location,
      averageServiceDuration: Number(averageServiceDuration) || 10,
      maximumQueueCapacity: Number(maximumQueueCapacity) || 50,
      assignedStaffIds: assignedStaffIds || [],
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully.',
      service,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a service
 * @route   PUT /api/services/:id
 * @access  Admin only
 */
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedStaffIds', 'name email');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        code: 'SERVICE_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service updated successfully.',
      service,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete or deactivate a service
 * @route   DELETE /api/services/:id
 * @access  Admin only
 */
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        code: 'SERVICE_NOT_FOUND',
      });
    }

    // Toggle active status or soft delete
    service.isActive = false;
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service deactivated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
