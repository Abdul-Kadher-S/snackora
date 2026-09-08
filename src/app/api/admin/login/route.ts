import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials, signAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Please enter both Admin ID and password.' },
        { status: 400 }
      );
    }

    const isValid = validateAdminCredentials(username.trim(), password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please check your Admin ID and password.' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await signAdminToken({ username: username.trim(), role: 'admin' });

    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful',
      user: { username: username.trim(), role: 'admin' },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error during login' }, { status: 500 });
  }
}
