# 临床决策实验平台部署与运行说明

## 一、项目概览

本项目是一个临床决策研究实验平台，采用前后端分离部署方式：

- **前端**：React 单页应用，部署在 Vercel
- **后端**：Node.js + Express API，部署在 Render
- **数据库**：MongoDB Atlas 云数据库

本说明文档对整个系统的部署流程、运行方式、接口调用以及维护操作进行全面梳理。

---

## 二、部署架构

```
用户浏览器
    ↓
前端 (Vercel)
https://clinical-experiment-xxbbkk.vercel.app/
    ↓ API 调用
后端 (Render)
https://clinical-experiment-backend.onrender.com
    ↓ 数据读写
数据库 (MongoDB Atlas)
clinical-experiment
```

### 组件说明

- `experiment-platform/`：前端源代码目录
- `backend/`：后端源代码目录
- `backend/models/`：MongoDB 数据模型
- `backend/routes/`：后端 API 路由
- `backend/middleware/auth.js`：JWT 认证中间件
- `AGENTS.md`：项目总览说明
- `.github/copilot-instructions.md`：AI 工作区指令
- `QUICK_REFERENCE.md`：快速使用参考

---

## 三、前端部署

### 1. 代码位置

前端代码位于 `experiment-platform/`：

- `index.html`：主入口页面
- `App.js`：实验逻辑与UI实现
- `styles.css`：样式文件

### 2. 后端地址配置

前端通过 `App.js` 中的 `API_URL` 连接后端：

```javascript
const API_URL = 'https://clinical-experiment-backend.onrender.com';
```

该地址为当前后端部署地址。

### 3. Vercel 部署步骤

1. 登录 https://vercel.com
2. 点击 `Add New...` → `Project`
3. 选择对应 GitHub 仓库
4. 设定项目根目录为 `experiment-platform`
5. 部署完成后获取前端地址

### 4. 已部署前端地址

```
https://clinical-experiment-xxbbkk.vercel.app/
```

---

## 四、后端部署

### 1. 代码位置

后端源码位于 `backend/`：

- `server.js`：Express 服务器入口
- `package.json`：依赖与启动脚本
- `models/`：Participant、Trial 等数据模型
- `routes/`：sessions、trials、admin 路由
- `middleware/auth.js`：Bearer Token 认证逻辑

### 2. 本地启动命令

```bash
cd backend
npm install
npm run dev
```

服务器默认监听端口 `5000`，可访问：

```
http://localhost:5000/api/health
```

### 3. Render 部署配置

1. 登录 https://render.com
2. 创建 Web Service
3. 选择 GitHub 仓库并连接
4. 设定 Root Directory 为 `backend`
5. Build Command：`npm install`
6. Start Command：`node server.js`

### 4. 已部署后端地址

```
https://clinical-experiment-backend.onrender.com
```

---

## 五、数据库配置

### 1. MongoDB Atlas

数据库托管在 MongoDB Atlas，数据库名为 `clinical-experiment`。

### 2. .env 配置示例

后端部署应使用如下环境变量：

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/clinical-experiment?retryWrites=true&w=majority
NODE_ENV=production
PORT=5000
JWT_SECRET=<your_jwt_secret>
CORS_ORIGIN=https://clinical-experiment-xxbbkk.vercel.app
ADMIN_KEY=<your_admin_key>
```

> 注意：请不要把真实密码和密钥写入代码仓库。Render 平台应使用 Secrets 配置。

### 3. IP 与访问

- Atlas 建议将 `0.0.0.0/0` 加入白名单用于开发测试
- 生产环境可限定来源 IP 或使用 VPC 连接

---

## 六、系统运行流程

### 1. 用户访问前端

用户访问 `https://clinical-experiment-xxbbkk.vercel.app/`，进入实验页面。

### 2. 前端展示实验流程

前端呈现：

- 欢迎页
- 知情同意
- 人口统计问卷
- 练习试例
- 主实验（3个病例）
- 结束问卷

### 3. 数据写入后端

在实验过程中，前端会调用后端 API 保存实验数据，例如：

- `/api/experiment/save`
- `/api/sessions/create`
- `/api/sessions/resume`
- `/api/sessions/update-demographics`
- `/api/sessions/submit-questionnaire`
- `/api/trials/upload`

### 4. 后端处理数据

后端接收请求后：

- 验证 JWT Token 或管理员 Key
- 将参与者会话与试次数据保存到 MongoDB
- 返回保存结果

### 5. 数据存储

MongoDB 存储两类核心数据：

- 参与者信息 `participants`
- 试次数据 `trials`

---

## 七、主要 API 端点

### 7.1 健康检查

```
GET /api/health
```

