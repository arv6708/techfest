import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getDb } from './db';
import { User, Role } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'vibecode-tantra-2026-super-secret-key-cse-vjec';
export const AUTH_COOKIE_NAME = 'vibecode_auth_token';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  participantId?: string;
  fullName?: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUser(): Promise<{ user: User | null; participantId?: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const db = getDb();
    const user = db.prepare('SELECT id, email, role, full_name, created_at, updated_at FROM users WHERE id = ?').get(payload.userId) as any;
    if (!user) return null;

    // Check if participant linked
    let participantId = payload.participantId;
    if (!participantId && user.role === 'PARTICIPANT') {
      const participant = db.prepare('SELECT participant_id FROM participants WHERE user_id = ?').get(user.id) as any;
      if (participant) {
        participantId = participant.participant_id;
      }
    }

    return { user, participantId };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<{ user: User; participantId?: string }> {
  const current = await getCurrentUser();
  if (!current || !current.user) {
    throw new Error('UNAUTHORIZED');
  }
  return { user: current.user, participantId: current.participantId };
}

export async function requireAdmin(): Promise<User> {
  const { user } = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }
  return user;
}
