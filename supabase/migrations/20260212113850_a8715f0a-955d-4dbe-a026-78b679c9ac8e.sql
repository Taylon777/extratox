
-- Create enum for transaction category
CREATE TYPE public.transaction_category AS ENUM (
  'pix',
  'transferencia',
  'cartao_debito',
  'cartao_credito',
  'taxas',
  'outros'
);

-- Create enum for transaction type
CREATE TYPE public.transaction_type AS ENUM ('entrada', 'saida');

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  value NUMERIC(15, 2) NOT NULL,
  category public.transaction_category NOT NULL,
  type public.transaction_type NOT NULL,
  bank_name TEXT,
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
ON public.transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON public.transactions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
ON public.transactions
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_category ON public.transactions(user_id, category);
CREATE INDEX idx_transactions_user_type ON public.transactions(user_id, type);

-- Create trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
