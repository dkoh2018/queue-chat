export const GlobeIcon = ({ className }: { className?: string }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Globe outline */}
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
    />
    
    {/* Vertical meridian lines */}
    <path 
      d="M2 12h20" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    
    {/* Horizontal lines (parallels) */}
    <path 
      d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
    />
    
    {/* Additional meridian curves for globe effect */}
    <path 
      d="M8 3a19 19 0 0 0 0 18" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
      opacity="0.6"
    />
    <path 
      d="M16 3a19 19 0 0 1 0 18" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
      opacity="0.6"
    />
  </svg>
); 