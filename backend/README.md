# 临床决策研究平台 - 后端服务

这是临床决策研究实验平台的后端服务，使用Node.js + Express + MongoDB构建。

## 📦 快速开始

### 1. 安装依赖
```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入必要的配置：
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/clinical-experiment
NODE_ENV=development
PORT=5000
JWT_SECRET=your_random_secret_key_here
CORS_ORIGIN=http://localhost:3000
ADMIN_KEY=your_admin_key_here
```

**环境变量说明**：
- `MONGODB_URI` - MongoDB连接字符串（从MongoDB Atlas获取）
- `NODE_ENV` - 环境（development/production）
- `PORT` - 服务器端口
- `JWT_SECRET` - JWT密钥（生成随机字符串用于token签名）
- `CORS_ORIGIN` - 前端地址（允许跨域请求的源）
- `ADMIN_KEY` - 管理员密钥（用于管理员端点）

### 3. 运行服务器

**开发模式**（自动重启，推荐）：
```bash
npm run dev
```

**生产模式**：
```bash
npm start
```

服务器将在 `http://localhost:5000` 启动

## 🔌 API 端点

### 健康检查
```
GET /api/health
```
返回服务器状态

### 会话管理（`/api/sessions`）

#### 创建新会话
```
POST /api/sessions/create
Content-Type: application/json

{
  "condition": "A"
}
```
**响应**：
```json
{
  "participantId": "P1234567abc",
  "participantCode": "EXP2024A3B7",
  "sessionToken": "eyJhbGc...",
  "condition": "A",
  "message": "会话创建成功"
}
```

#### 恢复会话
```
POST /api/sessions/resume
Content-Type: application/json

{
  "participantCode": "EXP2024A3B7"
}
```

#### 更新参与者信息
```
POST /api/sessions/update-demographics
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "demographics": {
    "age": 35,
    "gender": "female",
    "experience": "5years",
    "institution": "Hospital A",
    "specialty": "Cardiology"
  }
}
```

#### 提交问卷
```
POST /api/sessions/submit-questionnaire
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "questionnaire": {
    "q1": "strongly_agree",
    "q2": "agree",
    ...
  },
  "totalDuration": 3600000
}
```

#### 获取参与者状态
```
GET /api/sessions/status
Authorization: Bearer {sessionToken}
```

### Trial数据管理（`/api/trials`）

#### 上传单个trial
```
POST /api/trials/upload
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "trialData": {
    "trialId": "trial_001",
    "vignetteId": "v1",
    "condition": "A",
    "correctness": "correct",
    "baselineDecision": "A",
    "finalDecision": "B",
    "adoptionLevel": 75,
    "confidenceBefore": 60,
    "confidenceAfter": 80,
    "trustScore": 8,
    "baselineTime": 5000,
    "finalTime": 8000
  }
}
```

#### 批量上传trial（用于离线同步）
```
POST /api/trials/batch-upload
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "trials": [
    { ...trial1 },
    { ...trial2 },
    { ...trial3 }
  ]
}
```

#### 获取参与者的所有trial
```
GET /api/trials/participant/{participantId}
Authorization: Bearer {sessionToken}
```

#### 获取参与者的统计数据
```
GET /api/trials/stats/{participantId}
Authorization: Bearer {sessionToken}
```

### 管理员接口（`/api/admin`）

**所有管理员端点需要提供管理员密钥**：
```
X-Admin-Key: your_admin_key_here
```

#### 获取所有参与者统计
```
GET /api/admin/participants
X-Admin-Key: {ADMIN_KEY}
```

#### 获取实验摘要
```
GET /api/admin/summary
X-Admin-Key: {ADMIN_KEY}
```

#### 导出所有trial数据为CSV
```
GET /api/admin/export-trials
X-Admin-Key: {ADMIN_KEY}
```

#### 导出所有参与者数据为CSV
```
GET /api/admin/export-participants
X-Admin-Key: {ADMIN_KEY}
```

