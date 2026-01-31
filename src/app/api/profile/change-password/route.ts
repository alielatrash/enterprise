import { NextResponse } from 'next/server'
import { getSession, invalidateUserSessions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/password'
import { changePasswordSchema } from '@/lib/validations/profile'
import { createAuditLog } from '@/lib/audit'

// POST /api/profile/change-password - Change user password
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = changePasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validation.data

    // Get user's current password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // Check if user has a password (they might be OAuth-only user)
    if (!user.passwordHash) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_OPERATION', message: 'Cannot change password for OAuth-only accounts' } },
        { status: 400 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' } },
        { status: 401 }
      )
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    })

    // Invalidate all sessions except current one (force re-login on other devices)
    await prisma.session.deleteMany({
      where: {
        userId: session.user.id,
        id: { not: session.sessionId },
      },
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'USER_PASSWORD_CHANGED',
      entityType: 'User',
      entityId: session.user.id,
      metadata: {
        message: 'User changed their password',
        sessionsInvalidated: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Password changed successfully. Other sessions have been logged out.' },
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to change password' } },
      { status: 500 }
    )
  }
}
