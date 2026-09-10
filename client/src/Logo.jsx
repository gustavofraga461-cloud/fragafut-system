export default function Logo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="FRAGAFUT" role="img">
      <defs>
        <linearGradient id="ffBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF4D5E" />
          <stop offset="55%" stopColor="#C41E3A" />
          <stop offset="100%" stopColor="#4A0A14" />
        </linearGradient>
        <linearGradient id="ffStreak" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="96" height="96" rx="27" fill="url(#ffBg)" />
      <rect x="2" y="2" width="96" height="96" rx="27" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1.5" />
      <rect x="15" y="33" width="27" height="6.5" rx="3.25" fill="url(#ffStreak)" opacity="0.55" />
      <rect x="15" y="46.75" width="40" height="7.5" rx="3.75" fill="url(#ffStreak)" opacity="0.9" />
      <rect x="15" y="60.5" width="21" height="6.5" rx="3.25" fill="url(#ffStreak)" opacity="0.45" />
      <g transform="translate(68,50)">
        <circle r="20" fill="#f5f5f7" />
        <circle r="20" fill="none" stroke="#00000022" strokeWidth="1" />
        <path d="M0 -20 L8.4 -14.2 L5.3 -3.9 L-5.3 -3.9 L-8.4 -14.2 Z" fill="#15151a" />
        <path d="M0 20 L-8.4 14.2 L-5.3 3.9 L5.3 3.9 L8.4 14.2 Z" fill="#15151a" opacity="0.92" />
        <path d="M-20 0 L-14.2 -8.4 L-3.9 -5.3 L-3.9 5.3 L-14.2 8.4 Z" fill="#15151a" opacity="0.86" />
      </g>
    </svg>
  )
}
