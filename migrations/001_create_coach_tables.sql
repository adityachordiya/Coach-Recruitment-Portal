-- Coach outreach log: tracks each contact attempt a coach makes
CREATE TABLE IF NOT EXISTS coach_outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_method TEXT NOT NULL, -- 'Instagram DM', 'Text', 'Email', 'In Person'
  status TEXT NOT NULL DEFAULT 'Reached Out', -- 'Reached Out', 'Interested', 'Enrolled'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_outreach_coach_id ON coach_outreach_log(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_outreach_created_at ON coach_outreach_log(created_at);

-- Coach accounts: auth layer on top of the referrers table
CREATE TABLE IF NOT EXISTS coach_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'coach', -- 'coach' or 'owner'
  invite_token TEXT,
  invite_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_accounts_referrer_id ON coach_accounts(referrer_id);
CREATE INDEX IF NOT EXISTS idx_coach_accounts_invite_token ON coach_accounts(invite_token);
