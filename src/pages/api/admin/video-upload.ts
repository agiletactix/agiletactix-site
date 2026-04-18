// POST /api/admin/video-upload — Upload video to R2 + store metadata in D1
// Admin-only: requires auth session + admin email check

import type { APIRoute } from 'astro';
import { createAuth, getEnvFromLocals } from '../../../lib/auth';
import { getDb } from '../../../lib/db';
import { videos } from '../../../lib/db/video-schema';
import { ALL_LESSONS } from '../../../lib/rovo/learning-paths';

export const prerender = false;

// Admin email — only Danny can upload videos
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

  // 2. Admin role check (email-based for now)
  if (session.user.email !== ADMIN_EMAIL) {
    return jsonError('Forbidden: admin access required', 403);
  }

  // 3. Check R2 binding
  if (!env.VIDEO_BUCKET) {
    return jsonError('VIDEO_BUCKET R2 binding not configured', 503);
  }

  // 4. Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError('Invalid form data — expected multipart/form-data', 400);
  }

  const file = formData.get('file') as File | null;
  const lessonId = formData.get('lesson_id') as string | null;
  const title = formData.get('title') as string | null;

  if (!file || !(file instanceof File)) {
    return jsonError('Missing required field: file', 400);
  }
  if (!lessonId) {
    return jsonError('Missing required field: lesson_id', 400);
  }

  // Validate lesson exists
  const lesson = ALL_LESSONS[lessonId];
  if (!lesson) {
    return jsonError(`Lesson not found: ${lessonId}`, 404);
  }

  // 5. Generate video ID and R2 key
  const videoId = crypto.randomUUID();
  const ext = file.name.split('.').pop() || 'mp4';
  const r2Key = `videos/${lessonId}/${videoId}.${ext}`;

  // 6. Upload to R2
  try {
    const arrayBuffer = await file.arrayBuffer();
    await env.VIDEO_BUCKET.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'video/mp4',
      },
      customMetadata: {
        lessonId,
        videoId,
        originalFilename: file.name,
      },
    });
  } catch (err) {
    console.error('[video-upload] R2 upload failed:', err);
    return jsonError('Failed to upload video to storage', 500);
  }

  // 7. Store metadata in D1
  const db = getDb(env.DB);
  try {
    await db.insert(videos).values({
      id: videoId,
      lessonId,
      title: title || lesson.title,
      r2Key,
      r2Url: null, // Set after configuring public access or signed URLs
      status: 'processing',
    });
  } catch (err) {
    console.error('[video-upload] D1 insert failed:', err);
    return jsonError('Failed to store video metadata', 500);
  }

  return jsonSuccess({
    success: true,
    video_id: videoId,
    r2_key: r2Key,
    lesson_id: lessonId,
    status: 'processing',
  }, 201);
};
