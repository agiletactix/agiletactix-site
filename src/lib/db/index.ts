// D1 Database helper — wraps Drizzle ORM for Cloudflare D1
// Usage: const db = getDb(context.locals.runtime.env.DB);

import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, and, desc, count } from 'drizzle-orm';
import * as schema from './schema';

export type Database = DrizzleD1Database<typeof schema>;

// D1Database type from @cloudflare/workers-types
type D1Binding = import('@cloudflare/workers-types').D1Database;

/**
 * Create a Drizzle instance from a D1 binding.
 * In Cloudflare Pages: context.locals.runtime.env.DB
 */
export function getDb(d1: D1Binding): Database {
  return drizzle(d1, { schema });
}

// ─── Typed query helpers ───────────────────────────────────────────────

/** Upsert a member by email. Returns the member ID. */
export async function upsertMember(
  db: Database,
  data: {
    id: string;
    email: string;
    firstName?: string | undefined;
    role?: string | undefined;
    deployment?: string | undefined;
    tier?: string | undefined;
  },
): Promise<string> {
  // Try to find existing member by email
  const existing = await db
    .select({ id: schema.members.id })
    .from(schema.members)
    .where(eq(schema.members.email, data.email))
    .get();

  if (existing) {
    // Update existing member
    await db
      .update(schema.members)
      .set({
        firstName: data.firstName,
        role: data.role,
        deployment: data.deployment,
        tier: data.tier,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.members.id, existing.id));
    return existing.id;
  }

  // Insert new member
  await db.insert(schema.members).values({
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    role: data.role,
    deployment: data.deployment,
    tier: data.tier,
  });
  return data.id;
}

/** Store an assessment result linked to a member. */
export async function createAssessment(
  db: Database,
  data: {
    id: string;
    memberId: string;
    overallScorePct: number;
    tier: string;
    dimensionScores: Record<string, unknown>;
    weakDimensions: string[];
    deploymentOverride: boolean;
  },
): Promise<void> {
  await db.insert(schema.assessments).values({
    id: data.id,
    memberId: data.memberId,
    overallScorePct: data.overallScorePct,
    tier: data.tier,
    dimensionScores: JSON.stringify(data.dimensionScores),
    weakDimensions: JSON.stringify(data.weakDimensions),
    deploymentOverride: data.deploymentOverride ? 1 : 0,
  });
}

/** Get all assessments for a member, newest first. */
export async function getAssessments(
  db: Database,
  memberId: string,
) {
  return db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.memberId, memberId))
    .orderBy(desc(schema.assessments.completedAt))
    .all();
}

/** Get the latest assessment for a member. */
export async function getLatestAssessment(
  db: Database,
  memberId: string,
) {
  return db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.memberId, memberId))
    .orderBy(desc(schema.assessments.completedAt))
    .limit(1)
    .get();
}

/** Get a member by Better Auth user ID. */
export async function getMemberByAuthUserId(
  db: Database,
  authUserId: string,
) {
  return db
    .select()
    .from(schema.members)
    .where(eq(schema.members.betterAuthUserId, authUserId))
    .get();
}

/** Get the learning path for a member. */
export async function getLearningPath(
  db: Database,
  memberId: string,
) {
  return db
    .select()
    .from(schema.learningPaths)
    .where(eq(schema.learningPaths.memberId, memberId))
    .orderBy(desc(schema.learningPaths.assignedAt))
    .limit(1)
    .get();
}

/** Get lesson progress for a member. */
export async function getLessonProgress(
  db: Database,
  memberId: string,
) {
  return db
    .select()
    .from(schema.lessonProgress)
    .where(eq(schema.lessonProgress.memberId, memberId))
    .all();
}

/** Get recent engagement events for a member. */
export async function getRecentEvents(
  db: Database,
  memberId: string,
  limit = 5,
) {
  return db
    .select()
    .from(schema.engagementEvents)
    .where(eq(schema.engagementEvents.memberId, memberId))
    .orderBy(desc(schema.engagementEvents.createdAt))
    .limit(limit)
    .all();
}

