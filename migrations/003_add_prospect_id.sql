-- Add prospect_id to group multiple interactions per prospect
ALTER TABLE coach_outreach_log
  ADD COLUMN IF NOT EXISTS prospect_id UUID;

-- Give each existing entry its own unique prospect_id
-- (they were all independent entries before)
UPDATE coach_outreach_log
  SET prospect_id = gen_random_uuid()
  WHERE prospect_id IS NULL;
