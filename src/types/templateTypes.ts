import { Database } from "@/integrations/supabase/types";

export type BankCode = Database["public"]["Enums"]["bank_code"];

export type ReportTemplate = Database["public"]["Tables"]["report_templates"]["Row"];
export type ReportTemplateInsert = Database["public"]["Tables"]["report_templates"]["Insert"];

export type TemplateSection = Database["public"]["Tables"]["template_sections"]["Row"];
export type TemplateSectionInsert = Database["public"]["Tables"]["template_sections"]["Insert"];

export type CalculationRule = Database["public"]["Tables"]["template_calculation_rules"]["Row"];
export type CalculationRuleInsert = Database["public"]["Tables"]["template_calculation_rules"]["Insert"];

export type BankDetectionPattern = Database["public"]["Tables"]["bank_detection_patterns"]["Row"];

export type SectionType =
  | "summary"
  | "transactions"
  | "chart_bar"
  | "chart_pie"
  | "totals"
  | "categories"
  | "payment_methods";

export type RuleType = "sum" | "subtract" | "percentage" | "count" | "balance";

export const sectionTypeLabels: Record<SectionType, string> = {
  summary: "Resumo Financeiro",
  transactions: "Lista de Movimentações",
  chart_bar: "Gráfico de Barras",
  chart_pie: "Gráfico de Pizza",
  totals: "Totais e Saldos",
  categories: "Agrupamento por Categoria",
  payment_methods: "Agrupamento por Método de Pagamento",
};

export const ruleTypeLabels: Record<RuleType, string> = {
  sum: "Soma",
  subtract: "Subtração",
  percentage: "Percentual",
  count: "Contagem",
  balance: "Saldo (Entradas - Saídas)",
};

export const bankLabels: Record<BankCode, string> = {
  itau: "Itaú Unibanco",
  bradesco: "Bradesco",
  bb: "Banco do Brasil",
  santander: "Santander",
  nubank: "Nubank",
  generic: "Genérico (Padrão)",
};

export interface TemplateWithRelations extends ReportTemplate {
  sections: TemplateSection[];
  rules: CalculationRule[];
}
