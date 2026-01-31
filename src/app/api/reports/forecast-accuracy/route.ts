import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns'

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
    const weeksBack = parseInt(searchParams.get('weeks') || '4', 10)

    // Get date range
    const now = new Date()
    const endDate = endOfWeek(now, { weekStartsOn: 0 })
    const startDate = startOfWeek(subWeeks(now, weeksBack), { weekStartsOn: 0 })

    // Get forecasts grouped by week and CITYm
    const forecasts = await prisma.demandForecast.groupBy({
      by: ['citym', 'planningWeekId'],
      where: {
        planningWeek: {
          weekStart: { gte: startDate, lte: endDate },
        },
      },
      _sum: {
        totalLoads: true,
      },
    })

    // Get planning weeks for display
    const planningWeeks = await prisma.planningWeek.findMany({
      where: {
        weekStart: { gte: startDate, lte: endDate },
      },
      select: { id: true, weekStart: true, weekNumber: true, year: true },
      orderBy: { weekStart: 'asc' },
    })

    // Get actual requests grouped by week and CITYm
    const actuals = await prisma.actualShipperRequest.groupBy({
      by: ['citym'],
      where: {
        requestDate: { gte: startDate, lte: endDate },
      },
      _sum: {
        loadsRequested: true,
        loadsFulfilled: true,
      },
    })

    // Build accuracy report by CITYm
    const citymSet = new Set([
      ...forecasts.map(f => f.citym),
      ...actuals.map(a => a.citym),
    ])

    const forecastsByCitym = forecasts.reduce((acc, f) => {
      if (!acc[f.citym]) acc[f.citym] = 0
      acc[f.citym] += f._sum.totalLoads ?? 0
      return acc
    }, {} as Record<string, number>)

    const actualsByCitym = actuals.reduce((acc, a) => {
      acc[a.citym] = {
        requested: a._sum.loadsRequested ?? 0,
        fulfilled: a._sum.loadsFulfilled ?? 0,
      }
      return acc
    }, {} as Record<string, { requested: number; fulfilled: number }>)

    const report = Array.from(citymSet).map(citym => {
      const forecasted = forecastsByCitym[citym] || 0
      const actual = actualsByCitym[citym]?.requested || 0
      const fulfilled = actualsByCitym[citym]?.fulfilled || 0

      const accuracy = forecasted > 0
        ? Math.round((actual / forecasted) * 100)
        : actual === 0 ? 100 : 0

      const variance = actual - forecasted
      const variancePercent = forecasted > 0
        ? Math.round((variance / forecasted) * 100)
        : 0

      return {
        citym,
        forecasted,
        actual,
        fulfilled,
        accuracy,
        variance,
        variancePercent,
      }
    })

    // Sort by variance (absolute value, highest first)
    report.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))

    // Calculate totals
    const totals = report.reduce(
      (acc, r) => ({
        forecasted: acc.forecasted + r.forecasted,
        actual: acc.actual + r.actual,
        fulfilled: acc.fulfilled + r.fulfilled,
      }),
      { forecasted: 0, actual: 0, fulfilled: 0 }
    )

    const overallAccuracy = totals.forecasted > 0
      ? Math.round((totals.actual / totals.forecasted) * 100)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        dateRange: {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd'),
        },
        weeks: planningWeeks.map(w => ({
          id: w.id,
          weekNumber: w.weekNumber,
          year: w.year,
          start: format(w.weekStart, 'MMM d'),
        })),
        report,
        totals: {
          ...totals,
          accuracy: overallAccuracy,
          variance: totals.actual - totals.forecasted,
        },
      },
    })
  } catch (error) {
    console.error('Forecast accuracy report error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate report' } },
      { status: 500 }
    )
  }
}
