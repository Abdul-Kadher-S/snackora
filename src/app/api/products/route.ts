import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { broadcastProductEvent } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categorySlug = searchParams.get('category');
    const categoryId = searchParams.get('categoryId');
    const foodType = searchParams.get('foodType');
    const taste = searchParams.get('taste');
    const origin = searchParams.get('origin');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const inStockOnly = searchParams.get('inStockOnly') === 'true';
    const isTrending = searchParams.get('isTrending');
    const isHalfPrice = searchParams.get('isHalfPrice');
    const earnSnackpoints = searchParams.get('earnSnackpoints');
    const sortBy = searchParams.get('sortBy') || 'recommended';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {};

    if (!includeInactive) {
      where.available = true;
    }

    if (inStockOnly) {
      where.stock = { gt: 0 };
    }

    if (isTrending === 'true') {
      where.isTrending = true;
    }

    if (isHalfPrice === 'true') {
      where.isHalfPrice = true;
    }

    if (earnSnackpoints === 'true') {
      where.earnSnackpoints = true;
    } else if (earnSnackpoints === 'false') {
      where.earnSnackpoints = false;
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { brand: { contains: q } },
        { tags: { contains: q } },
        { category: { name: { contains: q } } },
      ];
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    } else if (categoryId) {
      where.categoryId = categoryId;
    }

    if (foodType && foodType !== 'ALL') {
      where.foodType = foodType;
    }

    if (taste && taste !== 'ALL') {
      where.taste = taste;
    }

    if (origin && origin !== 'ALL') {
      where.origin = origin;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'discount':
        orderBy = { discount: 'desc' };
        break;
      case 'popular':
        orderBy = { rating: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'alphabetical':
        orderBy = { name: 'asc' };
        break;
      case 'snackpoints':
        orderBy = [{ earnSnackpoints: 'desc' }, { price: 'desc' }];
        break;
      case 'recommended':
      default:
        orderBy = [{ isTrending: 'desc' }, { rating: 'desc' }, { discount: 'desc' }];
        break;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Admin login required.' }, { status: 401 });
    }

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
      isTrending,
      isHalfPrice,
      earnSnackpoints,
    } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Product name must be at least 2 characters.' }, { status: 400 });
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 1 || numPrice > 10000) {
      return NextResponse.json({ error: 'Product price must be between ₹1 and ₹10,000.' }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'Please select a valid category.' }, { status: 400 });
    }

    // Handle half price: auto-calculate price as 50% of original
    let finalPrice = numPrice;
    let finalOriginalPrice = originalPrice ? parseFloat(originalPrice) : null;
    let finalDiscount = discount ? parseInt(discount) : 0;

    if (isHalfPrice && finalOriginalPrice) {
      finalPrice = Math.round(finalOriginalPrice / 2);
      finalDiscount = 50;
    }

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        description: (description || '').trim(),
        categoryId,
        price: finalPrice,
        originalPrice: finalOriginalPrice,
        discount: finalDiscount,
        imageUrl: imageUrl?.trim() || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
        stock: stock !== undefined ? parseInt(stock) : 50,
        available: available !== undefined ? Boolean(available) : true,
        brand: brand?.trim() || null,
        rating: rating ? parseFloat(rating) : 4.8,
        foodType: foodType || 'VEG',
        taste: taste || 'SPICY',
        origin: origin || 'INDIAN',
        tags: (tags || '').trim(),
        isTrending: Boolean(isTrending),
        isHalfPrice: Boolean(isHalfPrice),
        earnSnackpoints: earnSnackpoints !== undefined ? Boolean(earnSnackpoints) : true,
      },
      include: {
        category: true,
      },
    });

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/');
      revalidatePath('/search');
      revalidatePath('/categories');
    } catch {}

    broadcastProductEvent('PRODUCT_CREATED', newProduct);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
