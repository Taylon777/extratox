import { useState } from "react";
import { getImportLogs, clearImportLogs } from "@/lib/importLogs";
import { ImportLog } from "@/types/importTypes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Trash2, FileText, FileSpreadsheet, File } from "lucide-react";
import { cn } from "@/lib/utils";

const statusLabels: Record<ImportLog["status"], { label: string; className: string }> = {
  success: { label: "Sucesso", className: "bg-emerald-100 text-emerald-800" },
  partial: { label: "Parcial", className: "bg-amber-100 text-amber-800" },
  failed: { label: "Falhou", className: "bg-rose-100 text-rose-800" },
};

const fileTypeIcons: Record<string, typeof File> = {
  csv: FileText,
  ofx: FileSpreadsheet,
  excel: FileSpreadsheet,
  pdf: FileText,
};

export function ImportLogHistory() {
  const [logs, setLogs] = useState<ImportLog[]>(getImportLogs());

  const handleClearLogs = () => {
    clearImportLogs();
    setLogs([]);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma importação registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Histórico
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação removerá permanentemente todos os registros de importação. Os dados
                importados não serão afetados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearLogs}>Limpar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Importadas</TableHead>
              <TableHead className="text-center">Removidas</TableHead>
              <TableHead className="text-center">Editadas</TableHead>
              <TableHead className="text-center">Duplicatas</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const Icon = fileTypeIcons[log.fileType] || File;
              const status = statusLabels[log.status];

              return (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {formatDate(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{log.fileName}</span>
                      <Badge variant="outline" className="text-xs uppercase">
                        {log.fileType}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{log.totalTransactions}</TableCell>
                  <TableCell className="text-center text-emerald-600 font-medium">
                    {log.importedTransactions}
                  </TableCell>
                  <TableCell className="text-center text-rose-600">
                    {log.removedTransactions}
                  </TableCell>
                  <TableCell className="text-center text-blue-600">
                    {log.editedTransactions}
                  </TableCell>
                  <TableCell className="text-center text-amber-600">
                    {log.duplicatesDetected}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("font-normal", status.className)}>
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Mostrando {logs.length} importação(ões) • Logs são armazenados localmente
      </p>
    </div>
  );
}
