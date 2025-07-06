export const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    {/* Calendar base */}
    <rect x="1" y="2" width="14" height="13" rx="2" ry="2" fill="white" stroke="#dadce0" strokeWidth="0.5"/>
    
    {/* Header section */}
    <rect x="1" y="2" width="14" height="3" rx="2" ry="2" fill="#1a73e8"/>
    <rect x="1" y="4.5" width="14" height="0.5" fill="#1a73e8"/>
    
    {/* Calendar rings */}
    <rect x="4" y="0.5" width="1" height="3" rx="0.5" fill="#5f6368"/>
    <rect x="11" y="0.5" width="1" height="3" rx="0.5" fill="#5f6368"/>
    
    {/* Date grid - colorful dots representing events */}
    <circle cx="3.5" cy="7" r="0.8" fill="#ea4335"/>
    <circle cx="6" cy="7" r="0.8" fill="#34a853"/>
    <circle cx="8.5" cy="7" r="0.8" fill="#fbbc04"/>
    <circle cx="11" cy="7" r="0.8" fill="#1a73e8"/>
    
    <circle cx="3.5" cy="9.5" r="0.8" fill="#34a853"/>
    <circle cx="6" cy="9.5" r="0.8" fill="#1a73e8"/>
    <circle cx="8.5" cy="9.5" r="0.8" fill="#ea4335"/>
    
    <circle cx="3.5" cy="12" r="0.8" fill="#fbbc04"/>
    <circle cx="6" cy="12" r="0.8" fill="#ea4335"/>
    <circle cx="8.5" cy="12" r="0.8" fill="#34a853"/>
    <circle cx="11" cy="12" r="0.8" fill="#1a73e8"/>
  </svg>
); 