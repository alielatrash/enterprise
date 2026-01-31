import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getOrCreatePlanningWeek } from '@/lib/planning-week'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // Get current planning week
    const currentWeek = await getOrCreatePlanningWeek()

    // Get demand forecasts for current week
    const forecasts = await prisma.demandForecast.findMany({
      where: { planningWeekId: currentWeek.id },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    })

    // Get supply commitments for current week
    const commitments = await prisma.supplyCommitment.findMany({
      where: { planningWeekId: currentWeek.id },
    })

    // Calculate total demand
    const totalDemand = forecasts.reduce((sum, f) => {
      return sum + f.day1Loads + f.day2Loads + f.day3Loads +
        f.day4Loads + f.day5Loads + f.day6Loads + f.day7Loads
    }, 0)

    // Calculate total committed supply
    const totalCommitted = commitments.reduce((sum, c) => {
      return sum + c.day1Committed + c.day2Committed + c.day3Committed +
        c.day4Committed + c.day5Committed + c.day6Committed + c.day7Committed
    }, 0)

    // Calculate supply gap
    const supplyGap = totalDemand - totalCommitted
    const gapPercent = totalDemand > 0 ? Math.round((supplyGap / totalDemand) * 100) : 0

    // Get unique active routes (CITYm)
    const activeRoutes = new Set(forecasts.map(f => f.citym)).size

    // Calculate gap by route
    const demandByCitym = new Map<string, number>()
    for (const forecast of forecasts) {
      const total = forecast.day1Loads + forecast.day2Loads + forecast.day3Loads +
        forecast.day4Loads + forecast.day5Loads + forecast.day6Loads + forecast.day7Loads
      demandByCitym.set(forecast.citym, (demandByCitym.get(forecast.citym) || 0) + total)
    }

    const committedByCitym = new Map<string, number>()
    for (const commitment of commitments) {
      const total = commitment.day1Committed + commitment.day2Committed + commitment.day3Committed +
        commitment.day4Committed + commitment.day5Committed + commitment.day6Committed + commitment.day7Committed
      committedByCitym.set(commitment.citym, (committedByCitym.get(commitment.citym) || 0) + total)
    }

    // Get routes with highest gaps
    const routeGaps = Array.from(demandByCitym.entries()).map(([citym, target]) => ({
      citym,
      target,
      committed: committedByCitym.get(citym) || 0,
      gap: target - (committedByCitym.get(citym) || 0),
    }))
    routeGaps.sort((a, b) => b.gap - a.gap)
    const topGapRoutes = routeGaps.slice(0, 5)

    // Get recent forecasts
    const recentForecasts = forecasts.slice(0, 5).map(f => ({
      id: f.id,
      citym: f.citym,
      clientName: f.client?.name || null,
      totalLoads: f.day1Loads + f.day2Loads + f.day3Loads +
        f.day4Loads + f.day5Loads + f.day6Loads + f.day7Loads,
      createdAt: f.createdAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: {
        currentWeek: {
          id: currentWeek.id,
          weekNumber: currentWeek.weekNumber,
          year: currentWeek.year,
          weekStart: currentWeek.weekStart.toISOString(),
          weekEnd: currentWeek.weekEnd.toISOString(),
        },
        metrics: {
          totalDemand,
          totalCommitted,
          supplyGap,
          activeRoutes,
          gapPercent,
        },
        topGapRoutes,
        recentForecasts,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load dashboard' } },
      { status: 500 }
    )
  }
}