/** Get a member by email. */
export async function getMemberByEmail(
  db: Database,
  email: string,
) {
  return db
    .select()
    .from(schema.members)
    .where(eq(schema.members.email, email))
    .get();
}

/**
 * Link a Better Auth user ID to an existing member row that was created
 * anonymously (e.g. during an assessment before login). Only writes if a
 * member with that email exists and has no betterAuthUserId set yet.
 */
export async function linkAuthUserToMember(
  db: Database,
  email: string,
  betterAuthUserId: string,
): Promise<void> {
  const existing = await db
    .select({ id: schema.members.id, betterAuthUserId: schema.members.betterAuthUserId })
    .from(schema.members)
    .where(eq(schema.members.email, email))
    .get();

  if (existing && !existing.betterAuthUserId) {
    await db
      .update(schema.members)
      .set({ betterAuthUserId, updatedAt: new Date().toISOString() })
      .where(eq(schema.members.id, existing.id));
  }
}

/** Record an engagement event. */
export async function createEngagementEvent(
  db: Database,
  data: {
    id: string;
    memberId: string;
    eventType: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await db.insert(schema.engagementEvents).values({
    id: data.id,
    memberId: data.memberId,
    eventType: data.eventType,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  });
}

// ─── Learning path helpers ────────────────────────────────────────────

/** Assign (or reassign) a learning path to a member. Deletes any existing row first so retakes don't accumulate orphan rows. */
export async function assignLearningPath(
  db: Database,
  memberId: string,
  pathSlug: string,
): Promise<void> {
  await db
    .delete(schema.learningPaths)
    .where(eq(schema.learningPaths.memberId, memberId));
  await db.insert(schema.learningPaths).values({
    id: crypto.randomUUID(),
    memberId,
    pathSlug,
  });
}

/** Get a member's current learning path with per-lesson progress. */
export async function getLearningPathWithProgress(
  db: Database,
  memberId: string,
): Promise<{
  path: typeof schema.learningPaths.$inferSelect;
  progress: (typeof schema.lessonProgress.$inferSelect)[];
} | null> {
  const path = await db
    .select()
    .from(schema.learningPaths)
    .where(eq(schema.learningPaths.memberId, memberId))
    .orderBy(desc(schema.learningPaths.assignedAt))
    .limit(1)
    .get();

  if (!path) return null;

  const progress = await db
    .select()
    .from(schema.lessonProgress)
    .where(eq(schema.lessonProgress.memberId, memberId))
    .all();

  return { path, progress };
}

/** Update lesson progress for a member (upsert). */
export async function updateLessonProgress(
  db: Database,
  memberId: string,
  lessonId: string,
  status: 'in_progress' | 'completed',
): Promise<void> {
  const now = new Date().toISOString();

  const existing = await db
    .select()
    .from(schema.lessonProgress)
    .where(
      and(
        eq(schema.lessonProgress.memberId, memberId),
        eq(schema.lessonProgress.lessonId, lessonId),
      ),
    )
    .get();

  if (existing) {
    await db
      .update(schema.lessonProgress)
      .set({
        status,
        ...(status === 'completed' ? { completedAt: now } : {}),
      })
      .where(
        and(
          eq(schema.lessonProgress.memberId, memberId),
          eq(schema.lessonProgress.lessonId, lessonId),
        ),
      );
  } else {
    await db.insert(schema.lessonProgress).values({
      memberId,
      lessonId,
      status,
      startedAt: now,
      ...(status === 'completed' ? { completedAt: now } : {}),
    });
  }
}

/** Get an assessment by its ID (token). */
export async function getAssessmentById(db: Database, id: string) {
  return db.select().from(schema.assessments).where(eq(schema.assessments.id, id)).get();
}

/** Get a member by their ID. */
export async function getMemberById(db: Database, id: string) {
  return db.select().from(schema.members).where(eq(schema.members.id, id)).get();
}

/** Count completed lessons for a member. */
export async function getCompletedLessonCount(
  db: Database,
  memberId: string,
): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(schema.lessonProgress)
    .where(
      and(
        eq(schema.lessonProgress.memberId, memberId),
        eq(schema.lessonProgress.status, 'completed'),
      ),
    )
    .get();

  return result?.value ?? 0;
}
