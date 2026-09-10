import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Admin login required.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, slug, description, imageUrl, active, sortOrder } = body;

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(slug !== undefined && {
          slug: slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
        }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
        ...(active !== undefined && { active: Boolean(active) }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Admin login required.' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      // Cleanly delete all associated products in category first
      await tx.product.deleteMany({
        where: { categoryId: id },
      });

      // Delete the category
      await tx.category.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
