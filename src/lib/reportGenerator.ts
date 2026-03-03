/**
 * Professional Financial Report PDF Generator
 * Generates a corporate-grade financial statement with:
 * - Executive header (Company, Period, Report Date)
 * - Financial overview with category breakdowns
 * - SVG pie charts for revenue/expense distribution
 * - Full transaction listing with running balance
 */

import type { FinancialMetrics, CategoryBreakdownItem } from "@/services/financialCalculationService";

interface ReportTransaction {
  date: string;
  description: string;
  category: string;
  type: "entrada" | "saida";
  value: number;
}

interface ReportConfig {
  companyName: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  pix: "Pix",
  transferencia: "Transferência",
  cartao_debito: "Cartão Débito",
  cartao_credito: "Cartão Crédito",
  taxas: "Taxas Bancárias",
  outros: "Outros",
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

function buildPieChartSvg(
  items: { name: string; value: number; color: string }[],
  title: string
): string {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return "";

  let currentAngle = -90;
  const radius = 80;
  const cx = 100;
  const cy = 100;

  const slices = items.map((item) => {
    const pct = item.value / total;
    const angle = pct * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path =
      items.length === 1
        ? `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${item.color}" />`
        : `<path d="M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z" fill="${item.color}" />`;

    return { path, name: item.name, pct, color: item.color, value: item.value };
  });

  const legendItems = slices
    .map(
      (s, i) =>
        `<div style="display:flex;align-items:center;gap:6px;font-size:11px">
          <span style="width:10px;height:10px;border-radius:2px;background:${s.color};flex-shrink:0"></span>
          <span style="color:#374151">${s.name}</span>
          <span style="color:#9ca3af;margin-left:auto">${fmtPct(s.pct * 100)}</span>
          <span style="color:#374151;font-weight:600;min-width:90px;text-align:right">${fmt(s.value)}</span>
        </div>`
    )
    .join("");

  return `
    <div style="margin-bottom:24px">
      <h3 style="font-size:13px;font-weight:700;color:#1f2937;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px">${title}</h3>
      <div style="display:flex;align-items:center;gap:24px">
        <svg width="200" height="200" viewBox="0 0 200 200">${slices.map((s) => s.path).join("")}</svg>
        <div style="flex:1;display:flex;flex-direction:column;gap:6px">${legendItems}</div>
      </div>
    </div>`;
}

export function generateProfessionalReport(
  transactions: ReportTransaction[],
  metrics: FinancialMetrics,
  config: ReportConfig
): string {
  const now = new Date();
  const reportDate = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Sort transactions chronologically (oldest first) for running balance
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Build running balance
  let runningBalance = 0;
  const transactionRows = sorted
    .map((t) => {
      const sign = t.type === "entrada" ? 1 : -1;
      runningBalance += t.value * sign;
      const dateStr = new Date(t.date).toLocaleDateString("pt-BR");
      const catLabel = CATEGORY_LABELS[t.category] || t.category;
      const valueColor = t.type === "entrada" ? "#047857" : "#b91c1c";
      const valuePrefix = t.type === "entrada" ? "+" : "−";
      const balColor = runningBalance >= 0 ? "#047857" : "#b91c1c";

      return `<tr>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;white-space:nowrap;font-size:12px;color:#374151">${dateStr}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#1f2937;max-width:280px;overflow:hidden;text-overflow:ellipsis">${t.description}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280">${catLabel}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:600;text-align:right;color:${valueColor};white-space:nowrap">${valuePrefix} ${fmt(t.value)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:600;text-align:right;color:${balColor};white-space:nowrap">${fmt(runningBalance)}</td>
      </tr>`;
    })
    .join("");

  // Category breakdown tables
  const entryCats = metrics.categoryBreakdown.filter((c) => c.type === "entrada" && c.total > 0);
  const exitCats = metrics.categoryBreakdown.filter((c) => c.type === "saida" && c.total > 0);

  const buildCategoryTable = (items: CategoryBreakdownItem[], total: number, title: string) => {
    if (items.length === 0) return "";
    const rows = items
      .sort((a, b) => b.total - a.total)
      .map(
        (c) =>
          `<tr>
            <td style="padding:5px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#374151">${c.label}</td>
            <td style="padding:5px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;text-align:center;color:#6b7280">${c.count}</td>
            <td style="padding:5px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;text-align:right;font-weight:600;color:#1f2937">${fmt(c.total)}</td>
            <td style="padding:5px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;text-align:right;color:#6b7280">${fmtPct((c.total / total) * 100)}</td>
          </tr>`
      )
      .join("");

    return `
      <div style="margin-bottom:16px">
        <h4 style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px">${title}</h4>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th style="text-align:left;padding:6px 10px;background:#f9fafb;font-size:10px;text-transform:uppercase;color:#9ca3af;border-bottom:1px solid #e5e7eb">Categoria</th>
            <th style="text-align:center;padding:6px 10px;background:#f9fafb;font-size:10px;text-transform:uppercase;color:#9ca3af;border-bottom:1px solid #e5e7eb">Qtd</th>
            <th style="text-align:right;padding:6px 10px;background:#f9fafb;font-size:10px;text-transform:uppercase;color:#9ca3af;border-bottom:1px solid #e5e7eb">Valor</th>
            <th style="text-align:right;padding:6px 10px;background:#f9fafb;font-size:10px;text-transform:uppercase;color:#9ca3af;border-bottom:1px solid #e5e7eb">%</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  };

  // Pie charts
  const entryPie = buildPieChartSvg(
    entryCats.map((c) => ({ name: c.label, value: c.total, color: c.color })),
    "Distribuição de Receitas"
  );
  const exitPie = buildPieChartSvg(
    exitCats.map((c) => ({ name: c.label, value: c.total, color: c.color })),
    "Distribuição de Despesas"
  );

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Financeiro — ${config.companyName}</title>
<style>
  @media print {
    body { margin: 0; }
    .page-break { page-break-before: always; }
    @page { margin: 20mm 15mm; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1f2937; background: #fff; }
  
  .header { background: linear-gradient(135deg, #1e3a5f 0%, #0f2440 100%); color: #fff; padding: 32px 40px; }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .header .company-id { font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 2px; }
  .header-meta { display: flex; gap: 32px; margin-top: 16px; }
  .header-meta div { font-size: 11px; }
  .header-meta .label { color: rgba(255,255,255,0.6); text-transform: uppercase; font-size: 9px; letter-spacing: 1px; font-weight: 600; }
  .header-meta .val { color: #fff; font-weight: 600; margin-top: 2px; }
  
  .content { padding: 32px 40px; }
  
  .section-title { font-size: 14px; font-weight: 700; color: #1f2937; border-bottom: 2px solid #1e3a5f; padding-bottom: 6px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
  
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .kpi-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
  .kpi-card .kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; font-weight: 600; }
  .kpi-card .kpi-value { font-size: 22px; font-weight: 800; margin-top: 4px; }
  .kpi-card .kpi-sub { font-size: 11px; color: #9ca3af; margin-top: 2px; }
  
  .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
  
  table { width: 100%; border-collapse: collapse; }
  
  .footer { text-align: center; padding: 24px 40px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <h1>${config.companyName}</h1>
  <div class="company-id">${config.companyId}</div>
  <div class="header-meta">
    <div><div class="label">Período</div><div class="val">${config.periodStart} — ${config.periodEnd}</div></div>
    <div><div class="label">Data do Relatório</div><div class="val">${reportDate}</div></div>
    <div><div class="label">Total de Lançamentos</div><div class="val">${metrics.transactionCount}</div></div>
  </div>
</div>

<div class="content">

  <!-- EXECUTIVE SUMMARY -->
  <h2 class="section-title">Resumo Executivo</h2>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Receita Total</div>
      <div class="kpi-value" style="color:#047857">${fmt(metrics.totalEntradas)}</div>
      <div class="kpi-sub">${metrics.entradasCount} lançamentos</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Despesa Total</div>
      <div class="kpi-value" style="color:#b91c1c">${fmt(metrics.totalSaidas)}</div>
      <div class="kpi-sub">${metrics.saidasCount} lançamentos</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Saldo Líquido</div>
      <div class="kpi-value" style="color:${metrics.saldoLiquido >= 0 ? "#047857" : "#b91c1c"}">${fmt(metrics.saldoLiquido)}</div>
      <div class="kpi-sub">${metrics.saldoLiquido >= 0 ? "Superávit" : "Déficit"}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Margem Líquida</div>
      <div class="kpi-value" style="color:#1e3a5f">${metrics.totalEntradas > 0 ? fmtPct((metrics.saldoLiquido / metrics.totalEntradas) * 100) : "0,0%"}</div>
      <div class="kpi-sub">Saldo / Receita</div>
    </div>
  </div>

  <!-- CATEGORY BREAKDOWN -->
  <h2 class="section-title">Visão Financeira por Categoria</h2>
  <div class="charts-grid">
    <div>
      ${entryPie}
      ${buildCategoryTable(entryCats, metrics.totalEntradas, "Detalhamento de Receitas")}
    </div>
    <div>
      ${exitPie}
      ${buildCategoryTable(exitCats, metrics.totalSaidas, "Detalhamento de Despesas")}
    </div>
  </div>

  <!-- TRANSACTIONS -->
  <div class="page-break"></div>
  <h2 class="section-title">Transações Recentes</h2>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;padding:8px 10px;background:#f9fafb;font-size:10px;text-transform:uppercase;color:#9ca3af;border-bottom:2px solid #d1d5db;letter-spacing:0.5px">Data</th>
        <th style="text-align:left;padding:8px 10px;background:#f9fafb;font-size:10px;text-transform:uppercase;color:#9ca3af;border-bottom:2px solid #d1d5db;letter-spacing:0.5px">Descrição</th>
        <th style="text-align:left;padding:8px 10px;background:#f9fafb;font-size:10px;text-transform:uppercase;color:#9ca3af;border-bottom:2px solid #d1d5db;letter-spacing:0.5px">Categoria</th>
        <th style="text-align:right;padding:8px 10px;background:#f9fafb;font-size:10px;text-transform:uppercase;color:#9ca3af;border-bottom:2px solid #d1d5db;letter-spacing:0.5px">Valor</th>
        <th style="text-align:right;padding:8px 10px;background:#f9fafb;font-size:10px;text-transform:uppercase;color:#9ca3af;border-bottom:2px solid #d1d5db;letter-spacing:0.5px">Saldo</th>
      </tr>
    </thead>
    <tbody>
      ${transactionRows}
    </tbody>
    <tfoot>
      <tr style="background:#f9fafb">
        <td colspan="3" style="padding:8px 10px;font-size:12px;font-weight:700;color:#1f2937">TOTAL</td>
        <td style="padding:8px 10px;font-size:12px;font-weight:700;text-align:right;color:#1f2937">${fmt(metrics.totalEntradas - metrics.totalSaidas)}</td>
        <td style="padding:8px 10px;font-size:12px;font-weight:700;text-align:right;color:${runningBalance >= 0 ? "#047857" : "#b91c1c"}">${fmt(runningBalance)}</td>
      </tr>
    </tfoot>
  </table>

</div>

<div class="footer">
  Relatório gerado automaticamente por R&R Contas — ${reportDate} — Documento para uso interno
</div>

</body></html>`;
}
