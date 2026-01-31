import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        {/* Background Circle */}
        <circle cx="20" cy="20" r="18" fill="hsl(var(--primary))" />

        {/* Truck/Transport Icon - Simplified */}
        <g transform="translate(8, 12)">
          {/* Truck Cabin */}
          <rect x="0" y="6" width="8" height="10" rx="1" fill="white" />

          {/* Truck Container */}
          <rect x="8" y="4" width="16" height="12" rx="1" fill="white" opacity="0.9" />

          {/* Wheel 1 */}
          <circle cx="6" cy="18" r="2.5" fill="white" />
          <circle cx="6" cy="18" r="1.5" fill="hsl(var(--primary))" />

          {/* Wheel 2 */}
          <circle cx="18" cy="18" r="2.5" fill="white" />
          <circle cx="18" cy="18" r="1.5" fill="hsl(var(--primary))" />

          {/* Motion Lines */}
          <line x1="10" y1="8" x2="14" y2="8" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.5" />
          <line x1="10" y1="10" x2="16" y2="10" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.5" />
          <line x1="10" y1="12" x2="14" y2="12" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.5" />
        </g>
      </svg>
    </div>
  )
}
