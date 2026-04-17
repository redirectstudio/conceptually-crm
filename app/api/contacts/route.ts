import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const score = searchParams.get("score");
  const status = searchParams.get("status");
  const industry = searchParams.get("industry");
  const stage = searchParams.get("stage");

  const db = getServiceClient();
  let query = db
    .from("contacts")
    .select("*")
    .order("readiness_score", { ascending: false })
    .order("created_at", { ascending: false });

  if (score) query = query.eq("readiness_score", parseInt(score));
  if (status) query = query.eq("outreach_status", status);
  if (industry) query = query.ilike("industry", `%${industry}%`);
  if (stage) query = query.eq("business_stage", stage);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data });
}
