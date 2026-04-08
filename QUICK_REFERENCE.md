# Workspace 指令快速参考

## 🚀 快速启动

### 1️⃣ 启动后端
```bash
cd backend
npm run dev
# 验证：curl http://localhost:5000/api/health
```

### 2️⃣ 打开前端
浏览器打开：`file:///c:\Users\xxbbkk\Desktop\新课题\platform\experiment-platform\index.html`

### 3️⃣ 创建测试会话
```bash
curl -X POST http://localhost:5000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"condition":"A"}'
```

---

## 📍 关键文件位置

| 任务 | 文件 | 位置 |
|-----|------|-----|
| 修改病例 | App.js | `const vignettes = [...]` |
| 修改问卷 | App.js | `const questionnaire = {q1, q2, ...}` |
| 修改参与者条件 | App.js | `getConditionText()` 函数 |
| 添加API | routes/*.js | `backend/routes/sessions.js` 等 |
| 修改数据模型 | models/*.js | `backend/models/Participant.js` 等 |
| 配置环境 | .env | `backend/.env` |

---

## 🔐 认证方式

### 创建会话并获取Token
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"condition":"A"}' | jq -r '.sessionToken')
```

### 使用Token调用API
```bash
curl -X GET http://localhost:5000/api/sessions/status \
  -H "Authorization: Bearer $TOKEN"
```

### 管理员操作
```bash
curl http://localhost:5000/api/admin/summary \
  -H "X-Admin-Key: adminsecret123"
```

---

## 📊 主要API端点

### 会话管理
- `POST /api/sessions/create` - 创建新会话
- `POST /api/sessions/resume` - 恢复会话
- `GET /api/sessions/status` - 获取状态
- `POST /api/sessions/update-demographics` - 更新人口统计
- `POST /api/sessions/submit-questionnaire` - 提交问卷

### 试验数据  
- `POST /api/trials/upload` - 上传试次
- `POST /api/trials/batch-upload` - 批量上传
- `GET /api/trials/participant/{id}` - 获取参与者试次
- `GET /api/trials/stats/{id}` - 统计数据

### 管理员
- `GET /api/admin/participants` - 所有参与者
- `GET /api/admin/summary` - 统计摘要
- `GET /api/admin/export-trials` - 导出Trial CSV
- `GET /api/admin/export-participants` - 导出参与者CSV

---

## 💡 常见任务

### 任务1：修改病例
```javascript
// 在 App.js 中找到 vignettes 数组
const vignettes = [
  {
    id: 'v1',
    title: '病例1：胸痛患者',
    description: '...', // 修改此处
    question: '...',
    options: ['A...', 'B...', 'C...', 'D...'],
    correctAnswer: 'B',
    unsafeAnswer: 'C',
    cotText: '...',  // 有CoT思维链的版本
    noCotText: '...' // 无CoT的版本
  }
];
```

### 任务2：修改问卷
```javascript
// 在 App.js 中找到 questionnaire 对象
const questionnaire = {
  q1: {
    question: "AI建议对您的决策有何帮助？",
    options: ["非常有帮助", "有帮助", "中立", "没有帮助", "非常没有帮助"]
  }
  // 修改题目或选项
};
```

### 任务3：添加新API端点
```javascript
// 在 backend/routes/trials.js 中
router.get('/new-endpoint', requireAuth, async (req, res) => {
  try {
    // 业务逻辑
    res.json({ message: 'success' });
  } catch (err) {
    console.error('❌ 错误:', err.message);
    res.status(500).json({ error: err.message });
  }
});
```

### 任务4：测试完整流程
```bash
# 1. 创建会话
SESSION=$(curl -s -X POST http://localhost:5000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"condition":"A"}' | jq -r '.sessionToken')

# 2. 更新人口统计
curl -X POST http://localhost:5000/api/sessions/update-demographics \
  -H "Authorization: Bearer $SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "demographics": {
      "age": 35,
      "gender": "female",
      "experience": "5years",
      "institution": "Hospital A",
      "specialty": "Cardiology"
    }
  }'

# 3. 上传试次数据
curl -X POST http://localhost:5000/api/trials/upload \
  -H "Authorization: Bearer $SESSION" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'

# 4. 提交问卷并完成
curl -X POST http://localhost:5000/api/sessions/submit-questionnaire \
  -H "Authorization: Bearer $SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "questionnaire": {
      "q1": "very_helpful",
      "q2": "trust",
      "q3": "strongly_influence",
      "q4": "very_high",
      "q5": "very_positive"
    },
    "totalDuration": 3600000
  }'

# 5. 查看统计
curl http://localhost:5000/api/admin/summary \
  -H "X-Admin-Key: adminsecret123"
```

---

## 🐛 调试技巧

### 查看后端日志
在启动后端时会输出详细日志：
```
[时间戳] POST /api/sessions/create
✅ 创建新会话: P1234567abc, 条件: A
```

### 常见错误和解决方案
| 错误 | 原因 | 解决方案 |
|-----|-----|--------|
| CORS错误 | CORS_ORIGIN配置不对 | 检查 .env 中的CORS_ORIGIN |
| 401 Unauthorized | Token未提供或过期 | 重新创建会话获取新token |
| MongoDB连接失败 | MONGODB_URI错误 | 验证连接字符串和IP白名单 |
| 数据重复 | 网络重试多次上传 | ExperimentData表有唯一索引 |

---

## 📝 环境配置检查清单

- [ ] MongoDB Atlas集群创建并运行
- [ ] 数据库用户创建（username、password）
- [ ] IP白名单已添加
- [ ] 连接字符串复制到 `.env` 的 `MONGODB_URI`
- [ ] JWT_SECRET 已设置（强随机字符串）
- [ ] ADMIN_KEY 已设置
- [ ] CORS_ORIGIN 配置正确
- [ ] 后端启动成功（`npm run dev`）
- [ ] API测试成功（`curl localhost:5000/api/health` 返回200）
- [ ] 前端可打开（浏览器打开 index.html）

---

## 🎯 下一步行动

1. **配置MongoDB**：
   - 如果Atlas遇到reCAPTCHA问题，考虑使用本地SQLite
   - 或联系MongoDB支持

2. **集成前端API**：
   - 修改App.js中的API调用指向 `localhost:5000`
   - 实现会话恢复功能
   - 测试离线缓存

3. **本地测试**：
   - 模拟多个参与者的完整流程
   - 验证所有4个条件
   - 检查数据导出

4. **部署准备**：
   - 选择部署平台（Render/Railway）
   - 配置生产环境变量
   - 设置HTTPS和自定义域名

---

## 📚 相关文档

- [.github/copilot-instructions.md](./.github/copilot-instructions.md) - 完整工作区指令
- [AGENTS.md](./AGENTS.md) - 项目总览
- [backend/README.md](./backend/README.md) - 后端API文档
- [backend/package.json](./backend/package.json) - 依赖列表

---

**最后更新**：2026-04-08  
**状态**：✅ 后端完整 | ⏳ 需集成前端 | ⏳ 数据库配置
