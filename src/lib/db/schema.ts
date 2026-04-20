// Member-MCP D1 Database Schema
// Drizzle ORM with SQLite dialect for Cloudflare D1

import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── members ───────────────────────────────────────────────────────────
// Created on assessment completion or Stripe checkout
// better_auth_user_id links to Better Auth's managed `user` table (Option A: separate tables)
export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  firstName: text('first_name'),
  role: text('role'), // exec | practitioner | mixed
  deployment: text('deployment'), // cloud | data_center | server | mixed | unsure
  tier: text('tier'), // ready | close | foundation | notyet
  betterAuthUserId: text('better_auth_user_id').unique(), // FK → Better Auth user.id
  stripeCustomerId: text('stripe_customer_id'),
  membershipStatus: text('membership_status').default('free'), // free | active | cancelled | expired
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── assessments ───────────────────────────────────────────────────────
// One per completion; member can retake
export const assessments = sqliteTable('assessments', {
  id: text('id').primaryKey(),
  memberId: text('member_id').references(() => members.id),
  overallScorePct: integer('overall_score_pct'),
  tier: text('tier'),
  dimensionScores: text('dimension_scores'), // JSON string
  weakDimensions: text('weak_dimensions'), // JSON string
  deploymentOverride: integer('deployment_override').default(0), // boolean
  completedAt: text('completed_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// ─── learning_paths ────────────────────────────────────────────────────
// Assigned based on assessment score
export const learningPaths = sqliteTable('learning_paths', {
  id: text('id').primaryKey(),
  memberId: text('member_id').references(() => members.id),
  pathSlug: text('path_slug'), // e.g. 'rovo-governance', 'foundation-first'
  assignedAt: text('assigned_at').default(sql`(CURRENT_TIMESTAMP)`),
  completedAt: text('completed_at'),
});

// ─── lesson_progress ───────────────────────────────────────────────────
// Tracks individual lesson completion
export const lessonProgress = sqliteTable(
  'lesson_progress',
  {
    memberId: text('member_id').references(() => members.id),
    lessonId: text('lesson_id'),
    status: text('status').default('not_started'), // not_started | in_progress | completed
    startedAt: text('started_at'),
    completedAt: text('completed_at'),
  },
  (table) => [primaryKey({ columns: [table.memberId, table.lessonId] })],
);

// ─── engagement_events ─────────────────────────────────────────────────
// For agent personalization in Q3
export * from './video-schema';

export const engagementEvents = sqliteTable('engagement_events', {
  id: text('id').primaryKey(),
  memberId: text('member_id').references(() => members.id),
  eventType: text('event_type'), // assessment_completed | lesson_started | lesson_completed | login | video_watched
  metadata: text('metadata'), // JSON string
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});
