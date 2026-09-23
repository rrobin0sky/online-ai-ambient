import React from 'react';
import { Sparkles, Download, Github, Monitor, Compass } from 'lucide-react';

interface HeaderNavProps {
  activeTab: 'player' | 'showcase';
  onTabChange: (tab: 'player' | 'showcase') => void;
  onDownloadClick: () => void;
  uiVisible: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  onTabChange,
  onDownloadClick,
  uiVisible,
}) => {
  return (
    <header
      className={`fixed top-4 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-500 pointer-events-none ${
        uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="glass-panel px-3 py-2 rounded-full flex items-center gap-1 sm:gap-2 shadow-2xl pointer-events-auto border border-white/10">
        {/* Brand */}
        <button
          onClick={() => onTabChange('player')}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors group cursor-pointer text-left"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1.5px] shadow-lg group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-black/90 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Ambient<span className="text-indigo-400 font-extrabold text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">4K</span>
            </span>
          </div>
        </button>

        <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />

        {/* Tab switch */}
        <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/5">
          <button
            onClick={() => onTabChange('player')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'player'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>沉浸播放</span>
          </button>

          <button
            onClick={() => onTabChange('showcase')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'showcase'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>探索原生客户端</span>
          </button>
        </div>

        {/* Quick CTA */}
        <button
          onClick={onDownloadClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-slate-200 transition-all shadow-md hover:scale-[1.02] cursor-pointer ml-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">下载 macOS 版</span>
          <span className="md:hidden">下载</span>
        </button>

        {/* GitHub link */}
        <a
          href="https://github.com/robin-bin0sky/Ambient4K"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="GitHub 源码仓库"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};
