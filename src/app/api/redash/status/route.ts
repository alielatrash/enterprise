import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSyncStatus } from '@/lib/redash'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const status = await getSyncStatus()

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('Get sync status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get sync status',
        },
      },
      { status: 500 }
    )
  }
}
