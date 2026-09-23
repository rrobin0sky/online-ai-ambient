import React, { useState, useEffect } from 'react';
import { WallpaperItem } from '../types';
import { MapPin } from 'lucide-react';

interface ClockWidgetProps {
  currentWallpaper: WallpaperItem;
  visible: boolean;
}

export const ClockWidget: React.FC<ClockWidgetProps> = ({ currentWallpaper, visible }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);

      const options: Intl.DateTimeFormatOptions = {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      };
      setDateStr(now.toLocaleDateString('zh-CN', options));

      const h = now.getHours();
      if (h >= 5 && h < 12) setGreeting('清晨好 · 愿今日灵感常驻');
      else if (h >= 12 && h < 18) setGreeting('午后好 · 专注于每一个细节');
      else if (h >= 18 && h < 22) setGreeting('夜幕降临 · 享受惬意宁静');
      else setGreeting('夜深了 · 沉浸于星空与心绪');
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`absolute inset-0 flex flex-col justify-between p-8 sm:p-14 pointer-events-none select-none transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {/* Top greeting badge */}
      <div className="pt-16 sm:pt-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-xs font-light text-slate-300 shadow-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{greeting}</span>
        </div>
      </div>

      {/* Center Clock display */}
      <div className="my-auto flex flex-col items-center justify-center text-center">
        <div className="text-7xl sm:text-9xl md:text-[11rem] font-light tracking-tighter text-white/95 drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)] font-sans">
          {timeStr || '12:00'}
        </div>
        <div className="text-base sm:text-xl font-normal text-white/80 tracking-widest mt-1 sm:mt-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          {dateStr}
        </div>
      </div>

      {/* Bottom Wallpaper Location Info */}
      <div className="pb-24 sm:pb-20 flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium drop-shadow-md">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentWallpaper.location || currentWallpaper.title}</span>
          </div>
          <p className="text-xs text-slate-400 drop-shadow">
            {currentWallpaper.title} · <span className="text-slate-300">{currentWallpaper.source} 4K UHD</span>
          </p>
        </div>
      </div>
    </div>
  );
};
