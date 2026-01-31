import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cloudinary, AVATAR_FOLDER, AVATAR_TRANSFORMATION, getPublicIdFromUrl } from '@/lib/cloudinary'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// POST /api/profile/avatar - Upload avatar to Cloudinary
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('avatar') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File must be JPEG, PNG, or WebP' } },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File size must be less than 5MB' } },
        { status: 400 }
      )
    }

    // Get current user's avatar URL to delete old one later
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    })

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await new Promise<{
      secure_url: string
      public_id: string
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: AVATAR_FOLDER,
          public_id: `${session.user.id}-${Date.now()}`,
          transformation: [AVATAR_TRANSFORMATION],
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result as { secure_url: string; public_id: string })
        }
      )

      uploadStream.end(buffer)
    })

    // Update user record with new avatar URL
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: uploadResult.secure_url },
    })

    // Delete old avatar from Cloudinary if it exists
    if (user?.avatarUrl) {
      const oldPublicId = getPublicIdFromUrl(user.avatarUrl)
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId)
        } catch (error) {
          console.error('Error deleting old avatar from Cloudinary:', error)
          // Don't fail the request if old avatar deletion fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { avatarUrl: uploadResult.secure_url },
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to upload avatar' } },
      { status: 500 }
    )
  }
}

// DELETE /api/profile/avatar - Delete avatar from Cloudinary
export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // Get current avatar URL
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    })

    if (!user?.avatarUrl) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No avatar to delete' } },
        { status: 404 }
      )
    }

    // Extract public_id from URL
    const publicId = getPublicIdFromUrl(user.avatarUrl)

    // Delete from Cloudinary
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId)
      } catch (error) {
        console.error('Error deleting avatar from Cloudinary:', error)
        // Continue to update database even if Cloudinary deletion fails
      }
    }

    // Update database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: null },
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Avatar removed successfully' },
    })
  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete avatar' } },
      { status: 500 }
    )
  }
}
