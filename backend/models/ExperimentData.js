/**
 * 实验数据模型
 * 存储每个试次的决策数据
 */

const mongoose = require('mongoose');

const experimentDataSchema = new mongoose.Schema({
  // 参与者标识（来自 Prolific 或自动生成）
  participant_id: {
    type: String,
    required: true,
    index: true
  },

  // 病例 Vignette ID
  vignette_id: {
    type: String,
    required: true
  },

  // 实验条件 (A/B/C/D)
  condition: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D']
  },

  // 基线决策（在 AI 建议前）
  baseline_decision: {
    type: String,
    required: true
  },

  // 最终决策（在 AI 建议后）
  final_decision: {
    type: String,
    required: true
  },

  // AI 建议采纳程度 (0-100)
  adoption_level: {
    type: Number,
    min: 0,
    max: 100
  },

  // 信任评分 (1-10)
  trust_score: {
    type: Number,
    min: 1,
    max: 10
  },

  // 基线反应时（毫秒）
  baseline_reaction_time: {
    type: Number,
    required: true
  },

  // 最终反应时（毫秒）
  final_reaction_time: {
    type: Number,
    required: true
  },

  // 创建时间
  create_time: {
    type: Date,
    default: Date.now
  }
});

// 复合唯一索引，防止重复提交
experimentDataSchema.index(
  { participant_id: 1, vignette_id: 1 },
  { unique: true }
);

module.exports = mongoose.model('ExperimentData', experimentDataSchema);