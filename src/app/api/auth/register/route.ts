import { NextRequest, NextResponse } from 'next/server';
import { getDb, getNextParticipantId, findDuplicateParticipant, logAuditEvent, parseParticipantRow } from '@/lib/db';
import { hashPassword, signToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      full_name,
      email,
      phone,
      college,
      course,
      state = 'Kerala',
      district = 'Kannur',
      password,
      custom_fields = {}
    } = body;

    // Validation
    if (!full_name || !email || !phone || !college || !course || !password) {
      return NextResponse.json(
        { error: 'Please fill in all required fields (Name, Email, Phone, College, Course, Password)' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    const db = getDb();

    // Check duplicate
    const duplicateCheck = findDuplicateParticipant(db, { email: cleanEmail, phone: cleanPhone });
    if (duplicateCheck.match) {
      return NextResponse.json(
        {
          error: `A participant with this ${duplicateCheck.matchedBy === 'email' ? 'email address' : 'phone number'} is already registered (${duplicateCheck.match.participant_id}). Please log in instead.`
        },
        { status: 409 }
      );
    }

    // Check if user account exists
    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(cleanEmail);
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const userId = 'usr_' + Date.now();
    const participantDbId = 'part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    // Atomic transaction to generate ID and insert
    let participantId = '';
    const registerTx = db.transaction(() => {
      participantId = getNextParticipantId(db);

      // Insert User
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, full_name, created_at, updated_at)
        VALUES (?, ?, ?, 'PARTICIPANT', ?, ?, ?)
      `).run(userId, cleanEmail, hashedPassword, full_name.trim(), now, now);

      // Insert Participant
      db.prepare(`
        INSERT INTO participants (
          id, participant_id, user_id, full_name, email, phone, college, course,
          state, district, payment_status, payment_reference, registration_source,
          registration_date, status, custom_fields, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NULL, 'Website', ?, 'REGISTERED', ?, ?, ?)
      `).run(
        participantDbId,
        participantId,
        userId,
        full_name.trim(),
        cleanEmail,
        cleanPhone,
        college.trim(),
        course.trim(),
        state.trim(),
        district.trim(),
        now,
        JSON.stringify(custom_fields || {}),
        now,
        now
      );

      logAuditEvent(
        db,
        'WEBSITE_REGISTRATION',
        `New participant registered: ${full_name} (${participantId}) from ${college}`,
        full_name
      );
    });

    registerTx();

    const createdParticipant = db.prepare('SELECT * FROM participants WHERE id = ?').get(participantDbId);

    const token = signToken({
      userId,
      email: cleanEmail,
      role: 'PARTICIPANT',
      participantId,
      fullName: full_name.trim()
    });

    const response = NextResponse.json({
      success: true,
      message: 'Registration successful! Welcome to VibeCode.',
      participantId,
      user: {
        id: userId,
        email: cleanEmail,
        role: 'PARTICIPANT',
        fullName: full_name.trim()
      },
      participant: parseParticipantRow(createdParticipant)
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 });
  }
}
