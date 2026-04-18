// GET /api/search?q=value+streams — Search across video transcripts
// Public endpoint: search helps with discovery

import type { APIRoute } from 'astro';
import { getEnvFromLocals } from '../../lib/auth';
import { getDb } from '../../lib/db';
import { videos } from '../../lib/db/video-schema';
import { like } from 'drizzle-orm';
import { ALL_LESSONS } from '../../lib/rovo/learning-paths';

export const prerender = false;

interface SearchResult {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  pathSlug: string;
  excerpt: string;
  timestamp: number | null; // seconds into the video
  videoId: string;
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Extract a highlighted excerpt around the first match of `query` in `text`.
 * Returns ~120 chars of context with the match wrapped in <mark> tags.
 */
function extractExcerpt(text: string, query: string): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return text.slice(0, 120) + '...';

  const start = Math.max(0, idx - 50);
  const end = Math.min(text.length, idx + query.length + 70);
  let excerpt = '';
  if (start > 0) excerpt += '...';
  const raw = text.slice(start, end);
  // Highlight the match
  const matchStart = idx - start;
  excerpt +=
    raw.slice(0, matchStart) +
    '<mark>' +
    raw.slice(matchStart, matchStart + query.length) +
    '</mark>' +
    raw.slice(matchStart + query.length);
  if (end < text.length) excerpt += '...';
  return excerpt;
}

/**
 * Find the timestamp of the first segment containing the query.
 */
function findTimestamp(
  segmentsJson: string | null,
  query: string,
): number | null {
  if (!segmentsJson) return null;
  try {
    const segments = JSON.parse(segmentsJson) as Array<{
      start: number;
      end: number;
      text: string;
    }>;
    const lowerQuery = query.toLowerCase();
    for (const seg of segments) {
      if (seg.text.toLowerCase().includes(lowerQuery)) {
        return seg.start;
      }
    }
  } catch {
    // Invalid JSON — skip
  }
  return null;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return jsonError('Query must be at least 2 characters', 400);
  }

  if (query.length > 200) {
    return jsonError('Query too long (max 200 characters)', 400);
  }

  const env = getEnvFromLocals(locals as Record<string, unknown>);
  if (!env) {
    return jsonError('Database not configured', 503);
  }

  const db = getDb(env.DB);

  // Use LIKE for SQLite compatibility (D1 doesn't support FTS5 out of the box)
  const pattern = `%${query}%`;
  const rows = await db
    .select()
    .from(videos)
    .where(like(videos.transcript, pattern))
    .limit(20)
    .all();

  const results: SearchResult[] = rows
    .map((row) => {
      const lesson = ALL_LESSONS[row.lessonId];
      if (!lesson || !row.transcript) return null;

      return {
        lessonId: row.lessonId,
        lessonSlug: lesson.slug,
        lessonTitle: lesson.title,
        pathSlug: lesson.pathSlug,
        excerpt: extractExcerpt(row.transcript, query),
        timestamp: findTimestamp(row.transcriptSegments, query),
        videoId: row.id,
      };
    })
    .filter((r): r is SearchResult => r !== null);

  return new Response(
    JSON.stringify({
      query,
      count: results.length,
      results,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
