# Ambient4K Web · 沉浸式 4K 氛围工作台 & macOS 原生应用官网

> 专为 Mac 与 iPad 打造的沉浸式极简 4K 视觉画廊与环境白噪音空间。
> 线上体验：[ambient.bin0sky.tech](https://ambient.bin0sky.tech)

---

## 🌟 双模合一架构设计

1. **沉浸全屏播放器 (Player Mode)**：
   - 4K 臻选壁纸平滑渐变呼吸轮播（直连 Unsplash / Bing 4K 高画质源）
   - 原生 Web Audio 实时合成自然白噪音（细雨、深海波涛、壁炉篝火、林间微风，0 音频文件依赖）
   - 极简毛玻璃时钟、日期与灵感问候语挂件
   - 快捷键深度掌控：`Space`（暂停/播放）、`← / →`（切换画面）、`F`（全屏）
   - 鼠标静止 3.5 秒自动淡出所有控件，纯粹无干扰沉浸体验

2. **客户端展台与下载中心 (Showcase & Download Hub)**：
   - Apple 风格高质感 Bento Grid 产品特性矩阵
   - **macOS Universal 通用版** 一键极速直链下载（~3.1MB，兼容 Apple Silicon M1-M4 & Intel）
   - 快捷键操作与首次打开安全权限指南

---

## 🛠 本地开发与构建

```bash
# 1. 安装依赖
npm install

# 2. 启动本地开发服务
npm run dev

# 3. 生产环境构建打包
npm run build
```

构建产物将输出至 `dist/` 目录。

---

## 🚀 部署至 Cloudflare Pages

本项目完全静态化，完美契合 Cloudflare Pages：

1. **GitHub 仓库连接**：
   - 将本项目代码推送到 GitHub 仓库。
   - 在 Cloudflare 控制台中进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
2. **构建设置**：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. **绑定自定义域名**：
   - 在 Pages 项目设置中添加自定义域名：`ambient.bin0sky.tech`
   - Cloudflare 会自动配置全球 CDN 与 SSL 证书。
