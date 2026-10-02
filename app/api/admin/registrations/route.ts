import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

async function requireAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

// GET /api/admin/registrations - Fetch all student registrations
export async function GET() {
  const auth = await requireAdminAuth();
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401, headers: NO_CACHE_HEADERS });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('student_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin DB Error] Failed to fetch registrations:', error.message);
      return NextResponse.json({ error: 'Database query failed.' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ data: data || [] }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error fetching registrations.' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

// DELETE /api/admin/registrations - Delete a student registration by id
export async function DELETE(req: Request) {
  const auth = await requireAdminAuth();
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    const id = idParam ? parseInt(idParam, 10) : null;

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'Valid registration ID is required.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('student_registrations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Admin DB Error] Failed to delete registration:', error.message);
      return NextResponse.json({ error: 'Failed to delete record.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error processing deletion.' }, { status: 500 });
  }
}
