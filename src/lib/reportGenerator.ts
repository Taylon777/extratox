/**
 * Professional Financial Report PDF Generator v2
 * Corporate-grade financial statement with premium design
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

function buildDonutChart(
  items: { name: string; value: number; color: string }[],
  title: string
): string {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return "";

  let currentAngle = -90;
  const outerR = 75;
  const innerR = 45;
  const cx = 90;
  const cy = 90;

  const slices = items.map((item) => {
    const pct = item.value / total;
    const angle = pct * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + outerR * Math.cos(startRad);
    const y1 = cy + outerR * Math.sin(startRad);
    const x2 = cx + outerR * Math.cos(endRad);
    const y2 = cy + outerR * Math.sin(endRad);
    const x3 = cx + innerR * Math.cos(endRad);
    const y3 = cy + innerR * Math.sin(endRad);
    const x4 = cx + innerR * Math.cos(startRad);
    const y4 = cy + innerR * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path =
      items.length === 1
        ? `<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${item.color}" /><circle cx="${cx}" cy="${cy}" r="${innerR}" fill="#fff" />`
        : `<path d="M${x1},${y1} A${outerR},${outerR} 0 ${largeArc},1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${largeArc},0 ${x4},${y4} Z" fill="${item.color}" />`;

    return { path, name: item.name, pct, color: item.color, value: item.value };
  });

  const legendItems = slices
    .map(
      (s) =>
        `<div style="display:flex;align-items:center;gap:8px;font-size:11px;padding:4px 0">
          <span style="width:10px;height:10px;border-radius:50%;background:${s.color};flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,0.15)"></span>
          <span style="color:#374151;flex:1">${s.name}</span>
          <span style="color:#6b7280;font-size:10px">${fmtPct(s.pct * 100)}</span>
          <span style="color:#111827;font-weight:700;min-width:95px;text-align:right;font-size:11px">${fmt(s.value)}</span>
        </div>`
    )
    .join("");

  return `
    <div style="margin-bottom:20px">
      <h3 style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:14px;text-transform:uppercase;letter-spacing:1px;border-left:3px solid #1e3a5f;padding-left:10px">${title}</h3>
      <div style="display:flex;align-items:center;gap:28px">
        <div style="position:relative;width:180px;height:180px;flex-shrink:0">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <filter id="shadow-${title.replace(/\s/g, "")}">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1"/>
              </filter>
            </defs>
            <g filter="url(#shadow-${title.replace(/\s/g, "")})">${slices.map((s) => s.path).join("")}</g>
          </svg>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">
            <div style="font-size:14px;font-weight:800;color:#0f172a">${fmt(total)}</div>
            <div style="font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">Total</div>
          </div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:2px">${legendItems}</div>
      </div>
    </div>`;
}

function buildHorizontalBar(items: CategoryBreakdownItem[], total: number, title: string, accentColor: string): string {
  if (items.length === 0 || total === 0) return "";
  const sorted = [...items].sort((a, b) => b.total - a.total);

  const bars = sorted
    .map((c) => {
      const pct = (c.total / total) * 100;
      return `
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
            <span style="font-size:11px;color:#374151;font-weight:500">${c.label}</span>
            <span style="font-size:11px;font-weight:700;color:#111827">${fmt(c.total)} <span style="font-weight:400;color:#9ca3af;font-size:10px">(${fmtPct(pct)})</span></span>
          </div>
          <div style="height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${c.color};border-radius:4px;transition:width 0.3s"></div>
          </div>
        </div>`;
    })
    .join("");

  return `
    <div style="margin-bottom:20px">
      <h4 style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.8px;display:flex;align-items:center;gap:8px">
        <span style="width:6px;height:6px;border-radius:50%;background:${accentColor}"></span>
        ${title} · ${sorted.length} categorias · ${fmt(total)}
      </h4>
      ${bars}
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
  const reportTime = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // Sort transactions chronologically for running balance
  const sorted = [...transactions].sort(
    (a, b) => a.date.localeCompare(b.date)
  );

  // Build running balance rows with alternating colors
  let runningBalance = 0;
  const transactionRows = sorted
    .map((t, idx) => {
      const sign = t.type === "entrada" ? 1 : -1;
      runningBalance += t.value * sign;
      const [year, month, day] = t.date.split("-");
      const dateStr = `${day}/${month}/${year}`;
      const catLabel = CATEGORY_LABELS[t.category] || t.category;
      const valueColor = t.type === "entrada" ? "#047857" : "#b91c1c";
      const valuePrefix = t.type === "entrada" ? "+" : "−";
      const balColor = runningBalance >= 0 ? "#047857" : "#b91c1c";
      const bgColor = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const typeBadgeBg = t.type === "entrada" ? "#ecfdf5" : "#fef2f2";
      const typeBadgeColor = t.type === "entrada" ? "#065f46" : "#991b1b";
      const typeBadgeText = t.type === "entrada" ? "C" : "D";

      return `<tr style="background:${bgColor}">
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;white-space:nowrap;font-size:11px;color:#374151;font-variant-numeric:tabular-nums">${dateStr}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#0f172a;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:10px;color:#64748b">
          <span style="background:#f1f5f9;padding:2px 8px;border-radius:10px;font-size:10px">${catLabel}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center">
          <span style="display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;border-radius:50%;background:${typeBadgeBg};color:${typeBadgeColor};font-size:9px;font-weight:700">${typeBadgeText}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:11px;font-weight:700;text-align:right;color:${valueColor};white-space:nowrap;font-variant-numeric:tabular-nums">${valuePrefix} ${fmt(t.value)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:11px;font-weight:600;text-align:right;color:${balColor};white-space:nowrap;font-variant-numeric:tabular-nums">${fmt(runningBalance)}</td>
      </tr>`;
    })
    .join("");

  // Category breakdown
  const entryCats = metrics.categoryBreakdown.filter((c) => c.type === "entrada" && c.total > 0);
  const exitCats = metrics.categoryBreakdown.filter((c) => c.type === "saida" && c.total > 0);

  // Charts
  const entryDonut = buildDonutChart(
    entryCats.map((c) => ({ name: c.label, value: c.total, color: c.color })),
    "Distribuição de Receitas"
  );
  const exitDonut = buildDonutChart(
    exitCats.map((c) => ({ name: c.label, value: c.total, color: c.color })),
    "Distribuição de Despesas"
  );

  const entryBars = buildHorizontalBar(entryCats, metrics.totalEntradas, "Receitas por Categoria", "#047857");
  const exitBars = buildHorizontalBar(exitCats, metrics.totalSaidas, "Despesas por Categoria", "#b91c1c");

  const netMargin = metrics.totalEntradas > 0 ? (metrics.saldoLiquido / metrics.totalEntradas) * 100 : 0;
  const avgTicket = metrics.transactionCount > 0 ? (metrics.totalEntradas + metrics.totalSaidas) / metrics.transactionCount : 0;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Financeiro — ${config.companyName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  
  @media print {
    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-break { page-break-before: always; }
    @page { margin: 15mm 12mm; size: A4; }
    .no-print { display: none !important; }
  }
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; color: #0f172a; background: #fff; line-height: 1.5; }
  
  .header {
    background: linear-gradient(135deg, #0c1929 0%, #1e3a5f 50%, #2d5a8e 100%);
    color: #fff;
    padding: 36px 44px 28px;
    position: relative;
    overflow: hidden;
  }
  .header::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
    border-radius: 50%;
  }
  .header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6);
  }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1; }
  .header h1 { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.2; }
  .header .subtitle { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 4px; font-weight: 400; letter-spacing: 2px; text-transform: uppercase; }
  .header .company-id { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 6px; font-weight: 500; }
  .header-badge { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 16px; text-align: right; backdrop-filter: blur(10px); }
  .header-badge .badge-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.5); font-weight: 600; }
  .header-badge .badge-value { font-size: 13px; font-weight: 700; color: #fff; margin-top: 2px; }
  
  .header-meta { display: flex; gap: 28px; margin-top: 20px; position: relative; z-index: 1; }
  .header-meta .meta-item { }
  .header-meta .label { color: rgba(255,255,255,0.45); text-transform: uppercase; font-size: 9px; letter-spacing: 1.5px; font-weight: 600; }
  .header-meta .val { color: #fff; font-weight: 600; margin-top: 3px; font-size: 13px; }
  
  .content { padding: 32px 44px; }
  
  .section-title {
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
    padding-bottom: 8px;
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .section-title::before {
    content: '';
    width: 4px;
    height: 18px;
    background: linear-gradient(180deg, #1e3a5f, #3b82f6);
    border-radius: 2px;
    flex-shrink: 0;
  }
  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, #e2e8f0, transparent);
  }
  
  .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 36px; }
  .kpi-card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px 18px;
    position: relative;
    overflow: hidden;
    background: #fff;
  }
  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
  }
  .kpi-card.green::before { background: linear-gradient(90deg, #10b981, #34d399); }
  .kpi-card.red::before { background: linear-gradient(90deg, #ef4444, #f87171); }
  .kpi-card.blue::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
  .kpi-card.purple::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
  .kpi-card.amber::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  .kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; }
  .kpi-value { font-size: 20px; font-weight: 900; margin-top: 6px; font-variant-numeric: tabular-nums; letter-spacing: -0.5px; }
  .kpi-sub { font-size: 10px; color: #94a3b8; margin-top: 3px; font-weight: 500; }
  
  .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 36px; }
  
  table { width: 100%; border-collapse: collapse; }
  
  .summary-strip {
    display: flex;
    gap: 0;
    margin-bottom: 36px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }
  .summary-strip-item {
    flex: 1;
    padding: 14px 20px;
    text-align: center;
    border-right: 1px solid #e2e8f0;
  }
  .summary-strip-item:last-child { border-right: none; }
  .summary-strip-item .strip-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; }
  .summary-strip-item .strip-value { font-size: 15px; font-weight: 800; margin-top: 4px; font-variant-numeric: tabular-nums; }
  
  .footer {
    text-align: center;
    padding: 20px 44px;
    border-top: 2px solid #f1f5f9;
    font-size: 9px;
    color: #94a3b8;
    letter-spacing: 0.3px;
    background: #fafbfc;
  }
  .footer strong { color: #64748b; font-weight: 700; }
  
  .watermark {
    position: fixed;
    bottom: 40px;
    right: 40px;
    font-size: 60px;
    font-weight: 900;
    color: rgba(0,0,0,0.02);
    transform: rotate(-15deg);
    pointer-events: none;
    z-index: 0;
    letter-spacing: -2px;
  }
</style>
</head>
<body>

<div class="watermark">CONFIDENCIAL</div>

<!-- HEADER -->
<div class="header">
  <div class="header-top">
    <div>
      <h1>${config.companyName}</h1>
      <div class="subtitle">Relatório Financeiro</div>
      ${config.companyId && config.companyId !== "—" ? `<div class="company-id">CNPJ: ${config.companyId}</div>` : ""}
    </div>
    <div class="header-badge">
      <div class="badge-label">Nº do Relatório</div>
      <div class="badge-value">RF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 9000) + 1000)}</div>
    </div>
  </div>
  <div class="header-meta">
    <div class="meta-item"><div class="label">Período Analisado</div><div class="val">${config.periodStart} — ${config.periodEnd}</div></div>
    <div class="meta-item"><div class="label">Data de Emissão</div><div class="val">${reportDate} às ${reportTime}</div></div>
    <div class="meta-item"><div class="label">Lançamentos</div><div class="val">${metrics.transactionCount} registros</div></div>
  </div>
</div>

<div class="content">

  <!-- QUICK SUMMARY STRIP -->
  <div class="summary-strip">
    <div class="summary-strip-item">
      <div class="strip-label">Receita Bruta</div>
      <div class="strip-value" style="color:#047857">${fmt(metrics.totalEntradas)}</div>
    </div>
    <div class="summary-strip-item">
      <div class="strip-label">Despesa Total</div>
      <div class="strip-value" style="color:#b91c1c">${fmt(metrics.totalSaidas)}</div>
    </div>
    <div class="summary-strip-item">
      <div class="strip-label">Resultado Líquido</div>
      <div class="strip-value" style="color:${metrics.saldoLiquido >= 0 ? "#047857" : "#b91c1c"}">${fmt(metrics.saldoLiquido)}</div>
    </div>
    <div class="summary-strip-item">
      <div class="strip-label">Margem Líquida</div>
      <div class="strip-value" style="color:#1e3a5f">${fmtPct(netMargin)}</div>
    </div>
  </div>

  <!-- KPIs -->
  <h2 class="section-title">Indicadores Financeiros</h2>
  <div class="kpi-grid">
    <div class="kpi-card green">
      <div class="kpi-label">Receita Total</div>
      <div class="kpi-value" style="color:#047857">${fmt(metrics.totalEntradas)}</div>
      <div class="kpi-sub">${metrics.entradasCount} entradas</div>
    </div>
    <div class="kpi-card red">
      <div class="kpi-label">Despesa Total</div>
      <div class="kpi-value" style="color:#b91c1c">${fmt(metrics.totalSaidas)}</div>
      <div class="kpi-sub">${metrics.saidasCount} saídas</div>
    </div>
    <div class="kpi-card blue">
      <div class="kpi-label">Saldo Líquido</div>
      <div class="kpi-value" style="color:${metrics.saldoLiquido >= 0 ? "#047857" : "#b91c1c"}">${fmt(metrics.saldoLiquido)}</div>
      <div class="kpi-sub">${metrics.saldoLiquido >= 0 ? "Superávit" : "Déficit"}</div>
    </div>
    <div class="kpi-card purple">
      <div class="kpi-label">Margem Líquida</div>
      <div class="kpi-value" style="color:#1e3a5f">${fmtPct(netMargin)}</div>
      <div class="kpi-sub">Saldo / Receita</div>
    </div>
    <div class="kpi-card amber">
      <div class="kpi-label">Ticket Médio</div>
      <div class="kpi-value" style="color:#92400e">${fmt(avgTicket)}</div>
      <div class="kpi-sub">por lançamento</div>
    </div>
  </div>

  <!-- CATEGORY BREAKDOWN -->
  <h2 class="section-title">Análise por Categoria</h2>
  <div class="charts-grid">
    <div>
      ${entryDonut}
      ${entryBars}
    </div>
    <div>
      ${exitDonut}
      ${exitBars}
    </div>
  </div>

  <!-- TRANSACTIONS -->
  <div class="page-break"></div>
  <h2 class="section-title">Extrato Detalhado de Transações</h2>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;padding:10px 12px;background:#0f172a;font-size:9px;text-transform:uppercase;color:rgba(255,255,255,0.7);letter-spacing:1px;font-weight:700;border:none">Data</th>
        <th style="text-align:left;padding:10px 12px;background:#0f172a;font-size:9px;text-transform:uppercase;color:rgba(255,255,255,0.7);letter-spacing:1px;font-weight:700;border:none">Descrição</th>
        <th style="text-align:left;padding:10px 12px;background:#0f172a;font-size:9px;text-transform:uppercase;color:rgba(255,255,255,0.7);letter-spacing:1px;font-weight:700;border:none">Categoria</th>
        <th style="text-align:center;padding:10px 12px;background:#0f172a;font-size:9px;text-transform:uppercase;color:rgba(255,255,255,0.7);letter-spacing:1px;font-weight:700;border:none">Tipo</th>
        <th style="text-align:right;padding:10px 12px;background:#0f172a;font-size:9px;text-transform:uppercase;color:rgba(255,255,255,0.7);letter-spacing:1px;font-weight:700;border:none">Valor</th>
        <th style="text-align:right;padding:10px 12px;background:#0f172a;font-size:9px;text-transform:uppercase;color:rgba(255,255,255,0.7);letter-spacing:1px;font-weight:700;border:none">Saldo</th>
      </tr>
    </thead>
    <tbody>
      ${transactionRows}
    </tbody>
    <tfoot>
      <tr style="background:#0f172a">
        <td colspan="4" style="padding:10px 12px;font-size:11px;font-weight:800;color:#fff;letter-spacing:0.5px">SALDO FINAL</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:800;text-align:right;color:${metrics.saldoLiquido >= 0 ? "#34d399" : "#f87171"}">${fmt(metrics.totalEntradas - metrics.totalSaidas)}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:800;text-align:right;color:${runningBalance >= 0 ? "#34d399" : "#f87171"}">${fmt(runningBalance)}</td>
      </tr>
    </tfoot>
  </table>

</div>

<div class="footer">
  <strong>${config.companyName}</strong> · Relatório gerado em ${reportDate} às ${reportTime} · Documento confidencial para uso interno<br>
  Gerado automaticamente pelo sistema RR Finance · Todos os valores em R$ (BRL)
</div>

</body></html>`;
}
