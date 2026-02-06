import { useState } from "react";
import { Edit2, Trash2, FileText, Building2, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  TemplateWithRelations,
  bankLabels,
  sectionTypeLabels,
  ruleTypeLabels,
  SectionType,
  RuleType,
} from "@/types/templateTypes";
import { useTemplates, useDeleteTemplate } from "@/hooks/useTemplates";

interface TemplateListProps {
  onEdit: (template: TemplateWithRelations) => void;
}

export function TemplateList({ onEdit }: TemplateListProps) {
  const { data: templates, isLoading, error } = useTemplates();
  const deleteMutation = useDeleteTemplate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Template excluído com sucesso!");
    } catch (err) {
      toast.error("Erro ao excluir template");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-6">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Erro ao carregar templates: {error.message}
        </CardContent>
      </Card>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-1">Nenhum template cadastrado</h3>
          <p className="text-sm text-muted-foreground">
            Crie seu primeiro template para padronizar os relatórios financeiros.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <Collapsible
          key={template.id}
          open={expandedId === template.id}
          onOpenChange={(open) => setExpandedId(open ? template.id : null)}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expandedId === template.id ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.is_default && (
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {bankLabels[template.bank_code]}
                      </Badge>
                      {template.company_name && (
                        <Badge variant="outline" className="text-xs">
                          <Building2 className="h-3 w-3 mr-1" />
                          {template.company_name}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {template.sections.length} seções • {template.rules.length} regras
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(template)}>
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir "{template.name}"? Esta ação não
                          pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(template.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Seções</h4>
                    <div className="space-y-1">
                      {template.sections.map((s, i) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <span className="w-5 text-center text-xs">{i + 1}.</span>
                          <span className={!s.is_visible ? "line-through opacity-50" : ""}>
                            {s.title}
                          </span>
                          <Badge variant="outline" className="text-[10px] ml-auto">
                            {sectionTypeLabels[s.section_type as SectionType] ?? s.section_type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Regras de Cálculo</h4>
                    <div className="space-y-1">
                      {template.rules.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <span className={!r.is_visible ? "line-through opacity-50" : ""}>
                            {r.display_label}
                          </span>
                          <Badge variant="outline" className="text-[10px] ml-auto">
                            {ruleTypeLabels[r.rule_type as RuleType] ?? r.rule_type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}
