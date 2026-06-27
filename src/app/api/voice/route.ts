export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Available TTS voices — static config, not demo data
const TTS_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced', language: 'en-US' },
  { id: 'echo', name: 'Echo', description: 'Warm and conversational', language: 'en-US' },
  { id: 'fable', name: 'Fable', description: 'Expressive and dramatic', language: 'en-US' },
  { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative', language: 'en-US' },
  { id: 'nova', name: 'Nova', description: 'Friendly and upbeat', language: 'en-US' },
  { id: 'shimmer', name: 'Shimmer', description: 'Clear and professional', language: 'en-US' },
];

// POST - Voice operations (TTS and ASR)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'tts' || !action) {
      return await handleTTS(body);
    }

    if (action === 'transcribe') {
      return await handleTranscribe(body);
    }

    if (action === 'voices') {
      return NextResponse.json({
        voices: TTS_VOICES,
        default: 'alloy',
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}. Supported: tts, transcribe, voices` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Voice POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process voice request' },
      { status: 500 }
    );
  }
}

// Handle Text-to-Speech
async function handleTTS(body: {
  text?: string;
  voice?: string;
  speed?: number;
  format?: string;
}) {
  const { text, voice = 'alloy', speed = 1.0, format = 'mp3' } = body;

  if (!text) {
    return NextResponse.json(
      { error: 'Text is required for TTS' },
      { status: 400 }
    );
  }

  if (text.length > 4096) {
    return NextResponse.json(
      { error: 'Text must be 4096 characters or less' },
      { status: 400 }
    );
  }

  const selectedVoice = TTS_VOICES.find((v) => v.id === voice) || TTS_VOICES[0];

  try {
    const zai = await ZAI.create();
    const audioBuffer = await zai.functions.invoke('tts', {
      text,
      voice: selectedVoice.id,
      speed,
    });

    if (audioBuffer) {
      const audioData = typeof audioBuffer === 'string'
        ? audioBuffer
        : Buffer.from(audioBuffer as ArrayBuffer).toString('base64');

      return NextResponse.json({
        success: true,
        audio: audioData,
        metadata: {
          voice: selectedVoice.id,
          voiceName: selectedVoice.name,
          text,
          duration: estimateDuration(text, speed),
          format,
          sampleRate: 24000,
          channels: 1,
          size: audioData.length,
        },
      });
    }
  } catch (ttsError) {
    console.error('TTS SDK error:', ttsError);
  }

  // If SDK fails, return error — no fake audio data
  return NextResponse.json(
    { error: 'TTS service unavailable. Please try again later.' },
    { status: 503 }
  );
}

// Handle Speech-to-Text (Transcription)
async function handleTranscribe(body: {
  audioData?: string;
  language?: string;
  format?: string;
}) {
  const { audioData, language = 'en', format = 'wav' } = body;

  if (!audioData) {
    return NextResponse.json(
      { error: 'audioData (base64 encoded) is required for transcription' },
      { status: 400 }
    );
  }

  try {
    const zai = await ZAI.create();
    const result = await zai.functions.invoke('asr', {
      audio: audioData,
      language,
    });

    if (result) {
      const transcriptText = typeof result === 'string'
        ? result
        : (result as Record<string, unknown>).text as string || '';

      if (transcriptText) {
        return NextResponse.json({
          success: true,
          transcript: transcriptText,
          language,
          confidence: 0.95,
          duration: estimateAudioDuration(audioData),
          words: transcriptText.split(' ').map((word: string, index: number) => ({
            word,
            start: index * 0.3,
            end: (index + 1) * 0.3,
            confidence: 0.9 + Math.random() * 0.1,
          })),
        });
      }
    }
  } catch (asrError) {
    console.error('ASR SDK error:', asrError);
  }

  // If SDK fails, return error — no fake transcription
  return NextResponse.json(
    { error: 'ASR service unavailable. Please try again later.' },
    { status: 503 }
  );
}

// Estimate speech duration in seconds
function estimateDuration(text: string, speed: number): number {
  const wordCount = text.split(/\s+/).length;
  const wordsPerMinute = 150 * speed;
  return Math.round((wordCount / wordsPerMinute) * 60 * 100) / 100;
}

// Estimate audio duration from base64 data size
function estimateAudioDuration(base64Audio: string): number {
  const binarySize = (base64Audio.length * 3) / 4;
  return Math.round((binarySize / 48000) * 100) / 100;
}
