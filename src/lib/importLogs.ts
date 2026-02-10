import { ImportLog } from "@/types/importTypes";

const STORAGE_KEY = "financial_import_logs";

export function saveImportLog(log: ImportLog): void {
  const logs = getImportLogs();
  logs.unshift(log);
  
  // Mantém apenas os últimos 100 logs
  const trimmedLogs = logs.slice(0, 100);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs));
}

export function getImportLogs(): ImportLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  } catch {
    return [];
  }
}

export function getImportLog(id: string): ImportLog | undefined {
  const logs = getImportLogs();
  return logs.find((log) => log.id === id);
}

export function clearImportLogs(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function createImportLog(
  fileName: string,
  fileType: string,
  totalTransactions: number,
  importedTransactions: number,
  removedTransactions: number,
  editedTransactions: number,
  duplicatesDetected: number,
  userId?: string
): ImportLog {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: userId || "anonymous",
    timestamp: new Date(),
    fileName,
    fileType,
    totalTransactions,
    importedTransactions,
    removedTransactions,
    editedTransactions,
    duplicatesDetected,
    status: importedTransactions === totalTransactions 
      ? "success" 
      : importedTransactions > 0 
        ? "partial" 
        : "failed",
  };
}
