const express = require('express');
const Participant = require('../models/Participant');
const Trial = require('../models/Trial');

const router = express.Router();

// 管理员密钥验证中间件
const requireAdminKey = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY && process.env.ADMIN_KEY) {
    return res.status(401).json({ error: '未授权的访问' });
  }
  next();
};

// 1. 获取所有参与者统计
router.get('/participants', requireAdminKey, async (req, res) => {
  try {
    const participants = await Participant.find({})
      .select('-sessionToken')
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      total: participants.length,
      active: participants.filter(p => p.status === 'active').length,
      completed: participants.filter(p => p.status === 'completed').length,
      abandoned: participants.filter(p => p.status === 'abandoned').length,
      byCondition: {
        A: participants.filter(p => p.condition === 'A').length,
        B: participants.filter(p => p.condition === 'B').length,
        C: participants.filter(p => p.condition === 'C').length,
        D: participants.filter(p => p.condition === 'D').length
      }
    };

    res.json({ participants, stats });
  } catch (err) {
    console.error('❌ 获取参与者列表失败:', err.message);
    res.status(500).json({ error: '获取数据失败', message: err.message });
  }
});

// 2. 导出所有trial数据
router.get('/export-trials', requireAdminKey, async (req, res) => {
  try {
    const trials = await Trial.find({}).lean();
    
    // 转换为CSV格式
    const csv = convertTrialsToCSV(trials);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="trials_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('❌ 导出数据失败:', err.message);
    res.status(500).json({ error: '导出失败', message: err.message });
  }
});

// 3. 导出所有参与者数据
router.get('/export-participants', requireAdminKey, async (req, res) => {
  try {
    const participants = await Participant.find({})
      .select('-sessionToken')
      .lean();
    
    // 转换为CSV格式
    const csv = convertParticipantsToCSV(participants);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="participants_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('❌ 导出参与者数据失败:', err.message);
    res.status(500).json({ error: '导出失败', message: err.message });
  }
});

// 4. 获取实验统计摘要
router.get('/summary', requireAdminKey, async (req, res) => {
  try {
    const participants = await Participant.find({});
    const trials = await Trial.find({});

    const summary = {
      totalParticipants: participants.length,
      totalTrials: trials.length,
      completedParticipants: participants.filter(p => p.status === 'completed').length,
      avgTrialsPerParticipant: (trials.length / participants.length).toFixed(2),
      avgCompletionTime: participants
        .filter(p => p.totalDuration)
        .reduce((sum, p) => sum + p.totalDuration, 0) / participants.filter(p => p.totalDuration).length || 0,
      experimentStartDate: participants.length > 0 ? participants[0].createdAt : null,
      experimentEndDate: participants.length > 0 ? participants[participants.length - 1].createdAt : null,
      conditions: {
        A: participants.filter(p => p.condition === 'A').length,
        B: participants.filter(p => p.condition === 'B').length,
        C: participants.filter(p => p.condition === 'C').length,
        D: participants.filter(p => p.condition === 'D').length
      },
      avgTrustScore: parseFloat(
        (trials.reduce((sum, t) => sum + (t.trustScore || 0), 0) / trials.length).toFixed(2)
      ),
      avgAdoptionRate: parseFloat(
        (trials.reduce((sum, t) => sum + (t.adoptionLevel || 0), 0) / trials.length).toFixed(2)
      )
    };

    res.json(summary);
  } catch (err) {
    console.error('❌ 获取摘要失败:', err.message);
    res.status(500).json({ error: '获取摘要失败', message: err.message });
  }
});

// 5. 删除参与者数据（谨慎使用）
router.delete('/participant/:participantId', requireAdminKey, async (req, res) => {
  try {
    const { participantId } = req.params;

    await Participant.deleteOne({ participantId });
    await Trial.deleteMany({ participantId });

    console.log(`⚠️ 删除参与者数据: ${participantId}`);

    res.json({ message: `已删除参与者 ${participantId} 的所有数据` });
  } catch (err) {
    console.error('❌ 删除数据失败:', err.message);
    res.status(500).json({ error: '删除失败', message: err.message });
  }
});

// ============ 辅助函数 ============

function convertTrialsToCSV(trials) {
  const headers = [
    'participantId',
    'trialId',
    'vignetteId',
    'condition',
    'correctness',
    'baselineDecision',
    'finalDecision',
    'adoptionLevel',
    'confidenceBefore',
    'confidenceAfter',
    'trustScore',
    'baselineTime',
    'finalTime',
    'timestamp'
  ];

  const rows = trials.map(t => [
    t.participantId,
    t.trialId,
    t.vignetteId,
    t.condition,
    t.correctness,
    t.baselineDecision,
    t.finalDecision,
    t.adoptionLevel,
    t.confidenceBefore,
    t.confidenceAfter,
    t.trustScore,
    t.baselineTime,
    t.finalTime,
    t.timestamp
  ]);

  return [headers, ...rows].map(row => row.map(cell => 
    `"${String(cell).replace(/"/g, '""')}"`
  ).join(',')).join('\n');
}

function convertParticipantsToCSV(participants) {
  const headers = [
    'participantId',
    'participantCode',
    'condition',
    'status',
    'completedTrials',
    'totalDuration',
    'demographics',
    'createdAt'
  ];

  const rows = participants.map(p => [
    p.participantId,
    p.participantCode,
    p.condition,
    p.status,
    p.completedTrials,
    p.totalDuration,
    JSON.stringify(p.demographics),
    p.createdAt
  ]);

  return [headers, ...rows].map(row => row.map(cell => 
    `"${String(cell).replace(/"/g, '""')}"`
  ).join(',')).join('\n');
}

module.exports = router;
