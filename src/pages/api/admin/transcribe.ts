// POST /api/admin/transcribe — Trigger transcription for a video by ID
// Admin-only: requires auth session + admin email check

import type { APIRoute } from 'astro';
import { createAuth, getEnvFromLocals } from '../../../lib/auth';
import { getDb } from '../../../lib/db';
import { videos } from '../../../lib/db/video-schema';
import { getTranscriptionProvider } from '../../../lib/transcription';
import { eq } from 'drizzle-orm';

export const prerender = false;

const ADMIN_EMAIL = 'danny@agiletactix.com';

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonSuccess(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface RequestBody {
  video_id: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Auth check
  const env = getEnvFromLocals(locals as Record<string, unknown>);
  if (!env) {
    return jsonError('Auth not configured', 503);
  }

  const auth = createAuth(env);
  let session;
  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch {
    return jsonError('Authentication failed', 401);
  }
  if (!session) {
    return jsonError('Not authenticated', 401);
  }

  // 2. Admin check
  if (session.user.email !== ADMIN_EMAIL) {
    return jsonError('Forbidden: admin access required', 403);
  }

  // 3. Parse body
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonError('Invalid request body', 400);
  }

  if (!body.video_id) {
    return jsonError('Missing required field: video_id', 400);
  }

  // 4. Lookup video
  const db = getDb(env.DB);
  const video = await db
    .select()
    .from(videos)
    .where(eq(videos.id, body.video_id))
    .get();

  if (!video) {
    return jsonError('Video not found', 404);
  }

  // 5. Check R2 binding
  if (!env.VIDEO_BUCKET) {
    return jsonError('VIDEO_BUCKET R2 binding not configured', 503);
  }

  // 6. Get video from R2 and create a temporary URL for the transcription service
  // For Whisper, we need to send the file directly. Generate a signed URL or read the object.
  let audioUrl: string;
  try {
    // If the video has a public URL, use it directly
    if (video.r2Url) {
      audioUrl = video.r2Url;
    } else {
      // Generate a temporary signed URL (valid for 1 hour)
      // Note: This requires R2 public access or a worker-based presigned URL.
      // For now, we'll read the object and pass it through.
      // In production, configure R2 custom domain or use presigned URLs.
      audioUrl = `https://video.agiletactix.ai/${video.r2Key}`;
    }
  } catch (err) {
    console.error('[transcribe] Failed to get video URL:', err);
    return jsonError('Failed to access video in storage', 500);
  }

  // 7. Run transcription
  const provider = getTranscriptionProvider({
    OPENAI_API_KEY: env.OPENAI_API_KEY,
  });

  try {
    const result = await provider.transcribe(audioUrl);

    // 8. Store transcript in D1
    await db
      .update(videos)
      .set({
        transcript: result.text,
        transcriptSegments: JSON.stringify(result.segments),
        status: 'ready',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(videos.id, body.video_id));

    return jsonSuccess({
      success: true,
      video_id: body.video_id,
      transcript_length: result.text.length,
      segment_count: result.segments.length,
    });
  } catch (err) {
    console.error('[transcribe] Transcription failed:', err);

    // Mark video status as error
    await db
      .update(videos)
      .set({
        status: 'error',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(videos.id, body.video_id));

    return jsonError(`Transcription failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 500);
  }
};
