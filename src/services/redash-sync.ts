import { parse } from 'csv-parse/sync'
import { prisma } from '@/lib/prisma'
import { generateCitym } from '@/lib/citym'

interface RedashConfig {
  baseUrl: string
  apiKey: string
  actualRequestsQueryId: string
  completionQueryId: string
}

function getConfig(): RedashConfig {
  return {
    baseUrl: process.env.REDASH_BASE_URL || 'https://redash.trella.co',
    apiKey: process.env.REDASH_API_KEY || '',
    actualRequestsQueryId: process.env.REDASH_ACTUAL_REQUESTS_QUERY_ID || '',
    completionQueryId: process.env.REDASH_COMPLETION_QUERY_ID || '',
  }
}

async function fetchCsv(queryId: string, apiKey: string): Promise<string> {
  const config = getConfig()
  const url = `${config.baseUrl}/api/queries/${queryId}/results.csv?api_key=${apiKey}`

  const response = await fetch(url, {
    headers: {
      'Accept': 'text/csv',
    },
  })

  if (!response.ok) {
    throw new Error(`Redash fetch failed: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

interface ActualRequestRecord {
  id: string
  shipper_name?: string
  pickup_city: string
  dropoff_city: string
  request_date: string
  truck_type?: string
  loads_requested: string
  loads_fulfilled?: string
}

interface CompletionRecord {
  id: string
  supplier_name?: string
  pickup_city: string
  dropoff_city: string
  completion_date: string
  truck_type?: string
  loads_completed: string
}

export async function syncActualShipperRequests(): Promise<number> {
  const config = getConfig()

  if (!config.apiKey || !config.actualRequestsQueryId) {
    console.log('Redash actual requests sync skipped: missing configuration')
    return 0
  }

  // Mark sync as in progress
  await prisma.redashSync.upsert({
    where: { endpoint: 'ACTUAL_SHIPPER_REQUESTS' },
    create: { endpoint: 'ACTUAL_SHIPPER_REQUESTS', lastSyncStatus: 'IN_PROGRESS' },
    update: { lastSyncStatus: 'IN_PROGRESS', errorMessage: null },
  })

  try {
    const csv = await fetchCsv(config.actualRequestsQueryId, config.apiKey)
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as ActualRequestRecord[]

    let count = 0
    for (const record of records) {
      if (!record.id || !record.pickup_city || !record.dropoff_city) continue

      const citym = generateCitym(record.pickup_city, record.dropoff_city)

      await prisma.actualShipperRequest.upsert({
        where: { externalId: record.id },
        create: {
          externalId: record.id,
          shipperName: record.shipper_name || null,
          citym,
          requestDate: new Date(record.request_date),
          truckType: record.truck_type || null,
          loadsRequested: parseInt(record.loads_requested, 10) || 0,
          loadsFulfilled: parseInt(record.loads_fulfilled || '0', 10),
        },
        update: {
          loadsFulfilled: parseInt(record.loads_fulfilled || '0', 10),
          syncedAt: new Date(),
        },
      })
      count++
    }

    // Mark sync as successful
    await prisma.redashSync.update({
      where: { endpoint: 'ACTUAL_SHIPPER_REQUESTS' },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'SUCCESS',
        recordsCount: count,
        errorMessage: null,
      },
    })

    return count
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Mark sync as failed
    await prisma.redashSync.update({
      where: { endpoint: 'ACTUAL_SHIPPER_REQUESTS' },
      data: {
        lastSyncStatus: 'FAILED',
        errorMessage,
      },
    })

    throw error
  }
}

export async function syncFleetPartnerCompletions(): Promise<number> {
  const config = getConfig()

  if (!config.apiKey || !config.completionQueryId) {
    console.log('Redash completions sync skipped: missing configuration')
    return 0
  }

  // Mark sync as in progress
  await prisma.redashSync.upsert({
    where: { endpoint: 'FLEET_PARTNER_COMPLETION' },
    create: { endpoint: 'FLEET_PARTNER_COMPLETION', lastSyncStatus: 'IN_PROGRESS' },
    update: { lastSyncStatus: 'IN_PROGRESS', errorMessage: null },
  })

  try {
    const csv = await fetchCsv(config.completionQueryId, config.apiKey)
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CompletionRecord[]

    let count = 0
    for (const record of records) {
      if (!record.id || !record.pickup_city || !record.dropoff_city) continue

      const citym = generateCitym(record.pickup_city, record.dropoff_city)

      await prisma.fleetPartnerCompletion.upsert({
        where: { externalId: record.id },
        create: {
          externalId: record.id,
          supplierName: record.supplier_name || null,
          citym,
          completionDate: new Date(record.completion_date),
          truckType: record.truck_type || null,
          loadsCompleted: parseInt(record.loads_completed, 10) || 0,
        },
        update: {
          loadsCompleted: parseInt(record.loads_completed, 10) || 0,
          syncedAt: new Date(),
        },
      })
      count++
    }

    // Mark sync as successful
    await prisma.redashSync.update({
      where: { endpoint: 'FLEET_PARTNER_COMPLETION' },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'SUCCESS',
        recordsCount: count,
        errorMessage: null,
      },
    })

    return count
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Mark sync as failed
    await prisma.redashSync.update({
      where: { endpoint: 'FLEET_PARTNER_COMPLETION' },
      data: {
        lastSyncStatus: 'FAILED',
        errorMessage,
      },
    })

    throw error
  }
}

export async function syncAll(): Promise<{ requests: number; completions: number }> {
  const [requests, completions] = await Promise.all([
    syncActualShipperRequests().catch((e) => {
      console.error('Failed to sync actual requests:', e)
      return 0
    }),
    syncFleetPartnerCompletions().catch((e) => {
      console.error('Failed to sync completions:', e)
      return 0
    }),
  ])

  return { requests, completions }
}

export async function getSyncStatus() {
  const syncs = await prisma.redashSync.findMany()
  return syncs.reduce((acc, sync) => {
    acc[sync.endpoint] = {
      lastSyncAt: sync.lastSyncAt,
      status: sync.lastSyncStatus,
      recordsCount: sync.recordsCount,
      errorMessage: sync.errorMessage,
    }
    return acc
  }, {} as Record<string, { lastSyncAt: Date | null; status: string; recordsCount: number; errorMessage: string | null }>)
}
