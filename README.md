# SNACKORA

SNACKORA is a modern, full-stack hostel snack delivery and store management web application built with Next.js, React, Tailwind CSS, TypeScript, and Prisma.

---

## Features

- **Customer Storefront (`/`)**: Browse snacks, filter by category/diet/taste/origin, search, real-time cart, checkout with hostel room delivery details, track orders, redeem snackpoints, and use discount coupons.
- **Admin Dashboard (`/admin`)**: Secure admin management for inventory, product CRUD, category management, real-time order tracking with status pipelines, analytics, customer snackpoints, and store settings.
- **Unified Architecture**: Both customer website and admin portal are unified in a single Next.js application ready for seamless deployment.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router, Turbopack)
- **Frontend**: React 19, Tailwind CSS 4, Lucide Icons, Canvas Confetti
- **Backend**: Next.js Serverless API Routes
- **Database & ORM**: Prisma ORM with SQLite (Local Development) / PostgreSQL / MySQL (Production)
- **Authentication**: JWT session tokens via `jose` and `bcryptjs`

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
- `DATABASE_URL`: Connection string for your database (e.g. `file:./dev.db` for local SQLite)
- `ADMIN_USERNAME`: Admin login username
- `ADMIN_PASSWORD`: Admin login password
- `ADMIN_JWT_SECRET`: A secure random string for JWT token generation
- `NEXT_PUBLIC_APP_NAME`: `SNACKORA`

### 3. Initialize Database & Seed Data

```bash
npx prisma db push
npm run prisma db seed  # or npx tsx prisma/seed.ts
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

1. Import this repository into your [Vercel Dashboard](https://vercel.com).
2. Configure your production database (e.g., Supabase, Neon, Railway, PlanetScale, or Turso).
3. In Vercel Project Settings > **Environment Variables**, add:
   - `DATABASE_URL`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `ADMIN_JWT_SECRET`
   - `NEXT_PUBLIC_APP_NAME`
4. Deploy! Next.js and Prisma Client will automatically build via `postinstall` and `npm run build`.
