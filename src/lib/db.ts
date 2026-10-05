import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { 
  Participant, 
  User, 
  Submission, 
  EventConfig, 
  EventAuditLog, 
  ImportHistoryItem,
  IdeaInspiration,
  Role,
  PaymentStatus,
  ParticipantStatus,
  RegistrationSource,
  EventState
} from './types';

// Ensure data directory exists
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'vibecode.db');

declare global {
  // eslint-disable-next-line no-var
  var __vibecode_db: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (global.__vibecode_db) {
    initSchema(global.__vibecode_db);
    return global.__vibecode_db;
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initSchema(db);

  if (process.env.NODE_ENV !== 'production') {
    global.__vibecode_db = db;
  }

  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'PARTICIPANT',
      full_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      participant_id TEXT UNIQUE NOT NULL,
      user_id TEXT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE,
      phone TEXT NOT NULL,
      college TEXT NOT NULL,
      course TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'Kerala',
      district TEXT NOT NULL DEFAULT 'Kannur',
      payment_status TEXT NOT NULL DEFAULT 'PENDING',
      payment_reference TEXT,
      registration_source TEXT NOT NULL DEFAULT 'Website',
      registration_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'REGISTERED',
      custom_fields TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      participant_id TEXT UNIQUE NOT NULL,
      project_name TEXT NOT NULL,
      project_description TEXT NOT NULL,
      key_features TEXT NOT NULL,
      live_website_url TEXT,
      github_url TEXT NOT NULL,
      demo_video_url TEXT,
      technologies_used TEXT NOT NULL,
      ai_tools_used TEXT,
      ai_usage_description TEXT,
      screenshot_url TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(participant_id) REFERENCES participants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      short_problem TEXT,
      description TEXT NOT NULL,
      possible_directions TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS event_config (
      id TEXT PRIMARY KEY,
      event_name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      state TEXT NOT NULL,
      venue TEXT NOT NULL,
      fee INTEGER NOT NULL,
      prize_pool INTEGER NOT NULL,
      challenge_brief TEXT,
      results_info TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS event_audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      actor TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS import_history (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      imported_by TEXT NOT NULL,
      date TEXT NOT NULL,
      rows_processed INTEGER NOT NULL,
      rows_added INTEGER NOT NULL,
      rows_updated INTEGER NOT NULL,
      duplicates INTEGER NOT NULL,
      invalid_rows INTEGER NOT NULL,
      details TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
    CREATE INDEX IF NOT EXISTS idx_participants_phone ON participants(phone);
    CREATE INDEX IF NOT EXISTS idx_participants_participant_id ON participants(participant_id);
    CREATE INDEX IF NOT EXISTS idx_participants_college ON participants(college);
    CREATE INDEX IF NOT EXISTS idx_participants_payment ON participants(payment_status);
    CREATE INDEX IF NOT EXISTS idx_participants_source ON participants(registration_source);
  `);

  // Safe schema migrations
  try {
    db.prepare('ALTER TABLE submissions ADD COLUMN problem_solved TEXT').run();
  } catch {}
  try {
    db.prepare('ALTER TABLE ideas ADD COLUMN short_problem TEXT').run();
  } catch {}

  // Seed arbeon Admin user
  const arbeonCheck = db.prepare("SELECT id FROM users WHERE LOWER(email) = 'arbeon@tantra.vjec.ac.in' OR LOWER(full_name) = 'arbeon'").get() as any;
  const arbeonHash = bcrypt.hashSync('arbeon123', 10);
  const now = new Date().toISOString();
  
  if (!arbeonCheck) {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, full_name, created_at, updated_at)
      VALUES ('usr_admin_arbeon', 'arbeon@tantra.vjec.ac.in', ?, 'ADMIN', 'arbeon', ?, ?)
    `).run(arbeonHash, now, now);
  } else {
    db.prepare(`
      UPDATE users SET password_hash = ?, role = 'ADMIN', updated_at = ? WHERE id = ?
    `).run(arbeonHash, now, arbeonCheck.id);
  }

  // Also maintain general default admin if needed
  const adminCheck = db.prepare("SELECT id FROM users WHERE LOWER(email) = 'admin@tantra.vjec.ac.in'").get();
  if (!adminCheck) {
    const adminId = 'usr_admin_' + Date.now();
    const passwordHash = bcrypt.hashSync('Admin@VibeCode2026', 10);
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, full_name, created_at, updated_at)
      VALUES (?, 'admin@tantra.vjec.ac.in', ?, 'ADMIN', 'Tantra Admin', ?, ?)
    `).run(adminId, passwordHash, now, now);
  }

  // Seed default Event Config if none exists
  const eventConfigCheck = db.prepare("SELECT id FROM event_config LIMIT 1").get();
  if (!eventConfigCheck) {
    const now = new Date().toISOString();
    // Default event: 7 October 2026, 10:30 AM to 12:00 PM IST (UTC+05:30)
    // 10:30 AM IST = 05:00 UTC, 12:00 PM IST = 06:30 UTC
    const startTime = '2026-10-07T10:30:00+05:30';
    const endTime = '2026-10-07T12:00:00+05:30';
    
    db.prepare(`
      INSERT INTO event_config (
        id, event_name, event_date, start_time, end_time, duration_minutes, state, venue, fee, prize_pool, challenge_brief, results_info, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'vibecode_tantra_2026',
      "VIBECODE: BUILD BEYOND BOUNDARIES - TANTRA'26",
      '2026-10-07',
      startTime,
      endTime,
      90,
      'PRE_EVENT',
      'Admin Block, Vimal Jyothi Engineering College',
      30,
      1000,
      'Build a modern, intelligent web application solving campus/student workflow bottlenecks within 90 minutes. Unleash full-stack creativity with AI-assisted development tools allowed.',
      'Results will be announced by the CSE evaluation committee after live demonstration.',
      now
    );
  }

  // Seed default 5 inspiration ideas if none exist
  const ideasCount = (db.prepare('SELECT COUNT(*) as c FROM ideas').get() as any)?.c || 0;
  if (ideasCount === 0) {
    const initialIdeas = [
      {
        id: 'idea_foodrescue',
        title: 'FOODRESCUE',
        slug: 'foodrescue',
        short_problem: 'Reduce Food Waste',
        description: 'Build a website that could help reduce food waste by connecting surplus food with people, organizations, volunteers, or communities that can coordinate redistribution.',
        possible_directions: JSON.stringify([
          'Surplus food sharing',
          'Pickup coordination',
          'Volunteer support',
          'Food availability',
          'Community participation'
        ]),
        display_order: 1
      },
      {
        id: 'idea_crisisconnect',
        title: 'CRISISCONNECT',
        slug: 'crisisconnect',
        short_problem: 'Emergency Response Hub',
        description: 'Build a website that could help people find reliable emergency information and assistance during floods, fires, accidents, or other emergencies.',
        possible_directions: JSON.stringify([
          'Emergency help',
          'Incident reporting',
          'Shelter information',
          'Emergency contacts',
          'Volunteer coordination'
        ]),
        display_order: 2
      },
      {
        id: 'idea_lost2found',
        title: 'LOST2FOUND',
        slug: 'lost2found',
        short_problem: 'Smart Lost & Found',
        description: 'Build a website that could make it easier for people to report lost items, report found items, and discover possible matches.',
        possible_directions: JSON.stringify([
          'Lost item reports',
          'Found item reports',
          'Search and filters',
          'Category matching',
          'Image-based matching'
        ]),
        display_order: 3
      },
      {
        id: 'idea_accessable',
        title: 'ACCESSABLE',
        slug: 'accessable',
        short_problem: 'Accessibility Finder',
        description: 'Build a website that could help people discover places with useful accessibility facilities.',
        possible_directions: JSON.stringify([
          'Wheelchair access',
          'Ramps',
          'Elevators',
          'Accessible toilets',
          'Accessible parking',
          'User reviews'
        ]),
        display_order: 4
      },
      {
        id: 'idea_scamshield',
        title: 'SCAMSHIELD',
        slug: 'scamshield',
        short_problem: 'Digital Scam Awareness',
        description: 'Build a website that could help people recognize online scams, phishing attempts, and digital fraud.',
        possible_directions: JSON.stringify([
          'Scam awareness',
          'Suspicious-message examples',
          'Scam checker concept',
          'Safety guidance',
          'Reporting information'
        ]),
        display_order: 5
      }
    ];

    const insertIdea = db.prepare(`
      INSERT INTO ideas (
        id, title, slug, short_problem, description, possible_directions, display_order, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    for (const item of initialIdeas) {
      insertIdea.run(
        item.id,
        item.title,
        item.slug,
        item.short_problem,
        item.description,
        item.possible_directions,
        item.display_order,
        now,
        now
      );
    }
  }
}

export function parseIdeaRow(row: any): IdeaInspiration {
  let directions: string[] = [];
  try {
    directions = typeof row.possible_directions === 'string'
      ? JSON.parse(row.possible_directions)
      : (row.possible_directions || []);
  } catch {
    directions = [];
  }

  return {
    ...row,
    possible_directions: Array.isArray(directions) ? directions : [],
    is_active: Boolean(row.is_active)
  };
}

export function getAllIdeas(db: Database.Database, onlyActive = false): IdeaInspiration[] {
  const sql = onlyActive
    ? "SELECT * FROM ideas WHERE is_active = 1 ORDER BY display_order ASC, created_at ASC"
    : "SELECT * FROM ideas ORDER BY display_order ASC, created_at ASC";
  const rows = db.prepare(sql).all() as any[];
  return rows.map(parseIdeaRow);
}

/**
 * Finds the highest sequential VB26-XXXXX number and returns the next formatted ID
 */
export function getNextParticipantId(db: Database.Database): string {
  const rows = db.prepare(`
    SELECT participant_id FROM participants 
    WHERE participant_id LIKE 'VB26-%'
  `).all() as { participant_id: string }[];

  let maxNum = 0;
  for (const row of rows) {
    const match = row.participant_id.match(/VB26-(\d+)/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `VB26-${String(nextNum).padStart(5, '0')}`;
}

/**
 * Generates an array of unique sequential IDs for batch imports
 */
export function getBatchNextParticipantIds(db: Database.Database, count: number): string[] {
  const rows = db.prepare(`
    SELECT participant_id FROM participants 
    WHERE participant_id LIKE 'VB26-%'
  `).all() as { participant_id: string }[];

  let maxNum = 0;
  for (const row of rows) {
    const match = row.participant_id.match(/VB26-(\d+)/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const ids: string[] = [];
  for (let i = 1; i <= count; i++) {
    const nextNum = maxNum + i;
    ids.push(`VB26-${String(nextNum).padStart(5, '0')}`);
  }
  return ids;
}

export function normalizePhone(phone: any): { raw: string; clean: string; last10: string } {
  if (phone === undefined || phone === null) return { raw: '', clean: '', last10: '' };
  let str = String(phone).trim();
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }
  const clean = str.replace(/\D/g, '');
  let normalized = clean;
  if (normalized.length === 12 && normalized.startsWith('91')) {
    normalized = normalized.slice(2);
  } else if (normalized.length === 11 && normalized.startsWith('0')) {
    normalized = normalized.slice(1);
  }
  const last10 = normalized.length >= 10 ? normalized.slice(-10) : (clean.length >= 10 ? clean.slice(-10) : clean);
  return { raw: str, clean, last10 };
}

export function isSamePhone(phoneA: any, phoneB: any): boolean {
  if (!phoneA || !phoneB) return false;
  const pA = normalizePhone(phoneA);
  const pB = normalizePhone(phoneB);
  if (!pA.clean || !pB.clean) return false;
  if (pA.clean === pB.clean) return true;
  if (pA.last10.length === 10 && pB.last10.length === 10 && pA.last10 === pB.last10) return true;
  return false;
}

export function normalizeEmail(email: any): string {
  if (!email) return '';
  return String(email).trim().toLowerCase();
}

export function normalizeParticipantId(id: any): string {
  if (!id) return '';
  return String(id).trim().toUpperCase();
}

export function normalizeName(name: any): string {
  if (!name) return '';
  return String(name).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Checks for duplicates against existing participants by participant_id, email, phone, or name
 */
export function findDuplicateParticipant(
  db: Database.Database,
  data: { 
    participant_id?: string; 
    email?: string; 
    phone?: string; 
    full_name?: string; 
    college?: string;
  }
): { match: Participant | null; matchedBy?: 'participant_id' | 'email' | 'phone' | 'full_name' } {
  // 1. Participant ID match (case-insensitive & trimmed)
  const normPid = normalizeParticipantId(data.participant_id);
  if (normPid) {
    const match = db.prepare("SELECT * FROM participants WHERE UPPER(TRIM(participant_id)) = ? OR UPPER(TRIM(id)) = ?").get(normPid, normPid) as any;
    if (match) {
      return { match: parseParticipantRow(match), matchedBy: 'participant_id' };
    }
  }

  // 2. Email match (case-insensitive & trimmed)
  const normEmail = normalizeEmail(data.email);
  if (normEmail) {
    const match = db.prepare("SELECT * FROM participants WHERE LOWER(TRIM(email)) = ?").get(normEmail) as any;
    if (match) {
      return { match: parseParticipantRow(match), matchedBy: 'email' };
    }
  }

  // 3. Phone match (exact cleaned or matching last 10 digits)
  const pData = normalizePhone(data.phone);
  if (pData.clean.length >= 7) {
    const allParticipants = db.prepare("SELECT * FROM participants").all() as any[];
    for (const p of allParticipants) {
      if (isSamePhone(data.phone, p.phone)) {
        return { match: parseParticipantRow(p), matchedBy: 'phone' };
      }
    }
  }

  // 4. Full Name match
  const normName = normalizeName(data.full_name);
  if (normName && normName.length >= 3) {
    const allParticipants = db.prepare("SELECT * FROM participants").all() as any[];
    for (const p of allParticipants) {
      const pName = normalizeName(p.full_name);
      if (pName === normName) {
        // A. If college also matches
        if (data.college && p.college && normalizeName(data.college) === normalizeName(p.college)) {
          return { match: parseParticipantRow(p), matchedBy: 'full_name' };
        }
        // B. If email username (before @) matches
        if (normEmail && p.email) {
          const u1 = normEmail.split('@')[0];
          const u2 = normalizeEmail(p.email).split('@')[0];
          if (u1 && u2 && u1 === u2) {
            return { match: parseParticipantRow(p), matchedBy: 'full_name' };
          }
        }
        // C. If phone or email was missing or empty in data
        if (!normEmail || !pData.clean) {
          return { match: parseParticipantRow(p), matchedBy: 'full_name' };
        }
      }
    }
  }

  return { match: null };
}

export function parseParticipantRow(row: any): Participant {
  let customFields = {};
  try {
    customFields = typeof row.custom_fields === 'string' ? JSON.parse(row.custom_fields) : (row.custom_fields || {});
  } catch {
    customFields = {};
  }

  return {
    ...row,
    custom_fields: customFields
  };
}

export function logAuditEvent(
  db: Database.Database,
  action: string,
  details: string,
  actor: string = 'System'
) {
  const id = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const timestamp = new Date().toISOString();
  db.prepare(`
    INSERT INTO event_audit_logs (id, action, details, actor, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, action, details, actor, timestamp);
}

/**
 * Retrieves the event configuration and automatically transitions the event state 
 * based on official schedule start_time and end_time.
 * 
 * Schedule: 7 October 2026, 10:30 AM IST (UTC+05:30) to 12:00 PM IST (UTC+05:30)
 * - Transitions PRE_EVENT -> LIVE when serverTimestamp >= startTimeMs and serverTimestamp < endTimeMs
 * - Transitions PRE_EVENT -> SUBMISSION_CLOSED when serverTimestamp >= endTimeMs
 * - Transitions LIVE -> SUBMISSION_CLOSED when serverTimestamp >= endTimeMs
 * Persists the transition to SQLite and logs an audit log event.
 */
export function getEventConfigWithAutoTransition(db: Database.Database): EventConfig {
  let config = db.prepare('SELECT * FROM event_config LIMIT 1').get() as EventConfig;
  if (!config) return config;

  const now = new Date();
  const serverTimestamp = now.getTime();
  const startTimeMs = new Date(config.start_time).getTime();
  const endTimeMs = new Date(config.end_time).getTime();

  let newState: EventState | null = null;
  let auditDetails = '';

  // 1. PRE_EVENT scheduled auto-transition
  if (config.state === 'PRE_EVENT' && serverTimestamp >= startTimeMs) {
    if (serverTimestamp < endTimeMs) {
      newState = 'LIVE';
      auditDetails = `Scheduled event start time reached (${config.start_time}). System automatically transitioned event from PRE_EVENT to LIVE.`;
    } else {
      newState = 'SUBMISSION_CLOSED';
      auditDetails = `Scheduled event end time elapsed (${config.end_time}). System automatically transitioned event from PRE_EVENT to SUBMISSION_CLOSED.`;
    }
  } 
  // 2. LIVE scheduled auto-transition when 90-min sprint completes
  else if (config.state === 'LIVE' && serverTimestamp >= endTimeMs) {
    newState = 'SUBMISSION_CLOSED';
    auditDetails = `Competition deadline elapsed (${config.end_time}). System automatically transitioned event from LIVE to SUBMISSION_CLOSED.`;
  }

  // Persist if state changed
  if (newState && newState !== config.state) {
    const nowIso = now.toISOString();
    db.prepare('UPDATE event_config SET state = ?, updated_at = ? WHERE id = ?')
      .run(newState, nowIso, config.id);

    logAuditEvent(db, 'EVENT_AUTO_STATE_CHANGE', auditDetails, 'SYSTEM');

    config = {
      ...config,
      state: newState,
      updated_at: nowIso
    };
  }

  return config;
}

