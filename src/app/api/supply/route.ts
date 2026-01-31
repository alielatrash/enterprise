import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, hasPermission } from '@/lib/auth'
import { createAuditLog, AuditAction } from '@/lib/audit'
import { createSupplyCommitmentSchema } from '@/lib/validations/supply'
import { notifyDemandPlannerOfSupply } from '@/lib/notifications'

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
    const citym = searchParams.get('citym')
    const supplierId = searchParams.get('supplierId')

    const where = {
      ...(planningWeekId && { planningWeekId }),
      ...(citym && { citym }),
      ...(supplierId && { supplierId }),
    }

    const commitments = await prisma.supplyCommitment.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        truckType: { select: { id: true, name: true } },
        planningWeek: { select: { id: true, weekStart: true, weekEnd: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [
        { citym: 'asc' },
        { supplier: { name: 'asc' } },
      ],
    })

    return NextResponse.json({
      success: true,
      data: commitments,
    })
  } catch (error) {
    console.error('Get supply commitments error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    if (!hasPermission(session.user.role, 'supply:write')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not authorized to create supply commitments' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validationResult = createSupplyCommitmentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validationResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Run validation queries in parallel
    const [planningWeek, existing] = await Promise.all([
      prisma.planningWeek.findUnique({ where: { id: data.planningWeekId } }),
      prisma.supplyCommitment.findFirst({
        where: {
          planningWeekId: data.planningWeekId,
          supplierId: data.supplierId,
          citym: data.citym,
          truckTypeId: data.truckTypeId || null,
        },
      }),
    ])

    if (!planningWeek) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Planning week not found' } },
        { status: 404 }
      )
    }

    if (planningWeek.isLocked) {
      return NextResponse.json(
        { success: false, error: { code: 'LOCKED', message: 'This planning week is locked' } },
        { status: 400 }
      )
    }

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'A commitment for this supplier and route already exists' } },
        { status: 409 }
      )
    }

    const totalCommitted = data.day1Committed + data.day2Committed + data.day3Committed +
                           data.day4Committed + data.day5Committed + data.day6Committed + data.day7Committed

    const commitment = await prisma.supplyCommitment.create({
      data: {
        ...data,
        totalCommitted,
        createdById: session.user.id,
      },
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        truckType: { select: { id: true, name: true } },
        planningWeek: { select: { id: true, weekStart: true, weekEnd: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Create audit log asynchronously (don't block the response)
    createAuditLog({
      userId: session.user.id,
      action: AuditAction.SUPPLY_COMMITTED,
      entityType: 'SupplyCommitment',
      entityId: commitment.id,
      metadata: { citym: data.citym, totalCommitted, supplierId: data.supplierId },
    }).catch((err) => console.error('Failed to create audit log:', err))

    // Notify demand planners who created forecasts for this route
    notifyDemandPlannerOfSupply(
      commitment.id,
      data.citym,
      commitment.supplier.name,
      `${session.user.firstName} ${session.user.lastName}`,
      data.planningWeekId
    ).catch((err) => console.error('Failed to send notifications:', err))

    return NextResponse.json({ success: true, data: commitment }, { status: 201 })
  } catch (error) {
    console.error('Create supply commitment error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
