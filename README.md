# Shorebird Console

基于 Vue 3、Vite 与 Element Plus 的 Shorebird 私有热更新管理控制台。

与 [Shorebird Private Server](https://github.com/subuhui/wa.o_patch_server) 后端服务无缝协作，为 Flutter 热更新提供应用管理、底包发布追溯、补丁状态流转、渠道管理及网络诊断等一站式可视化运维能力。

---

## 核心特性

- 🔐 **登录与鉴权**：支持私有 Token 鉴权机制、本地安全持久化、无缝全局路由守卫及开发环境快捷填入。
- 📱 **多应用生命周期管理 (Apps)**：实时拉取登记应用，直观展示各平台支持情况、最新底包版本与补丁号；支持在线新建应用、修改显示名称及危险警告二次确认删除。
- 📦 **底包版本发布 (Releases)**：展示多版本发布历史、Android/iOS 平台激活状态、Flutter SDK 版本及引擎 Revision 哈希；支持底包产物抽屉详情预览与产物直链下载。
- 🚀 **热更新补丁流转 (Patches)**：清晰呈现补丁编号、关联渠道、生效状态与产物包体积；支持补丁渠道快速发布、切换与回滚。
- 🏷️ **多渠道管理 (Channels)**：全面纳管内置渠道（`stable`、`beta`、`staging`）与自定义灰度渠道，支持自定义渠道的动态创建与注销。
- ⚡ **系统测速与网络诊断 (Diagnostics)**：内置服务端下行与上行吞吐量诊断工具，直观评估客户端与开发机到私有服务器的网络传输速率及延迟。
- 🎨 **现代化交互体验**：响应式布局、侧边栏折叠收起、深色模式 (Dark Mode) / 亮色模式一键切换、Sentry 异常监控预置。

---

## 技术架构

- **核心框架**：Vue 3.5 (Composition API, `<script setup>`) + TypeScript 5
- **构建工具**：Vite 6
- **UI 体系**：Element Plus + @element-plus/icons-vue
- **状态管理与异步缓存**：Pinia + TanStack Vue Query (@tanstack/vue-query)
- **网络通信**：Axios + 统一错误处理与拦截器
- **端到端测试**：Playwright + Vitest
- **工程化规范**：ESLint 9 + Prettier + Husky + Commitlint

---

## 快速开始

### 运行环境

- Node.js 20+
- pnpm 9+

### 安装依赖

```sh
pnpm install
```

### 环境变量配置

在项目根目录下配置 `.env.development` 或 `.env.production`：

```env
# 控制台网页标题
VITE_APP_TITLE=Shorebird Console

# API 基础路径
VITE_API_BASE_URL=/api/v1

# 后端代理目标地址 (默认指向本地 Go 服务)
VITE_API_PROXY_TARGET=http://127.0.0.1:8080

# 错误监控 DSN (可选)
VITE_SENTRY_DSN=
```

### 启动开发服务器

```sh
pnpm dev
```

默认运行于 `http://localhost:5173`，所有 `/api` 请求将自动代理转发至 `VITE_API_PROXY_TARGET`。

### 生产打包与预览

```sh
# 类型检查并编译打包
pnpm build

# 预览生产构建产物
pnpm preview
```

---

## 测试与质量保障

```sh
# 运行单元测试
pnpm test:unit

# 运行全链路端到端自动化测试 (Playwright)
pnpm test:e2e

# 代码格式化与代码风格检查
pnpm lint
pnpm format
```

---

## 开源协议

本项目采用 [MIT License](LICENSE)，版权所有 © 2026 subuhui。
