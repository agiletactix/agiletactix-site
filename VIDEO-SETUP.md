# Phase Video — Setup Instructions

## 1. Create the R2 Bucket

```bash
npx wrangler r2 bucket create agiletactix-videos
```

The `wrangler.toml` is already configured with the binding:
```toml
[[r2_buckets]]
binding = "VIDEO_BUCKET"
bucket_name = "agiletactix-videos"
```

## 2. Run the D1 Migration

Apply the videos table migration:

```bash
npx wrangler d1 execute member-mcp --remote --file=drizzle/migrations/0002_video_table.sql
```

## 3. Configure R2 Public Access (for video playback)

Option A — Custom domain (recommended):
1. In Cloudflare dashboard, go to R2 > agiletactix-videos > Settings
2. Add a custom domain: `video.agiletactix.ai`
3. Videos will be accessible at `https://video.agiletactix.ai/videos/{lesson_id}/{video_id}.mp4`

Option B — R2 Public URL:
1. Enable public access on the bucket
2. Use the generated `r2.dev` URL

After configuring, update the `r2_url` field in the `videos` table for each uploaded video.

## 4. Configure Transcription (Optional)

Set the `OPENAI_API_KEY` environment variable in Cloudflare Pages:

```bash
npx wrangler pages secret put OPENAI_API_KEY
```

Without this key, the transcription endpoint returns a placeholder. When the key is configured, it uses OpenAI Whisper API.

Alternative: swap `WhisperProvider` for Deepgram or AssemblyAI by implementing the `TranscriptionProvider` interface in `src/lib/transcription.ts`.

## 5. Upload a Video

```bash
curl -X POST https://agiletactix.ai/api/admin/video-upload \
  -H "Cookie: <session-cookie>" \
  -F "file=@lesson-video.mp4" \
  -F "lesson_id=rg-01" \
  -F "title=Rovo Agent Governance Framework"
```

## 6. Trigger Transcription

```bash
curl -X POST https://agiletactix.ai/api/admin/transcribe \
  -H "Cookie: <session-cookie>" \
  -H "Content-Type: application/json" \
  -d '{"video_id": "<video-id-from-upload>"}'
```

## Architecture

- **Storage**: Cloudflare R2 (`agiletactix-videos` bucket)
- **Metadata + Transcripts**: Cloudflare D1 (`videos` table)
- **Upload API**: `POST /api/admin/video-upload` (admin-only, multipart form)
- **Transcription API**: `POST /api/admin/transcribe` (admin-only)
- **Search API**: `GET /api/search?q=query` (public)
- **Player**: Custom HTML5 video player (`VideoPlayer.astro`)
- **Transcript**: Timestamped viewer with search and click-to-seek (`TranscriptViewer.astro`)
