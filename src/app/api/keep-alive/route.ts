import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This endpoint keeps the database connection warm
// Call it periodically to prevent Neon cold starts
export async function GET() {
  try {
    // Simple query to keep connection alive
    const result = await prisma.$queryRaw`SELECT 1 as ping`

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      result,
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
