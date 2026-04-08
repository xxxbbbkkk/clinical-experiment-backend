const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  participantId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  participantCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  sessionToken: {
    type: String,
    required: true,
    unique: true
  },
  demographics: {
    age: Number,
    gender: String,
    experience: String,
    institution: String,
    specialty: String
  },
  condition: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  lastActivityTime: {
    type: Date,
    default: Date.now
  },
  completedTrials: {
    type: Number,
    default: 0
  },
  totalDuration: Number,
  questionnaire: mongoose.Schema.Types.Mixed,
  notes: String,
  ip: String,
  userAgent: String
}, { timestamps: true });

// 更新lastActivityTime
participantSchema.pre('save', function(next) {
  this.lastActivityTime = new Date();
  next();
});

// 索引优化
participantSchema.index({ createdAt: -1 });
participantSchema.index({ status: 1 });
participantSchema.index({ condition: 1 });

module.exports = mongoose.model('Participant', participantSchema);
