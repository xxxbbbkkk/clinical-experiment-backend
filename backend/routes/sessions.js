const express = require('express');
const jwt = require('jsonwebtoken');
const Participant = require('../models/Participant');
const { requireAuth, generateSessionToken } = require('../middleware/auth');

const router = express.Router();

// 生成参与者编码（6-8位字母数字）
function generateParticipantCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'EXP' + new Date().getFullYear();
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 1. 创建新会话（分配参与者ID和编码）
router.post('/create', async (req, res) => {
  try {
    const { condition } = req.body;
    
    if (!condition || !['A', 'B', 'C', 'D'].includes(condition)) {
      return res.status(400).json({ error: '条件无效，必须是A/B/C/D之一' });
    }

    const participantId = 'P' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const participantCode = generateParticipantCode();
    const sessionToken = generateSessionToken(participantId);

    const participant = new Participant({
      participantId,
      participantCode,
      sessionToken,
      condition,
      status: 'active',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    await participant.save();

    console.log(`✅ 创建新会话: ${participantId}, 条件: ${condition}`);

    res.status(201).json({
      participantId,
      participantCode,
      sessionToken,
      condition,
      message: '会话创建成功'
    });
  } catch (err) {
    console.error('❌ 创建会话失败:', err.message);
    res.status(500).json({ error: '创建会话失败', message: err.message });
  }
});

// 2. 恢复会话（通过参与者编码）
router.post('/resume', async (req, res) => {
  try {
    const { participantCode } = req.body;
    
    if (!participantCode) {
      return res.status(400).json({ error: '参与者编码不能为空' });
    }

    const participant = await Participant.findOne({ participantCode });
    
    if (!participant) {
      return res.status(404).json({ error: '参与者编码不存在，请检查输入是否正确' });
    }

    if (participant.status === 'completed') {
      return res.status(403).json({ error: '该实验已完成，无法重新开始' });
    }

    // 生成新的会话令牌
    const sessionToken = generateSessionToken(participant.participantId);
    participant.sessionToken = sessionToken;
    participant.status = 'active';
    await participant.save();

    console.log(`✅ 恢复会话: ${participant.participantId}`);

    res.json({
      participantId: participant.participantId,
      participantCode: participant.participantCode,
      sessionToken,
      condition: participant.condition,
      demographics: participant.demographics,
      completedTrials: participant.completedTrials,
      message: '会话恢复成功'
    });
  } catch (err) {
    console.error('❌ 恢复会话失败:', err.message);
    res.status(500).json({ error: '恢复会话失败', message: err.message });
  }
});

// 3. 更新参与者信息（人口统计学数据）
router.post('/update-demographics', requireAuth, async (req, res) => {
  try {
    const { demographics } = req.body;
    
    const participant = await Participant.findOne({ participantId: req.participantId });
    if (!participant) {
      return res.status(404).json({ error: '参与者不存在' });
    }

    participant.demographics = demographics;
    await participant.save();

    console.log(`✅ 更新参与者信息: ${req.participantId}`);

    res.json({ message: '参与者信息已更新', demographics });
  } catch (err) {
    console.error('❌ 更新参与者信息失败:', err.message);
    res.status(500).json({ error: '更新失败', message: err.message });
  }
});

// 4. 提交问卷
router.post('/submit-questionnaire', requireAuth, async (req, res) => {
  try {
    const { questionnaire, totalDuration } = req.body;
    
    const participant = await Participant.findOne({ participantId: req.participantId });
    if (!participant) {
      return res.status(404).json({ error: '参与者不存在' });
    }

    participant.questionnaire = questionnaire;
    participant.totalDuration = totalDuration;
    participant.status = 'completed';
    await participant.save();

    console.log(`✅ 问卷提交完成: ${req.participantId}`);

    res.json({ 
      message: '问卷已提交，实验完成', 
      participantId: participant.participantId,
      completedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ 提交问卷失败:', err.message);
    res.status(500).json({ error: '提交失败', message: err.message });
  }
});

// 5. 获取参与者状态
router.get('/status', requireAuth, async (req, res) => {
  try {
    const participant = await Participant.findOne({ participantId: req.participantId });
    if (!participant) {
      return res.status(404).json({ error: '参与者不存在' });
    }

    res.json({
      participantId: participant.participantId,
      participantCode: participant.participantCode,
      status: participant.status,
      completedTrials: participant.completedTrials,
      condition: participant.condition,
      demographics: participant.demographics,
      startTime: participant.startTime,
      lastActivityTime: participant.lastActivityTime
    });
  } catch (err) {
    console.error('❌ 获取状态失败:', err.message);
    res.status(500).json({ error: '获取状态失败', message: err.message });
  }
});

module.exports = router;
