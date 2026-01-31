import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const updateRoleSchema = z.object({
  role: z.enum(['DEMAND_PLANNER', 'SUPPLY_PLANNER', 'ADMIN']),
})

// Update user role (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const { userId } = await params
    const body = await request.json()
    const parsed = updateRoleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid role' } },
        { status: 400 }
      )
    }

    // Prevent changing own role
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot change your own role' } },
        { status: 403 }
      )
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: parsed.data.role },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        metadata: { previousRole: user.role, newRole: parsed.data.role },
      },
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update role' } },
      { status: 500 }
    )
  }
}
