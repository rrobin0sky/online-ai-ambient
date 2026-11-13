import React, { useRef, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { WallpaperItem } from '../types';

interface FilmstripScrubberProps {
  items: WallpaperItem[];
  currentIndex: number;
  favoriteIds: Set<string>;
  onSelectIndex: (index: number) => void;
  visible: boolean;
}

export const FilmstripScrubber: React.FC<FilmstripScrubberProps> = ({
  items,
  currentIndex,
  favoriteIds,
  onSelectIndex,
  visible,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragInitialIndexRef = useRef(0);

  // Auto-center active thumbnail when currentIndex changes
  useEffect(() => {
    if (!visible || isDragging) return;
    const activeEl = itemRefs.current[currentIndex];
    const container = scrollContainerRef.current;
    if (activeEl && container) {
      const targetLeft =
        activeEl.offsetLeft - container.clientWidth / 2 + activeEl.clientWidth / 2;
      container.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  }, [currentIndex, visible, isDragging, items.length]);

  if (items.length <= 1) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragInitialIndexRef.current = currentIndex;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartXRef.current;
    if (Math.abs(deltaX) < 18) return;
    const steps = Math.round(-deltaX / 64);
    const nextIdx = Math.max(0, Math.min(items.length - 1, dragInitialIndexRef.current + steps));
    if (nextIdx !== currentIndex) {
      onSelectIndex(nextIdx);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`w-full max-w-3xl mx-auto px-4 transition-all duration-500 pointer-events-auto ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div
        ref={scrollContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="glass-panel px-3 py-2 rounded-full border border-white/15 shadow-2xl flex items-center gap-2 overflow-x-auto no-scrollbar select-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map((item, idx) => {
          const isCurrent = idx === currentIndex;
          const isFav = favoriteIds.has(item.id);
          return (
            <button
              key={`${item.id}_${idx}`}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              onClick={() => onSelectIndex(idx)}
              className={`relative shrink-0 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
                isCurrent
                  ? 'w-20 h-12 ring-2 ring-white scale-105 opacity-100 shadow-lg'
                  : 'w-16 h-10 opacity-60 hover:opacity-95 hover:scale-[1.03] border border-white/15'
              }`}
              title={item.title}
            >
              <img
                src={item.previewUrl || item.url}
                alt={item.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover pointer-events-none"
              />
              {isFav && (
                <span className="absolute top-1 right-1 p-0.5 rounded-full bg-black/65 text-rose-500">
                  <Heart className="w-2.5 h-2.5 fill-rose-500" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
