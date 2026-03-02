
-- Add import_id to group transactions by import session
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS import_id uuid;

-- Add transaction_hash for deduplication (based on date + value + description + type)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_hash text;

-- Create unique index on transaction_hash per user to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_hash 
ON public.transactions (user_id, transaction_hash) 
WHERE transaction_hash IS NOT NULL;

-- Create index on import_id for fast filtering
CREATE INDEX IF NOT EXISTS idx_transactions_import_id 
ON public.transactions (import_id) 
WHERE import_id IS NOT NULL;

-- Create imports table to track each import session
CREATE TABLE IF NOT EXISTS public.imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  total_transactions integer NOT NULL DEFAULT 0,
  imported_transactions integer NOT NULL DEFAULT 0,
  duplicates_skipped integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own imports" ON public.imports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own imports" ON public.imports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own imports" ON public.imports FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own imports" ON public.imports FOR DELETE TO authenticated USING (auth.uid() = user_id);
