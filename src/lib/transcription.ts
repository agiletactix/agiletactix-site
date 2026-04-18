// Pluggable transcription service for Phase Video
// Default: placeholder stub. Swap in Whisper or Deepgram when API keys are available.

// ─── Types ────────────────────────────────────────────────────────────

export interface TranscriptSegment {
  start: number; // seconds
  end: number; // seconds
  text: string;
}

export interface TranscriptResult {
  text: string; // full transcript
  segments: TranscriptSegment[];
}

export interface TranscriptionProvider {
  transcribe(audioUrl: string): Promise<TranscriptResult>;
}

// ─── Placeholder provider ─────────────────────────────────────────────
// Returns a stub transcript. Replace with a real provider when API keys are configured.

export class PlaceholderProvider implements TranscriptionProvider {
  async transcribe(_audioUrl: string): Promise<TranscriptResult> {
    return {
      text: 'Transcript pending — upload audio and configure a transcription API key.',
      segments: [
        {
          start: 0,
          end: 0,
          text: 'Transcript pending — upload audio and configure a transcription API key.',
        },
      ],
    };
  }
}

// ─── OpenAI Whisper provider ──────────────────────────────────────────
// Uses the OpenAI Whisper API (POST /v1/audio/transcriptions)
// Requires OPENAI_API_KEY environment variable.

export class WhisperProvider implements TranscriptionProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribe(audioUrl: string): Promise<TranscriptResult> {
    // Fetch the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio from ${audioUrl}: ${audioResponse.status}`);
    }
    const audioBlob = await audioResponse.blob();

    // Build multipart form
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp4');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Whisper API error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as {
      text: string;
      segments?: Array<{ start: number; end: number; text: string }>;
    };

    const segments: TranscriptSegment[] = (data.segments ?? []).map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }));

    return {
      text: data.text,
      segments,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────
// Returns the appropriate provider based on available env vars.

export function getTranscriptionProvider(env: Record<string, string | undefined>): TranscriptionProvider {
  if (env.OPENAI_API_KEY) {
    return new WhisperProvider(env.OPENAI_API_KEY);
  }
  return new PlaceholderProvider();
}
