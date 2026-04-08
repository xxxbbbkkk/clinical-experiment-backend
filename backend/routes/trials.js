const express = require('express');
const Trial = require('../models/Trial');
const Participant = require('../models/Participant');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// 1. 上传trial数据
router.post('/upload', requireAuth, async (req, res) => {
  try {
    const { trialData } = req.body;
    
    if (!trialData) {
      return res.status(400).json({ error: 'Trial数据不能为空' });
    }

    const trial = new Trial({
      participantId: req.participantId,
      ...trialData
    });

    await trial.save();

    // 更新参与者的完成试验数
    await Participant.updateOne(
      { participantId: req.participantId },
      { $inc: { completedTrials: 1 } }
    );

    res.status(201).json({
      message: 'Trial数据已保存',
      trialId: trial._id
    });
  } catch (err) {
    console.error('❌ Trial数据保存失败:', err.message);
    res.status(500).json({ error: '保存失败', message: err.message });
  }
});

// 2. 批量上传trial数据（离线模式恢复用）
router.post('/batch-upload', requireAuth, async (req, res) => {
  try {
    const { trials } = req.body;
    
    if (!Array.isArray(trials)) {
      return res.status(400).json({ error: 'Trials必须是数组' });
    }

    if (trials.length === 0) {
      return res.status(400).json({ error: 'Trials数组不能为空' });
    }

    const trialsToInsert = trials.map(t => ({
      ...t,
      participantId: req.participantId
    }));

    const result = await Trial.insertMany(trialsToInsert);

    // 更新参与者的完成试验数
    await Participant.updateOne(
      { participantId: req.participantId },
      { $inc: { completedTrials: trials.length } }
    );

    console.log(`✅ 批量保存${trials.length}个Trial数据: ${req.participantId}`);

    res.status(201).json({
      message: `已保存${trials.length}个Trial数据`,
      count: result.length
    });
  } catch (err) {
    console.error('❌ 批量保存失败:', err.message);
    res.status(500).json({ error: '批量保存失败', message: err.message });
  }
});

// 3. 获取参与者的所有trial数据
router.get('/participant/:participantId', requireAuth, async (req, res) => {
  try {
    // 验证权限（只能获取自己的数据）
    if (req.participantId !== req.params.participantId) {
      return res.status(403).json({ error: '无权访问该参与者的数据' });
    }

    const trials = await Trial.find({ participantId: req.participantId })
      .sort({ timestamp: 1 })
      .lean();
    
    res.json({
      participantId: req.participantId,
      trials: trials,
      count: trials.length
    });
  } catch (err) {
    console.error('❌ 获取trial数据失败:', err.message);
    res.status(500).json({ error: '获取数据失败', message: err.message });
  }
});

// 4. 获取统计数据
router.get('/stats/:participantId', requireAuth, async (req, res) => {
  try {
    if (req.participantId !== req.params.participantId) {
      return res.status(403).json({ error: '无权访问该参与者的统计' });
    }

    const trials = await Trial.find({ participantId: req.participantId });
    
    if (trials.length === 0) {
      return res.json({
        totalTrials: 0,
        avgConfidenceChange: 0,
        avgTrustScore: 0,
        avgAdoptionLevel: 0,
        byCondition: {}
      });
    }

    const stats = {
      totalTrials: trials.length,
      avgConfidenceChange: parseFloat(
        (trials.reduce((sum, t) => sum + ((t.confidenceAfter || 0) - (t.confidenceBefore || 0)), 0) / trials.length).toFixed(2)
      ),
      avgTrustScore: parseFloat(
        (trials.reduce((sum, t) => sum + (t.trustScore || 0), 0) / trials.length).toFixed(2)
      ),
      avgAdoptionLevel: parseFloat(
        (trials.reduce((sum, t) => sum + (t.adoptionLevel || 0), 0) / trials.length).toFixed(2)
      ),
      correctAnswerAccuracy: parseFloat(
        ((trials.filter(t => t.correctness === 'correct').length / trials.length) * 100).toFixed(2)
      ),
      byCondition: {
        A: trials.filter(t => t.condition === 'A').length,
        B: trials.filter(t => t.condition === 'B').length,
        C: trials.filter(t => t.condition === 'C').length,
        D: trials.filter(t => t.condition === 'D').length
      }
    };

    res.json(stats);
  } catch (err) {
    console.error('❌ 获取统计失败:', err.message);
    res.status(500).json({ error: '获取统计失败', message: err.message });
  }
});

module.exports = router;
