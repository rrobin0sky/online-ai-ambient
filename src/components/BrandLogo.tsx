import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="brandSquircleBg" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#312E81" />
          <stop offset="50%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#3B0764" />
        </linearGradient>

        <radialGradient id="brandTopGlow" cx="32" cy="10" r="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#090A14" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="brandFrameGrad" x1="10" y1="14" x2="54" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#E879F9" />
        </linearGradient>

        <linearGradient id="brandFrontPeak" x1="14" y1="24" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>

        <clipPath id="brandScreenClip">
          <rect x="10" y="15" width="44" height="31" rx="6" />
        </clipPath>
      </defs>

      {/* Main Squircle Base */}
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#brandSquircleBg)" />
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#brandTopGlow)" />
      <rect
        x="2.75"
        y="2.75"
        width="58.5"
        height="58.5"
        rx="13.25"
        stroke="rgba(255,255,255,0.32)"
        strokeWidth="1.5"
      />

      {/* 4K Viewport Screen */}
      <rect x="10" y="15" width="44" height="31" rx="6" fill="#090A16" />

      <g clipPath="url(#brandScreenClip)">
        {/* Subtle Aurora Wave */}
        <path
          d="M10 25 C 20 20, 30 28, 42 22 C 48 19, 52 22, 55 21"
          stroke="url(#brandFrameGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />
        {/* Back Mountain */}
        <path d="M24 47 L40 26 L55 47 Z" fill="#6366F1" opacity="0.75" />
        {/* Front Aurora Peak */}
        <path d="M9 47 L27 24 L45 47 Z" fill="url(#brandFrontPeak)" />
        {/* Horizon Reflection */}
        <rect x="19" y="42" width="26" height="1" rx="0.5" fill="#FFFFFF" opacity="0.25" />
      </g>

      {/* Glowing Screen Border */}
      <rect x="10" y="15" width="44" height="31" rx="6" stroke="url(#brandFrameGrad)" strokeWidth="2.4" />

      {/* 4-Point Ambient Star */}
      <path
        d="M44 19 L45.3 23.2 L49.5 24.5 L45.3 25.8 L44 30 L42.7 25.8 L38.5 24.5 L42.7 23.2 Z"
        fill="#FFFFFF"
      />

      {/* Minimalist Ambient Soundwave Stand */}
      <rect x="25" y="51" width="14" height="2.2" rx="1.1" fill="url(#brandFrameGrad)" />
      <circle cx="22" cy="52.1" r="1" fill="#38BDF8" opacity="0.7" />
      <circle cx="42" cy="52.1" r="1" fill="#E879F9" opacity="0.7" />
    </svg>
  );
};
