import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch related products from the same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        available: true,
      },
      take: 4,
    });

    return NextResponse.json({ ...product, relatedProducts });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

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

    const {
      name,
      description,
      categoryId,
      price,
      originalPrice,
      discount,
      imageUrl,
      stock,
      available,
      brand,
      rating,
      foodType,
      taste,
      origin,
      tags,
      earnSnackpoints,
      isTrending,
      isHalfPrice,
    } = body;

    // Validate price if updated
    if (price !== undefined) {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice < 10 || numPrice > 1000) {
        return NextResponse.json({ error: 'Product price must be between ₹10 and ₹1,000.' }, { status: 400 });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(categoryId !== undefined && { categoryId }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseFloat(originalPrice) : null }),
        ...(discount !== undefined && { discount: parseInt(discount) || 0 }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl.trim() }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(available !== undefined && { available: Boolean(available) }),
        ...(brand !== undefined && { brand: brand ? brand.trim() : null }),
        ...(rating !== undefined && { rating: parseFloat(rating) }),
        ...(foodType !== undefined && { foodType }),
        ...(taste !== undefined && { taste }),
        ...(origin !== undefined && { origin }),
        ...(tags !== undefined && { tags: tags.trim() }),
        ...(earnSnackpoints !== undefined && { earnSnackpoints: Boolean(earnSnackpoints) }),
        ...(isTrending !== undefined && { isTrending: Boolean(isTrending) }),
        ...(isHalfPrice !== undefined && { isHalfPrice: Boolean(isHalfPrice) }),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
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
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}
