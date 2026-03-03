const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0.0, 0.0]
    }
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  aboutme: {
    type: String,
    default: '',
    maxlength: 1000
  },
  album: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 5;
      },
      message: 'Album cannot have more than 5 images'
    }
  },
  
  isOnline: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isFrozen: {
    type: Boolean,
    default: false
  },
  matchCount: {
    type: Number,
    default: 0
  },
  actualMeetCount: {
    type: Number,
    default: 0
  },
  meeting_count: {
    type: Number,
    default: 0.0
  },
  status: {
    type: [String],
    default: []
  },
  rate: {
    type: Number,
    default: 0.0
  },
  birth_year: {
    type: Number,
    default: 1990
  },
  smsVerified: {
    type: Boolean,
    default: false
  },
  smsCode: {
    type: String
  },
  smsCodeExpiry: {
    type: Date
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String
  }
}, {
  timestamps: true
});

userSchema.index({ location: '2dsphere' });
userSchema.index({ phoneNumber: 1 });

module.exports = mongoose.model('User', userSchema);
