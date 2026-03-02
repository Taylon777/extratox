/**
 * Service for managing import sessions with isolated import IDs.
 * Handles creating imports, saving transactions with hash dedup, and tracking progress.
 */

import { supabase } from "@/integrations/supabase/client";
import { generateTransactionHash } from "./duplicateService";

export interface ImportSession {
  id: string;
  fileName: string;
  fileType: string;
  totalTransactions: number;
  importedTransactions: number;
  duplicatesSkipped: number;
  status: "pending" | "processing" | "success" | "failed";
}

export interface TransactionToImport {
  date: string;
  description: string;
  category: "pix" | "transferencia" | "cartao_debito" | "cartao_credito" | "taxas" | "outros";
  type: "entrada" | "saida";
  value: number;
  bank_name?: string;
  is_duplicate?: boolean;
}

/** Create a new import session in the database */
export async function createImportSession(
  userId: string,
  fileName: string,
  fileType: string
): Promise<string> {
  const { data, error } = await supabase
    .from("imports")
    .insert({
      user_id: userId,
      file_name: fileName,
      file_type: fileType,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

/** Fetch existing transaction hashes for a user to detect duplicates */
export async function fetchExistingHashes(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("transactions")
    .select("transaction_hash")
    .not("transaction_hash", "is", null);

  if (error) throw error;
  return new Set((data || []).map((r) => r.transaction_hash).filter(Boolean) as string[]);
}

/** Save transactions with deduplication, linked to an import session */
export async function saveTransactionsWithDedup(
  userId: string,
  importId: string,
  transactions: TransactionToImport[],
  existingHashes: Set<string>
): Promise<{ imported: number; skipped: number }> {
  const seenHashes = new Set<string>();
  const rowsToInsert: any[] = [];
  let skipped = 0;

  for (const t of transactions) {
    const hash = await generateTransactionHash(t.date, t.value, t.description, t.type);

    if (existingHashes.has(hash) || seenHashes.has(hash)) {
      skipped++;
      continue;
    }

    seenHashes.add(hash);
    rowsToInsert.push({
      user_id: userId,
      import_id: importId,
      date: t.date,
      description: t.description.slice(0, 500),
      category: t.category,
      type: t.type,
      value: t.value,
      bank_name: t.bank_name || null,
      is_duplicate: false,
      transaction_hash: hash,
    });
  }

  if (rowsToInsert.length > 0) {
    // Insert in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
      const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("transactions").insert(batch);
      if (error) throw error;
    }
  }

  // Update import session
  await supabase
    .from("imports")
    .update({
      total_transactions: transactions.length,
      imported_transactions: rowsToInsert.length,
      duplicates_skipped: skipped,
      status: "success",
    })
    .eq("id", importId);

  return { imported: rowsToInsert.length, skipped };
}

/** Fetch all import sessions for a user */
export async function fetchImportSessions(userId: string): Promise<ImportSession[]> {
  const { data, error } = await supabase
    .from("imports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    fileName: row.file_name,
    fileType: row.file_type,
    totalTransactions: row.total_transactions,
    importedTransactions: row.imported_transactions,
    duplicatesSkipped: row.duplicates_skipped,
    status: row.status as ImportSession["status"],
  }));
}
