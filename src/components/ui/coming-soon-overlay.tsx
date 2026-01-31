import { Lock, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ComingSoonOverlayProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function ComingSoonOverlay({
  children,
  title = "Coming Soon",
  description = "This feature is currently under development and will be available soon."
}: ComingSoonOverlayProps) {
  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>

      {/* Coming Soon Modal Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px]">
        <Card className="w-full max-w-md shadow-2xl border-2">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription className="text-base mt-2">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Expected availability: Q1 2026</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
