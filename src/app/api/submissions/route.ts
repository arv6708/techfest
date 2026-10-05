import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAuditEvent, getEventConfigWithAutoTransition } from '@/lib/db';
import { requireAuth, getCurrentUser } from '@/lib/auth';
import { EventConfig, SubmissionStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const participantIdParam = searchParams.get('participantId');

    if (session.user.role === 'ADMIN') {
      if (participantIdParam) {
        const sub = db.prepare(`
          SELECT s.*, p.full_name, p.participant_id, p.college, p.email 
          FROM submissions s
          JOIN participants p ON p.id = s.participant_id
          WHERE p.participant_id = ? OR s.participant_id = ?
        `).get(participantIdParam, participantIdParam);
        return NextResponse.json({ submission: sub || null });
      }

      // Return all submissions
      const allSubmissions = db.prepare(`
        SELECT s.*, p.full_name, p.participant_id, p.college, p.email, p.phone
        FROM submissions s
        JOIN participants p ON p.id = s.participant_id
        ORDER BY s.updated_at DESC
      `).all();
      return NextResponse.json({ submissions: allSubmissions });
    }

    // Participant retrieving own submission
    const participant = db.prepare(
      'SELECT id, participant_id FROM participants WHERE user_id = ? OR LOWER(email) = LOWER(?)'
    ).get(session.user.id, session.user.email) as any;

    if (!participant) {
      return NextResponse.json({ error: 'Participant record not found' }, { status: 404 });
    }

    const submission = db.prepare('SELECT * FROM submissions WHERE participant_id = ?').get(participant.id) as any;

    return NextResponse.json({
      submission: submission || null,
      participantId: participant.participant_id
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();

    // Find participant
    let participant: any;
    if (session.user.role === 'ADMIN') {
      const body = await req.clone().json();
      if (!body.participantId) {
        return NextResponse.json({ error: 'Admin must specify participantId' }, { status: 400 });
      }
      participant = db.prepare('SELECT * FROM participants WHERE id = ? OR participant_id = ?').get(body.participantId, body.participantId);
    } else {
      participant = db.prepare(
        'SELECT * FROM participants WHERE user_id = ? OR LOWER(email) = LOWER(?)'
      ).get(session.user.id, session.user.email);
    }

    if (!participant) {
      return NextResponse.json({ error: 'Participant record not found' }, { status: 404 });
    }

    // Server-Authoritative Event Check
    const eventConfig = getEventConfigWithAutoTransition(db);
    const now = new Date();
    const serverTimestamp = now.getTime();
    const endTimeMs = new Date(eventConfig.end_time).getTime();

    // Check if locked or deadline exceeded (unless admin override)
    if (session.user.role !== 'ADMIN') {
      if (eventConfig.state !== 'LIVE') {
        return NextResponse.json(
          {
            error: `Submissions are currently not open. Current event state is ${eventConfig.state}.`,
            serverTime: now.toISOString(),
            eventState: eventConfig.state
          },
          { status: 403 }
        );
      }

      if (serverTimestamp > endTimeMs) {
        return NextResponse.json(
          {
            error: 'The official 90-minute deadline has expired. Submissions are now closed.',
            serverTime: now.toISOString(),
            deadline: eventConfig.end_time
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const {
      project_name,
      project_description,
      problem_solved = '',
      key_features,
      live_website_url = '',
      github_url,
      demo_video_url = '',
      technologies_used,
      ai_tools_used = '',
      ai_usage_description = '',
      screenshot_url = '',
      isFinalSubmit = false
    } = body;

    // Check if existing submission is already locked
    const existingSubmission = db.prepare('SELECT * FROM submissions WHERE participant_id = ?').get(participant.id) as any;
    if (existingSubmission && existingSubmission.status === 'LOCKED' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'This submission has been locked and cannot be edited' }, { status: 403 });
    }

    if (isFinalSubmit) {
      if (!project_name || !project_description || !github_url || !technologies_used) {
        return NextResponse.json(
          { error: 'Project Name, Description, GitHub URL, and Technologies Used are required for final submission.' },
          { status: 400 }
        );
      }
    }

    const submissionStatus: SubmissionStatus = isFinalSubmit ? 'SUBMITTED' : 'DRAFT';
    const submittedAt = isFinalSubmit ? now.toISOString() : (existingSubmission?.submitted_at || null);

    const submissionId = existingSubmission?.id || ('sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));

    if (existingSubmission) {
      db.prepare(`
        UPDATE submissions SET
          project_name = ?,
          project_description = ?,
          problem_solved = ?,
          key_features = ?,
          live_website_url = ?,
          github_url = ?,
          demo_video_url = ?,
          technologies_used = ?,
          ai_tools_used = ?,
          ai_usage_description = ?,
          screenshot_url = ?,
          status = ?,
          submitted_at = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        project_name || existingSubmission.project_name,
        project_description || existingSubmission.project_description,
        problem_solved !== undefined ? problem_solved : (existingSubmission.problem_solved || ''),
        key_features || existingSubmission.key_features,
        live_website_url,
        github_url || existingSubmission.github_url,
        demo_video_url,
        technologies_used || existingSubmission.technologies_used,
        ai_tools_used,
        ai_usage_description,
        screenshot_url,
        submissionStatus,
        submittedAt,
        now.toISOString(),
        existingSubmission.id
      );
    } else {
      db.prepare(`
        INSERT INTO submissions (
          id, participant_id, project_name, project_description, problem_solved, key_features,
          live_website_url, github_url, demo_video_url, technologies_used,
          ai_tools_used, ai_usage_description, screenshot_url, status, submitted_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        submissionId,
        participant.id,
        project_name || 'Untitled Project',
        project_description || '',
        problem_solved || '',
        key_features || '',
        live_website_url,
        github_url || '',
        demo_video_url,
        technologies_used || '',
        ai_tools_used,
        ai_usage_description,
        screenshot_url,
        submissionStatus,
        submittedAt,
        now.toISOString(),
        now.toISOString()
      );
    }

    logAuditEvent(
      db,
      isFinalSubmit ? 'FINAL_SUBMISSION' : 'DRAFT_SUBMISSION',
      `Participant ${participant.participant_id} saved project "${project_name || 'Untitled'}" (${submissionStatus})`,
      participant.full_name
    );

    const saved = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId);

    return NextResponse.json({
      success: true,
      submission: saved,
      serverTime: now.toISOString(),
      message: isFinalSubmit ? 'Final project submitted successfully!' : 'Draft saved successfully.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required to delete submissions' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id || body.submissionId;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare(`
      SELECT s.*, p.participant_id, p.full_name 
      FROM submissions s 
      JOIN participants p ON p.id = s.participant_id 
      WHERE s.id = ?
    `).get(id) as any;

    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM submissions WHERE id = ?').run(id);

    logAuditEvent(
      db,
      'DELETE_SUBMISSION',
      `Admin deleted submission "${existing.project_name}" of participant ${existing.participant_id} (${existing.full_name})`,
      session.user.full_name || session.user.email
    );

    return NextResponse.json({
      success: true,
      message: `Submission "${existing.project_name}" for ${existing.participant_id} deleted successfully.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete submission' }, { status: 500 });
  }
}
