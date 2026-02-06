import { supabase } from "@/integrations/supabase/client";
import { BankCode, BankDetectionPattern } from "@/types/templateTypes";

interface DetectionResult {
  bankCode: BankCode;
  confidence: number;
  matchedPatterns: string[];
}

/**
 * Detecta o banco emissor a partir do conteúdo textual de um extrato.
 * Busca padrões no banco de dados e faz matching por prioridade.
 */
export async function detectBank(content: string): Promise<DetectionResult> {
  const { data: patterns, error } = await supabase
    .from("bank_detection_patterns")
    .select("*")
    .order("priority", { ascending: false });

  if (error || !patterns || patterns.length === 0) {
    return { bankCode: "generic", confidence: 0, matchedPatterns: [] };
  }

  const contentLower = content.toLowerCase();
  const scores: Record<BankCode, { score: number; matches: string[] }> = {
    itau: { score: 0, matches: [] },
    bradesco: { score: 0, matches: [] },
    bb: { score: 0, matches: [] },
    santander: { score: 0, matches: [] },
    nubank: { score: 0, matches: [] },
    generic: { score: 0, matches: [] },
  };

  for (const pattern of patterns) {
    const patternValue = pattern.pattern_value.toLowerCase();
    const priority = pattern.priority ?? 0;

    if (contentLower.includes(patternValue)) {
      const bankCode = pattern.bank_code as BankCode;
      scores[bankCode].score += priority;
      scores[bankCode].matches.push(pattern.pattern_value);
    }
  }

  // Encontra o banco com maior score
  let bestBank: BankCode = "generic";
  let bestScore = 0;

  for (const [bank, data] of Object.entries(scores)) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestBank = bank as BankCode;
    }
  }

  // Calcula confiança (0-100) baseada no score
  const maxPossibleScore = patterns
    .filter((p) => p.bank_code === bestBank)
    .reduce((sum, p) => sum + (p.priority ?? 0), 0);

  const confidence = maxPossibleScore > 0 ? Math.min(100, (bestScore / maxPossibleScore) * 100) : 0;

  return {
    bankCode: bestBank,
    confidence: Math.round(confidence),
    matchedPatterns: scores[bestBank].matches,
  };
}

/**
 * Detecta banco a partir de conteúdo OFX usando tags específicas.
 */
export function detectBankFromOFX(content: string): BankCode {
  const orgMatch = content.match(/<ORG>([^<]+)/i);
  const fidMatch = content.match(/<FID>([^<]+)/i);

  const org = orgMatch?.[1]?.toLowerCase() ?? "";
  const fid = fidMatch?.[1] ?? "";

  if (org.includes("itau") || org.includes("itaú")) return "itau";
  if (org.includes("bradesco")) return "bradesco";
  if (org.includes("brasil") || org.includes("bb")) return "bb";
  if (org.includes("santander")) return "santander";
  if (org.includes("nubank") || org.includes("nu ")) return "nubank";

  return "generic";
}
