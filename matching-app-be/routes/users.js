const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getNearbyUsers,
  updateLocation,
  getUserProfile,
  updateProfile,
  setOnlineStatus,
  getAvailabilityStatus,
  getAllUsers,
  nearbyUsersValidation,
  locationValidation,
  profileValidation
} = require('../controllers/userController');

const router = express.Router();

router.get('/nearby', auth, nearbyUsersValidation, getNearbyUsers);
router.get('/all', auth, getAllUsers);
router.post('/update-location', auth, locationValidation, updateLocation);
router.get('/profile/:id', auth, getUserProfile);
router.put('/profile', auth, profileValidation, updateProfile);
router.post('/update-profile', auth, profileValidation, updateProfile);
router.get('/status', auth, getAvailabilityStatus);
router.post('/status', auth, setOnlineStatus);

module.exports = router;
