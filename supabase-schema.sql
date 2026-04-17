-- Conceptually CRM Schema
-- Run this in Supabase SQL Editor for project: mfmjtqqgrkwtiqdletjr

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),

  -- Identity
  name                TEXT NOT NULL,
  title               TEXT,
  location            TEXT,
  headshot_url        TEXT,

  -- Episode source
  episode_url         TEXT,
  episode_title       TEXT,
  podcast_date        DATE,
  transcript_raw      TEXT,

  -- Personal background
  personal_bio        TEXT,
  childhood_notes     TEXT,
  key_quotes          JSONB DEFAULT '[]',

  -- Business profile
  business_name       TEXT,
  industry            TEXT,
  business_stage      TEXT CHECK (business_stage IN ('idea', 'pre_revenue', 'early_revenue', 'growing', 'scaling')),
  has_audience        BOOLEAN DEFAULT false,
  audience_size       TEXT,
  business_summary    TEXT,

  -- Conceptually fit
  where_we_can_help   TEXT,
  readiness_score     INTEGER CHECK (readiness_score BETWEEN 1 AND 5),
  readiness_reasoning TEXT,

  -- Outreach
  outreach_status     TEXT DEFAULT 'not_contacted'
                        CHECK (outreach_status IN ('not_contacted', 'reached_out', 'responded', 'meeting_booked', 'converted', 'not_a_fit')),
  outreach_notes      TEXT,
  last_contacted      TIMESTAMPTZ,
  meeting_booked      BOOLEAN DEFAULT false,
  converted           BOOLEAN DEFAULT false
);

-- Processing jobs table (tracks async ingest runs)
CREATE TABLE IF NOT EXISTS processing_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  youtube_url     TEXT NOT NULL,
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  error_message   TEXT,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL
);

-- Auto-update updated_at on contacts
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: disable for now (private URL, no auth)
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs DISABLE ROW LEVEL SECURITY;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contacts_readiness_score ON contacts (readiness_score DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_outreach_status ON contacts (outreach_status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts (created_at DESC);
