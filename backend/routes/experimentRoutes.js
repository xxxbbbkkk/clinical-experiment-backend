/**
 * 实验数据 API 路由
 * POST /api/experiment/save - 保存试次数据
 * POST /api/experiment/save-questionnaire - 保存问卷和人口统计数据
 */

const express = require('express');
const router = express.Router();
const ExperimentData = require('../models/ExperimentData');
const Participant = require('../models/Participant');

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

// ============ 保存问卷和人口统计数据 ============
router.post('/save-questionnaire', async (req, res) => {
  try {
    const { participant_id, demographics, questionnaire, total_duration, completed_at } = req.body;

    if (!participant_id) {
      return res.status(400).json({ error: '缺少 participant_id' });
    }

    // 查找或创建参与者记录
    let participant = await Participant.findOne({ participantId: participant_id });
    
    if (participant) {
      // 更新现有记录
      if (demographics) participant.demographics = demographics;
      if (questionnaire) participant.questionnaire = questionnaire;
      if (total_duration) participant.totalDuration = total_duration;
      if (completed_at) participant.status = 'completed';
      await participant.save();
      console.log(`✅ 问卷数据更新成功: ${participant_id}`);
    } else {
      // 创建新记录（如果不存在）
      participant = new Participant({
        participantId: participant_id,
        sessionToken: 'temp-token-' + Date.now(),
        condition: 'unknown',
        demographics: demographics || {},
        questionnaire: questionnaire || {},
        totalDuration: total_duration || 0,
        status: 'completed'
      });
      await participant.save();
      console.log(`✅ 问卷数据保存成功: ${participant_id}`);
    }

    res.status(201).json({
      message: '问卷数据保存成功',
      data: {
        participant_id: participant.participantId,
        hasQuestionnaire: !!participant.questionnaire
      }
    });

  } catch (err) {
    console.error('❌ 保存问卷失败:', err.message);
    res.status(500).json({
      error: '问卷保存失败',
      details: err.message
    });
  }
});

module.exports = router;
