import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const start = Date.now()

  try {
    // Simple query to test database connection speed
    await prisma.$queryRaw`SELECT 1`

    const dbLatency = Date.now() - start

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      dbLatency: `${dbLatency}ms`,
      message: dbLatency > 3000 ? 'Database is very slow (cold start)' :
               dbLatency > 1000 ? 'Database is slow' :
               'Database is fast'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
