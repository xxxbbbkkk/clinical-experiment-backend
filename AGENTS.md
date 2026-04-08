# AGENTS.md - 临床决策研究实验平台

## 启动
- **前端**: 浏览器打开 `experiment-platform/index.html`
- **离线前端**: `experiment-platform/experiment.html` (无CDN依赖，可断网使用)
- **后端**: `cd backend && npm run dev` (需先配置 `.env`)

## 项目结构
- `experiment-platform/` - 前端 (React via CDN)
  - `index.html` - 联机版
  - `experiment.html` - 离线版 (内联React，无CDN)
  - `App.js` - 主应用逻辑
- `backend/` - Express + MongoDB API

## 关键约束
- 界面中文
- 2×2 因子设计: CoT(有/无) × 建议正确性(正确/不安全)
- 4条件: A(correct+无CoT), B(correct+有CoT), C(unsafe+无CoT), D(unsafe+有CoT)
- **无自动化测试** - 手动测试

## 环境配置 (.env)
```
MONGODB_URI, JWT_SECRET, PORT, CORS_ORIGIN, ADMIN_KEY
```
从 `.env.example` 复制创建

## API 认证
- 用户: `Authorization: Bearer {token}`
- 管理端: `X-Admin-Key` 请求头 (不是Bearer)

## 前端配置
- API地址在 `App.js:108` 硬编码为 `https://clinical-experiment-backend.onrender.com`
- 本地测试时需修改为 `http://localhost:5000`
- 问卷和病例数据均在 `App.js` 中定义