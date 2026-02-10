
-- Drop all permissive write policies
DROP POLICY IF EXISTS "Anyone can create templates" ON public.report_templates;
DROP POLICY IF EXISTS "Anyone can update templates" ON public.report_templates;
DROP POLICY IF EXISTS "Anyone can delete templates" ON public.report_templates;

DROP POLICY IF EXISTS "Anyone can manage template sections" ON public.template_sections;
DROP POLICY IF EXISTS "Anyone can update template sections" ON public.template_sections;
DROP POLICY IF EXISTS "Anyone can delete template sections" ON public.template_sections;

DROP POLICY IF EXISTS "Anyone can manage calculation rules" ON public.template_calculation_rules;
DROP POLICY IF EXISTS "Anyone can update calculation rules" ON public.template_calculation_rules;
DROP POLICY IF EXISTS "Anyone can delete calculation rules" ON public.template_calculation_rules;

DROP POLICY IF EXISTS "Anyone can manage detection patterns" ON public.bank_detection_patterns;
DROP POLICY IF EXISTS "Anyone can update detection patterns" ON public.bank_detection_patterns;
DROP POLICY IF EXISTS "Anyone can delete detection patterns" ON public.bank_detection_patterns;

-- Drop public read on detection patterns (restrict to authenticated)
DROP POLICY IF EXISTS "Detection patterns are publicly readable" ON public.bank_detection_patterns;

-- Restrict detection patterns read to authenticated users
CREATE POLICY "Authenticated users can read detection patterns"
  ON public.bank_detection_patterns FOR SELECT
  TO authenticated
  USING (true);

-- Restrict write operations to authenticated users only
-- report_templates
CREATE POLICY "Authenticated users can create templates"
  ON public.report_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update templates"
  ON public.report_templates FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete templates"
  ON public.report_templates FOR DELETE
  TO authenticated
  USING (true);

-- template_sections
CREATE POLICY "Authenticated users can manage sections"
  ON public.template_sections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sections"
  ON public.template_sections FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete sections"
  ON public.template_sections FOR DELETE
  TO authenticated
  USING (true);

-- template_calculation_rules
CREATE POLICY "Authenticated users can manage rules"
  ON public.template_calculation_rules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rules"
  ON public.template_calculation_rules FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete rules"
  ON public.template_calculation_rules FOR DELETE
  TO authenticated
  USING (true);

-- bank_detection_patterns (read-only for authenticated, no public write)
CREATE POLICY "Authenticated users can manage patterns"
  ON public.bank_detection_patterns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update patterns"
  ON public.bank_detection_patterns FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete patterns"
  ON public.bank_detection_patterns FOR DELETE
  TO authenticated
  USING (true);
