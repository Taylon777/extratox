/**
 * Service responsible for transaction deduplication via hash.
 * 
 * IMPORTANT: Transactions with identical date + value + description + type
 * are NOT necessarily duplicates. Real bank statements often have repeated
 * transactions (e.g., two identical purchases on the same day).
 * 
 * A transaction is only a duplicate when it appears in a DIFFERENT import
 * with the exact same fields — meaning the user re-imported the same file.
 * 
 * Strategy: hash includes an occurrence index within each import batch,
 * so the 1st, 2nd, 3rd identical transactions each get unique hashes.
 * Cross-import duplicates are still caught because re-importing the same
 * file produces the same occurrence order.
 */

export async function generateTransactionHash(
  date: string,
  value: number,
  description: string,
  type: "entrada" | "saida",
  occurrenceIndex: number = 0
): Promise<string> {
  const raw = `${date}|${value.toFixed(2)}|${description.trim().toLowerCase()}|${type}|${occurrenceIndex}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Builds a signature key (without hash) for counting occurrences.
 */
function buildSignatureKey(t: { date: string; value: number; description: string; type: string }): string {
  return `${t.date}|${t.value.toFixed(2)}|${t.description.trim().toLowerCase()}|${t.type}`;
}

export async function markDuplicatesWithHash<
  T extends { date: string; value: number; description: string; type: "entrada" | "saida" }
>(
  transactions: T[],
  existingHashes: Set<string>
): Promise<(T & { transaction_hash: string; isDuplicate: boolean })[]> {
  // Count occurrences within this batch to assign unique indices
  const occurrenceCounter = new Map<string, number>();
  const results: (T & { transaction_hash: string; isDuplicate: boolean })[] = [];

  for (const t of transactions) {
    const sigKey = buildSignatureKey(t);
    const currentIndex = occurrenceCounter.get(sigKey) || 0;
    occurrenceCounter.set(sigKey, currentIndex + 1);

    const hash = await generateTransactionHash(t.date, t.value, t.description, t.type, currentIndex);
    const isDuplicate = existingHashes.has(hash);

    results.push({ ...t, transaction_hash: hash, isDuplicate });
  }

  return results;
}
