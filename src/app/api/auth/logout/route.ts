import { NextResponse } from 'next/server'
import { getSession, deleteSession, clearSessionCookie } from '@/lib/auth'
import { createAuditLog, AuditAction } from '@/lib/audit'

export async function POST() {
  try {
    const session = await getSession()

    if (session) {
      // Audit log
      await createAuditLog({
        userId: session.user.id,
        action: AuditAction.USER_LOGGED_OUT,
        entityType: 'User',
        entityId: session.user.id,
      })

      // Delete session from database
      await deleteSession(session.sessionId)
    }

    // Clear cookie
    await clearSessionCookie()

    return NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    })
  } catch (error) {
    console.error('Logout error:', error)
    // Clear cookie even if there's an error
    await clearSessionCookie()

    return NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    })
  }
}
