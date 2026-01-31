import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUpcomingWeeks, formatWeekDisplay } from '@/lib/planning-week'

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
    const count = parseInt(searchParams.get('count') || '8', 10)

    const weeks = await getUpcomingWeeks(count)

    const formattedWeeks = weeks.map(week => ({
      ...week,
      display: formatWeekDisplay(week.weekStart, week.weekEnd),
    }))

    return NextResponse.json({
      success: true,
      data: formattedWeeks,
    })
  } catch (error) {
    console.error('Get planning weeks error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
