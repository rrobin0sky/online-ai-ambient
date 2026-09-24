import React, { useState, useEffect, useRef } from 'react';
import { WallpaperItem } from '../types';

export type ScaleMode = 'auto' | 'cover' | 'fit';

interface WallpaperStageProps {
  wallpaper: WallpaperItem;
  nextWallpaper?: WallpaperItem;
  scaleMode: ScaleMode;
  onImageReady: (id: string) => void;
  onImageError: (id: string) => void;
}

interface LayerState {
  item: WallpaperItem;
  srcToUse: string;
  isFullRes: boolean;
  naturalRatio: number;
}

export const WallpaperStage: React.FC<WallpaperStageProps> = ({
  wallpaper,
  nextWallpaper,
  scaleMode,
  onImageReady,
  onImageError,
}) => {
  const [activeLayer, setActiveLayer] = useState<LayerState>({
    item: wallpaper,
    srcToUse: wallpaper.previewUrl || wallpaper.url,
    isFullRes: false,
    naturalRatio: wallpaper.aspectRatio || 1.77,
  });

  const [previousLayer, setPreviousLayer] = useState<LayerState | null>(null);
  const [isLoadingFullRes, setIsLoadingFullRes] = useState<boolean>(false);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Preload next wallpaper in background so switching is instant
  useEffect(() => {
    if (!nextWallpaper) return;
    const preThumb = new Image();
    preThumb.referrerPolicy = 'no-referrer';
    preThumb.src = nextWallpaper.previewUrl || nextWallpaper.url;

    const preFull = new Image();
    preFull.referrerPolicy = 'no-referrer';
    preFull.src = nextWallpaper.url;
  }, [nextWallpaper]);

  // Progressive Two-Stage Loader with Zero-Black-Screen Guarantee
  useEffect(() => {
    let cancelled = false;
    const target = wallpaper;
    const thumbUrl = target.previewUrl || target.url;
    const fullUrl = target.url;

    setIsLoadingFullRes(true);

    // Timeout watchdog: if neither thumb nor full image loads within 12s, skip broken wallpaper
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        onImageError(target.id);
      }
    }, 12000);

    const commitLayer = (src: string, isFull: boolean, width: number, height: number) => {
      if (cancelled) return;
      clearTimeout(timeoutId);

      const ratio = width > 0 && height > 0 ? width / height : target.aspectRatio || 1.77;

      setActiveLayer((current) => {
        if (current.item.id !== target.id) {
          setPreviousLayer(current);
          if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
          fadeTimerRef.current = setTimeout(() => {
            setPreviousLayer(null);
          }, 900);
        }
        return {
          item: target,
          srcToUse: src,
          isFullRes: isFull,
          naturalRatio: ratio,
        };
      });

      if (isFull) {
        setIsLoadingFullRes(false);
        onImageReady(target.id);
      }
    };

    // Stage 1: Fast Thumbnail / Preview Load
    const thumbImg = new Image();
    thumbImg.referrerPolicy = 'no-referrer';
    let thumbSucceeded = false;

    thumbImg.onload = () => {
      if (cancelled) return;
      thumbSucceeded = true;
      commitLayer(thumbUrl, thumbUrl === fullUrl, thumbImg.naturalWidth, thumbImg.naturalHeight);
      if (thumbUrl !== fullUrl) {
        onImageReady(target.id);
      }
    };

    thumbImg.onerror = () => {
      // If thumb fails, wait for fullImg before declaring failure
    };

    thumbImg.src = thumbUrl;

    // Stage 2: 4K UHD Original Load in parallel
    if (fullUrl && fullUrl !== thumbUrl) {
      const fullImg = new Image();
      fullImg.referrerPolicy = 'no-referrer';

      fullImg.onload = () => {
        if (cancelled) return;
        commitLayer(fullUrl, true, fullImg.naturalWidth, fullImg.naturalHeight);
      };

      fullImg.onerror = () => {
        if (cancelled) return;
        setIsLoadingFullRes(false);
        if (!thumbSucceeded) {
          clearTimeout(timeoutId);
          onImageError(target.id);
        }
      };

      fullImg.src = fullUrl;
    } else {
      thumbImg.onerror = () => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setIsLoadingFullRes(false);
        onImageError(target.id);
      };
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [wallpaper, onImageReady, onImageError]);

  const renderLayerContent = (layer: LayerState, isFadingIn: boolean) => {
    // Determine whether to use Fit (Contain + Blurred Backdrop) or Cover
    const isPortraitOrSquare = layer.naturalRatio < 1.15;
    const useFitMode =
      scaleMode === 'fit' || (scaleMode === 'auto' && isPortraitOrSquare);

    return (
      <div
        key={layer.item.id}
        className={`absolute inset-0 transition-opacity duration-700 ease-out ${
          isFadingIn ? 'opacity-100 z-10' : 'opacity-100 z-0'
        }`}
      >
        {/* Ambient Blurred Backdrop (Always rendered to guarantee zero black edges) */}
        <img
          src={layer.item.previewUrl || layer.srcToUse}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl brightness-50 saturate-150 pointer-events-none select-none"
        />

        {/* Primary Foreground 4K Image */}
        <img
          src={layer.srcToUse}
          alt={layer.item.title}
          referrerPolicy="no-referrer"
          className={`relative w-full h-full transition-all duration-700 select-none ${
            useFitMode
              ? 'object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
              : 'object-cover'
          } ${!layer.isFullRes ? 'scale-[1.01] blur-[1.5px]' : 'scale-100 blur-0'}`}
        />

        {/* Subtle Vignette for Clock & UI Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/50 pointer-events-none" />
      </div>
    );
  };

  return (
    <div className="absolute inset-0 bg-slate-950 overflow-hidden">
      {/* Previous Wallpaper (kept underneath during crossfade so screen is NEVER black) */}
      {previousLayer && renderLayerContent(previousLayer, false)}

      {/* Active Wallpaper */}
      {renderLayerContent(activeLayer, true)}

      {/* Subtle 4K UHD Progressive Buffering Indicator */}
      {isLoadingFullRes && (
        <div className="fixed top-16 right-6 z-30 pointer-events-none flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-indigo-200 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          <span>正在渲染 4K 原图...</span>
        </div>
      )}
    </div>
  );
};
