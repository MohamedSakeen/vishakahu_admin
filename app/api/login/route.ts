import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const expectedUsername = process.env.ADMIN_UNAME || 'Vishakahu_academy';
    const expectedPassword = process.env.ADMIN_PASS || 'vishakahukarateschool';

    if (
      typeof username === 'string' &&
      typeof password === 'string' &&
      username.trim() === expectedUsername.trim() &&
      password === expectedPassword
    ) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid username or password. Please try again.' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Server authentication error.' },
      { status: 500 }
    );
  }
}
