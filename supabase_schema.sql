-- ==========================================================
-- SNACKORA: SUPABASE POSTGRESQL SCHEMA & REALTIME CONFIG
-- Paste and Run this in your Supabase SQL Editor (1-Click Run)
-- ==========================================================

-- 1. Create Tables

CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Product" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "price" DOUBLE PRECISION NOT NULL,
  "originalPrice" DOUBLE PRECISION,
  "discount" INTEGER NOT NULL DEFAULT 0,
  "imageUrl" TEXT NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 50,
  "available" BOOLEAN NOT NULL DEFAULT true,
  "brand" TEXT,
  "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
  "foodType" TEXT NOT NULL DEFAULT 'VEG',
  "taste" TEXT NOT NULL DEFAULT 'SPICY',
  "origin" TEXT NOT NULL DEFAULT 'INDIAN',
  "tags" TEXT NOT NULL DEFAULT '',
  "isTrending" BOOLEAN NOT NULL DEFAULT false,
  "isHalfPrice" BOOLEAN NOT NULL DEFAULT false,
  "earnSnackpoints" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT PRIMARY KEY,
  "phone" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "block" TEXT,
  "roomNumber" TEXT,
  "availableSnackpoints" INTEGER NOT NULL DEFAULT 0,
  "pendingSnackpoints" INTEGER NOT NULL DEFAULT 0,
  "totalEarned" INTEGER NOT NULL DEFAULT 0,
  "totalRedeemed" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT PRIMARY KEY,
  "orderNumber" TEXT UNIQUE NOT NULL,
  "customerName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "hostel" TEXT NOT NULL,
  "roomNumber" TEXT NOT NULL,
  "deliveryNote" TEXT,
  "subtotal" DOUBLE PRECISION NOT NULL,
  "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "couponDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "couponId" TEXT,
  "total" DOUBLE PRECISION NOT NULL,
  "paymentMethod" TEXT NOT NULL DEFAULT 'CASH_ON_DELIVERY',
  "status" TEXT NOT NULL DEFAULT 'ORDER_RECEIVED',
  "freeDeliveryApplied" BOOLEAN NOT NULL DEFAULT false,
  "deliveryThresholdAtOrder" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "snackpointsEarned" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "productName" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "quantity" INTEGER NOT NULL,
  "subtotal" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "StoreSetting" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT UNIQUE NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Offer" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT UNIQUE NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "discountType" TEXT NOT NULL,
  "discountValue" DOUBLE PRECISION NOT NULL,
  "minOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SnackpointTransaction" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "orderId" TEXT REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "points" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "description" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Coupon" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "pointsSpent" INTEGER NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "usedOrderId" TEXT
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'INFO',
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AdminMessage" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "orderId" TEXT REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "adminUser" TEXT NOT NULL DEFAULT 'admin',
  "message" TEXT NOT NULL,
  "messageType" TEXT NOT NULL DEFAULT 'CUSTOM',
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- 2. ENABLE SUPABASE REALTIME ON ORDERS TABLE
-- ==========================================================

-- Add the Order table to the Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE "Order";

-- Enable full row replica identity for detailed change tracking
ALTER TABLE "Order" REPLICA IDENTITY FULL;

-- ==========================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

-- Enable RLS
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StoreSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Offer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SnackpointTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminMessage" ENABLE ROW LEVEL SECURITY;

-- Allow public read access to catalog
CREATE POLICY "Public categories are viewable by everyone" ON "Category" FOR SELECT USING (true);
CREATE POLICY "Public products are viewable by everyone" ON "Product" FOR SELECT USING (true);
CREATE POLICY "Public offers are viewable by everyone" ON "Offer" FOR SELECT USING (true);
CREATE POLICY "Public settings are viewable by everyone" ON "StoreSetting" FOR SELECT USING (true);

-- Allow service-role & server API routes full management
CREATE POLICY "Server has full access to Category" ON "Category" USING (true) WITH CHECK (true);
CREATE POLICY "Server has full access to Product" ON "Product" USING (true) WITH CHECK (true);
CREATE POLICY "Server has full access to Customer" ON "Customer" USING (true) WITH CHECK (true);
CREATE POLICY "Server has full access to Order" ON "Order" USING (true) WITH CHECK (true);
CREATE POLICY "Server has full access to OrderItem" ON "OrderItem" USING (true) WITH CHECK (true);
CREATE POLICY "Server has full access to StoreSetting" ON "StoreSetting" USING (true) WITH CHECK (true);
CREATE POLICY "Server has full access to Offer" ON "Offer" USING (true) WITH CHECK (true);
CREATE POLICY "Server has full access to SnackpointTransaction" ON "SnackpointTransaction" USING (true) WITH CHECK (true);
CREATE POLICY "Server has full access to Coupon" ON "Coupon" USING (true) WITH CHECK (true);
CREATE POLICY "Server has full access to Notification" ON "Notification" USING (true) WITH CHECK (true);
CREATE POLICY "Server has full access to AdminMessage" ON "AdminMessage" USING (true) WITH CHECK (true);
