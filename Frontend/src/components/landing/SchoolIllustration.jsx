export default function SchoolIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 400 320" className={className} role="img" aria-label="Illustration of the school building">
      {/* Sky/ground */}
      <rect x="0" y="260" width="400" height="60" fill="#F0E6D2" />

      {/* Trees */}
      <g>
        <rect x="34" y="205" width="10" height="55" rx="2" fill="#8a6a4a" />
        <circle cx="39" cy="185" r="34" fill="#CFEAE0" />
        <circle cx="39" cy="185" r="34" fill="none" stroke="#0F6E56" strokeWidth="3" />
      </g>
      <g>
        <rect x="352" y="215" width="9" height="45" rx="2" fill="#8a6a4a" />
        <circle cx="356" cy="198" r="27" fill="#CFEAE0" />
        <circle cx="356" cy="198" r="27" fill="none" stroke="#0F6E56" strokeWidth="3" />
      </g>

      {/* Main building */}
      <rect x="90" y="140" width="220" height="120" fill="#FFFFFF" stroke="#1E3A5F" strokeWidth="4" />
      {/* Roof */}
      <polygon points="80,140 200,80 320,140" fill="#E8A33D" stroke="#1E3A5F" strokeWidth="4" strokeLinejoin="round" />
      {/* Flagpole + flag */}
      <line x1="200" y1="80" x2="200" y2="40" stroke="#1E3A5F" strokeWidth="3" />
      <polygon points="200,40 236,50 200,60" fill="#0F6E56" />

      {/* Entrance */}
      <rect x="178" y="205" width="44" height="55" fill="#0F6E56" stroke="#1E3A5F" strokeWidth="3" />
      <circle cx="212" cy="233" r="2.5" fill="#F0E6D2" />

      {/* Windows - left wing */}
      <rect x="108" y="165" width="30" height="30" fill="#CFEAE0" stroke="#1E3A5F" strokeWidth="3" />
      <line x1="123" y1="165" x2="123" y2="195" stroke="#1E3A5F" strokeWidth="2" />
      <line x1="108" y1="180" x2="138" y2="180" stroke="#1E3A5F" strokeWidth="2" />
      <rect x="108" y="210" width="30" height="30" fill="#CFEAE0" stroke="#1E3A5F" strokeWidth="3" />
      <line x1="123" y1="210" x2="123" y2="240" stroke="#1E3A5F" strokeWidth="2" />
      <line x1="108" y1="225" x2="138" y2="225" stroke="#1E3A5F" strokeWidth="2" />

      {/* Windows - right wing */}
      <rect x="262" y="165" width="30" height="30" fill="#CFEAE0" stroke="#1E3A5F" strokeWidth="3" />
      <line x1="277" y1="165" x2="277" y2="195" stroke="#1E3A5F" strokeWidth="2" />
      <line x1="262" y1="180" x2="292" y2="180" stroke="#1E3A5F" strokeWidth="2" />
      <rect x="262" y="210" width="30" height="30" fill="#CFEAE0" stroke="#1E3A5F" strokeWidth="3" />
      <line x1="277" y1="210" x2="277" y2="240" stroke="#1E3A5F" strokeWidth="2" />
      <line x1="262" y1="225" x2="292" y2="225" stroke="#1E3A5F" strokeWidth="2" />

      {/* Ground line */}
      <line x1="20" y1="260" x2="380" y2="260" stroke="#1E3A5F" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}