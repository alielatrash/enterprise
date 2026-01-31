import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createAuditLog, AuditAction } from '@/lib/audit'
import { createCitySchema, searchParamsSchema } from '@/lib/validations/repositories'

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
    const params = searchParamsSchema.parse({
      q: searchParams.get('q'),
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: searchParams.get('sortOrder'),
      isActive: searchParams.get('isActive'),
    })

    const region = searchParams.get('region')

    const where = {
      ...(params.q && {
        OR: [
          { name: { contains: params.q, mode: 'insensitive' as const } },
          { nameAr: { contains: params.q, mode: 'insensitive' as const } },
          { code: { contains: params.q, mode: 'insensitive' as const } },
        ],
      }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(region && { region }),
    }

    const [cities, total] = await Promise.all([
      prisma.city.findMany({
        where,
        orderBy: { [params.sortBy || 'name']: params.sortOrder },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.city.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: cities,
      meta: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    })
  } catch (error) {
    console.error('Get cities error:', error)
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

    const body = await request.json()
    const validationResult = createCitySchema.safeParse(body)

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

    const { name, nameAr, code, region } = validationResult.data

    const existing = await prisma.city.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          ...(code ? [{ code: { equals: code, mode: 'insensitive' as const } }] : []),
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DUPLICATE', message: 'A city with this name or code already exists' },
        },
        { status: 409 }
      )
    }

    const city = await prisma.city.create({
      data: { name, nameAr, code, region },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.CITY_CREATED,
      entityType: 'City',
      entityId: city.id,
      metadata: { name, code, region },
    })

    return NextResponse.json({ success: true, data: city }, { status: 201 })
  } catch (error) {
    console.error('Create city error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
