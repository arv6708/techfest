import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, parseParticipantRow, getEventConfigWithAutoTransition } from '@/lib/db';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || !session.user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    let participant = null;
    let submission = null;
    const db = getDb();

    if (session.user.role === 'PARTICIPANT') {
      const eventConfig = getEventConfigWithAutoTransition(db);
      if (eventConfig) {
        const now = new Date();
        const serverTimestamp = now.getTime();
        const startTimeMs = new Date(eventConfig.start_time).getTime();
        const isEventActive = 
          eventConfig.state === 'LIVE' || 
          eventConfig.state === 'SUBMISSION_CLOSED' || 
          eventConfig.state === 'JUDGING' || 
          eventConfig.state === 'RESULTS' || 
          serverTimestamp >= startTimeMs;

        if (!isEventActive && eventConfig.state === 'PRE_EVENT') {
          const res = NextResponse.json({
            authenticated: false,
            isPreEvent: true,
            error: 'Participant portal will be activated when the event begins on 7 October 2026 at 10:30 AM IST.'
          }, { status: 403 });
          res.cookies.delete('auth_token');
          return res;
        }
      }

      const pRow = db.prepare(
        'SELECT * FROM participants WHERE user_id = ? OR LOWER(email) = LOWER(?) LIMIT 1'
      ).get(session.user.id, session.user.email) as any;

      if (pRow) {
        participant = parseParticipantRow(pRow);
        const sRow = db.prepare('SELECT * FROM submissions WHERE participant_id = ?').get(participant.id) as any;
        if (sRow) {
          submission = sRow;
        }
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user,
      participantId: session.participantId || participant?.participant_id,
      participant,
      submission
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}
