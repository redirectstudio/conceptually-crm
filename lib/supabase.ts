import { createClient } from "@supabase/supabase-js";
import type { Contact } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("readiness_score", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Contact[];
}

export async function getContact(id: string): Promise<Contact | null> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Contact;
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Contact;
}
