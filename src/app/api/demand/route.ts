import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, hasPermission } from '@/lib/auth'
import { createAuditLog, AuditAction } from '@/lib/audit'
import { generateCitym } from '@/lib/citym'
import { createDemandForecastSchema } from '@/lib/validations/demand'
import { notifySupplyPlannersOfDemand } from '@/lib/notifications'

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
    const clientId = searchParams.get('clientId')
    const citym = searchParams.get('citym')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)

    const where = {
      ...(planningWeekId && { planningWeekId }),
      ...(clientId && { clientId }),
      ...(citym && { citym }),
    }

    // Run count and data query in parallel
    const [totalCount, forecasts] = await Promise.all([
      prisma.demandForecast.count({ where }),
      prisma.demandForecast.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, code: true } },
          pickupCity: { select: { id: true, name: true, code: true, region: true } },
          dropoffCity: { select: { id: true, name: true, code: true, region: true } },
          truckType: { select: { id: true, name: true } },
          planningWeek: { select: { id: true, weekStart: true, weekEnd: true, year: true, weekNumber: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [
          { client: { name: 'asc' } },
          { citym: 'asc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    return NextResponse.json({
      success: true,
      data: forecasts,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    })
  } catch (error) {
    console.error('Get demand forecasts error:', error)
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

    // Check permission
    if (!hasPermission(session.user.role, 'demand:write')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not authorized to create demand forecasts' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validationResult = createDemandForecastSchema.safeParse(body)

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

    // Run all validation queries in parallel
    const [planningWeek, pickupCity, dropoffCity, existing] = await Promise.all([
      prisma.planningWeek.findUnique({ where: { id: data.planningWeekId } }),
      prisma.city.findUnique({ where: { id: data.pickupCityId }, select: { name: true } }),
      prisma.city.findUnique({ where: { id: data.dropoffCityId }, select: { name: true } }),
      prisma.demandForecast.findFirst({
        where: {
          planningWeekId: data.planningWeekId,
          clientId: data.clientId,
          pickupCityId: data.pickupCityId,
          dropoffCityId: data.dropoffCityId,
          truckTypeId: data.truckTypeId,
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
        { success: false, error: { code: 'LOCKED', message: 'This planning week is locked and cannot be edited' } },
        { status: 400 }
      )
    }

    if (!pickupCity || !dropoffCity) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'City not found' } },
        { status: 404 }
      )
    }

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'A forecast for this route and client already exists' } },
        { status: 409 }
      )
    }

    const citym = generateCitym(pickupCity.name, dropoffCity.name)
    const totalLoads = data.day1Loads + data.day2Loads + data.day3Loads + data.day4Loads +
                       data.day5Loads + data.day6Loads + data.day7Loads

    const forecast = await prisma.demandForecast.create({
      data: {
        planningWeekId: data.planningWeekId,
        clientId: data.clientId,
        pickupCityId: data.pickupCityId,
        dropoffCityId: data.dropoffCityId,
        vertical: data.vertical,
        truckTypeId: data.truckTypeId,
        day1Loads: data.day1Loads,
        day2Loads: data.day2Loads,
        day3Loads: data.day3Loads,
        day4Loads: data.day4Loads,
        day5Loads: data.day5Loads,
        day6Loads: data.day6Loads,
        day7Loads: data.day7Loads,
        citym,
        totalLoads,
        createdById: session.user.id,
      },
      include: {
        client: { select: { id: true, name: true, code: true } },
        pickupCity: { select: { id: true, name: true, code: true, region: true } },
        dropoffCity: { select: { id: true, name: true, code: true, region: true } },
        truckType: { select: { id: true, name: true } },
        planningWeek: { select: { id: true, weekStart: true, weekEnd: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Create audit log asynchronously (don't block the response)
    createAuditLog({
      userId: session.user.id,
      action: AuditAction.DEMAND_CREATED,
      entityType: 'DemandForecast',
      entityId: forecast.id,
      metadata: { citym, totalLoads, clientId: data.clientId },
    }).catch((err) => console.error('Failed to create audit log:', err))

    // Notify supply planners of new demand forecast
    notifySupplyPlannersOfDemand(
      forecast.id,
      forecast.client.name,
      citym,
      `${session.user.firstName} ${session.user.lastName}`
    ).catch((err) => console.error('Failed to send notifications:', err))

    return NextResponse.json({ success: true, data: forecast }, { status: 201 })
  } catch (error) {
    console.error('Create demand forecast error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
