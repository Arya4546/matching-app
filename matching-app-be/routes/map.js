const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getMapData,
  getCurrentLocation,
  updateMapLocation,
  getMapConfig,
  mapDataValidation,
  locationUpdateValidation
} = require('../controllers/mapController');

const router = express.Router();

// Get map configuration (requires auth to avoid open route metadata exposure)
router.get('/config', auth, getMapConfig);

// Get map data with nearby users (requires auth)
router.get('/data', auth, mapDataValidation, getMapData);

// Get current user location (requires auth)
router.get('/location', auth, getCurrentLocation);

// Update user location from map (requires auth)
router.post('/location', auth, locationUpdateValidation, updateMapLocation);

module.exports = router;
