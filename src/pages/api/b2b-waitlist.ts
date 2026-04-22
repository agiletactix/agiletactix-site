import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  let email: string | undefined;

  try {
    const body = await request.json() as { email?: string };
    email = body.email;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!email) {
    return new Response(JSON.stringify({ ok: false, error: 'Email required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // TODO: wire to Kit.com with tag leadership_waitlist
  // For now: log and return success
  console.log('B2B waitlist signup:', email);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
