# 临床决策研究平台 - Copilot 工作区指令

## 快速上手

### 项目概述
这是一个**2×2因子设计的临床决策研究实验平台**，用于研究Chain-of-Thought（思维链）推理和AI建议正确性对医生决策的影响。

- **前端**: React SPA (CDN + Babel，无构建步骤)
- **后端**: Node.js + Express + MongoDB
- **用途**: 在线实验平台，参与者做临床决策任务
- **语言**: 中文

### 项目层级
```
platform/
├── experiment-platform/  # 前端（React）
├── backend/             # Node.js后端
├── AGENTS.md           # 项目总览
└── .github/copilot-instructions.md  # 本文件
```

---

## 启动命令

### 前端启动
```bash
# 直接在浏览器打开
file:///c:\Users\xxbbkk\Desktop\新课题\platform\experiment-platform\index.html

# 或打开离线版本（无CDN依赖）
file:///c:\Users\xxbbkk\Desktop\新课题\platform\experiment-platform\experiment.html
```

### 后端启动
```bash
cd backend
npm install                # 首次需要
npm run dev               # 开发模式（自动重启）
npm start                 # 生产模式
# 访问：http://localhost:5000/api/health
```

### 常用开发任务
```bash
# 检查后端API
curl http://localhost:5000/api/health

# 创建新会话
curl -X POST http://localhost:5000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"condition":"A"}'

# 导出参与者数据（需要ADMIN_KEY）
curl http://localhost:5000/api/admin/summary \
  -H "X-Admin-Key: {ADMIN_KEY}"
```

---

## 核心设计

### 2×2 因子设计
实验条件由两个因子组合而成：

| 编号 | 正确性 | 思维链(CoT) | 特点 |
|-----|---------|-----------|------|
| **A** | ✅ 正确 | ❌ 无 | 基准控制组 |
| **B** | ✅ 正确 | ✅ 有 | CoT增强效果 |
| **C** | ❌ 不安全 | ❌ 无 | 错误建议基准 |
| **D** | ❌ 不安全 | ✅ 有 | 错误+CoT的影响 |

参与者随机分配到A/B/C/D之一。

### 临床病例（3个）
1. **v1**: 58岁男性胸痛 → STEMI → 推荐冠脉造影介入治疗(PCI)
2. **v2**: 72岁女性呼吸困难 → 社区获得性肺炎 → 推荐住院静脉抗生素
3. **v3**: 45岁男性腹痛 → 胰腺炎 → 推荐保守支持治疗

每个病例分别呈现4次（对应A/B/C/D条件，但同一参与者只看一个条件的版本）。

### 实验流程
```
欢迎页 → 知情同意 → 人口统计表 → 指导说明
  ↓
练习试例（1个病例）
  ↓
主实验（3个病例 × 当前条件的版本）
  ├─ 每个病例显示：
  │  ├─ 基线问题（收集基线决策）
  │  ├─ AI建议（根据条件A/B/C/D展示）
  │  └─ 最终决策（收集最终决策）
  ├─ 测量指标：
  │  ├─ 采纳程度（0-100）
  │  ├─ 建议前后信心度（0-100）
  │  └─ 信任评分（0-10）
  │
问卷（5题） → 完成 → 导出数据
```

---

## 数据模型

### Participant（参与者）
```javascript
{
  participantId: "P1234567abc",           // 唯一ID
  participantCode: "EXP2024A3B7",         // 6-8位编码
  condition: "A" | "B" | "C" | "D",       // 分配条件
  demographics: { age, gender, experience, institution, specialty },
  status: "active" | "completed" | "abandoned",
  completedTrials: 3,                     // 已完成试次
  totalDuration: 1800000,                 // 总耗时(ms)
  questionnaire: { q1: "...", q2: "...", ... },
  sessionToken: "eyJhbGc...",             // JWT令牌
  createdAt: "2024-04-02T..."
}
```

