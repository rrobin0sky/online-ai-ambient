import React from 'react';
import {
  Download,
  Github,
  Zap,
  Layers,
  Sparkles,
  Command,
  ShieldCheck,
  Tablet,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface ShowcaseSectionProps {
  onBackToPlayer: () => void;
}

export const ShowcaseSection: React.FC<ShowcaseSectionProps> = ({ onBackToPlayer }) => {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 pb-24 pt-20 px-4 sm:px-6 lg:px-8 selection:bg-indigo-500/30">
      {/* Background radial glowing ambient lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Back pill button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={onBackToPlayer}
            className="glass-pill px-4 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>← 返回 4K 沉浸全屏播放器</span>
          </button>
        </div>

        {/* HERO SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          {/* App Icon badge */}
          <div className="inline-block relative mb-7 group">
            <div className="absolute -inset-2 rounded-[32px] bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/30 blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] bg-black/40 p-1.5 shadow-2xl glow-indigo mx-auto backdrop-blur-xl border border-white/20 flex items-center justify-center">
              <BrandLogo size={112} className="drop-shadow-2xl group-hover:scale-[1.03] transition-transform duration-300" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            让每一块屏幕，<br />
            都成为极简艺术的<span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">治愈视窗</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 font-light mb-10 leading-relaxed">
            专为 macOS 与 iPadOS 精雕细琢的原生 4K 氛围工作台。<br className="hidden sm:inline" />
            纯 Swift 原生打造，超低能耗与极简设计，一键化身桌面艺术动态屏保。
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <a
              href="/Ambient4K_Universal_macOS13.zip"
              download="Ambient4K_Universal_macOS13.zip"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold flex items-center justify-center gap-3 shadow-xl glow-indigo hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-base"
            >
              <Download className="w-5 h-5" />
              <span>免费下载 macOS 版 (Universal)</span>
            </a>

            <a
              href="https://github.com/rrobin0sky/online-ai-ambient"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl glass-panel hover:bg-white/10 text-slate-200 font-medium flex items-center justify-center gap-2.5 transition-all cursor-pointer text-base border border-white/15"
            >
              <Github className="w-5 h-5" />
              <span>GitHub 源码仓库</span>
            </a>
          </div>

          {/* Compatibility tags */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              macOS 13.0 Ventura 或更高版本
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              通用架构 (Apple Silicon M1-M4 & Intel)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              压缩包仅 ~3.1MB · 免安装解压即用
            </span>
          </div>
        </div>

        {/* BENTO GRID FEATURES */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              原生特质，为极致专注而生
            </h2>
            <p className="text-slate-400 text-sm">
              告别臃肿的 Web 封装，体验真正属于 Mac 的丝滑与宁静。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">纯原生架构 · 零功耗负担</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                采用 100% 纯 Swift 与 SwiftUI 编写，内存占用极低（通常仅几十 MB），运行时 CPU 占用趋近于 0%，全天候开机常驻毫无发热压力。
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">一键设为系统桌面壁纸</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                在 App 浏览时遇到心仪的 4K 画面，只需敲击键盘快捷键 <code className="text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded text-xs">W</code>，即可瞬间无缝应用为 macOS 全局系统壁纸。
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:border-pink-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-6 text-pink-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">多源 4K UHD 臻选图库</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                直连 Bing 每日壁纸、Unsplash 顶级摄影师作品库与 Wallhaven 4K 视觉库。智能缓存去重，每次轮播都是未知的视觉惊艳。
              </p>
            </div>

            {/* Card 4 - Wide */}
            <div className="glass-panel p-8 rounded-3xl md:col-span-2 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Tablet className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-300">
                  支持 Swift Playgrounds 跨端运行
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">多端生态与本地局域网协同</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                不仅为 Mac 显示器量身定制，还特别支持 iPad / iPadOS 平台（通过 Swift Playgrounds 源码包一键打开）。支持本地局域网设备感知与 iCloud 键值同步，让工作台与平板屏幕同频共振。
              </p>
            </div>

            {/* Card 5 */}
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">纯粹隐私，无任何追踪</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                无任何广告、无数据上传、无用户埋点追踪。纯净代码完全开源，所有壁纸数据直连权威开放 API。
              </p>
            </div>
          </div>
        </div>

        {/* KEYBOARD SHORTCUTS GUIDE */}
        <div className="glass-panel p-8 sm:p-12 rounded-3xl mb-24 border border-white/10">
          <div className="max-w-2xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
              <Command className="w-3.5 h-3.5" />
              <span>快捷键盘操作</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">指尖上的极简流动</h2>
            <p className="text-slate-400 text-sm">
              无需繁复菜单，通过直觉按键即可完全掌控你的氛围桌面。
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
              <kbd className="self-start px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-mono font-bold text-white shadow">
                Space
              </kbd>
              <span className="text-xs text-slate-300 font-medium">暂停 / 继续轮播</span>
              <span className="text-[11px] text-slate-500">固定当前心仪画面</span>
            </div>

            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
              <kbd className="self-start px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-mono font-bold text-white shadow">
                ← / →
              </kbd>
              <span className="text-xs text-slate-300 font-medium">上一张 / 下一张</span>
              <span className="text-[11px] text-slate-500">立即切换新 4K 视觉</span>
            </div>

            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
              <kbd className="self-start px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-xs font-mono font-bold text-indigo-200 shadow">
                W
              </kbd>
              <span className="text-xs text-indigo-200 font-medium">设为系统壁纸</span>
              <span className="text-[11px] text-slate-500">一键同步至 macOS 桌面</span>
            </div>

            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
              <kbd className="self-start px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-mono font-bold text-white shadow">
                F
              </kbd>
              <span className="text-xs text-slate-300 font-medium">全屏沉浸模式</span>
              <span className="text-[11px] text-slate-500">隐藏所有窗口与状态栏</span>
            </div>
          </div>
        </div>

        {/* INSTALLATION & SAFETY NOTE */}
        <div className="glass-panel p-8 rounded-3xl mb-24 border border-white/10 bg-indigo-950/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                首次在 Mac 上打开的安全提示指南
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                由于本应用为个人开源发布、未缴纳 Apple 商业公证费，macOS Gatekeeper 可能会在首次打开时提示「无法验证开发者」或「已损坏」。这是正常保护机制，无需担忧：
              </p>
              <div className="text-xs text-slate-400 space-y-1 bg-black/40 p-3 rounded-xl border border-white/5">
                <p>1. 解压下载的 <code className="text-indigo-300">Ambient4K_Universal_macOS13.zip</code> 获得 <code className="text-indigo-300">Ambient4K.app</code> 并拖入「应用程序」目录。</p>
                <p>2. 在访达中<strong>按住 Control 键并右键点击 App</strong>，选择「打开」，并在弹出的对话框中点击「打开」即可永久正常使用。</p>
                <p>3. 或在终端执行一行命令移除安全隔离属性：<code className="text-amber-200 select-all font-mono">xattr -cr /Applications/Ambient4K.app</code></p>
              </div>
            </div>
          </div>
        </div>

        {/* ECOSYSTEM LINKS */}
        <div className="text-center pt-8 border-t border-white/10">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-6">
            BIN0SKY.TECH PRODUCT SUITE · 极简创造力矩阵
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
            <a
              href="https://ppt.bin0sky.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl glass-panel hover:bg-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>AiPPT · 智能演示生成</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>

            <a
              href="https://icon.bin0sky.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl glass-panel hover:bg-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>OnlineAiTools · 矢量图标工作室</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>

            <span className="px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center gap-1.5">
              <span>Ambient4K · 沉浸氛围空间</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
