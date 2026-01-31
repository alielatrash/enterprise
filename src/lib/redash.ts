import { parse } from 'csv-parse/sync'
import { prisma } from '@/lib/prisma'
import { generateCitym } from '@/lib/citym'

interface RedashConfig {
  baseUrl: string
  actualRequestsQueryId: string
  actualRequestsApiKey: string
  completionQueryId: string
  completionApiKey: string
}

function getConfig(): RedashConfig {
  return {
    baseUrl: process.env.REDASH_BASE_URL || 'https://redash.trella.co',
    actualRequestsQueryId: process.env.REDASH_ACTUAL_REQUESTS_QUERY_ID || '',
    actualRequestsApiKey: process.env.REDASH_ACTUAL_REQUESTS_API_KEY || '',
    completionQueryId: process.env.REDASH_COMPLETION_QUERY_ID || '',
    completionApiKey: process.env.REDASH_COMPLETION_API_KEY || '',
  }
}

async function fetchCsv(queryId: string, apiKey: string): Promise<string> {
  const config = getConfig()
  const url = `${config.baseUrl}/api/queries/${queryId}/results.csv?api_key=${apiKey}`

  const response = await fetch(url, {
    headers: { 'Accept': 'text/csv' },
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    throw new Error(`Redash fetch failed: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

export async function syncActualRequests(): Promise<number> {
  const config = getConfig()

  if (!config.actualRequestsQueryId || !config.actualRequestsApiKey) {
    console.log('Skipping actual requests sync - missing config')
    return 0
  }

  await prisma.redashSync.upsert({
    where: { endpoint: 'ACTUAL_SHIPPER_REQUESTS' },
    create: { endpoint: 'ACTUAL_SHIPPER_REQUESTS', lastSyncStatus: 'IN_PROGRESS' },
    update: { lastSyncStatus: 'IN_PROGRESS', errorMessage: null },
  })

  try {
    const csv = await fetchCsv(config.actualRequestsQueryId, config.actualRequestsApiKey)
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[]

    let count = 0
    for (const record of records) {
      const externalId = record.id || record.request_id || `${record.shipper_name}-${record.request_date}-${count}`
      const pickupCity = record.pickup_city || record.pu_city || ''
      const dropoffCity = record.dropoff_city || record.do_city || ''

      if (!pickupCity || !dropoffCity) continue

      const citym = generateCitym(pickupCity, dropoffCity)

      await prisma.actualShipperRequest.upsert({
        where: { externalId },
        create: {
          externalId,
          shipperName: record.shipper_name || record.shipper || null,
          citym,
          requestDate: new Date(record.request_date || record.date),
          truckType: record.truck_type || null,
          loadsRequested: parseInt(record.loads_requested || record.loads || '0', 10),
          loadsFulfilled: parseInt(record.loads_fulfilled || '0', 10),
        },
        update: {
          loadsFulfilled: parseInt(record.loads_fulfilled || '0', 10),
          syncedAt: new Date(),
        },
      })
      count++
    }

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

    await prisma.redashSync.update({
      where: { endpoint: 'ACTUAL_SHIPPER_REQUESTS' },
      data: { lastSyncStatus: 'FAILED', errorMessage },
    })

    throw error
  }
}

export async function syncFleetCompletions(): Promise<number> {
  const config = getConfig()

  if (!config.completionQueryId || !config.completionApiKey) {
    console.log('Skipping fleet completions sync - missing config')
    return 0
  }

  await prisma.redashSync.upsert({
    where: { endpoint: 'FLEET_PARTNER_COMPLETION' },
    create: { endpoint: 'FLEET_PARTNER_COMPLETION', lastSyncStatus: 'IN_PROGRESS' },
    update: { lastSyncStatus: 'IN_PROGRESS', errorMessage: null },
  })

  try {
    const csv = await fetchCsv(config.completionQueryId, config.completionApiKey)
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[]

    let count = 0
    for (const record of records) {
      const externalId = record.id || record.completion_id || `${record.supplier_name}-${record.completion_date}-${count}`
      const pickupCity = record.pickup_city || record.pu_city || ''
      const dropoffCity = record.dropoff_city || record.do_city || ''

      if (!pickupCity || !dropoffCity) continue

      const citym = generateCitym(pickupCity, dropoffCity)

      await prisma.fleetPartnerCompletion.upsert({
        where: { externalId },
        create: {
          externalId,
          supplierName: record.supplier_name || record.supplier || record.fleet_partner || null,
          citym,
          completionDate: new Date(record.completion_date || record.date),
          truckType: record.truck_type || null,
          loadsCompleted: parseInt(record.loads_completed || record.loads || '0', 10),
        },
        update: {
          loadsCompleted: parseInt(record.loads_completed || record.loads || '0', 10),
          syncedAt: new Date(),
        },
      })
      count++
    }

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

    await prisma.redashSync.update({
      where: { endpoint: 'FLEET_PARTNER_COMPLETION' },
      data: { lastSyncStatus: 'FAILED', errorMessage },
    })

    throw error
  }
}

export async function syncAll(): Promise<{ requests: number; completions: number }> {
  const [requests, completions] = await Promise.allSettled([
    syncActualRequests(),
    syncFleetCompletions(),
  ])

  return {
    requests: requests.status === 'fulfilled' ? requests.value : 0,
    completions: completions.status === 'fulfilled' ? completions.value : 0,
  }
}

export async function getSyncStatus() {
  const syncs = await prisma.redashSync.findMany()
  return syncs.reduce((acc, sync) => {
    acc[sync.endpoint] = {
      lastSyncAt: sync.lastSyncAt,
      lastSyncStatus: sync.lastSyncStatus,
      recordsCount: sync.recordsCount,
      errorMessage: sync.errorMessage,
    }
    return acc
  }, {} as Record<string, unknown>)
}
