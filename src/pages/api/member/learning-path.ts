// GET /api/member/learning-path — returns authenticated user's learning path + progress
// Protected: requires auth session (middleware enforces /member/* but API needs manual check)

import type { APIRoute } from 'astro';
import { createAuth, getEnvFromLocals } from '../../../lib/auth';
import { getDb, getMemberByAuthUserId, getLearningPathWithProgress } from '../../../lib/db';
import { LEARNING_PATHS, type Lesson } from '../../../lib/rovo/learning-paths';

export const prerender = false;

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ request, locals }) => {
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

  // Get member from D1
  const db = getDb(env.DB);
  const member = await getMemberByAuthUserId(db, session.user.id);
  if (!member) {
    return jsonError('Member not found', 404);
  }

  // Get learning path + progress
  const result = await getLearningPathWithProgress(db, member.id);
  if (!result) {
    return new Response(JSON.stringify({ assigned: false, path: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Resolve full path definition from the slug
  const pathSlug = result.path.pathSlug;
  if (!pathSlug) {
    return jsonError('Learning path has no slug', 500);
  }
  const pathDef = LEARNING_PATHS[pathSlug];
  if (!pathDef) {
    return jsonError('Learning path definition not found', 500);
  }

  // Build progress map: lessonId → status
  const progressMap: Record<string, { status: string; startedAt: string | null; completedAt: string | null }> = {};
  for (const p of result.progress) {
    if (p.lessonId) {
      progressMap[p.lessonId] = {
        status: p.status ?? 'not_started',
        startedAt: p.startedAt,
        completedAt: p.completedAt,
      };
    }
  }

  // Merge lessons with progress
  const lessons = pathDef.lessons.map((lesson: Lesson) => ({
    ...lesson,
    progress: progressMap[lesson.id] ?? { status: 'not_started', startedAt: null, completedAt: null },
  }));

  const completedCount = lessons.filter((l: { progress: { status: string } }) => l.progress.status === 'completed').length;

  const response = {
    assigned: true,
    path: {
      slug: pathDef.slug,
      name: pathDef.name,
      description: pathDef.description,
      assignedAt: result.path.assignedAt,
      completedAt: result.path.completedAt,
    },
    lessons,
    stats: {
      total: lessons.length,
      completed: completedCount,
      percentComplete: Math.round((completedCount / lessons.length) * 100),
    },
    membershipStatus: member.membershipStatus ?? 'free',
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
