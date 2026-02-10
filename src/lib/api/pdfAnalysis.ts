import { supabase } from "@/integrations/supabase/client";
import { PdfAnalysisResult } from "@/types/pdfAnalysisTypes";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadPdfForAnalysis(file: File): Promise<{ documentId: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Arquivo excede o limite de 10MB");
  }

  if (file.type !== "application/pdf") {
    throw new Error("Apenas arquivos PDF são aceitos");
  }

  // Validate PDF magic bytes
  const header = await file.slice(0, 5).text();
  if (!header.startsWith("%PDF-")) {
    throw new Error("Arquivo PDF inválido ou corrompido");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const filePath = `${user.id}/${Date.now()}-${file.name}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("pdf-documents")
    .upload(filePath, file, { contentType: "application/pdf" });

  if (uploadError) {
    throw new Error(`Falha no upload: ${uploadError.message}`);
  }

  // Create document record
  const { data: doc, error: insertError } = await supabase
    .from("document_uploads")
    .insert({
      user_id: user.id,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      status: "pending",
    } as any)
    .select("id")
    .single();

  if (insertError || !doc) {
    // Cleanup uploaded file
    await supabase.storage.from("pdf-documents").remove([filePath]);
    throw new Error(`Falha ao registrar documento: ${insertError?.message}`);
  }

  return { documentId: (doc as any).id };
}

export async function analyzePdf(documentId: string): Promise<PdfAnalysisResult> {
  const { data, error } = await supabase.functions.invoke("analyze-pdf", {
    body: { documentId },
  });

  if (error) {
    throw new Error(error.message || "Erro ao analisar PDF");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data.analysis as PdfAnalysisResult;
}

export async function getUserDocuments() {
  const { data, error } = await supabase
    .from("document_uploads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return data;
}
