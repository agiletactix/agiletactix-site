// POST /api/member/lesson-progress — mark a lesson as started or completed
// Protected: requires auth session

import type { APIRoute } from 'astro';
import { createAuth, getEnvFromLocals } from '../../../lib/auth';
import { getDb, getMemberByAuthUserId, getMemberByEmail, updateLessonProgress, createEngagementEvent } from '../../../lib/db';
import { ALL_LESSONS } from '../../../lib/rovo/learning-paths';

export const prerender = false;

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface RequestBody {
  lesson_id: string;
  status: 'in_progress' | 'completed';
}

export const POST: APIRoute = async ({ request, locals }) => {
  // Authenticate
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

  // Parse body
  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return jsonError('Invalid request body', 400);
  }

  // Validate
  if (!body.lesson_id || typeof body.lesson_id !== 'string') {
    return jsonError('Missing required field: lesson_id', 400);
  }
  if (!body.status || !['in_progress', 'completed'].includes(body.status)) {
    return jsonError('Invalid status: must be "in_progress" or "completed"', 400);
  }

  // Validate lesson exists
  const lesson = ALL_LESSONS[body.lesson_id];
  if (!lesson) {
    return jsonError('Lesson not found', 404);
  }

  // Get member — try by Better Auth user ID first, fall back to email for
  // members created anonymously during assessment before login.
  const db = getDb(env.DB);
  const member =
    (await getMemberByAuthUserId(db, session.user.id)) ??
    (await getMemberByEmail(db, session.user.email));
  if (!member) {
    return jsonError('Member not found', 404);
  }

  // Check access: free lessons are always accessible, paid lessons require active membership
  if (!lesson.is_free && member.membershipStatus !== 'active') {
    return jsonError('Upgrade required to access this lesson', 403);
  }

  // Update progress
  await updateLessonProgress(db, member.id, body.lesson_id, body.status);

  // Record engagement event
  const eventType = body.status === 'completed' ? 'lesson_completed' : 'lesson_started';
  await createEngagementEvent(db, {
    id: crypto.randomUUID(),
    memberId: member.id,
    eventType,
    metadata: {
      lessonId: body.lesson_id,
      lessonSlug: lesson.slug,
      pathSlug: lesson.pathSlug,
    },
  });

  return new Response(JSON.stringify({ success: true, lesson_id: body.lesson_id, status: body.status }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
