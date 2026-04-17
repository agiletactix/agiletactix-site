// Astro middleware — auth session check + protected route enforcement
// Public routes pass through. Protected routes (/member/*, /dashboard/*, /lessons/*)
// redirect unauthenticated users to /login.

import { defineMiddleware } from 'astro:middleware';
import { createAuth, getEnvFromLocals } from './lib/auth';

/** Route patterns that require authentication */
const PROTECTED_PREFIXES = ['/member', '/dashboard'];

/** Routes that are explicitly public even if they match a protected prefix */
const PUBLIC_OVERRIDES = ['/api/stripe/webhook'];

/** Check if a pathname matches a protected route */
function isProtectedRoute(pathname: string): boolean {
  // Stripe webhook must be public (verified via signature, not session)
  if (PUBLIC_OVERRIDES.includes(pathname)) return false;

  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, url, redirect } = context;

  // Skip auth check for non-protected routes (most of the site)
  if (!isProtectedRoute(url.pathname)) {
    return next();
  }

  // Try to resolve session from Better Auth
  const env = getEnvFromLocals(locals as Record<string, unknown>);
  if (!env) {
    // Auth not configured (local dev without wrangler) — redirect to login
    return redirect('/login', 302);
  }

  const auth = createAuth(env);

  try {
    const session = await auth.api.getSession({
      headers: context.request.headers,
    });

    if (!session) {
      // Not authenticated — redirect to login with return URL
      const returnTo = encodeURIComponent(url.pathname + url.search);
      return redirect(`/login?returnTo=${returnTo}`, 302);
    }

    // Attach user + session to locals for downstream pages
    (locals as Record<string, unknown>).user = session.user;
    (locals as Record<string, unknown>).session = session.session;
  } catch (err) {
    console.error('[auth middleware] Session check failed:', err);
    return redirect('/login', 302);
  }

  return next();
});
