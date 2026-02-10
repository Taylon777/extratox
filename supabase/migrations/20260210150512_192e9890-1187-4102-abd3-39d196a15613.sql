
-- Tabela para registrar uploads de documentos PDF
CREATE TABLE public.document_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  analysis_result JSONB,
  error_message TEXT,
  page_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own documents
CREATE POLICY "Users can read own documents"
  ON public.document_uploads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own documents"
  ON public.document_uploads FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON public.document_uploads FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON public.document_uploads FOR DELETE
  USING (user_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_document_uploads_updated_at
  BEFORE UPDATE ON public.document_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket privado para PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-documents', 'pdf-documents', false);

-- Storage policies: usuários podem fazer upload e ler seus próprios PDFs
CREATE POLICY "Users can upload own PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pdf-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pdf-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own PDFs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pdf-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
