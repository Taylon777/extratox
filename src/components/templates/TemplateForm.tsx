import { useState } from "react";
import { Plus, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BankCode,
  SectionType,
  RuleType,
  sectionTypeLabels,
  ruleTypeLabels,
  bankLabels,
  ReportTemplateInsert,
  TemplateSectionInsert,
  CalculationRuleInsert,
  TemplateWithRelations,
} from "@/types/templateTypes";
import { useCreateTemplate, useUpdateTemplate } from "@/hooks/useTemplates";
import { Json } from "@/integrations/supabase/types";

interface TemplateSectionForm {
  section_type: SectionType;
  title: string;
  display_order: number;
  is_visible: boolean;
  config: Record<string, unknown>;
}

interface CalculationRuleForm {
  rule_name: string;
  rule_type: RuleType;
  source_categories: string[];
  source_types: string[];
  display_label: string;
  display_order: number;
  is_visible: boolean;
}

interface TemplateFormProps {
  existingTemplate?: TemplateWithRelations;
  onSaved: () => void;
  onCancel: () => void;
}

const defaultSections: TemplateSectionForm[] = [
  { section_type: "summary", title: "Resumo Financeiro", display_order: 0, is_visible: true, config: {} },
  { section_type: "totals", title: "Totais e Saldos", display_order: 1, is_visible: true, config: {} },
  { section_type: "categories", title: "Agrupamento por Categoria", display_order: 2, is_visible: true, config: {} },
  { section_type: "chart_pie", title: "Distribuição por Categoria", display_order: 3, is_visible: true, config: {} },
  { section_type: "transactions", title: "Movimentações", display_order: 4, is_visible: true, config: {} },
];

const defaultRules: CalculationRuleForm[] = [
  { rule_name: "total_entradas", rule_type: "sum", source_categories: [], source_types: ["entrada"], display_label: "Total Entradas", display_order: 0, is_visible: true },
  { rule_name: "total_saidas", rule_type: "sum", source_categories: [], source_types: ["saida"], display_label: "Total Saídas", display_order: 1, is_visible: true },
  { rule_name: "saldo_liquido", rule_type: "balance", source_categories: [], source_types: [], display_label: "Saldo Líquido", display_order: 2, is_visible: true },
  { rule_name: "total_transacoes", rule_type: "count", source_categories: [], source_types: [], display_label: "Total de Transações", display_order: 3, is_visible: true },
];

const categoryOptions = [
  { value: "pix", label: "Pix" },
  { value: "transferencia", label: "Transferência" },
  { value: "cartao_debito", label: "Vendas – Disponível Débito" },
  { value: "cartao_credito", label: "Vendas – Disponível Crédito" },
  { value: "taxas", label: "Taxas" },
  { value: "outros", label: "Outros" },
];

