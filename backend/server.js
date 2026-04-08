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
const experimentRoutes = require('./routes/experimentRoutes');

// ============ 路由使用 ============
app.use('/api/sessions', sessionRoutes);
app.use('/api/trials', trialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/experiment', experimentRoutes);

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
    console.log('📍 环境变量检查...');
    let mongoUri = process.env.MONGODB_URI || '';
    
    // 移除可能存在的BOM或特殊字符
    mongoUri = mongoUri.replace(/^\uFEFF/, '').trim();
    
    console.log('MONGODB_URI:', mongoUri ? '已设置' : '未设置');
    console.log('MONGODB_URI 前20字符:', mongoUri ? mongoUri.substring(0, 20) : 'N/A');
    console.log('MONGODB_URI 完整长度:', mongoUri.length);
    
    if (!mongoUri) {
      throw new Error('缺少 MONGODB_URI 环境变量，请检查 .env 文件');
    }
    await mongoose.connect(mongoUri, {
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
