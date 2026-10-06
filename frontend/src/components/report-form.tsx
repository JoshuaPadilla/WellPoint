import { useState } from 'react'
import { useCreateReport } from '../data/mutations'
import { reportTypeEnum } from '../data/schemas'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const TYPE_LABELS: Record<string, string> = {
  no_water: 'No water',
  low_pressure: 'Low pressure',
  contamination: 'Contamination',
  infrastructure_damage: 'Infrastructure damage',
  other: 'Other',
}

export function ReportForm() {
  const create = useCreateReport()
  const [type, setType] = useState<string>('contamination')
  const [description, setDescription] = useState('')

  function submit() {
    if (!description.trim()) return
    create.mutate(
      { type, description: description.trim() },
      { onSuccess: () => setDescription('') },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a community report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {reportTypeEnum.options.map((value) => (
              <option key={value} value={value}>
                {TYPE_LABELS[value] ?? value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What are residents experiencing?"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={submit}
            disabled={create.isPending || !description.trim()}
          >
            Submit report
          </Button>
          {create.isError && (
            <span className="text-sm text-red-600">
              {create.error instanceof Error
                ? create.error.message
                : 'Failed to submit.'}
            </span>
          )}
          {create.isSuccess && (
            <span className="text-sm text-green-600">Report submitted.</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
