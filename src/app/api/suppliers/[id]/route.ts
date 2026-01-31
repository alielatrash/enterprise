import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createAuditLog, AuditAction } from '@/lib/audit'
import { updateSupplierSchema } from '@/lib/validations/repositories'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const { id } = await params
    const supplier = await prisma.supplier.findUnique({ where: { id } })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: supplier })
  } catch (error) {
    console.error('Get supplier error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validationResult = updateSupplierSchema.safeParse(body)

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

    const existing = await prisma.supplier.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } },
        { status: 404 }
      )
    }

    const { name, code } = validationResult.data

    if (name || code) {
      const duplicate = await prisma.supplier.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(name ? [{ name: { equals: name, mode: 'insensitive' as const } }] : []),
            ...(code ? [{ code: { equals: code, mode: 'insensitive' as const } }] : []),
          ],
        },
      })

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'DUPLICATE', message: 'A supplier with this name or code already exists' },
          },
          { status: 409 }
        )
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: validationResult.data,
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.SUPPLIER_UPDATED,
      entityType: 'Supplier',
      entityId: supplier.id,
      metadata: { before: existing, after: supplier },
    })

    return NextResponse.json({ success: true, data: supplier })
  } catch (error) {
    console.error('Update supplier error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const { id } = await params
    const existing = await prisma.supplier.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } },
        { status: 404 }
      )
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.SUPPLIER_DELETED,
      entityType: 'Supplier',
      entityId: supplier.id,
      metadata: { name: existing.name },
    })

    return NextResponse.json({ success: true, data: { message: 'Supplier deactivated' } })
  } catch (error) {
    console.error('Delete supplier error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
