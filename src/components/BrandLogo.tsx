import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'horizontal' | 'icon-only' | 'compact' | 'hero-badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  theme?: 'light' | 'dark' | 'auto';
  showTagline?: boolean;
  showPillars?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  theme = 'auto',
  showTagline = false,
  showPillars = false,
  className = ''
}) => {
  // Size mappings for icon
  const iconSizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-32 h-32'
  };

  // Text size mappings
  const textSizeMap = {
    xs: { main: 'text-xs', sub: 'text-[8px]', tag: 'text-[7px]' },
    sm: { main: 'text-sm', sub: 'text-[9px]', tag: 'text-[8px]' },
    md: { main: 'text-base sm:text-lg', sub: 'text-[10px]', tag: 'text-[9px]' },
    lg: { main: 'text-xl sm:text-2xl', sub: 'text-xs', tag: 'text-[10px]' },
    xl: { main: 'text-3xl sm:text-4xl', sub: 'text-sm', tag: 'text-xs' },
    '2xl': { main: 'text-4xl sm:text-5xl', sub: 'text-base', tag: 'text-sm' }
  };

  const currentTextSize = textSizeMap[size] || textSizeMap.md;
  const currentIconSize = iconSizeMap[size] || iconSizeMap.md;

  const isDark = theme === 'dark';

  // Crisp Vector SVG of the official Negocio Flex Icon
  // Features: Blue storefront awning, smartphone screen with 4 colored app tiles,
  // speed motion lines on the left, WhatsApp green chat bubble on the right
  const LogoIcon = () => (
    <div className={`relative shrink-0 select-none ${currentIconSize} flex items-center justify-center`}>
      <svg 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md overflow-visible"
      >
        <defs>
          {/* Blue Awning & Hexagon Roof Gradients */}
          <linearGradient id="nf-blue-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>

          <linearGradient id="nf-blue-light" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          <linearGradient id="nf-speed-lines" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          {/* WhatsApp Bubble Gradient */}
          <linearGradient id="nf-wa-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#25D366" />
            <stop offset="100%" stopColor="#128C7E" />
          </linearGradient>

          {/* Screen Glass Shadow */}
          <filter id="nf-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1e3a8a" floodOpacity="0.25" />
          </filter>
          
          <filter id="nf-wa-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#25D366" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Top Hexagon / House Roof Background Accent */}
        <path 
          d="M100 12 L165 48 V105 C165 140 100 182 100 182 C100 182 35 140 35 105 V48 L100 12 Z" 
          fill="url(#nf-blue-dark)" 
          opacity="0.95"
        />

        {/* Left Speed / Agility Motion Lines */}
        <g stroke="url(#nf-speed-lines)" strokeWidth="6" strokeLinecap="round">
          {/* Small top dot */}
          <circle cx="28" cy="70" r="3.5" fill="#22c55e" stroke="none" />
          {/* Line 1 */}
          <line x1="36" y1="70" x2="68" y2="70" />
          {/* Line 2 */}
          <line x1="30" y1="84" x2="70" y2="84" strokeWidth="6.5" />
          {/* Line 3 */}
          <line x1="38" y1="98" x2="72" y2="98" />
          {/* Line 4 */}
          <line x1="48" y1="112" x2="76" y2="112" strokeWidth="5.5" />
        </g>

        {/* Central Smartphone Body */}
        <rect 
          x="62" 
          y="35" 
          width="76" 
          height="126" 
          rx="18" 
          fill="#0f172a" 
          stroke="#3b82f6" 
          strokeWidth="3.5"
          filter="url(#nf-glow)"
        />

        {/* Phone Screen Canvas (White/Light Slate) */}
        <rect 
          x="67" 
          y="42" 
          width="66" 
          height="112" 
          rx="13" 
          fill="#f8fafc" 
        />

        {/* Storefront Awning / Canopy Roof on Top of Phone */}
        <g>
          {/* Main Awning Base */}
          <path 
            d="M54 36 C54 33 60 30 100 30 C140 30 146 33 146 36 L142 54 C142 57 138 59 135 59 C132 59 130 57 128 54 C126 57 123 59 120 59 C117 59 114 57 112 54 C110 57 107 59 104 59 C101 59 99 57 97 54 C95 57 92 59 89 59 C86 59 84 57 82 54 C80 57 77 59 74 59 C71 59 69 57 67 54 C65 57 62 59 58 59 C55 59 52 57 52 54 Z" 
            fill="url(#nf-blue-light)" 
            stroke="#1e3a8a" 
            strokeWidth="1.5"
          />
          {/* Blue and White Stripes */}
          <path d="M68 31 L64 54 C66 57 69 57 71 54 L76 31 Z" fill="#ffffff" opacity="0.9" />
          <path d="M86 30 L84 54 C86 57 89 57 91 54 L94 30 Z" fill="#ffffff" opacity="0.9" />
          <path d="M106 30 L107 54 C109 57 112 57 114 54 L114 30 Z" fill="#ffffff" opacity="0.9" />
          <path d="M126 31 L129 54 C131 57 134 57 136 54 L134 31 Z" fill="#ffffff" opacity="0.9" />
        </g>

        {/* 4 Feature App Tiles inside Screen */}
        <g transform="translate(73, 66)">
          {/* 1. Blue Shopping Bag Tile */}
          <rect x="0" y="0" width="23" height="23" rx="5" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
          <path d="M6 9 H17 V18 C17 19 16 20 15 20 H8 C7 20 6 19 6 18 Z" fill="#2563eb" />
          <path d="M8.5 9 V7 C8.5 5.5 9.5 4.5 11.5 4.5 C13.5 4.5 14.5 5.5 14.5 7 V9" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" fill="none" />

          {/* 2. Orange Food Cloche Tile */}
          <rect x="31" y="0" width="23" height="23" rx="5" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1" />
          <circle cx="42.5" cy="7" r="1.5" fill="#ea580c" />
          <path d="M36 14 C36 10 49 10 49 14 Z" fill="#f97316" />
          <rect x="35" y="14.5" width="15" height="2.5" rx="1" fill="#ea580c" />

          {/* 3. Green Shopping Cart Tile */}
          <rect x="0" y="30" width="23" height="23" rx="5" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />
          <path d="M5 34 H8 L10 42 H18 L19.5 37 H9" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="11" cy="46" r="1.5" fill="#16a34a" />
          <circle cx="17" cy="46" r="1.5" fill="#16a34a" />

          {/* 4. Blue Analytics Bar Chart Tile */}
          <rect x="31" y="30" width="23" height="23" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          <rect x="35" y="42" width="3" height="6" rx="1" fill="#3b82f6" />
          <rect x="41" y="38" width="3" height="10" rx="1" fill="#2563eb" />
          <rect x="47" y="34" width="3" height="14" rx="1" fill="#1d4ed8" />
        </g>

        {/* WhatsApp Glossy Chat Bubble Badge on Bottom Right */}
        <g transform="translate(112, 78)" filter="url(#nf-wa-glow)">
          {/* Outer circle */}
          <circle cx="34" cy="34" r="30" fill="url(#nf-wa-gradient)" stroke="#ffffff" strokeWidth="3" />
          
          {/* Chat tail pointer */}
          <path d="M14 46 L8 56 L22 52 Z" fill="#128C7E" />
          
          {/* White Phone Receiver Icon */}
          <path 
            d="M26 21 C24.5 21 23 21.8 22.2 23 C20.5 25.5 20.8 28.5 22.8 32 C24.8 35.5 28.5 39.2 32 41.2 C35.5 43.2 38.5 43.5 41 41.8 C42.2 41 43 39.5 43 38 C43 37 42.2 36.2 40.5 35.2 L37.8 33.8 C36.5 33 35.8 33.2 35 34 L34 35.2 C33.5 35.8 32.5 36 31.8 35.5 C29.5 34 28 32.5 26.5 30.2 C26 29.5 26.2 28.5 26.8 28 L28 27 C28.8 26.2 29 25.5 28.2 24.2 L26.8 21.5 C25.8 19.8 25 19 24 19 Z" 
            fill="#ffffff" 
          />
        </g>
      </svg>
    </div>
  );

  // Styled Brand Typography
  // NEGOCIO in heavy slanted Navy Blue
  // FLEX in Vibrant Green with stylized checkmark accent
  const Typography = () => (
    <div className="flex flex-col leading-none select-none">
      <div className="flex items-baseline font-black tracking-tight italic transform -skew-x-6">
        <span className={`${currentTextSize.main} ${isDark ? 'text-white' : 'text-[#0a1f54]'} transition-colors`}>
          NEGOCIO
        </span>
        <span className="relative ml-1 text-emerald-500 font-extrabold flex items-center">
          <span className={`${currentTextSize.main} bg-linear-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent`}>
            FLEX
          </span>
          {/* Checkmark Accent on X */}
          <span className="inline-block text-emerald-500 font-black ml-0.5 transform -skew-x-12">
            ✓
          </span>
        </span>
      </div>

      {showTagline && (
        <span className={`mt-1 font-extrabold uppercase tracking-wider ${currentTextSize.tag} ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          TU NEGOCIO. TU MARCA. TUS PEDIDOS. SIN LÍMITES.
        </span>
      )}

      {!showTagline && variant !== 'compact' && (
        <span className={`mt-0.5 font-bold uppercase tracking-widest ${currentTextSize.sub} ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
          Plataforma SaaS • Catálogos & WhatsApp
        </span>
      )}
    </div>
  );

  // 4 Feature Pillars Badge (as seen on the official branding)
  const Pillars = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800 text-center">
      <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 space-y-1">
        <div className="text-blue-600 dark:text-blue-400 text-base">🏬</div>
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          CREA TU PÁGINA
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1">
        <div className="text-emerald-600 dark:text-emerald-400 text-base">🛒</div>
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          RECIBE PEDIDOS
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-green-50/80 dark:bg-green-950/40 border border-green-200/60 dark:border-green-800/60 space-y-1">
        <div className="text-green-600 dark:text-green-400 text-base">💬</div>
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          CLIENTES POR WHATSAPP
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 space-y-1">
        <div className="text-indigo-600 dark:text-indigo-400 text-base">📊</div>
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          GESTIONA EN UN LUGAR
        </div>
      </div>
    </div>
  );

  if (variant === 'icon-only') {
    return <LogoIcon />;
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <LogoIcon />
        <div className="flex items-baseline font-black italic tracking-tight -skew-x-6">
          <span className={`${currentTextSize.main} ${isDark ? 'text-white' : 'text-[#0a1f54]'}`}>
            NEGOCIO
          </span>
          <span className={`${currentTextSize.main} ml-1 text-emerald-500 font-extrabold`}>
            FLEX
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center space-y-4 ${className}`}>
        <div className="flex flex-col items-center">
          <LogoIcon />
          <div className="mt-3">
            <Typography />
          </div>
        </div>
        {showPillars && <Pillars />}
      </div>
    );
  }

  if (variant === 'hero-badge') {
    return (
      <div className={`inline-flex flex-col sm:flex-row items-center gap-3 p-3 sm:px-5 sm:py-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md ${className}`}>
        <LogoIcon />
        <div className="text-left">
          <Typography />
        </div>
      </div>
    );
  }

  // Default: horizontal layout (Navbar, Footer, Modals)
  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <LogoIcon />
      <Typography />
    </div>
  );
};
