import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

export function getBrowserClient() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}

export async function pollJob(jobId: string): Promise<{ status: string; contact_id: string | null; error_message: string | null }> {
  const db = getBrowserClient();
  const { data, error } = await db
    .from("crm_jobs")
    .select("status, contact_id, error_message")
    .eq("id", jobId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
