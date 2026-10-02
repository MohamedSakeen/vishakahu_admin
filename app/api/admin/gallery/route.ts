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

// GET /api/admin/gallery - Fetch all gallery photos
export async function GET() {
  const auth = await requireAdminAuth();
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401, headers: NO_CACHE_HEADERS });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('gallery_images')
      .select('*')
      .order('is_pinned', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin DB Error] Failed to fetch gallery photos:', error.message);
      return NextResponse.json({ error: 'Database query failed.' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ data: data || [] }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error fetching gallery.' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

// POST /api/admin/gallery - Add new uploaded photo
export async function POST(req: Request) {
  const auth = await requireAdminAuth();
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.public_id || !body.secure_url) {
      return NextResponse.json({ error: 'Missing public_id or secure_url.' }, { status: 400 });
    }

    const { public_id, secure_url, category } = body;

    const { data, error } = await supabaseAdmin
      .from('gallery_images')
      .insert({
        public_id,
        secure_url,
        category: category || 'dojo',
      })
      .select()
      .single();

    if (error) {
      console.error('[Admin DB Error] Insert photo failed:', error.message);
      return NextResponse.json({ error: 'Failed to record image upload.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error saving image.' }, { status: 500 });
  }
}

// PATCH /api/admin/gallery - Update photo category or pin status
export async function PATCH(req: Request) {
  const auth = await requireAdminAuth();
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Image ID is required.' }, { status: 400 });
    }

    const { id, category, is_pinned } = body;
    const updates: Record<string, any> = {};

    if (category !== undefined) updates.category = category;
    if (is_pinned !== undefined) updates.is_pinned = Boolean(is_pinned);

    const { error } = await supabaseAdmin
      .from('gallery_images')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('[Admin DB Error] Update photo failed:', error.message);
      return NextResponse.json({ error: 'Failed to update image.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error updating image.' }, { status: 500 });
  }
}

// DELETE /api/admin/gallery - Delete photo by id
export async function DELETE(req: Request) {
  const auth = await requireAdminAuth();
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('gallery_images')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Admin DB Error] Delete photo failed:', error.message);
      return NextResponse.json({ error: 'Failed to delete image.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error deleting image.' }, { status: 500 });
  }
}
