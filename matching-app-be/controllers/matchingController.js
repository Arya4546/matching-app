const { body, validationResult } = require('express-validator');
const Match = require('../models/Match');
const Meeting = require('../models/Meeting');
const User = require('../models/User');

const calculateMidpoint = (lat1, lng1, lat2, lng2) => {
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lng1Rad = (lng1 * Math.PI) / 180;
  const lng2Rad = (lng2 * Math.PI) / 180;

  const dLng = lng2Rad - lng1Rad;
  const bX = Math.cos(lat2Rad) * Math.cos(dLng);
  const bY = Math.cos(lat2Rad) * Math.sin(dLng);

  const lat3 = Math.atan2(
    Math.sin(lat1Rad) + Math.sin(lat2Rad),
    Math.sqrt((Math.cos(lat1Rad) + bX) ** 2 + bY ** 2)
  );

  const lng3 = lng1Rad + Math.atan2(bY, Math.cos(lat1Rad) + bX);

  return {
    lat: (lat3 * 180) / Math.PI,
    lng: (lng3 * 180) / Math.PI
  };
};

const toPublicUser = (user) => ({
  id: user?._id || user?.id,
  name: user?.name,
  profilePhoto: user?.profilePhoto || null,
  bio: user?.bio || '',
  isOnline: user?.isOnline === true,
  isAvailable: user?.isAvailable !== false
});

const buildPendingRequest = (match, direction) => ({
  matchId: match._id,
  status: match.status,
  direction,
  meetingReason: match.meetingReason,
  urgency: match.urgency,
  meetingPoint: match.meetingPoint,
  createdAt: match.createdAt,
  expiresAt: match.expiresAt
});

const sendMatchRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { targetUserId, meetingReason, urgency = '1h' } = req.body;
    const requesterId = req.user._id;
    const targetUser = await User.findById(targetUserId);

    if (!targetUser || targetUser.isAvailable === false || targetUser.isFrozen === true) {
      return res.status(404).json({ error: 'Target user is unavailable' });
    }

    const existingMatch = await Match.findOne({
      $or: [
        { requesterId, targetUserId, status: 'pending' },
        { requesterId: targetUserId, targetUserId: requesterId, status: 'pending' }
      ]
    });

    if (existingMatch) {
      return res.status(400).json({ error: 'A pending match request already exists' });
    }

    const requester = req.user;
    const midpoint = calculateMidpoint(
      requester.location.coordinates[1],
      requester.location.coordinates[0],
      targetUser.location.coordinates[1],
      targetUser.location.coordinates[0]
    );

    const match = new Match({
      requesterId,
      targetUserId,
      meetingReason,
      urgency,
      meetingPoint: {
        type: 'Point',
        coordinates: [midpoint.lng, midpoint.lat]
      }
    });

    await match.save();

    const pendingForTarget = {
      ...buildPendingRequest(match, 'incoming'),
      requester: toPublicUser(requester)
    };

    const pendingForRequester = {
      ...buildPendingRequest(match, 'outgoing'),
      targetUser: toPublicUser(targetUser)
    };

    if (targetUser.socketId) {
      req.app.get('io').to(targetUser.socketId).emit('newMatchRequest', pendingForTarget);
    }

    if (requester.socketId) {
      req.app.get('io').to(requester.socketId).emit('outgoingMatchPending', pendingForRequester);
    }

    res.status(201).json({
      message: 'Match request sent',
      match,
      pendingRequest: pendingForRequester
    });
  } catch (error) {
    console.error('Send match request error:', error);
    res.status(500).json({ error: 'Failed to send match request' });
  }
};

const respondToMatch = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matchId, response } = req.body;
    const userId = req.user._id;

    const match = await Match.findById(matchId).populate(['requesterId', 'targetUserId'], '-smsCode -smsCodeExpiry');

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.targetUserId._id.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to respond to this match' });
    }

    if (match.status !== 'pending') {
      return res.status(400).json({ error: 'Match has already been responded to' });
    }

    match.status = response;
    await match.save();

    const lifecyclePayload = {
      matchId: match._id,
      status: response,
      resolvedAt: new Date(),
      meetingReason: match.meetingReason,
      urgency: match.urgency
    };

    if (response === 'accepted') {
      await User.findByIdAndUpdate(match.requesterId._id, { $inc: { matchCount: 1 } });
      await User.findByIdAndUpdate(match.targetUserId._id, { $inc: { matchCount: 1 } });

      const meeting = new Meeting({
        matchId: match._id,
        scheduledTime: new Date(Date.now() + 30 * 60 * 1000)
      });
      await meeting.save();

      if (match.requesterId.socketId) {
        req.app.get('io').to(match.requesterId.socketId).emit('matchAccepted', {
          ...lifecyclePayload,
          matchId: match._id,
          targetUser: {
            id: match.targetUserId._id,
            name: match.targetUserId.name,
            profilePhoto: match.targetUserId.profilePhoto
          },
          meetingReason: match.meetingReason,
          urgency: match.urgency,
          meetingPoint: match.meetingPoint,
          meetingId: meeting._id,
          scheduledTime: meeting.scheduledTime
        });
      }

      if (match.targetUserId.socketId) {
        req.app.get('io').to(match.targetUserId.socketId).emit('matchConfirmed', {
          ...lifecyclePayload,
          matchId: match._id,
          requester: {
            id: match.requesterId._id,
            name: match.requesterId.name,
            profilePhoto: match.requesterId.profilePhoto
          },
          meetingReason: match.meetingReason,
          urgency: match.urgency,
          meetingPoint: match.meetingPoint,
          meetingId: meeting._id,
          scheduledTime: meeting.scheduledTime
        });
      }
    } else if (match.requesterId.socketId) {
      req.app.get('io').to(match.requesterId.socketId).emit('matchRejected', {
        ...lifecyclePayload,
        matchId: match._id,
        targetUserId: match.targetUserId._id
      });
    }

    if (match.targetUserId.socketId) {
      req.app.get('io').to(match.targetUserId.socketId).emit('incomingMatchResolved', lifecyclePayload);
    }

    res.json({
      message: `Match ${response === 'accepted' ? 'accepted' : 'rejected'}`,
      match
    });
  } catch (error) {
    console.error('Respond to match error:', error);
    res.status(500).json({ error: 'Failed to respond to match' });
  }
};

