
-- Restrict template reads to authenticated users only
DROP POLICY IF EXISTS "Templates are publicly readable" ON public.report_templates;
CREATE POLICY "Authenticated users can read templates"
  ON public.report_templates FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Template sections are publicly readable" ON public.template_sections;
CREATE POLICY "Authenticated users can read sections"
  ON public.template_sections FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Calculation rules are publicly readable" ON public.template_calculation_rules;
CREATE POLICY "Authenticated users can read rules"
  ON public.template_calculation_rules FOR SELECT
  TO authenticated
  USING (true);
