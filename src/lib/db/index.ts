// D1 Database helper — wraps Drizzle ORM for Cloudflare D1
// Usage: const db = getDb(context.locals.runtime.env.DB);

import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
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
    .orderBy(schema.assessments.completedAt)
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
