import { YoutubeTranscript } from "youtube-transcript";

export interface TranscriptResult {
  text: string;
  title?: string;
  videoId: string;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function fetchTranscript(youtubeUrl: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube URL — could not extract video ID");
  }

  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    const text = segments.map((s) => s.text).join(" ");
    return { text, videoId };
  } catch (err) {
    throw new Error(
      `Could not fetch transcript for video ${videoId}. The video may not have captions enabled. Error: ${err}`
    );
  }
}
