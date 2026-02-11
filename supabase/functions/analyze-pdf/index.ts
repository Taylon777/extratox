import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Serviço de IA não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { documentId } = await req.json();
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "documentId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to access storage and update records
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get document record
    const { data: doc, error: docError } = await supabaseAdmin
      .from("document_uploads")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !doc) {
      return new Response(
        JSON.stringify({ error: "Documento não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to processing
    await supabaseAdmin
      .from("document_uploads")
      .update({ status: "processing" })
      .eq("id", documentId);

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("pdf-documents")
      .download(doc.file_path);

    if (downloadError || !fileData) {
      await supabaseAdmin
        .from("document_uploads")
        .update({ status: "failed", error_message: "Falha ao baixar arquivo do storage" })
        .eq("id", documentId);

      return new Response(
        JSON.stringify({ error: "Falha ao baixar o PDF" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert PDF to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const pdfBase64 = btoa(binary);

    console.log(`Processing PDF: ${doc.file_name}, size: ${uint8Array.length} bytes`);

    // Send to Lovable AI Gateway (Gemini 2.5 Pro for multimodal analysis)
    const systemPrompt = `Você é um analista financeiro especializado em extratos bancários brasileiros.
Analise o documento PDF enviado e extraia TODAS as informações de forma estruturada.

REGRAS:
1. Identifique o tipo de documento (extrato bancário, fatura de cartão, etc.)
2. Identifique o banco/instituição financeira
3. Extraia TODAS as transações com: data, descrição, valor, tipo (entrada/saída), categoria
4. Gere um resumo executivo
5. Identifique anomalias ou observações importantes
6. Preserve a estrutura visual: tabelas, seções, cabeçalhos

CATEGORIAS para transações:
- pix: Transferências PIX
- transferencia: TED, DOC, transferências
- cartao_debito: Compras no débito
- cartao_credito: Compras no crédito, faturas
- taxas: Tarifas, IOF, juros, manutenção
- outros: Demais transações

FORMATO DE RESPOSTA (use exatamente esta estrutura JSON):`;

    const toolDefinition = {
      type: "function",
      function: {
        name: "analyze_bank_statement",
        description: "Retorna a análise estruturada completa do extrato bancário em PDF",
        parameters: {
          type: "object",
          properties: {
            documentType: {
              type: "string",
              description: "Tipo do documento (ex: Extrato Bancário, Fatura de Cartão)"
            },
            bankName: {
              type: "string",
              description: "Nome do banco ou instituição financeira"
            },
            period: {
              type: "object",
              properties: {
                start: { type: "string", description: "Data início no formato YYYY-MM-DD" },
                end: { type: "string", description: "Data fim no formato YYYY-MM-DD" }
              },
              required: ["start", "end"]
            },
            summary: {
              type: "object",
              properties: {
                totalEntradas: { type: "number" },
                totalSaidas: { type: "number" },
                saldoLiquido: { type: "number" },
                totalTransacoes: { type: "integer" },
                executiveSummary: { type: "string", description: "Resumo executivo em 3-5 frases" }
              },
              required: ["totalEntradas", "totalSaidas", "saldoLiquido", "totalTransacoes", "executiveSummary"]
            },
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string", description: "Data no formato YYYY-MM-DD" },
                  description: { type: "string" },
                  value: { type: "number", description: "Valor absoluto" },
                  type: { type: "string", enum: ["entrada", "saida"] },
                  category: { type: "string", enum: ["pix", "transferencia", "cartao_debito", "cartao_credito", "taxas", "outros"] },
                  confidence: { type: "string", enum: ["high", "medium", "low"] }
                },
                required: ["date", "description", "value", "type", "category", "confidence"]
              }
            },
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["info", "warning", "anomaly"] },
                  title: { type: "string" },
                  description: { type: "string" }
                },
                required: ["type", "title", "description"]
              }
            },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  pageNumber: { type: "integer" }
                },
                required: ["title", "content"]
              }
            }
          },
          required: ["documentType", "bankName", "summary", "transactions", "insights"],
          additionalProperties: false
        }
      }
    };

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise este documento PDF de extrato bancário. Extraia todas as transações e gere uma análise completa estruturada."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
        tools: [toolDefinition],
        tool_choice: { type: "function", function: { name: "analyze_bank_statement" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);

      let userError = "Erro ao processar o PDF com IA";
      if (aiResponse.status === 429) {
        userError = "Limite de requisições excedido. Tente novamente em alguns minutos.";
      } else if (aiResponse.status === 402) {
        userError = "Créditos de IA insuficientes. Adicione créditos em Configurações.";
      }

      await supabaseAdmin
        .from("document_uploads")
        .update({ status: "failed", error_message: userError })
        .eq("id", documentId);

      return new Response(
        JSON.stringify({ error: userError }),
        { status: aiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response received successfully");

    // Extract the tool call result
    let analysisResult;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        analysisResult = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse tool call arguments");
        analysisResult = null;
      }
    }

    if (!analysisResult) {
      // Fallback: try to parse from content
      const content = aiData.choices?.[0]?.message?.content;
      if (content) {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysisResult = JSON.parse(jsonMatch[0]);
          }
        } catch {
          console.error("Failed to parse content as JSON");
        }
      }
    }

    if (!analysisResult) {
      await supabaseAdmin
        .from("document_uploads")
        .update({ status: "failed", error_message: "Não foi possível extrair dados estruturados do PDF" })
        .eq("id", documentId);

      return new Response(
        JSON.stringify({ error: "Falha na extração estruturada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save analysis result
    const pageCount = analysisResult.sections?.length || 1;
    await supabaseAdmin
      .from("document_uploads")
      .update({
        status: "completed",
        analysis_result: analysisResult,
        page_count: pageCount,
      })
      .eq("id", documentId);

    return new Response(
      JSON.stringify({ success: true, analysis: analysisResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-pdf error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
