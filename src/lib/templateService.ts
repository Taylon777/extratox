import { supabase } from "@/integrations/supabase/client";
import {
  BankCode,
  ReportTemplate,
  ReportTemplateInsert,
  TemplateSection,
  TemplateSectionInsert,
  CalculationRule,
  CalculationRuleInsert,
  TemplateWithRelations,
} from "@/types/templateTypes";

// === CRUD Templates ===

export async function fetchTemplates(): Promise<TemplateWithRelations[]> {
  const { data: templates, error } = await supabase
    .from("report_templates")
    .select("*")
    .order("priority", { ascending: false });

  if (error) throw new Error(`Erro ao buscar templates: ${error.message}`);
  if (!templates) return [];

  // Busca seções e regras para cada template
  const ids = templates.map((t) => t.id);

  const [sectionsResult, rulesResult] = await Promise.all([
    supabase
      .from("template_sections")
      .select("*")
      .in("template_id", ids)
      .order("display_order"),
    supabase
      .from("template_calculation_rules")
      .select("*")
      .in("template_id", ids)
      .order("display_order"),
  ]);

  const sections = sectionsResult.data ?? [];
  const rules = rulesResult.data ?? [];

  return templates.map((t) => ({
    ...t,
    sections: sections.filter((s) => s.template_id === t.id),
    rules: rules.filter((r) => r.template_id === t.id),
  }));
}

export async function fetchTemplateById(id: string): Promise<TemplateWithRelations | null> {
  const { data: template, error } = await supabase
    .from("report_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !template) return null;

  const [sectionsResult, rulesResult] = await Promise.all([
    supabase
      .from("template_sections")
      .select("*")
      .eq("template_id", id)
      .order("display_order"),
    supabase
      .from("template_calculation_rules")
      .select("*")
      .eq("template_id", id)
      .order("display_order"),
  ]);

  return {
    ...template,
    sections: sectionsResult.data ?? [],
    rules: rulesResult.data ?? [],
  };
}

export async function createTemplate(
  template: ReportTemplateInsert,
  sections: Omit<TemplateSectionInsert, "template_id">[],
  rules: Omit<CalculationRuleInsert, "template_id">[]
): Promise<TemplateWithRelations> {
  const { data: created, error } = await supabase
    .from("report_templates")
    .insert(template)
    .select()
    .single();

  if (error || !created) throw new Error(`Erro ao criar template: ${error?.message}`);

  // Insere seções
  if (sections.length > 0) {
    const sectionsWithTemplate = sections.map((s) => ({
      ...s,
      template_id: created.id,
    }));
    await supabase.from("template_sections").insert(sectionsWithTemplate);
  }

  // Insere regras
  if (rules.length > 0) {
    const rulesWithTemplate = rules.map((r) => ({
      ...r,
      template_id: created.id,
    }));
    await supabase.from("template_calculation_rules").insert(rulesWithTemplate);
  }

  return fetchTemplateById(created.id) as Promise<TemplateWithRelations>;
}

export async function updateTemplate(
  id: string,
  template: Partial<ReportTemplateInsert>,
  sections?: Omit<TemplateSectionInsert, "template_id">[],
  rules?: Omit<CalculationRuleInsert, "template_id">[]
): Promise<TemplateWithRelations> {
  const { error } = await supabase
    .from("report_templates")
    .update(template)
    .eq("id", id);

  if (error) throw new Error(`Erro ao atualizar template: ${error.message}`);

  // Substitui seções se fornecidas
  if (sections) {
    await supabase.from("template_sections").delete().eq("template_id", id);
    if (sections.length > 0) {
      await supabase.from("template_sections").insert(
        sections.map((s) => ({ ...s, template_id: id }))
      );
    }
  }

  // Substitui regras se fornecidas
  if (rules) {
    await supabase.from("template_calculation_rules").delete().eq("template_id", id);
    if (rules.length > 0) {
      await supabase.from("template_calculation_rules").insert(
        rules.map((r) => ({ ...r, template_id: id }))
      );
    }
  }

  return fetchTemplateById(id) as Promise<TemplateWithRelations>;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from("report_templates").delete().eq("id", id);
  if (error) throw new Error(`Erro ao excluir template: ${error.message}`);
}

// === Template Matching ===

/**
 * Busca o template mais adequado para um dado banco e empresa.
 * Regra de prioridade:
 *   1. banco + empresa (mais específico)
 *   2. banco apenas
 *   3. genérico (fallback)
 */
export async function findMatchingTemplate(
  bankCode: BankCode,
  companyName?: string
): Promise<TemplateWithRelations | null> {
  const { data: templates, error } = await supabase
    .from("report_templates")
    .select("*")
    .order("priority", { ascending: false });

  if (error || !templates || templates.length === 0) return null;

  // 1. Busca por banco + empresa
  if (companyName) {
    const exact = templates.find(
      (t) =>
        t.bank_code === bankCode &&
        t.company_name?.toLowerCase() === companyName.toLowerCase()
    );
    if (exact) return fetchTemplateById(exact.id);
  }

  // 2. Busca por banco apenas (default para este banco)
  const bankDefault = templates.find(
    (t) => t.bank_code === bankCode && t.is_default
  );
  if (bankDefault) return fetchTemplateById(bankDefault.id);

  // Qualquer template do banco
  const bankTemplate = templates.find((t) => t.bank_code === bankCode);
  if (bankTemplate) return fetchTemplateById(bankTemplate.id);

  // 3. Fallback genérico
  const generic = templates.find(
    (t) => t.bank_code === "generic" && t.is_default
  );
  if (generic) return fetchTemplateById(generic.id);

  return null;
}
