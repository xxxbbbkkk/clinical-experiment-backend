const jwt = require('jsonwebtoken');

// 验证会话令牌的中间件
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.participantId = decoded.participantId;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期' });
    }
    return res.status(401).json({ error: '无效的令牌', message: err.message });
  }
};

// 可选的认证中间件（不会拒绝）
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.participantId = decoded.participantId;
      req.authenticated = true;
    } catch (err) {
      req.authenticated = false;
    }
  } else {
    req.authenticated = false;
  }
  
  next();
};

// 生成会话令牌
const generateSessionToken = (participantId) => {
  return jwt.sign({ participantId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

module.exports = { requireAuth, optionalAuth, generateSessionToken };
