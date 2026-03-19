const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const DATA_IMAGE_REGEX = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/;

const isValidImageSource = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (DATA_IMAGE_REGEX.test(trimmed)) return true;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const getNearbyUsers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lat, lng, radius = 100000 } = req.query;
    const currentUser = req.user;

    const nearbyUsers = await User.find({
      _id: { $ne: currentUser._id },
      isAvailable: { $ne: false },
      isFrozen: { $ne: true },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius, 10)
        }
      }
    }).select('name gender location isOnline isAvailable profilePhoto bio aboutme album address matchCount actualMeetCount lastSeen status');

    res.json({
      users: nearbyUsers,
      count: nearbyUsers.length
    });
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby users' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lat, lng } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        lastSeen: new Date(),
        isOnline: true
      },
      { new: true }
    ).select('-smsCode -smsCodeExpiry');

    req.app.get('io').emit('userLocationUpdate', {
      userId: user._id,
      location: user.location,
      isOnline: user.isOnline
    });

    res.json({
      message: 'Location updated',
      location: user.location
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-smsCode -smsCodeExpiry -phoneNumber');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, bio, profilePhoto, address, aboutme, album, gender, birth_year, status } = req.body;
    const requestedUserId = req.body.userId || req.user?._id;

    if (!requestedUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (
      req.user?.role !== 'admin' &&
      requestedUserId.toString() !== req.user?._id?.toString()
    ) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
    if (address !== undefined) updateData.address = address;
    if (aboutme !== undefined) updateData.aboutme = aboutme;
    if (album !== undefined) updateData.album = album;
    if (gender && ['male', 'female', 'other'].includes(gender)) updateData.gender = gender;

    if (birth_year !== undefined) {
      const by = parseInt(birth_year, 10);
      if (!Number.isNaN(by)) {
        updateData.birth_year = by;
      }
    }

    if (status !== undefined) {
      if (Array.isArray(status)) {
        updateData.status = status.filter((s) => typeof s === 'string');
      } else if (typeof status === 'string' && status.length > 0) {
        updateData.status = [status];
      } else if (status === null) {
        updateData.status = [];
      }
    }

    const user = await User.findByIdAndUpdate(requestedUserId, updateData, { new: true }).select('-smsCode -smsCodeExpiry');

    res.json({
      message: 'Profile updated',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const setOnlineStatus = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
        lastSeen: new Date()
      },
      { new: true }
    ).select('-smsCode -smsCodeExpiry');

    req.app.get('io').emit('userStatusUpdate', {
      userId: user._id,
      isAvailable: user.isAvailable,
      lastSeen: user.lastSeen
    });

    res.json({
      message: 'Availability updated',
      isAvailable: user.isAvailable
    });
  } catch (error) {
    console.error('Set availability status error:', error);
    res.status(500).json({ error: 'Failed to update availability status' });
  }
};

const getAvailabilityStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('isAvailable isOnline lastSeen');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      isAvailable: user.isAvailable !== false,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    });
  } catch (error) {
    console.error('Get availability status error:', error);
    res.status(500).json({ error: 'Failed to fetch availability status' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isAvailable: { $ne: false }, isFrozen: { $ne: true } })
      .select('name gender location isOnline isAvailable profilePhoto bio aboutme album address matchCount actualMeetCount lastSeen')
      .sort({ createdAt: -1 });

    res.json({
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch user list' });
  }
};

const nearbyUsersValidation = [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  query('radius').optional().isInt({ min: 100, max: 200000 }).withMessage('Radius must be between 100m and 200000m')
];

const locationValidation = [
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required')
];

const profileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be up to 500 characters'),
  body('profilePhoto')
    .optional()
    .custom((value) => isValidImageSource(value))
    .withMessage('profilePhoto must be a valid URL or data URL'),
  body('address').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Address must be 5-200 characters'),
  body('aboutme').optional().isLength({ max: 1000 }).withMessage('About me must be up to 1000 characters'),
  body('album').optional().isArray({ max: 5 }).withMessage('Album can contain up to 5 images'),
  body('album.*')
    .optional()
    .custom((value) => typeof value === 'string' && isValidImageSource(value))
    .withMessage('Each album item must be a valid URL or data URL')
];

const seedUsers = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const currentUser = req.user;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Current location (lat, lng) is required for seeding' });
    }

    // Generate 5-10 random users around the current location
    const genders = ['male', 'female', 'other'];
    const names = {
      male: ['田中 健太', '佐藤 翔', '鈴木 一郎', '高橋 雄大', '伊藤 直樹'],
      female: ['佐藤 花子', '高橋 美咲', '山田 由美', '小林 さくら', '松本 あい'],
      other: ['ゆう', 'あき', 'りん', 'ひかる', 'なつき']
    };

    const newUsers = [];
    for (let i = 0; i < 10; i++) {
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const name = names[gender][Math.floor(Math.random() * names[gender].length)] + (i + 1);
      
      // Random offset within ~5km
      const latOffset = (Math.random() - 0.5) * 0.05;
      const lngOffset = (Math.random() - 0.5) * 0.05;

      newUsers.push({
        name,
        phoneNumber: `+8190${Math.floor(10000000 + Math.random() * 90000000)}`,
        gender,
        address: '東京都内のどこか',
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng) + lngOffset, parseFloat(lat) + latOffset]
        },
        profilePhoto: `https://randomuser.me/api/portraits/${gender === 'male' ? 'men' : gender === 'female' ? 'women' : 'lego'}/${Math.floor(Math.random() * 99)}.jpg`,
        bio: `${name}です。よろしくお願いします！`,
        isOnline: Math.random() > 0.3,
        isAvailable: true,
        smsVerified: true,
        matchCount: Math.floor(Math.random() * 10),
        actualMeetCount: Math.floor(Math.random() * 5)
      });
    }

    await User.insertMany(newUsers);

    res.json({
      success: true,
      message: `${newUsers.length} users seeded near your location`,
      count: newUsers.length
    });
  } catch (error) {
    console.error('Seed users error:', error);
    res.status(500).json({ error: 'Failed to seed users' });
  }
};

module.exports = {
  getNearbyUsers,
  updateLocation,
  getUserProfile,
  updateProfile,
  setOnlineStatus,
  getAvailabilityStatus,
  getAllUsers,
  seedUsers,
  nearbyUsersValidation,
  locationValidation,
  profileValidation
};
