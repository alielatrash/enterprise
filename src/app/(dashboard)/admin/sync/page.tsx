'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SyncStatus {
  [key: string]: {
    lastSyncAt: string | null
    lastSyncStatus: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | null
    recordsCount: number | null
    errorMessage: string | null
  }
}

const statusConfig = {
  SUCCESS: { icon: CheckCircle, className: 'text-green-600', badge: 'bg-green-100 text-green-800' },
  FAILED: { icon: XCircle, className: 'text-red-600', badge: 'bg-red-100 text-red-800' },
  IN_PROGRESS: { icon: Clock, className: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800' },
}

const endpointNames: Record<string, string> = {
  ACTUAL_SHIPPER_REQUESTS: 'Actual Shipper Requests',
  FLEET_PARTNER_COMPLETION: 'Fleet Partner Completions',
}

export default function SyncStatusPage() {
  const queryClient = useQueryClient()
  const [isSyncing, setIsSyncing] = useState(false)

  const { data: status, isLoading } = useQuery({
    queryKey: ['admin', 'sync-status'],
    queryFn: async () => {
      const res = await fetch('/api/redash/sync')
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || 'Failed to fetch sync status')
      return json.data as SyncStatus
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true)
      const res = await fetch('/api/redash/sync', {
        method: 'POST',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || 'Sync failed')
      return json.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sync-status'] })
      toast.success(`Sync completed: ${data.requests} requests, ${data.completions} completions`)
      setIsSyncing(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Sync failed')
      setIsSyncing(false)
    },
  })

  const handleSync = () => {
    syncMutation.mutate()
  }

  return (
    <div>
      <PageHeader
        title="Redash Sync Status"
        description="Monitor and trigger data synchronization from Redash"
      >
        <Button onClick={handleSync} disabled={isSyncing || syncMutation.isPending}>
          {isSyncing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isSyncing ? 'Syncing...' : 'Trigger Sync'}
        </Button>
      </PageHeader>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            </div>
          ))
        ) : status && Object.keys(status).length > 0 ? (
          Object.entries(status).map(([endpoint, data]) => {
            const config = data.lastSyncStatus ? statusConfig[data.lastSyncStatus] : null
            const StatusIcon = config?.icon || Clock

            return (
              <div key={endpoint} className="rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {endpointNames[endpoint] || endpoint}
                  </h3>
                  {data.lastSyncStatus && (
                    <Badge className={config?.badge || 'bg-gray-100 text-gray-800'}>
                      <StatusIcon className={`h-3 w-3 mr-1 ${config?.className}`} />
                      {data.lastSyncStatus}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Last Sync</p>
                    <p className="font-medium">
                      {data.lastSyncAt
                        ? new Date(data.lastSyncAt).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Records Synced</p>
                    <p className="font-medium">
                      {data.recordsCount ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`font-medium ${config?.className || 'text-gray-600'}`}>
                      {data.lastSyncStatus || 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Error</p>
                    <p className="font-medium text-red-600 truncate">
                      {data.errorMessage || '—'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">No sync data available. Trigger a sync to start.</p>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">About Sync</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Automatic sync runs every hour via Vercel cron job</li>
          <li>• Syncs actual shipper requests and fleet partner completions from Redash</li>
          <li>• Data is used for forecast accuracy and vendor performance reports</li>
          <li>• Manual sync can be triggered using the button above (admin only)</li>
        </ul>
      </div>
    </div>
  )
}
