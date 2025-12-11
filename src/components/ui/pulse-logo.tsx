import { cn } from '@/lib/utils';

interface PulseLogoProps {
  className?: string;
}

export function PulseLogo({ className }: PulseLogoProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={cn("h-4 w-4", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" 
        fill="currentColor" 
        opacity="0.2"
      />
      <path 
        d="M4 12h3l2-4 3 8 2-4h6" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}