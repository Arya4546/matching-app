const express = require('express');
const { auth } = require('../middleware/auth');
const {
  sendMatchRequest,
  respondToMatch,
  getPendingSummary,
  getMatchHistory,
  confirmMeeting,
  matchRequestValidation,
  matchResponseValidation,
  meetingConfirmValidation
} = require('../controllers/matchingController');

const router = express.Router();

router.post('/request', auth, matchRequestValidation, sendMatchRequest);
router.post('/respond', auth, matchResponseValidation, respondToMatch);
router.get('/pending-summary', auth, getPendingSummary);
router.get('/history', auth, getMatchHistory);
router.post('/confirm-meeting', auth, meetingConfirmValidation, confirmMeeting);

module.exports = router;
