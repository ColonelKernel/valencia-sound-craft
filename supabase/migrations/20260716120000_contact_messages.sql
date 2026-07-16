
-- ═══════════════════════════════════════════════════════════
-- CONTACT MESSAGES (public contact form submissions)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  project_type TEXT,
  message TEXT NOT NULL
);

-- ═══════════════════════════════════════════════════════════
-- RLS: anonymous visitors may INSERT only — no read/update/delete
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon insert contact_messages" ON public.contact_messages
  FOR INSERT TO anon WITH CHECK (true);
