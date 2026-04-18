// Video table schema for Phase Video — R2-hosted lesson videos + transcripts
// Extends the existing D1 database with video metadata

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── videos ───────────────────────────────────────────────────────────
// One video per lesson. Uploaded to R2, metadata + transcript stored in D1.
export const videos = sqliteTable('videos', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id').notNull(), // maps to learning-paths lesson id
  title: text('title').notNull(),
  r2Key: text('r2_key').notNull(), // R2 object key (e.g. "videos/rg-01/video.mp4")
  r2Url: text('r2_url'), // public or signed URL for playback
  durationSeconds: integer('duration_seconds'),
  transcript: text('transcript'), // full-text transcript
  transcriptSegments: text('transcript_segments'), // JSON: [{start, end, text}]
  status: text('status').default('uploading').notNull(), // uploading | processing | ready | error
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});
