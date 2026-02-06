
-- Enum para bancos suportados
CREATE TYPE public.bank_code AS ENUM ('itau', 'bradesco', 'bb', 'santander', 'nubank', 'generic');

-- Tabela principal de templates de relatório
CREATE TABLE public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bank_code bank_code NOT NULL DEFAULT 'generic',
  company_name TEXT,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seções configuráveis do template
CREATE TABLE public.template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.report_templates(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  title TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Regras de cálculo do template
CREATE TABLE public.template_calculation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.report_templates(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  source_categories TEXT[] DEFAULT '{}',
  source_types TEXT[] DEFAULT '{}',
  display_label TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Padrões de detecção automática de banco
CREATE TABLE public.bank_detection_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_code bank_code NOT NULL,
  pattern_type TEXT NOT NULL,
  pattern_value TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Templates são públicos para leitura, escrita sem restrição por agora
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_calculation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_detection_patterns ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Templates are publicly readable"
  ON public.report_templates FOR SELECT
  USING (true);

CREATE POLICY "Template sections are publicly readable"
  ON public.template_sections FOR SELECT
  USING (true);

CREATE POLICY "Calculation rules are publicly readable"
  ON public.template_calculation_rules FOR SELECT
  USING (true);

CREATE POLICY "Detection patterns are publicly readable"
  ON public.bank_detection_patterns FOR SELECT
  USING (true);

-- Políticas de escrita pública (temporárias até auth ser implementado)
CREATE POLICY "Anyone can create templates"
  ON public.report_templates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update templates"
  ON public.report_templates FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete templates"
  ON public.report_templates FOR DELETE
  USING (true);

CREATE POLICY "Anyone can manage template sections"
  ON public.template_sections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update template sections"
  ON public.template_sections FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete template sections"
  ON public.template_sections FOR DELETE
  USING (true);

CREATE POLICY "Anyone can manage calculation rules"
  ON public.template_calculation_rules FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update calculation rules"
  ON public.template_calculation_rules FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete calculation rules"
  ON public.template_calculation_rules FOR DELETE
  USING (true);

CREATE POLICY "Anyone can manage detection patterns"
  ON public.bank_detection_patterns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update detection patterns"
  ON public.bank_detection_patterns FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete detection patterns"
  ON public.bank_detection_patterns FOR DELETE
  USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_templates_bank_code ON public.report_templates(bank_code);
CREATE INDEX idx_templates_company ON public.report_templates(company_name);
CREATE INDEX idx_templates_priority ON public.report_templates(priority DESC);
CREATE INDEX idx_sections_template ON public.template_sections(template_id);
CREATE INDEX idx_rules_template ON public.template_calculation_rules(template_id);
CREATE INDEX idx_detection_bank ON public.bank_detection_patterns(bank_code);
