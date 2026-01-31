'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { AccuracyTable } from '@/components/reports/accuracy-table'
import { useForecastAccuracy } from '@/hooks/use-reports'
import { ComingSoonOverlay } from '@/components/ui/coming-soon-overlay'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ForecastAccuracyPage() {
  const [weeks, setWeeks] = useState(4)
  const { data, isLoading } = useForecastAccuracy(weeks)

  return (
    <ComingSoonOverlay
      title="Forecast Accuracy Report"
      description="Compare your demand forecasts against actual client requests. Get detailed accuracy metrics by route, client, and time period to improve future planning."
    >
      <div>
      <PageHeader
        title="Forecast Accuracy"
        description="Compare demand forecasts against actual client requests"
      >
        <Select value={weeks.toString()} onValueChange={(v) => setWeeks(parseInt(v, 10))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 1 week</SelectItem>
            <SelectItem value="2">Last 2 weeks</SelectItem>
            <SelectItem value="4">Last 4 weeks</SelectItem>
            <SelectItem value="8">Last 8 weeks</SelectItem>
            <SelectItem value="12">Last 12 weeks</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Forecasted</p>
            <p className="text-2xl font-bold text-blue-600">{data.totals.forecasted}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Actual</p>
            <p className="text-2xl font-bold text-green-600">{data.totals.actual}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Fulfilled</p>
            <p className="text-2xl font-bold text-purple-600">{data.totals.fulfilled}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Variance</p>
            <p className={`text-2xl font-bold ${data.totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.totals.variance > 0 ? '+' : ''}{data.totals.variance}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Overall Accuracy</p>
            <p className={`text-2xl font-bold ${
              data.totals.accuracy >= 90 && data.totals.accuracy <= 110
                ? 'text-green-600'
                : data.totals.accuracy >= 80 && data.totals.accuracy <= 120
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}>
              {data.totals.accuracy}%
            </p>
          </div>
        </div>
      )}

      {/* Date Range Info */}
      {data && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing data from {data.dateRange.start} to {data.dateRange.end}
          ({data.weeks.length} weeks: {data.weeks.map(w => w.start).join(', ')})
        </div>
      )}

      <AccuracyTable data={data?.report} isLoading={isLoading} />
      </div>
    </ComingSoonOverlay>
  )
}
