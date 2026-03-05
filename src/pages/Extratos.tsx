import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  FileText,
  Trash2,
  AlertTriangle,
  Download,
  Calendar,
  Hash,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface ImportRecord {
  id: string;
  file_name: string;
  file_type: string;
  total_transactions: number;
  imported_transactions: number;
  duplicates_skipped: number;
  status: string;
  created_at: string;
}

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(dateStr));

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  success: { label: "Concluído", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  processing: { label: "Processando", variant: "outline" },
  failed: { label: "Falhou", variant: "destructive" },
};

export default function Extratos() {
  const { user } = useAuth();
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const fetchImports = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("imports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setImports((data as ImportRecord[]) || []);
    } catch {
      toast.error("Erro ao carregar extratos.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchImports(); }, [fetchImports]);

  const handleDeleteImport = async (importId: string) => {
    if (!user) return;
    setDeletingId(importId);
    try {
      // Delete transactions linked to this import
      const { error: txError } = await supabase
        .from("transactions")
        .delete()
        .eq("import_id", importId);
      if (txError) throw txError;

      // Delete the import record
      const { error: impError } = await supabase
        .from("imports")
        .delete()
        .eq("id", importId);
      if (impError) throw impError;

      setImports((prev) => prev.filter((i) => i.id !== importId));
      toast.success("Extrato e transações removidos com sucesso.");
    } catch {
      toast.error("Erro ao remover extrato.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    setIsDeletingAll(true);
    try {
      const { error: txError } = await supabase
        .from("transactions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all
      if (txError) throw txError;

      const { error: impError } = await supabase
        .from("imports")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (impError) throw impError;

      setImports([]);
      toast.success("Todos os dados foram apagados. Sistema resetado.");
    } catch {
      toast.error("Erro ao limpar dados.");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const totalTransactions = imports.reduce((sum, i) => sum + i.imported_transactions, 0);
  const totalDuplicates = imports.reduce((sum, i) => sum + i.duplicates_skipped, 0);

  return (
    <div className="flex-1 min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">Gestão de Extratos</h1>
              <p className="text-[11px] text-muted-foreground">Visualize, gerencie e exclua importações</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchImports} className="h-8 text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Atualizar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-8 text-xs" disabled={imports.length === 0}>
                  <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                  Apagar Todos os Dados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Apagar todos os dados importados?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>Esta ação é <strong>irreversível</strong>. Todos os dados serão permanentemente removidos:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>{imports.length} extrato(s) importado(s)</li>
                      <li>{totalTransactions} transação(ões)</li>
                      <li>Dashboard, gráficos e relatórios serão zerados</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeletingAll}
                  >
                    {isDeletingAll ? "Apagando..." : "Sim, apagar tudo"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="p-5 space-y-5 max-w-5xl mx-auto">
        {/* Summary Cards */}
        <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Extratos</p>
                  <p className="text-lg font-bold tabular-nums">{imports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Download className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Importadas</p>
                  <p className="text-lg font-bold tabular-nums">{totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Hash className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Duplicatas</p>
                  <p className="text-lg font-bold tabular-nums">{totalDuplicates}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Calendar className="h-4 w-4 text-info" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Última</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {imports[0] ? formatDate(imports[0].created_at) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Import Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Extratos Importados</CardTitle>
            <CardDescription className="text-xs">
              Cada extrato agrupa transações por importação. Excluir um extrato remove todas as suas transações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : imports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground font-medium">Nenhum extrato importado</p>
                <p className="text-xs text-muted-foreground mt-1">Importe seu primeiro extrato bancário para começar.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground h-9">Data</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground h-9">Arquivo</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground h-9 text-center">Importadas</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground h-9 text-center">Duplicatas</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground h-9 text-center">Status</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground h-9 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {imports.map((imp, idx) => {
                      const st = statusMap[imp.status] || statusMap.pending;
                      return (
                        <TableRow key={imp.id} className={cn(idx % 2 === 0 ? "bg-card" : "bg-muted/20")}>
                          <TableCell className="text-sm tabular-nums text-muted-foreground py-2.5">
                            {formatDate(imp.created_at)}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-foreground font-medium truncate max-w-[200px]">
                                {imp.file_name}
                              </span>
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {imp.file_type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm font-semibold text-success tabular-nums py-2.5">
                            {imp.imported_transactions}
                          </TableCell>
                          <TableCell className="text-center text-sm tabular-nums text-warning py-2.5">
                            {imp.duplicates_skipped}
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right py-2.5">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-muted-foreground hover:text-destructive"
                                  disabled={deletingId === imp.id}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir extrato?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    O extrato <strong>{imp.file_name}</strong> e suas{" "}
                                    <strong>{imp.imported_transactions}</strong> transações serão removidos permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteImport(imp.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
