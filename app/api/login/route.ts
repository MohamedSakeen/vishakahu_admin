import { NextResponse } from 'next/server';
import { createSessionToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from '../../../lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json().catch(() => ({}));

    const rawExpectedUname = process.env.ADMIN_UNAME || 'Vishakahu_Academy';
    const rawExpectedPass = process.env.ADMIN_PASS || 'vishakahuadmin@tirunelveli';

    const expectedUsername = rawExpectedUname.trim();
    const expectedPassword = rawExpectedPass.trim();

    if (
      typeof username === 'string' &&
      typeof password === 'string' &&
      username.trim() === expectedUsername &&
      password === expectedPassword
    ) {
      // 1. Generate a cryptographically signed HMAC session token
      const token = createSessionToken(username.trim());

      // 2. Prepare JSON response
      const response = NextResponse.json({
        success: true,
        message: 'Authentication successful.',
      });

      // 3. Set HttpOnly, Secure, SameSite=Lax cookie
      response.cookies.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_DURATION_SECONDS,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid username or password. Please try again.' },
      { status: 401 }
    );
  } catch (err: any) {
    console.error('[Auth Error] /api/login error:', err);
    return NextResponse.json(
      { success: false, error: 'Server authentication error.' },
      { status: 500 }
    );
  }
}
