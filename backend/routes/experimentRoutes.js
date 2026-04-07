/**
 * 实验数据 API 路由
 * POST /api/experiment/save - 保存试次数据
 */

const express = require('express');
const router = express.Router();
const ExperimentData = require('../models/ExperimentData');

// ============ 保存实验数据 ============
router.post('/save', async (req, res) => {
  try {
    const {
      participant_id,
      vignette_id,
      condition,
      baseline_decision,
      final_decision,
      adoption_level,
      trust_score,
      baseline_reaction_time,
      final_reaction_time
    } = req.body;

    // 验证必填字段
    const requiredFields = [
      'participant_id',
      'vignette_id',
      'condition',
      'baseline_decision',
      'final_decision',
      'baseline_reaction_time',
      'final_reaction_time'
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          error: `缺少必填字段: ${field}`
        });
      }
    }

    // 创建实验数据记录
    const experimentData = new ExperimentData({
      participant_id,
      vignette_id,
      condition,
      baseline_decision,
      final_decision,
      adoption_level,
      trust_score,
      baseline_reaction_time,
      final_reaction_time
    });

    // 保存到数据库
    await experimentData.save();

    console.log(`✅ 实验数据保存成功: ${participant_id} - ${vignette_id}`);

    res.status(201).json({
      message: '数据保存成功',
      data: {
        id: experimentData._id,
        participant_id: experimentData.participant_id,
        vignette_id: experimentData.vignette_id
      }
    });

  } catch (err) {
    // 处理唯一索引冲突（重复提交）
    if (err.code === 11000) {
      return res.status(409).json({
        error: '该试次数据已存在，请勿重复提交',
        duplicate: true
      });
    }

    console.error('❌ 保存实验数据失败:', err.message);
    res.status(500).json({
      error: '数据保存失败',
      details: err.message
    });
  }
});

// ============ 获取参与者的所有数据 ============
router.get('/participant/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    
    const data = await ExperimentData.find({ participant_id: participantId })
      .sort({ create_time: 1 });

    res.json({
      participant_id: participantId,
      total_trials: data.length,
      data: data
    });
  } catch (err) {
    console.error('❌ 获取数据失败:', err.message);
    res.status(500).json({ error: '获取数据失败' });
  }
});

module.exports = router;