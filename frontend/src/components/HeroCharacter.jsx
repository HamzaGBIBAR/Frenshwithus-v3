export default function HeroCharacter() {
  return (
    <div className="relative w-full max-w-[260px] sm:max-w-[320px] lg:max-w-sm mx-auto lg:mx-0 animate-fade-in">
      {/* Sparkle particles */}
      <span className="absolute top-8 right-12 w-2 h-2 bg-pink-primary rounded-full animate-sparkle opacity-80" style={{ animationDelay: '0s' }} />
      <span className="absolute top-16 left-8 w-1.5 h-1.5 bg-gold rounded-full animate-sparkle opacity-70" style={{ animationDelay: '0.5s' }} />
      <span className="absolute bottom-20 right-16 w-2 h-2 bg-pink-soft rounded-full animate-sparkle opacity-90" style={{ animationDelay: '1s' }} />
      <span className="absolute top-24 right-24 w-1 h-1 bg-pink-primary rounded-full animate-sparkle" style={{ animationDelay: '1.5s' }} />

      {/* Floating letters */}
      <span className="absolute -top-2 -right-4 text-2xl font-bold text-pink-primary/40 animate-float" style={{ animationDelay: '0s' }}>A</span>
      <span className="absolute top-1/4 -left-2 text-xl font-bold text-pink-dark/30 animate-float" style={{ animationDelay: '0.7s' }}>B</span>
      <span className="absolute bottom-1/3 -right-2 text-xl font-bold text-pink-primary/35 animate-float" style={{ animationDelay: '1.4s' }}>C</span>

      {/* Character container (float from HeroMotionWrapper) */}
      <div className="relative">
        <svg viewBox="0 0 200 280" className="w-full h-auto drop-shadow-lg hero-character-svg" fill="none">
          {/* Body - soft pink | dark: gris foncé */}
          <ellipse cx="100" cy="220" rx="55" ry="45" fill="#FADADD" stroke="#E75480" strokeWidth="2" className="dark:fill-[#2a2a2a] dark:stroke-pink-400" />
          <path d="M60 200 Q100 180 140 200 L135 220 Q100 210 65 220 Z" fill="#E75480" opacity="0.3" className="dark:fill-pink-500 dark:opacity-20" />
          
          {/* Neck */}
          <rect x="88" y="165" width="24" height="25" rx="4" fill="#FADADD" className="dark:fill-[#2a2a2a]" />
          
          {/* Head - light: rose | dark: gris + contour rose lumineux */}
          <circle cx="100" cy="140" r="45" fill="#FADADD" stroke="#E75480" strokeWidth="2" className="hero-character-face" />
          
          {/* Beret - rose, pompon jaune */}
          <ellipse cx="100" cy="105" rx="38" ry="12" fill="#C2185B" className="dark:fill-pink-600" />
          <ellipse cx="100" cy="100" rx="35" ry="10" fill="#E75480" className="dark:fill-pink-500" />
          <circle cx="100" cy="98" r="8" fill="#F4B400" opacity="0.8" />
          
          {/* Face - eyes: light noir | dark blanc */}
          <ellipse cx="85" cy="138" rx="4" ry="5" fill="#1F1F1F" className="hero-character-eyes animate-pulse" />
          <ellipse cx="115" cy="138" rx="4" ry="5" fill="#1F1F1F" className="hero-character-eyes animate-pulse" />
          {/* Smile: light rose | dark blanc */}
          <path d="M90 152 Q100 160 110 152" stroke="#C2185B" strokeWidth="2" fill="none" strokeLinecap="round" className="hero-character-smile" />
          
          {/* Book */}
          <rect x="125" y="175" width="35" height="45" rx="4" fill="#FFF" stroke="#E75480" strokeWidth="1.5" className="dark:fill-[#2a2a2a] dark:stroke-pink-400" transform="rotate(-15 125 175)" />
          <line x1="132" y1="185" x2="155" y2="182" stroke="#E75480" strokeWidth="1" opacity="0.5" transform="rotate(-15 125 175)" />
          <line x1="132" y1="195" x2="155" y2="192" stroke="#E75480" strokeWidth="1" opacity="0.5" transform="rotate(-15 125 175)" />
          
          {/* Coffee cup */}
          <ellipse cx="75" cy="195" rx="12" ry="4" fill="#8B4513" />
          <path d="M63 195 L65 220 Q75 225 85 220 L87 195" fill="#DEB887" stroke="#8B4513" strokeWidth="1" />
          <path d="M87 205 Q92 203 95 208" stroke="#E75480" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