#### 删除参与者数据
```
DELETE /api/admin/participant/{participantId}
X-Admin-Key: {ADMIN_KEY}
```

## 🔐 认证方式

大多数需要用户认证的端点使用Bearer Token方式：

```
Authorization: Bearer {sessionToken}
```

其中 `sessionToken` 由创建会话或恢复会话端点返回。

管理员端点使用请求头中的 `X-Admin-Key`。

## 📊 数据模型

### Participant（参与者）
```javascript
{
  participantId: String,           // 唯一参与者ID
  participantCode: String,         // 参与者编码（6-8位）
  sessionToken: String,            // JWT会话令牌
  demographics: Object,            // 人口统计学数据
  condition: String,               // 实验条件 (A/B/C/D)
  status: String,                  // 状态 (active/completed/abandoned)
  completedTrials: Number,         // 已完成的trial数
  totalDuration: Number,           // 总耗时（毫秒）
  questionnaire: Object,           // 问卷数据
  createdAt: Date,                 // 创建时间
  updatedAt: Date                  // 更新时间
}
```

### Trial（试验数据）
```javascript
{
  participantId: String,           // 参与者ID
  trialId: String,                 // Trial唯一ID
  vignetteId: String,              // 病例ID
  condition: String,               // 实验条件 (A/B/C/D)
  correctness: String,             // 正确性 (correct/unsafe)
  baselineDecision: String,        // 基线决策
  finalDecision: String,           // 最终决策
  adoptionLevel: Number,           // AI建议采纳程度 (0-100)
  confidenceBefore: Number,        // 建议前信心 (0-100)
  confidenceAfter: Number,         // 建议后信心 (0-100)
  trustScore: Number,              // AI信任度 (0-10)
  baselineTime: Number,            // 基线响应时间
  finalTime: Number,               // 最终响应时间
  timestamp: Date                  // 时间戳
}
```

## 🛠️ 开发指南

### 项目结构
```
backend/
├── server.js                 # 主服务器文件
├── middleware/
│   └── auth.js              # 认证中间件
├── models/
│   ├── Participant.js       # 参与者模型
│   └── Trial.js             # Trial数据模型
├── routes/
│   ├── sessions.js          # 会话管理路由
│   ├── trials.js            # Trial数据路由
│   └── admin.js             # 管理员路由
├── package.json
├── .env.example
└── README.md
```

### 添加新的API端点

1. 在对应的 `routes/*.js` 文件中添加路由
2. 使用 `requireAuth` 中间件进行认证
3. 编写错误处理
4. 添加日志记录

示例：
```javascript
router.get('/new-endpoint', requireAuth, async (req, res) => {
  try {
    // 业务逻辑
    res.json({ message: 'success' });
  } catch (err) {
    console.error('❌ 错误:', err.message);
    res.status(500).json({ error: '错误信息' });
  }
});
```

## 🚀 部署

### 本地部署
```bash
npm run dev
```

### 云服务部署（Render/Railway等）

1. 创建MongoDB Atlas数据库
2. 获取连接字符串
3. 在云平台添加环境变量
4. 部署应用

**Render部署示例**：
```bash
npm install -g render-cli
render deploy
```

## 📝 日志

服务器会输出详细的日志信息：
- ✅ 成功操作
- ❌ 错误操作
- 📍 系统事件

示例：
```
[2024-04-02T12:00:00Z] POST /api/sessions/create
✅ 创建新会话: P1234567abc, 条件: A
```

## 🐛 常见问题

### MongoDB连接失败
- 检查 `MONGODB_URI` 是否正确
- 确保IP白名单已配置（MongoDB Atlas）
- 检查网络连接

### CORS错误
- 确保 `CORS_ORIGIN` 正确配置
- 前端请求地址应与配置相符

### 认证失败
- 检查 `JWT_SECRET` 是否相同（前后端）
- 确保 `sessionToken` 未过期
- 检查 `Authorization` 请求头格式

## 📄 许可

MIT

## 📧 支持

如有问题，请联系开发团队。
