import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutTemplate, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { TemplateList } from "@/components/templates/TemplateList";
import { TemplateWithRelations } from "@/types/templateTypes";

type PageMode = "list" | "create" | "edit";

export default function Templates() {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <LayoutTemplate className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Modelos de Relatório
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Gerencie templates para padronizar relatórios financeiros
                  </p>
                </div>
              </div>
            </div>
            {mode === "list" && (
              <Button onClick={() => setMode("create")}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
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
