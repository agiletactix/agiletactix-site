// AgileTactix Assessment Worker — Cloudflare Workers entry point

import { handleScore } from './score';

interface Env {
  KIT_API_KEY: string;
  TEST_MODE: string;
  ENVIRONMENT: string;
}

const ALLOWED_ORIGINS = [
  'https://agiletactix.ai',
  'http://localhost:4321',
  'http://localhost:3000',
];

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function addCorsHeaders(response: Response, request: Request): Response {
  const corsHeaders = getCorsHeaders(request);
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    if (value) newHeaders.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS' && path === '/assessment/score') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request),
      });
    }

    // POST /assessment/score
    if (request.method === 'POST' && path === '/assessment/score') {
      try {
        const response = await handleScore(request, env);
        return addCorsHeaders(response, request);
      } catch (err) {
        console.error('Unhandled error:', err);
        return addCorsHeaders(
          new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
          request,
        );
      }
    }

    // Everything else → 404
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
