import { useReset, useSimulate } from '../data/mutations'
import { Button } from './ui/button'

export function DemoControls() {
  const simulate = useSimulate()
  const reset = useReset()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Demo controls:</span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => simulate.mutate({ type: 'typhoon' })}
        disabled={simulate.isPending}
      >
        Simulate typhoon
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => simulate.mutate({ type: 'drought' })}
        disabled={simulate.isPending}
      >
        Simulate drought
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => simulate.mutate({ type: 'contamination' })}
        disabled={simulate.isPending}
      >
        Simulate contamination
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => reset.mutate()}
        disabled={reset.isPending}
      >
        Reset demo
      </Button>
    </div>
  )
}
