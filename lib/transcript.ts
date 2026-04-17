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

  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    throw new Error("SUPADATA_API_KEY is not set");
  }

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(youtubeUrl)}&text=true`,
    { headers: { "x-api-key": apiKey } }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supadata transcript fetch failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const text: string = typeof data === "string" ? data : data.content ?? data.text ?? JSON.stringify(data);

  if (!text) {
    throw new Error("Supadata returned empty transcript");
  }

  return { text, videoId };
}
