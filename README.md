# SNACKORA

SNACKORA is a modern, full-stack hostel snack delivery and store management web application built with Next.js, React, Tailwind CSS, TypeScript, Prisma, and Supabase Realtime.

---

## Features

- **Customer Storefront (`/`)**: Browse snacks, filter by category/diet/taste/origin, search, real-time cart, checkout with hostel room delivery details, track orders, redeem snackpoints, and use discount coupons.
- **Admin Dashboard (`/admin`)**: Secure admin management with **Supabase Realtime Live Order Dispatching**, instant status progression, audio chimes on new orders, live analytics, customer snackpoints, and store settings.
- **Unified Architecture**: Both customer website and admin portal are unified in a single Next.js application ready for seamless deployment.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 16 (App Router, Turbopack)
- **Frontend**: React 19, Tailwind CSS 4, Lucide Icons, Canvas Confetti
- **Realtime**: [Supabase Realtime](https://supabase.com/docs/guides/realtime) (WebSockets & Postgres CDC)
- **Backend**: Next.js Serverless API Routes
- **Database & ORM**: Prisma ORM with SQLite (Local Development) / Supabase PostgreSQL (Production)
- **Authentication**: JWT session tokens via `jose` and `bcryptjs`

---

## Supabase Realtime Setup

1. In your **[Supabase Project Dashboard](https://supabase.com)**, go to the **SQL Editor**.
2. Open [`supabase_schema.sql`](./supabase_schema.sql) and paste its contents into the SQL Editor, then click **Run**.
3. This creates all PostgreSQL tables and enables Realtime on the `Order` table:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE "Order";
   ```
4. Copy your Supabase Project URL and Anon Key from **Project Settings → API**.

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Abdul-Kadher-S/snackora.git
cd snackora
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set the required environment variables:
- `DATABASE_URL`: Connection string for your database (e.g. `file:./dev.db` for local SQLite or Supabase PostgreSQL URI)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (`https://xyz.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon/publishable key
- `ADMIN_USERNAME`: Admin login username
- `ADMIN_PASSWORD`: Admin login password
- `ADMIN_JWT_SECRET`: A secure random string for JWT token generation
- `NEXT_PUBLIC_APP_NAME`: `SNACKORA`

### 3. Initialize Database & Seed Data

```bash
npx prisma db push
npm run prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build

To test the production build locally:

```bash
npm run build
npm start
```

---

## Vercel Deployment Guide

1. In your existing Vercel Project (**`snackora-omega`**), go to **Settings → Environment Variables** and add:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `ADMIN_JWT_SECRET`
   - `NEXT_PUBLIC_APP_NAME`
2. Trigger a redeploy. Real-time orders will now stream live into the Admin Dashboard!
