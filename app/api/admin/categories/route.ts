import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

async function requireAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

// GET /api/admin/categories - Fetch all categories
export async function GET() {
  const auth = await requireAdminAuth();
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('gallery_categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Admin DB Error] Failed to fetch categories:', error.message);
      return NextResponse.json({ error: 'Database query failed.' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error fetching categories.' }, { status: 500 });
  }
}

// POST /api/admin/categories - Create new category
export async function POST(req: Request) {
  const auth = await requireAdminAuth();
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const name = body?.name ? String(body.name).trim().toLowerCase() : '';

    if (!name || name.length < 2 || name.length > 50) {
      return NextResponse.json({ error: 'Valid category name is required.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('gallery_categories')
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error('[Admin DB Error] Insert category failed:', error.message);
      return NextResponse.json({ error: 'Failed to create category.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error creating category.' }, { status: 500 });
  }
}

// DELETE /api/admin/categories - Delete category
export async function DELETE(req: Request) {
  const auth = await requireAdminAuth();
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const categoryName = searchParams.get('name');

    if (!categoryName) {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
    }

    // 1. Move existing images to 'unlabeled'
    await supabaseAdmin
      .from('gallery_images')
      .update({ category: 'unlabeled' })
      .eq('category', categoryName);

    // 2. Delete category row
    const { error } = await supabaseAdmin
      .from('gallery_categories')
      .delete()
      .eq('name', categoryName);

    if (error) {
      console.error('[Admin DB Error] Delete category failed:', error.message);
      return NextResponse.json({ error: 'Failed to delete category.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error deleting category.' }, { status: 500 });
  }
}
