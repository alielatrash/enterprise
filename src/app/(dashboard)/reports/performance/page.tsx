'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout'
import { PerformanceTable } from '@/components/reports/performance-table'
import { useVendorPerformance } from '@/hooks/use-reports'
import { ComingSoonOverlay } from '@/components/ui/coming-soon-overlay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function VendorPerformancePage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data, isLoading } = useVendorPerformance({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  return (
    <ComingSoonOverlay
      title="Vendor Performance Report"
      description="Track supplier fulfillment rates, analyze commitment vs completion trends, and identify your top performing vendors to optimize your supply chain."
    >
      <div>
        <PageHeader
        title="Vendor Performance"
        description="Track supplier fulfillment rates against commitments"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate" className="text-sm whitespace-nowrap">From</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="endDate" className="text-sm whitespace-nowrap">To</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36"
            />
          </div>
          {(startDate || endDate) && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Clear
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Committed</p>
            <p className="text-2xl font-bold text-blue-600">{data.summary.totalCommitted}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Completed</p>
            <p className="text-2xl font-bold text-green-600">{data.summary.totalCompleted}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Variance</p>
            <p className={`text-2xl font-bold ${data.summary.overallVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.summary.overallVariance > 0 ? '+' : ''}{data.summary.overallVariance}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Fulfillment Rate</p>
            <p className={`text-2xl font-bold ${
              data.summary.overallFulfillmentRate >= 95
                ? 'text-green-600'
                : data.summary.overallFulfillmentRate >= 80
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}>
              {data.summary.overallFulfillmentRate}%
            </p>
          </div>
        </div>
      )}

      {/* Top Performers */}
      {data?.summary?.topPerformers && data.summary.topPerformers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Top Performers</h3>
          <div className="flex flex-wrap gap-2">
            {data.summary.topPerformers.map((performer) => (
              <div
                key={performer.name}
                className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm"
              >
                <span className="font-medium">{performer.name}</span>
                <span className="text-green-700">{performer.fulfillmentRate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Info */}
      {data?.summary && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {data.summary.supplierCount} suppliers across {data.summary.weekCount} weeks
        </div>
      )}

      <PerformanceTable data={data?.data} isLoading={isLoading} />
      </div>
    </ComingSoonOverlay>
  )
}
