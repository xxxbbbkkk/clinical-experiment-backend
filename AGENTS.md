# AGENTS.md - Clinical Decision Research Experiment Platform

## 启动
- **前端**: 浏览器打开 `experiment-platform/index.html`
- **离线前端**: `experiment-platform/experiment.html` (无CDN依赖，可断网使用)
- **后端**: `cd backend && npm run dev` (需先配置 `.env`)

## 项目结构
- `experiment-platform/` - 前端 (React via CDN)
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

## 问卷/病例数据位置
- 问卷: `App.js` 中 `questionnaire` 对象
- 临床病例: `App.js` 中 `vignettes` 数组