### Trial（试次数据）
```javascript
{
  participantId: "P1234567abc",
  vignetteId: "v1",                       // 病例ID
  condition: "A",                         // 当前条件
  correctness: "correct" | "unsafe",      // 建议正确性
  baselineDecision: "B",                  // 基线选择
  finalDecision: "B",                     // 最终选择
  adoptionLevel: 75,                      // 采纳程度(%)
  confidenceBefore: 60,                   // 建议前信心
  confidenceAfter: 85,                    // 建议后信心
  trustScore: 8,                          // 信任评分(0-10)
  baselineTime: 5000,                     // 基线响应时(ms)
  finalTime: 8000                         // 最终响应时(ms)
}
```

---

## 文件位置和责任

### 前端（experiment-platform/）
- **App.js** - 所有React组件和UI逻辑
  - 包含：问卷定义、病例数据、条件逻辑、状态管理
  - ⚠️ **硬编码**: 病例和问卷数据直接写在此文件
- **index.html** - React CDN版本（需网络）
- **experiment.html** - 离线版本（无CDN依赖）
- **styles.css** - 所有样式（中文UI支持）

### 后端（backend/）
- **server.js** - Express主服务器
- **models/** - Mongoose数据模型
  - Participant.js
  - Trial.js
- **routes/** - API路由
  - sessions.js (会话管理)
  - trials.js (试次数据)
  - admin.js (管理员API)
- **middleware/auth.js** - JWT认证
- **.env** - 环境配置（git ignore）
- **README.md** - 后端详细文档

### 关键文件位置（快速查找）
| 需求 | 文件 | 位置 |
|-----|------|-----|
| 修改病例内容 | App.js | `vignettes` 数组 |
| 修改问卷题目 | App.js | `questionnaire` 对象 |
| 修改条件逻辑 | App.js | `getConditionText()` 函数 |
| 添加API端点 | routes/*.js | backend/routes/ |
| 重新设计数据模型 | models/*.js | backend/models/ |
| 配置环境变量 | .env | backend/.env |

---

## API 认证

### Bearer Token 认证（用户API）
```
Authorization: Bearer {sessionToken}
```
- 用于所有需要参与者认证的端点
- Token有效期：30天

**获取Token流程**:
```bash
# 1. 创建会话
POST /api/sessions/create
{ "condition": "A" }
# 返回: { participantId, participantCode, sessionToken }

# 2. 使用Token访问受保护端点
GET /api/sessions/status
Authorization: Bearer {sessionToken}
```

### Admin Key 认证（管理员API）
```
X-Admin-Key: {adminKey}
```
- 用于管理员导出和数据分析端点
- 配置在 backend/.env 的 ADMIN_KEY

**使用**:
```bash
GET /api/admin/export-trials
X-Admin-Key: your_admin_key_here
```

---

## 环境配置

### backend/.env（所有必需变量）
```env
# 数据库
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/clinical-experiment

# 服务器
PORT=5000
NODE_ENV=development

# 认证
JWT_SECRET=your_jwt_secret_key_here_change_in_production
ADMIN_KEY=your_admin_key_here

# 跨域
CORS_ORIGIN=http://localhost:3000
# 或 * （用于测试，不要用于生产）
```

### 获取 MONGODB_URI
1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建集群和用户
3. 获取连接字符串：`Connect` → `Drivers` → `Node.js`

---

## 常见任务

### 任务1: 添加新的病例
1. 打开 `experiment-platform/App.js`
2. 找到 `vignettes` 数组
3. 按照现有病例格式添加新对象（需要5个字段：病例描述、问题、选项、正确答案、CoT文本）

### 任务2: 修改问卷题目
1. 打开 `experiment-platform/App.js`
2. 找到 `questionnaire` 对象
3. 修改 `q1-q5` 的题目或选项

### 任务3: 上传新API端点
1. 创建新路由文件或编辑现有 `routes/trials.js`
2. 使用 `requireAuth` 中间件进行认证
3. 添加错误处理和日志

### 任务4: 调试数据导出
```bash
# 检查是否有数据
curl http://localhost:5000/api/admin/summary \
  -H "X-Admin-Key: adminsecret123"

# 导出CSV
curl http://localhost:5000/api/admin/export-trials \
  -H "X-Admin-Key: adminsecret123" > trials.csv
```

### 任务5: 测试完整实验流程
```bash
# 1. 创建会话
SESSION=$(curl -s -X POST http://localhost:5000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"condition":"A"}' | jq -r '.sessionToken')

# 2. 更新人口统计
curl -X POST http://localhost:5000/api/sessions/update-demographics \
  -H "Authorization: Bearer $SESSION" \
  -H "Content-Type: application/json" \
  -d '{"demographics":{"age":35,"gender":"F"}}'

# 3. 上传试次数据
curl -X POST http://localhost:5000/api/trials/upload \
  -H "Authorization: Bearer $SESSION" \
  -H "Content-Type: application/json" \
  -d '{"trialData":{"trialId":"t1","vignetteId":"v1",...}}'

# 4. 查看统计
curl http://localhost:5000/api/admin/summary \
  -H "X-Admin-Key: adminsecret123"
```

---

## 已知限制和陷阱

### ⚠️ 前端限制
- ❌ **无自动化测试** - 仅支持手动测试
- ⚠️ **病例和问卷硬编码** - 在 App.js 中无法动态修改
- ⚠️ **无离线缓存** - 网络离线时无法恢复数据（除非手动下载JSON）
- ⚠️ **单参与者模式** - 无法同时模拟多个参与者

### ⚠️ 后端限制
- ⚠️ **MongoDB连接问题** - 需要IP白名单配置（Atlas）
- ⚠️ **CORS错误** - 需确保 CORS_ORIGIN 与前端URL匹配

### 💡 性能优化空间
- 缺少 `trial` 数据的索引查询优化
- 缺少前端的局部缓存（IndexedDB）
- 缺少速率限制中间件
- 缺少请求日志和监控

### 🔒 安全考虑
- JWT_SECRET 和 ADMIN_KEY 必须强加密
- 生产环境必须使用 HTTPS
- 需要添加速率限制保护 API
- 参与者数据应加密存储

---

## 依赖和版本

### 前端
- React 18 (CDN)
- Babel (用于JSX编译)

### 后端
- Node.js 14+
- Express 4.18
- Mongoose 7.0
- MongoDB 4.0+
- JWT token有效期：30天

### 浏览器支持
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 文档链接

详细参考文档：
- [AGENTS.md](./AGENTS.md) - 项目总览及启动指南
- [backend/README.md](./backend/README.md) - 后端API完整文档
- [experiment-platform/experiment.html](./experiment-platform/experiment.html) - 前端代码

---

## 推荐的 Copilot 工作流

### 🔍 探索代码时
- 使用 `@web` 查询相关文档
- 使用 `#file` 快速参考文件位置
- 使用具体的文件名和函数名进行搜索

### ✏️ 编辑时
- 对 App.js 修改时，指定是修改病例还是问卷
- 对后端修改时，指定是添加API还是修改现有逻辑
- 测试API时，使用提供的curl命令

### 🐛 调试时
- 检查 .env 配置是否正确
- 验证 MongoDB 连接字符串
- 检查前后端 CORS_ORIGIN 是否相符
- 查看 server.js 的日志输出

### 📊 数据相关
- 参与者ID以 `P` 开头（自动生成）
- 每个参与者代码唯一（可用于恢复会话）
- 所有时间戳使用 UTC ISO 格式
- 所有JSON数据导出到 `downloads/`

---

## 更新日期
- 2024年4月2日：初始版本
- 项目阶段：后端搭建完成，前端集成进行中，待部署和测试

## 联系和反馈
如有问题或建议，请更新此文件或联系项目负责人。
