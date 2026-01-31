'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface PerformanceRow {
  supplierId: string
  supplierName: string
  weekStart: string
  committed: number
  completed: number
  variance: number
  fulfillmentRate: number
  routes: string[]
}

interface PerformanceTableProps {
  data?: PerformanceRow[]
  isLoading?: boolean
}

function getFulfillmentBadge(rate: number) {
  if (rate >= 95) {
    return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
  } else if (rate >= 80) {
    return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
  } else if (rate >= 60) {
    return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>
  } else {
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>
  }
}

function getVarianceColor(variance: number) {
  if (variance === 0) return 'text-gray-600'
  if (variance >= 0) return 'text-green-600'
  return 'text-red-600'
}

export function PerformanceTable({ data, isLoading }: PerformanceTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Week</TableHead>
              <TableHead className="text-right">Committed</TableHead>
              <TableHead className="text-right">Completed</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead className="text-right">Fulfillment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Routes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No vendor performance data available for the selected period</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead>Week</TableHead>
            <TableHead className="text-right">Committed</TableHead>
            <TableHead className="text-right">Completed</TableHead>
            <TableHead className="text-right">Variance</TableHead>
            <TableHead className="text-right">Fulfillment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Routes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={`${row.supplierId}-${row.weekStart}-${index}`}>
              <TableCell className="font-medium">{row.supplierName}</TableCell>
              <TableCell>{row.weekStart}</TableCell>
              <TableCell className="text-right">{row.committed}</TableCell>
              <TableCell className="text-right">{row.completed}</TableCell>
              <TableCell className={`text-right ${getVarianceColor(row.variance)}`}>
                {row.variance > 0 ? '+' : ''}{row.variance}
              </TableCell>
              <TableCell className="text-right">{row.fulfillmentRate}%</TableCell>
              <TableCell>{getFulfillmentBadge(row.fulfillmentRate)}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                {row.routes.join(', ')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
