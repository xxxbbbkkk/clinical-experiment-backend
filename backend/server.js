require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// ============ 中间件 ============
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============ 请求日志中间件 ============
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============ 路由导入 ============
const sessionRoutes = require('./routes/sessions');
const trialRoutes = require('./routes/trials');
const adminRoutes = require('./routes/admin');

// ============ 路由使用 ============
app.use('/api/sessions', sessionRoutes);
app.use('/api/trials', trialRoutes);
app.use('/api/admin', adminRoutes);

// ============ 健康检查端点 ============
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '服务器正常运行',
    timestamp: new Date().toISOString()
  });
});

// ============ 根路由 ============
app.get('/', (req, res) => {
  res.json({ 
    message: '临床决策研究实验平台 - 后端API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      sessions: '/api/sessions',
      trials: '/api/trials',
      admin: '/api/admin'
    }
  });
});

// ============ MongoDB连接 ============
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB连接成功');
  } catch (err) {
    console.error('❌ MongoDB连接失败:', err.message);
    process.exit(1);
  }
};

connectDB();

// ============ 404处理 ============
app.use((req, res) => {
  res.status(404).json({ 
    error: '端点不存在',
    path: req.path,
    method: req.method
  });
});

// ============ 错误处理中间件 ============
app.use((err, req, res, next) => {
  console.error('❌ 错误:', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || '服务器内部错误',
    status: status,
    timestamp: new Date().toISOString()
  });
});

// ============ 启动服务器 ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const server = app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});

// ============ 优雅关闭 ============
process.on('SIGTERM', () => {
  console.log('📍 收到SIGTERM信号，关闭服务器...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ 服务器已关闭');
      process.exit(0);
    });
  });
});

module.exports = app;
