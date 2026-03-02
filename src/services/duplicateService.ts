/**
 * Service responsible for transaction deduplication via hash.
 * Hash = SHA-256(date + value + description + type)
 */

export async function generateTransactionHash(
  date: string,
  value: number,
  description: string,
  type: "entrada" | "saida"
): Promise<string> {
  const raw = `${date}|${value.toFixed(2)}|${description.trim().toLowerCase()}|${type}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function markDuplicatesWithHash<
  T extends { date: string; value: number; description: string; type: "entrada" | "saida" }
>(
  transactions: T[],
  existingHashes: Set<string>
): Promise<(T & { transaction_hash: string; isDuplicate: boolean })[]> {
  const seenHashes = new Set<string>();
  const results: (T & { transaction_hash: string; isDuplicate: boolean })[] = [];

  for (const t of transactions) {
    const hash = await generateTransactionHash(t.date, t.value, t.description, t.type);
    const isDuplicate = existingHashes.has(hash) || seenHashes.has(hash);

    if (!isDuplicate) {
      seenHashes.add(hash);
    }

    results.push({ ...t, transaction_hash: hash, isDuplicate });
  }

  return results;
}
