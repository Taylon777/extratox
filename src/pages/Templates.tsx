import { useState } from "react";
import { LayoutTemplate, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { TemplateList } from "@/components/templates/TemplateList";
import { TemplateWithRelations } from "@/types/templateTypes";

type PageMode = "list" | "create" | "edit";

export default function Templates() {
  const [mode, setMode] = useState<PageMode>("list");
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithRelations | undefined>();

  const handleEdit = (template: TemplateWithRelations) => {
    setEditingTemplate(template);
    setMode("edit");
  };

  const handleSaved = () => {
    setMode("list");
    setEditingTemplate(undefined);
  };

  const handleCancel = () => {
    setMode("list");
    setEditingTemplate(undefined);
  };

  return (
    <div className="flex-1 min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <LayoutTemplate className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Modelos de Relatório</h1>
                <p className="text-xs text-muted-foreground">
                  Gerencie templates para padronizar relatórios
                </p>
              </div>
            </div>
          </div>
          {mode === "list" && (
            <Button size="sm" onClick={() => setMode("create")} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          )}
        </div>
      </header>

      <main className="p-6 max-w-4xl">
        {mode === "list" && <TemplateList onEdit={handleEdit} />}
        {(mode === "create" || mode === "edit") && (
          <TemplateForm
            existingTemplate={editingTemplate}
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        )}
      </main>
    </div>
  );
}
