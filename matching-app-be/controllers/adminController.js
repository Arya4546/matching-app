const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');

const ADMIN_USER_SELECT =
  'name phoneNumber gender location profilePhoto bio aboutme status role isOnline isAvailable isFrozen lastSeen createdAt updatedAt';

const listUsers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const search = (req.query.search || '').trim();
    const filter = req.query.filter || 'all';

    const mongoFilter = {};

    if (search) {
      mongoFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (filter === 'frozen') {
      mongoFilter.isFrozen = true;
    } else if (filter === 'active') {
      mongoFilter.isFrozen = { $ne: true };
    }

    const [users, total] = await Promise.all([
      User.find(mongoFilter)
        .select(ADMIN_USER_SELECT)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(mongoFilter),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
};

const setFrozenStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { isFrozen } = req.body;

    if (req.user._id.toString() === userId) {
      return res.status(400).json({ error: 'You cannot freeze your own account.' });
    }

    const updateData = {
      isFrozen,
      lastSeen: new Date(),
    };

    if (isFrozen) {
      updateData.isAvailable = false;
      updateData.isOnline = false;
      updateData.socketId = null;
    } else {
      updateData.isAvailable = true;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select(
      ADMIN_USER_SELECT
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.app.get('io').emit('userAdminStatusUpdate', {
      userId: updatedUser._id,
      isFrozen: updatedUser.isFrozen,
      isAvailable: updatedUser.isAvailable,
      isOnline: updatedUser.isOnline,
      lastSeen: updatedUser.lastSeen,
    });

    res.json({
      message: isFrozen ? 'User frozen successfully' : 'User unfrozen successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Admin set frozen status error:', error);
    res.status(500).json({ error: 'Failed to update frozen status' });
  }
};

const updateUserBasicStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { isAvailable, status } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = { lastSeen: new Date() };

    if (typeof isAvailable === 'boolean') {
      updateData.isAvailable = user.isFrozen ? false : isAvailable;
    }

    if (Array.isArray(status)) {
      updateData.status = status
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select(
      ADMIN_USER_SELECT
    );

    req.app.get('io').emit('userAdminStatusUpdate', {
      userId: updatedUser._id,
      isFrozen: updatedUser.isFrozen,
      isAvailable: updatedUser.isAvailable,
      status: updatedUser.status,
      lastSeen: updatedUser.lastSeen,
    });

    res.json({
      message: 'User status updated',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Admin update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

const listUsersValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().isLength({ max: 100 }),
  query('filter').optional().isIn(['all', 'active', 'frozen']),
];

const freezeValidation = [
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  body('isFrozen').isBoolean().withMessage('isFrozen must be boolean'),
];

const updateStatusValidation = [
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be boolean'),
  body('status')
    .optional()
    .isArray({ max: 10 })
    .withMessage('status must be an array with up to 10 items'),
];

module.exports = {
  listUsers,
  setFrozenStatus,
  updateUserBasicStatus,
  listUsersValidation,
  freezeValidation,
  updateStatusValidation,
};
