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
  lang?: 'zh' | 'en';
  isDark?: boolean;
}

export const ShowcaseSection: React.FC<ShowcaseSectionProps> = ({ 
  onBackToPlayer,
  lang = 'zh',
  isDark = true
}) => {
  const isZh = lang !== 'en';

  return (
    <div className={`relative min-h-screen pb-24 pt-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f5f5f7] text-[#1d1d1f]'
    }`}>
      {/* Background radial glowing ambient lights */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] blur-3xl pointer-events-none ${
        isDark ? 'bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent' : 'bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent'
      }`} />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Back pill button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={onBackToPlayer}
            className={`glass-pill px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-black'
            }`}
          >
            <span>{isZh ? '← 返回 4K 沉浸全屏播放器' : '← Back to 4K Ambient Player'}</span>
          </button>
        </div>

        {/* HERO SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          {/* App Icon badge */}
          <div className="inline-block relative mb-7 group">
            <div className="absolute -inset-2 rounded-[32px] bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/30 blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] p-1.5 shadow-2xl glow-indigo mx-auto backdrop-blur-xl border flex items-center justify-center ${
              isDark ? 'bg-black/40 border-white/20' : 'bg-white/80 border-black/10'
            }`}>
              <BrandLogo size={112} className="drop-shadow-2xl group-hover:scale-[1.03] transition-transform duration-300" />
            </div>
          </div>

          <h1 className={`text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight ${
            isDark ? 'text-white' : 'text-[#1d1d1f]'
          }`}>
            {isZh ? (
              <>
                让每一块屏幕，<br />
                都成为极简艺术的<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">治愈视窗</span>
              </>
            ) : (
              <>
                Turn Every Display into a <br />
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Minimalist Aesthetic Canvas</span>
              </>
            )}
          </h1>

          <p className={`text-base sm:text-lg font-light mb-10 leading-relaxed ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {isZh 
              ? '专为 macOS 与 iPadOS 精雕细琢的原生 4K 氛围工作台。纯 Swift 原生打造，超低能耗与极简设计，一键化身桌面艺术动态屏保。'
              : 'Crafted exclusively for macOS and iPadOS. 100% pure Swift, ultra-low resource footprint, and zero distraction. Ambient artwork & soundscapes at your fingertips.'
            }
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <a
              href="/Ambient4K_Universal_macOS13.zip"
              download="Ambient4K_Universal_macOS13.zip"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold flex items-center justify-center gap-3 shadow-xl glow-indigo hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-base"
            >
              <Download className="w-5 h-5" />
              <span>{isZh ? '免费下载 macOS 版 (Universal)' : 'Download for macOS (Universal)'}</span>
            </a>

            <a
              href="https://github.com/rrobin0sky/online-ai-ambient"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full sm:w-auto px-6 py-4 rounded-2xl glass-panel font-medium flex items-center justify-center gap-2.5 transition-all cursor-pointer text-base border ${
                isDark ? 'hover:bg-white/10 text-slate-200 border-white/15' : 'hover:bg-black/5 text-slate-800 border-black/10'
              }`}
            >
              <Github className="w-5 h-5" />
              <span>{isZh ? 'GitHub 源码仓库' : 'GitHub Source Code'}</span>
            </a>
          </div>

          {/* Compatibility tags */}
          <div className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {isZh ? 'macOS 13.0 Ventura 或更高版本' : 'macOS 13.0 Ventura or later'}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {isZh ? '通用架构 (Apple Silicon M1-M4 & Intel)' : 'Universal Binary (Apple Silicon & Intel)'}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {isZh ? '压缩包仅 ~3.1MB · 免安装解压即用' : 'Only ~3.1MB · Standalone App'}
            </span>
          </div>
        </div>

        {/* BENTO GRID FEATURES */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight mb-3 ${
              isDark ? 'text-white' : 'text-[#1d1d1f]'
            }`}>
              {isZh ? '原生特质，为极致专注而生' : 'Native Engineering for Pure Focus'}
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isZh ? '告别臃肿的 Web 封装，体验真正属于 Mac 的丝滑与宁静。' : 'Say goodbye to Electron bloat. Pure Apple performance and calm.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-500 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                {isZh ? '纯原生架构 · 零功耗负担' : 'Pure Swift · Zero Energy Drain'}
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isZh 
                  ? '采用 100% 纯 Swift 与 SwiftUI 编写，内存占用极低（通常仅几十 MB），运行时 CPU 占用趋近于 0%，全天候开机常驻毫无发热压力。'
                  : 'Engineered entirely in Swift and SwiftUI. Negligible memory footprint, near-zero CPU usage, staying cool on your Mac all day.'
                }
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                {isZh ? '一键设为系统桌面壁纸' : '1-Click Set as macOS Wallpaper'}
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isZh
                  ? '在 App 浏览时遇到心仪的 4K 画面，只需敲击键盘快捷键 W，即可瞬间无缝应用为 macOS 全局系统壁纸。'
                  : 'Press "W" on any curated visual to instantly set it as your global macOS desktop wallpaper.'
                }
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:border-pink-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-6 text-pink-500 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                {isZh ? '多源 4K UHD 臻选图库' : 'Multi-Source 4K UHD Streams'}
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isZh
                  ? '直连 Bing 每日壁纸、Unsplash 顶级摄影师作品库与 Wallhaven 4K 视觉库。智能缓存去重，每次轮播都是未知的视觉惊艳。'
                  : 'Direct streams from Unsplash curated photographers, Bing Daily, and Wallhaven 4K. Intelligent deduplication and smart preloading.'
                }
              </p>
            </div>

            {/* Card 4 - Wide */}
            <div className="glass-panel p-8 rounded-3xl md:col-span-2 relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
                  <Tablet className="w-6 h-6" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-black/5 border-black/10 text-slate-700'
                }`}>
                  {isZh ? '支持 Swift Playgrounds 跨端运行' : 'Swift Playgrounds Cross-Platform'}
                </span>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                {isZh ? '多端生态与本地局域网协同' : 'Cross-Device Ecosystem & iPad Sync'}
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isZh
                  ? '不仅为 Mac 显示器量身定制，还特别支持 iPad / iPadOS 平台。支持本地局域网设备感知与 iCloud 同步，让工作台与平板屏幕同频共振。'
                  : 'Designed for studio displays and portable iPads alike. Open directly via Swift Playgrounds on iPadOS with local network discovery and iCloud sync.'
                }
              </p>
            </div>

            {/* Card 5 */}
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-500 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                {isZh ? '纯粹隐私，无任何追踪' : '100% Private, Zero Tracking'}
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isZh
                  ? '无任何广告、无数据上传、无用户埋点追踪。纯净代码完全开源，所有壁纸数据直连权威开放 API。'
                  : 'No telemetry, no tracking analytics, no advertisements. Clean open-source code connecting directly to official open endpoints.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* KEYBOARD SHORTCUTS GUIDE */}
        <div className={`glass-panel p-8 sm:p-12 rounded-3xl mb-24 border ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className="max-w-2xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-300 text-xs font-semibold mb-3">
              <Command className="w-3.5 h-3.5" />
              <span>{isZh ? '快捷键盘操作' : 'Keyboard Shortcuts'}</span>
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
              {isZh ? '指尖上的极简流动' : 'Effortless Flow at Your Fingertips'}
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isZh ? '无需繁复菜单，通过直觉按键即可完全掌控你的氛围桌面。' : 'No bloated menus. Control your ambient workspace with intuitive single keys.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${
              isDark ? 'bg-black/40 border-white/5' : 'bg-black/5 border-black/5'
            }`}>
              <kbd className={`self-start px-3 py-1.5 rounded-lg border text-xs font-mono font-bold shadow ${
                isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-black/10 text-black'
              }`}>
                Space
              </kbd>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                {isZh ? '暂停 / 继续轮播' : 'Pause / Resume'}
              </span>
              <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {isZh ? '固定当前心仪画面' : 'Hold current wallpaper'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${
              isDark ? 'bg-black/40 border-white/5' : 'bg-black/5 border-black/5'
            }`}>
              <kbd className={`self-start px-3 py-1.5 rounded-lg border text-xs font-mono font-bold shadow ${
                isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-black/10 text-black'
              }`}>
                ← / →
              </kbd>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                {isZh ? '上一张 / 下一张' : 'Prev / Next'}
              </span>
              <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {isZh ? '立即切换新 4K 视觉' : 'Cycle next 4K stream'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${
              isDark ? 'bg-black/40 border-white/5' : 'bg-black/5 border-black/5'
            }`}>
              <kbd className="self-start px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-xs font-mono font-bold text-indigo-500 dark:text-indigo-200 shadow">
                W
              </kbd>
              <span className="text-xs text-indigo-500 dark:text-indigo-200 font-medium">
                {isZh ? '设为系统壁纸' : 'Set as Wallpaper'}
              </span>
              <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {isZh ? '一键同步至 macOS 桌面' : 'Sync to macOS desktop'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${
              isDark ? 'bg-black/40 border-white/5' : 'bg-black/5 border-black/5'
            }`}>
              <kbd className={`self-start px-3 py-1.5 rounded-lg border text-xs font-mono font-bold shadow ${
                isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-black/10 text-black'
              }`}>
                F
              </kbd>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                {isZh ? '全屏沉浸模式' : 'Fullscreen'}
              </span>
              <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {isZh ? '隐藏所有窗口与状态栏' : 'Distraction-free mode'}
              </span>
            </div>
          </div>
        </div>

        {/* INSTALLATION & SAFETY NOTE */}
        <div className={`glass-panel p-8 rounded-3xl mb-24 border ${
          isDark ? 'border-white/10 bg-indigo-950/20' : 'border-indigo-500/20 bg-indigo-50/50'
        }`}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-300 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-[#1d1d1f]'}`}>
                {isZh ? '首次在 Mac 上打开的安全提示指南' : 'macOS First-Launch Gatekeeper Guide'}
              </h3>
              <p className={`text-sm leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isZh
                  ? '由于本应用为个人开源发布，macOS Gatekeeper 可能会在首次打开时提示「无法验证开发者」或「已损坏」。这是正常保护机制：'
                  : 'Since this is a standalone open-source release, macOS Gatekeeper may show an unverified developer dialog. This is normal:'
                }
              </p>
              <div className={`text-xs space-y-1.5 p-3.5 rounded-xl border ${
                isDark ? 'text-slate-400 bg-black/40 border-white/5' : 'text-slate-600 bg-white border-black/5'
              }`}>
                <p>1. {isZh ? '解压获得' : 'Extract'} <code className="text-indigo-500 dark:text-indigo-300 font-semibold">Ambient4K.app</code> {isZh ? '并拖入「应用程序」目录。' : 'into your /Applications folder.'}</p>
                <p>2. {isZh ? '在访达中按住 Control 键并右键点击 App，选择「打开」即可永久正常使用。' : 'Hold Control and Right-Click the app in Finder, then select "Open".'}</p>
                <p>3. {isZh ? '或在终端执行一行命令移除安全隔离属性：' : 'Or run command in Terminal:'} <code className="text-amber-500 dark:text-amber-200 select-all font-mono font-bold">xattr -cr /Applications/Ambient4K.app</code></p>
              </div>
            </div>
          </div>
        </div>

        {/* ECOSYSTEM LINKS */}
        <div className={`text-center pt-8 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <p className={`text-xs uppercase tracking-widest font-semibold mb-6 ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            BIN0SKY.TECH PRODUCT SUITE · CREATIVE MATRIX
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
            <a
              href="https://ppt.bin0sky.tech"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded-xl glass-panel flex items-center gap-1.5 transition-colors ${
                isDark ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-black/5 text-slate-700 hover:text-black'
              }`}
            >
              <span>SlideCraft · {isZh ? '智能演示生成' : 'AI Deck Studio'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-50" />
            </a>

            <a
              href="https://icon.bin0sky.tech"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded-xl glass-panel flex items-center gap-1.5 transition-colors ${
                isDark ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-black/5 text-slate-700 hover:text-black'
              }`}
            >
              <span>ArchIcons · {isZh ? '云架构图标库' : 'Architecture Icons'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-50" />
            </a>

            <span className="px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-500 dark:text-indigo-300 flex items-center gap-1.5">
              <span>Ambient4K · {isZh ? '沉浸氛围空间' : '4K Ambient'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