export function TemplateForm({ existingTemplate, onSaved, onCancel }: TemplateFormProps) {
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();

  const [name, setName] = useState(existingTemplate?.name ?? "");
  const [bankCode, setBankCode] = useState<BankCode>(existingTemplate?.bank_code ?? "generic");
  const [companyName, setCompanyName] = useState(existingTemplate?.company_name ?? "");
  const [description, setDescription] = useState(existingTemplate?.description ?? "");
  const [isDefault, setIsDefault] = useState(existingTemplate?.is_default ?? false);
  const [priority, setPriority] = useState(existingTemplate?.priority ?? 0);

  const [sections, setSections] = useState<TemplateSectionForm[]>(
    existingTemplate?.sections?.map((s) => ({
      section_type: s.section_type as SectionType,
      title: s.title,
      display_order: s.display_order,
      is_visible: s.is_visible ?? true,
      config: (s.config as Record<string, unknown>) ?? {},
    })) ?? defaultSections
  );

  const [rules, setRules] = useState<CalculationRuleForm[]>(
    existingTemplate?.rules?.map((r) => ({
      rule_name: r.rule_name,
      rule_type: r.rule_type as RuleType,
      source_categories: r.source_categories ?? [],
      source_types: r.source_types ?? [],
      display_label: r.display_label,
      display_order: r.display_order ?? 0,
      is_visible: r.is_visible ?? true,
    })) ?? defaultRules
  );

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Nome do template é obrigatório");
      return;
    }

    const templateData: ReportTemplateInsert = {
      name: name.trim(),
      bank_code: bankCode,
      company_name: companyName.trim() || null,
      description: description.trim() || null,
      is_default: isDefault,
      priority,
    };

    const sectionData: Omit<TemplateSectionInsert, "template_id">[] = sections.map((s) => ({
      section_type: s.section_type,
      title: s.title,
      display_order: s.display_order,
      is_visible: s.is_visible,
      config: s.config as Json,
    }));

    const ruleData: Omit<CalculationRuleInsert, "template_id">[] = rules.map((r) => ({
      rule_name: r.rule_name,
      rule_type: r.rule_type,
      source_categories: r.source_categories,
      source_types: r.source_types,
      display_label: r.display_label,
      display_order: r.display_order,
      is_visible: r.is_visible,
    }));

    try {
      if (existingTemplate) {
        await updateMutation.mutateAsync({
          id: existingTemplate.id,
          template: templateData,
          sections: sectionData,
          rules: ruleData,
        });
        toast.success("Template atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync({
          template: templateData,
          sections: sectionData,
          rules: ruleData,
        });
        toast.success("Template criado com sucesso!");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar template");
    }
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        section_type: "transactions",
        title: "Nova Seção",
        display_order: prev.length,
        is_visible: true,
        config: {},
      },
    ]);
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, updates: Partial<TemplateSectionForm>) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  };

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        rule_name: `regra_${prev.length}`,
        rule_type: "sum",
        source_categories: [],
        source_types: [],
        display_label: "Nova Regra",
        display_order: prev.length,
        is_visible: true,
      },
    ]);
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<CalculationRuleForm>) => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r))
    );
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Info Básica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações do Template</CardTitle>
          <CardDescription>Dados de identificação e associação do modelo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Template *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Extrato Itaú PJ"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank">Banco Emissor *</Label>
            <Select value={bankCode} onValueChange={(v) => setBankCode(v as BankCode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(bankLabels).map(([code, label]) => (
                  <SelectItem key={code} value={code}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Empresa Associada (opcional)</Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Empresa ABC LTDA"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Input
              id="priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              min={0}
              max={100}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o modelo e quando deve ser usado..."
              rows={2}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="is_default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
            <Label htmlFor="is_default">Template padrão para este banco</Label>
          </div>
        </CardContent>
      </Card>

      {/* Seções */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Seções do Relatório</CardTitle>
              <CardDescription>Configure quais seções aparecem e em qual ordem.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addSection}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar Seção
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sections.map((section, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Badge variant="outline" className="shrink-0 text-xs">
                {index + 1}
              </Badge>
              <Select
                value={section.section_type}
                onValueChange={(v) =>
                  updateSection(index, {
                    section_type: v as SectionType,
                    title: sectionTypeLabels[v as SectionType],
                  })
                }
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sectionTypeLabels).map(([type, label]) => (
                    <SelectItem key={type} value={type}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={section.title}
                onChange={(e) => updateSection(index, { title: e.target.value })}
                className="flex-1"
                placeholder="Título da seção"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  updateSection(index, { is_visible: !section.is_visible })
                }
              >
                {section.is_visible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSection(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {sections.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma seção configurada. Adicione seções para definir o layout do relatório.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Regras de Cálculo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Regras de Cálculo</CardTitle>
              <CardDescription>
                Defina fórmulas e critérios para os cálculos do relatório.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addRule}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar Regra
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.map((rule, index) => (
            <div key={index} className="p-4 rounded-lg border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Regra {index + 1}</Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateRule(index, { is_visible: !rule.is_visible })}
                  >
                    {rule.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeRule(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Label de Exibição</Label>
                  <Input
                    value={rule.display_label}
                    onChange={(e) => updateRule(index, { display_label: e.target.value })}
                    placeholder="Ex: Total Entradas PIX"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tipo de Cálculo</Label>
                  <Select
                    value={rule.rule_type}
                    onValueChange={(v) => updateRule(index, { rule_type: v as RuleType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ruleTypeLabels).map(([type, label]) => (
                        <SelectItem key={type} value={type}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tipo de Transação</Label>
                  <Select
                    value={rule.source_types.join(",") || "all"}
                    onValueChange={(v) =>
                      updateRule(index, {
                        source_types: v === "all" ? [] : [v],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="entrada">Entradas</SelectItem>
                      <SelectItem value="saida">Saídas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma regra de cálculo configurada.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Salvando..." : existingTemplate ? "Atualizar Template" : "Criar Template"}
        </Button>
      </div>
    </div>
  );
}
