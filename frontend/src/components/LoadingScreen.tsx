import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('size-5 animate-spin text-well', className)}
      aria-hidden="true"
    />
  )
}

export function LoadingScreen({
  label = 'Loading…',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-20',
        className,
      )}
    >
      <Spinner className="size-8" />
      <p className="text-sm text-ink/60">{label}</p>
    </div>
  )
}
