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

async function fetchYouTubeTitle(youtubeUrl: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.title as string | undefined;
  } catch {
    return undefined;
  }
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

  const [transcriptRes, title] = await Promise.all([
    fetch(
      `https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(youtubeUrl)}&text=true`,
      { headers: { "x-api-key": apiKey } }
    ),
    fetchYouTubeTitle(youtubeUrl),
  ]);

  if (!transcriptRes.ok) {
    const body = await transcriptRes.text();
    throw new Error(`Supadata transcript fetch failed (${transcriptRes.status}): ${body}`);
  }

  const data = await transcriptRes.json();
  const text: string = typeof data === "string" ? data : data.content ?? data.text ?? JSON.stringify(data);

  if (!text) {
    throw new Error("Supadata returned empty transcript");
  }

  return { text, title, videoId };
}