### 7.2 会话管理

```
POST /api/sessions/create
POST /api/sessions/resume
POST /api/sessions/update-demographics
POST /api/sessions/submit-questionnaire
GET /api/sessions/status
```

### 7.3 试次数据

```
POST /api/trials/upload
POST /api/trials/batch-upload
GET /api/trials/participant/:participantId
GET /api/trials/stats/:participantId
```

### 7.4 管理员接口

```
GET /api/admin/participants
GET /api/admin/summary
GET /api/admin/export-trials
GET /api/admin/export-participants
DELETE /api/admin/participant/:participantId
```

---

## 八、前端与后端对接核心点

### 8.1 前端 API 地址

`experiment-platform/App.js` 中的关键配置：

```javascript
const API_URL = 'https://clinical-experiment-backend.onrender.com';
```

这是前端调用后端 API 的统一入口地址。

### 8.2 数据保存示例

当试次完成后，前端会执行：

```javascript
saveDataToBackend({
  participant_id: participantId,
  vignette_id: currentTrialData.vignette.id,
  condition: trials[currentTrialIndex].condition,
  baseline_decision: currentTrialData.baselineDecision,
  final_decision: decision,
  adoption_level: adoption,
  trust_score: trust,
  baseline_reaction_time: currentTrialData.baselineTime,
  final_reaction_time: finalTime
});
```

### 8.3 常见调试点

- 确认 `API_URL` 是否正确
- 确认后端是否可访问
- 检查浏览器控制台是否有 CORS 或 token 错误

---

## 九、测试与验证

### 9.1 后端健康检查

```bash
curl https://clinical-experiment-backend.onrender.com/api/health
```

### 9.2 创建新会话

```bash
curl -X POST https://clinical-experiment-backend.onrender.com/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"condition":"A"}'
```

### 9.3 保存试次数据

```bash
curl -X POST "https://clinical-experiment-backend.onrender.com/api/experiment/save" \
  -H "Content-Type: application/json" \
  -d '{"participant_id":"test001","vignette_id":"v1","condition":"A","baseline_decision":"A","final_decision":"B","adoption_level":75,"trust_score":8,"baseline_reaction_time":1000,"final_reaction_time":2000}'
```

### 9.4 管理端统计

```bash
curl https://clinical-experiment-backend.onrender.com/api/admin/summary \
  -H "X-Admin-Key: <your_admin_key>"
```

---

## 十、维护与更新

### 10.1 修改前端

- 编辑：`experiment-platform/App.js`
- 推送到 GitHub
- Vercel 会自动部署更新

### 10.2 修改后端

- 编辑：`backend/` 下的路由、模型、`server.js`
- 推送到 GitHub
- Render 会自动部署更新

### 10.3 修改数据库配置

- 在 MongoDB Atlas 或 Render Secret 中更新环境变量
- 避免将 `.env` 中的真实密钥提交到版本库

---

## 十一、扩展说明

### 11.1 新病例添加位置

病例数据存放在 `experiment-platform/App.js` 的 `vignettes` 数组中。

### 11.2 新API添加位置

后端路由文件位于：

- `backend/routes/sessions.js`
- `backend/routes/trials.js`
- `backend/routes/admin.js`

### 11.3 数据模型位置

- `backend/models/Participant.js`
- `backend/models/Trial.js`

---

## 十二、常见问题

### Q1. 前端提示跨域错误

确认 `backend/.env` 中 `CORS_ORIGIN` 已设置为：

```text
https://clinical-experiment-xxbbkk.vercel.app
```

### Q2. 后端无法连接数据库

- 检查 `MONGODB_URI`
- 检查 MongoDB Atlas 白名单设置
- 检查 Render 环境变量是否生效

### Q3. 数据未写入 MongoDB

- 确认后端日志是否报错
- 检查 API 请求是否返回 200 / 201
- 检查 MongoDB 集合 `participants`、`trials` 是否存在

---

## 十三、当前部署地址一览

| 服务 | 地址 |
| ---- | ---- |
| 前端 | https://clinical-experiment-xxbbkk.vercel.app/ |
| 后端 | https://clinical-experiment-backend.onrender.com |
| 后端 API 基础地址 | https://clinical-experiment-backend.onrender.com/api/ |

---

## 十四、结论

当前项目已经完成从代码到线上运行的全流程部署：

- 前端页面已部署并对外可用
- 后端 API 已部署并正常响应
- 数据库已在 MongoDB Atlas 中运行
- 前端与后端已成功对接并完成数据保存

如需进一步优化，可继续增加：

- 离线缓存能力
- 会话恢复 UI
- 管理端数据导出与分析页面
- 更完善的安全策略