const getPendingSummary = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const matches = await Match.find({
      status: 'pending',
      $or: [{ requesterId: userId }, { targetUserId: userId }]
    })
      .populate('requesterId', 'name profilePhoto bio isOnline isAvailable')
      .populate('targetUserId', 'name profilePhoto bio isOnline isAvailable')
      .sort({ createdAt: -1 });

    const incoming = [];
    const outgoing = [];

    matches.forEach((match) => {
      const requesterId = match.requesterId?._id?.toString();
      const targetUserId = match.targetUserId?._id?.toString();

      if (targetUserId === userId) {
        incoming.push({
          ...buildPendingRequest(match, 'incoming'),
          requester: toPublicUser(match.requesterId)
        });
        return;
      }

      if (requesterId === userId) {
        outgoing.push({
          ...buildPendingRequest(match, 'outgoing'),
          targetUser: toPublicUser(match.targetUserId)
        });
      }
    });

    res.json({
      incoming,
      outgoing,
      counts: {
        incoming: incoming.length,
        outgoing: outgoing.length
      }
    });
  } catch (error) {
    console.error('Get pending summary error:', error);
    res.status(500).json({ error: 'Failed to fetch pending summary' });
  }
};

const getMatchHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const filter = {
      $or: [{ requesterId: userId }, { targetUserId: userId }]
    };

    if (status) {
      filter.status = status;
    }

    const matches = await Match.find(filter)
      .populate(['requesterId', 'targetUserId'], '-smsCode -smsCodeExpiry')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Match.countDocuments(filter);

    res.json({
      matches,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get match history error:', error);
    res.status(500).json({ error: 'Failed to fetch match history' });
  }
};

const confirmMeeting = async (req, res) => {
  try {
    const { meetingId } = req.body;
    const userId = req.user._id;

    const meeting = await Meeting.findById(meetingId).populate({
      path: 'matchId',
      populate: {
        path: 'requesterId targetUserId',
        select: '-smsCode -smsCodeExpiry'
      }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const match = meeting.matchId;
    const isRequester = match.requesterId._id.toString() === userId.toString();
    const isTarget = match.targetUserId._id.toString() === userId.toString();

    if (!isRequester && !isTarget) {
      return res.status(403).json({ error: 'Not authorized to confirm this meeting' });
    }

    if (isRequester) {
      meeting.requesterConfirmed = true;
    }
    if (isTarget) {
      meeting.targetConfirmed = true;
    }

    meeting.bothConfirmed = meeting.requesterConfirmed && meeting.targetConfirmed;

    if (meeting.bothConfirmed && !meeting.actualMeetingTime) {
      meeting.actualMeetingTime = new Date();
      meeting.meetingSuccess = true;

      await User.findByIdAndUpdate(match.requesterId._id, { $inc: { actualMeetCount: 1 } });
      await User.findByIdAndUpdate(match.targetUserId._id, { $inc: { actualMeetCount: 1 } });
    }

    await meeting.save();

    const otherUserId = isRequester ? match.targetUserId._id : match.requesterId._id;
    const otherUser = await User.findById(otherUserId);

    if (otherUser && otherUser.socketId) {
      req.app.get('io').to(otherUser.socketId).emit('meetingConfirmed', {
        meetingId: meeting._id,
        confirmedBy: req.user.name,
        bothConfirmed: meeting.bothConfirmed
      });
    }

    res.json({
      message: 'Meeting confirmed',
      meeting: {
        id: meeting._id,
        bothConfirmed: meeting.bothConfirmed,
        actualMeetingTime: meeting.actualMeetingTime,
        meetingSuccess: meeting.meetingSuccess
      }
    });
  } catch (error) {
    console.error('Confirm meeting error:', error);
    res.status(500).json({ error: 'Failed to confirm meeting' });
  }
};

const matchRequestValidation = [
  body('targetUserId').isMongoId().withMessage('Valid target user ID is required'),
  body('meetingReason').trim().isLength({ min: 1, max: 200 }).withMessage('Meeting reason must be 1-200 characters'),
  body('urgency').optional().isIn(['5m', '1h']).withMessage('urgency must be 5m or 1h')
];

const matchResponseValidation = [
  body('matchId').isMongoId().withMessage('Valid match ID is required'),
  body('response').isIn(['accepted', 'rejected']).withMessage('Response must be accepted or rejected')
];

const meetingConfirmValidation = [
  body('meetingId').isMongoId().withMessage('Valid meeting ID is required')
];

module.exports = {
  sendMatchRequest,
  respondToMatch,
  getPendingSummary,
  getMatchHistory,
  confirmMeeting,
  matchRequestValidation,
  matchResponseValidation,
  meetingConfirmValidation
};
