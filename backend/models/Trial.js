const mongoose = require('mongoose');

const trialSchema = new mongoose.Schema({
  participantId: {
    type: String,
    required: true,
    index: true
  },
  trialId: {
    type: String,
    required: true
  },
  vignetteId: String,
  condition: {
    type: String,
    enum: ['A', 'B', 'C', 'D']
  },
  correctness: {
    type: String,
    enum: ['correct', 'unsafe']
  },
  baselineDecision: String,
  baselineTime: Number,
  finalDecision: String,
  finalTime: Number,
  adoptionLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  confidenceBefore: {
    type: Number,
    min: 0,
    max: 100
  },
  confidenceAfter: {
    type: Number,
    min: 0,
    max: 100
  },
  trustScore: {
    type: Number,
    min: 0,
    max: 10
  },
  responseData: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// 复合索引优化查询性能
trialSchema.index({ participantId: 1, timestamp: -1 });
trialSchema.index({ participantId: 1, vignetteId: 1 });

module.exports = mongoose.model('Trial', trialSchema);
