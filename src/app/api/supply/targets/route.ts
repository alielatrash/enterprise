import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Get aggregated demand targets by CITYm (for supply planning view)
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const planningWeekId = searchParams.get('planningWeekId')

    if (!planningWeekId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Planning week ID is required' } },
        { status: 400 }
      )
    }

    // Run queries in parallel for better performance
    const [aggregatedDemand, commitments, demandForecasts] = await Promise.all([
      // Aggregate demand forecasts by CITYm
      prisma.demandForecast.groupBy({
        by: ['citym'],
        where: { planningWeekId },
        _sum: {
          day1Loads: true,
          day2Loads: true,
          day3Loads: true,
          day4Loads: true,
          day5Loads: true,
          day6Loads: true,
          day7Loads: true,
          totalLoads: true,
        },
        _count: { id: true },
      }),
      // Get all supply commitments for this week
      prisma.supplyCommitment.findMany({
        where: { planningWeekId },
        include: {
          supplier: { select: { id: true, name: true, code: true } },
        },
      }),
      // Get individual demand forecasts with client details for breakdown
      prisma.demandForecast.findMany({
        where: { planningWeekId },
        select: {
          citym: true,
          client: { select: { id: true, name: true, code: true } },
          day1Loads: true,
          day2Loads: true,
          day3Loads: true,
          day4Loads: true,
          day5Loads: true,
          day6Loads: true,
          day7Loads: true,
          totalLoads: true,
        },
        orderBy: [
          { client: { name: 'asc' } },
        ],
      }),
    ])

    // Group commitments by CITYm
    const commitmentsByCitym = commitments.reduce((acc, commitment) => {
      if (!acc[commitment.citym]) {
        acc[commitment.citym] = []
      }
      acc[commitment.citym].push(commitment)
      return acc
    }, {} as Record<string, typeof commitments>)

    // Group demand forecasts by CITYm for client breakdown
    const forecastsByCitym = demandForecasts.reduce((acc, forecast) => {
      if (!acc[forecast.citym]) {
        acc[forecast.citym] = []
      }
      acc[forecast.citym].push(forecast)
      return acc
    }, {} as Record<string, typeof demandForecasts>)

    // Build targets with gap calculation
    const targets = aggregatedDemand.map((demand) => {
      const citymCommitments = commitmentsByCitym[demand.citym] || []

      // Sum up all commitments for this CITYm
      const totalCommitments = citymCommitments.reduce(
        (sums, c) => ({
          day1: sums.day1 + c.day1Committed,
          day2: sums.day2 + c.day2Committed,
          day3: sums.day3 + c.day3Committed,
          day4: sums.day4 + c.day4Committed,
          day5: sums.day5 + c.day5Committed,
          day6: sums.day6 + c.day6Committed,
          day7: sums.day7 + c.day7Committed,
          total: sums.total + c.totalCommitted,
        }),
        { day1: 0, day2: 0, day3: 0, day4: 0, day5: 0, day6: 0, day7: 0, total: 0 }
      )

      const target = {
        day1: demand._sum.day1Loads ?? 0,
        day2: demand._sum.day2Loads ?? 0,
        day3: demand._sum.day3Loads ?? 0,
        day4: demand._sum.day4Loads ?? 0,
        day5: demand._sum.day5Loads ?? 0,
        day6: demand._sum.day6Loads ?? 0,
        day7: demand._sum.day7Loads ?? 0,
        total: demand._sum.totalLoads ?? 0,
      }

      const gap = {
        day1: target.day1 - totalCommitments.day1,
        day2: target.day2 - totalCommitments.day2,
        day3: target.day3 - totalCommitments.day3,
        day4: target.day4 - totalCommitments.day4,
        day5: target.day5 - totalCommitments.day5,
        day6: target.day6 - totalCommitments.day6,
        day7: target.day7 - totalCommitments.day7,
        total: target.total - totalCommitments.total,
      }

      const gapPercent = target.total > 0
        ? Math.round((gap.total / target.total) * 100)
        : 0

      // Get client breakdown for this CITYm
      const citymForecasts = forecastsByCitym[demand.citym] || []
      const clientBreakdown = citymForecasts.map((f) => ({
        client: f.client,
        day1: f.day1Loads,
        day2: f.day2Loads,
        day3: f.day3Loads,
        day4: f.day4Loads,
        day5: f.day5Loads,
        day6: f.day6Loads,
        day7: f.day7Loads,
        total: f.totalLoads,
      }))

      return {
        citym: demand.citym,
        forecastCount: demand._count.id,
        target,
        committed: totalCommitments,
        gap,
        gapPercent,
        clients: clientBreakdown,
        commitments: citymCommitments.map((c) => ({
          id: c.id,
          supplier: c.supplier,
          day1: c.day1Committed,
          day2: c.day2Committed,
          day3: c.day3Committed,
          day4: c.day4Committed,
          day5: c.day5Committed,
          day6: c.day6Committed,
          day7: c.day7Committed,
          total: c.totalCommitted,
        })),
      }
    })

    // Sort by gap (highest gap first)
    targets.sort((a, b) => b.gap.total - a.gap.total)

    return NextResponse.json({
      success: true,
      data: targets,
    })
  } catch (error) {
    console.error('Get supply targets error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
