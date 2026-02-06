import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  findMatchingTemplate,
} from "@/lib/templateService";
import {
  BankCode,
  ReportTemplateInsert,
  TemplateSectionInsert,
  CalculationRuleInsert,
} from "@/types/templateTypes";

export function useTemplates() {
  return useQuery({
    queryKey: ["report-templates"],
    queryFn: fetchTemplates,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      template,
      sections,
      rules,
    }: {
      template: ReportTemplateInsert;
      sections: Omit<TemplateSectionInsert, "template_id">[];
      rules: Omit<CalculationRuleInsert, "template_id">[];
    }) => createTemplate(template, sections, rules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      template,
      sections,
      rules,
    }: {
      id: string;
      template: Partial<ReportTemplateInsert>;
      sections?: Omit<TemplateSectionInsert, "template_id">[];
      rules?: Omit<CalculationRuleInsert, "template_id">[];
    }) => updateTemplate(id, template, sections, rules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
    },
  });
}

export function useMatchingTemplate(bankCode: BankCode, companyName?: string) {
  return useQuery({
    queryKey: ["matching-template", bankCode, companyName],
    queryFn: () => findMatchingTemplate(bankCode, companyName),
    enabled: !!bankCode,
  });
}
