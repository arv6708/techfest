import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAllIdeas, parseIdeaRow, logAuditEvent, getEventConfigWithAutoTransition } from '@/lib/db';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { EventConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const session = await getCurrentUser();
    const isAdmin = session?.user?.role === 'ADMIN';

    if (isAdmin) {
      const allIdeas = getAllIdeas(db, false);
      return NextResponse.json({
        isLocked: false,
        isAdmin: true,
        ideas: allIdeas
      });
    }

    // Check event status for participants/guests
    const config = getEventConfigWithAutoTransition(db);
    const now = new Date();
    const serverTimestamp = now.getTime();
    const startTimeMs = config ? new Date(config.start_time).getTime() : 0;
    const isLive = config?.state === 'LIVE' || (config && serverTimestamp >= startTimeMs);

    // If event has not started yet, do not reveal the inspiration content
    if (!isLive && config?.state === 'PRE_EVENT') {
      return NextResponse.json({
        isLocked: true,
        message: 'IDEAS & INSPIRATION WILL BE UNLOCKED WHEN THE EVENT BEGINS.',
        ideas: []
      });
    }

    const activeIdeas = getAllIdeas(db, true);
    return NextResponse.json({
      isLocked: false,
      ideas: activeIdeas
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch ideas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const {
      title,
      slug,
      short_problem,
      description,
      possible_directions = [],
      display_order = 0,
      is_active = 1
    } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and Description are required' }, { status: 400 });
    }

    const db = getDb();
    const id = 'idea_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const cleanSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const now = new Date().toISOString();

    const directionsJson = Array.isArray(possible_directions) 
      ? JSON.stringify(possible_directions)
      : (typeof possible_directions === 'string' ? JSON.stringify(possible_directions.split('\n').map(s => s.trim()).filter(Boolean)) : '[]');

    db.prepare(`
      INSERT INTO ideas (
        id, title, slug, short_problem, description, possible_directions, display_order, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      cleanSlug,
      short_problem ? short_problem.trim() : null,
      description.trim(),
      directionsJson,
      Number(display_order) || 0,
      is_active ? 1 : 0,
      now,
      now
    );

    logAuditEvent(
      db,
      'CREATE_IDEA',
      `Created inspiration idea: ${title.trim()} (${id})`,
      admin.full_name || admin.email
    );

    const created = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id);
    return NextResponse.json({ success: true, idea: parseIdeaRow(created) }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Failed to create idea' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const {
      id,
      title,
      slug,
      short_problem,
      description,
      possible_directions,
      display_order,
      is_active
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const newTitle = title !== undefined ? title.trim() : existing.title;
    const newSlug = slug !== undefined 
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') 
      : existing.slug;
    const newShortProblem = short_problem !== undefined ? short_problem.trim() : existing.short_problem;
    const newDesc = description !== undefined ? description.trim() : existing.description;
    
    let newDirectionsJson = existing.possible_directions;
    if (possible_directions !== undefined) {
      newDirectionsJson = Array.isArray(possible_directions)
        ? JSON.stringify(possible_directions)
        : (typeof possible_directions === 'string' ? JSON.stringify(possible_directions.split('\n').map(s => s.trim()).filter(Boolean)) : '[]');
    }

    const newOrder = display_order !== undefined ? Number(display_order) : existing.display_order;
    const newActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE ideas SET
        title = ?,
        slug = ?,
        short_problem = ?,
        description = ?,
        possible_directions = ?,
        display_order = ?,
        is_active = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      newTitle,
      newSlug,
      newShortProblem,
      newDesc,
      newDirectionsJson,
      newOrder,
      newActive,
      now,
      id
    );

    logAuditEvent(
      db,
      'UPDATE_IDEA',
      `Updated inspiration idea: ${newTitle} (${id})`,
      admin.full_name || admin.email
    );

    const updated = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id);
    return NextResponse.json({ success: true, idea: parseIdeaRow(updated) });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Failed to update idea' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM ideas WHERE id = ?').run(id);

    logAuditEvent(
      db,
      'DELETE_IDEA',
      `Deleted inspiration idea: ${existing.title} (${id})`,
      admin.full_name || admin.email
    );

    return NextResponse.json({ success: true, message: `Idea ${existing.title} deleted.` });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Failed to delete idea' }, { status: 500 });
  }
}
