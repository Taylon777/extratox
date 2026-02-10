
-- Add user_id to report_templates
ALTER TABLE public.report_templates
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set existing rows to NULL (they'll need to be claimed or deleted)
-- Going forward, user_id is required via RLS

-- Drop old policies on report_templates
DROP POLICY IF EXISTS "Authenticated users can read templates" ON public.report_templates;
DROP POLICY IF EXISTS "Authenticated users can create templates" ON public.report_templates;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON public.report_templates;
DROP POLICY IF EXISTS "Authenticated users can delete templates" ON public.report_templates;

-- Owner-scoped policies for report_templates
CREATE POLICY "Users can read own templates"
  ON public.report_templates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own templates"
  ON public.report_templates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own templates"
  ON public.report_templates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own templates"
  ON public.report_templates FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Drop old policies on template_sections
DROP POLICY IF EXISTS "Authenticated users can read sections" ON public.template_sections;
DROP POLICY IF EXISTS "Authenticated users can manage sections" ON public.template_sections;
DROP POLICY IF EXISTS "Authenticated users can update sections" ON public.template_sections;
DROP POLICY IF EXISTS "Authenticated users can delete sections" ON public.template_sections;

-- Owner-scoped policies for template_sections (via parent template)
CREATE POLICY "Users can read own sections"
  ON public.template_sections FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.report_templates
    WHERE id = template_sections.template_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create own sections"
  ON public.template_sections FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.report_templates
    WHERE id = template_sections.template_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update own sections"
  ON public.template_sections FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.report_templates
    WHERE id = template_sections.template_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own sections"
  ON public.template_sections FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.report_templates
    WHERE id = template_sections.template_id AND user_id = auth.uid()
  ));

-- Drop old policies on template_calculation_rules
DROP POLICY IF EXISTS "Authenticated users can read rules" ON public.template_calculation_rules;
DROP POLICY IF EXISTS "Authenticated users can manage rules" ON public.template_calculation_rules;
DROP POLICY IF EXISTS "Authenticated users can update rules" ON public.template_calculation_rules;
DROP POLICY IF EXISTS "Authenticated users can delete rules" ON public.template_calculation_rules;

-- Owner-scoped policies for template_calculation_rules (via parent template)
CREATE POLICY "Users can read own rules"
  ON public.template_calculation_rules FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.report_templates
    WHERE id = template_calculation_rules.template_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create own rules"
  ON public.template_calculation_rules FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.report_templates
    WHERE id = template_calculation_rules.template_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update own rules"
  ON public.template_calculation_rules FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.report_templates
    WHERE id = template_calculation_rules.template_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own rules"
  ON public.template_calculation_rules FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.report_templates
    WHERE id = template_calculation_rules.template_id AND user_id = auth.uid()
  ));
