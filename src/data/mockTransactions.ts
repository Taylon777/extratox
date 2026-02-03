import { Transaction } from "@/components/dashboard/TransactionTable";

export const mockTransactions: Transaction[] = [
  {
    id: "1",
    date: "2024-01-15",
    description: "Pagamento Cliente A",
    category: "pix",
    type: "entrada",
    value: 5500.00,
  },
  {
    id: "2",
    date: "2024-01-15",
    description: "Aluguel Escritório",
    category: "transferencia",
    type: "saida",
    value: 2800.00,
  },
  {
    id: "3",
    date: "2024-01-16",
    description: "Venda Produto X",
    category: "cartao_debito",
    type: "entrada",
    value: 1250.00,
  },
  {
    id: "4",
    date: "2024-01-16",
    description: "Taxa de Manutenção",
    category: "taxas",
    type: "saida",
    value: 89.90,
  },
  {
    id: "5",
    date: "2024-01-17",
    description: "Consultoria Projeto B",
    category: "pix",
    type: "entrada",
    value: 8000.00,
  },
  {
    id: "6",
    date: "2024-01-17",
    description: "Fornecedor Material",
    category: "transferencia",
    type: "saida",
    value: 3200.00,
  },
  {
    id: "7",
    date: "2024-01-18",
    description: "Serviço Mensal Cliente C",
    category: "pix",
    type: "entrada",
    value: 4500.00,
  },
  {
    id: "8",
    date: "2024-01-18",
    description: "Energia Elétrica",
    category: "outros",
    type: "saida",
    value: 450.00,
  },
  {
    id: "9",
    date: "2024-01-19",
    description: "Venda Online",
    category: "cartao_credito",
    type: "entrada",
    value: 780.00,
  },
  {
    id: "10",
    date: "2024-01-19",
    description: "Internet e Telefone",
    category: "outros",
    type: "saida",
    value: 299.90,
  },
  {
    id: "11",
    date: "2024-01-20",
    description: "Pagamento Cliente D",
    category: "transferencia",
    type: "entrada",
    value: 12000.00,
  },
  {
    id: "12",
    date: "2024-01-20",
    description: "Taxa DOC/TED",
    category: "taxas",
    type: "saida",
    value: 15.50,
  },
];

export const monthlyData = [
  { name: "Jan", entradas: 32030, saidas: 18500 },
  { name: "Fev", entradas: 28500, saidas: 21000 },
  { name: "Mar", entradas: 35000, saidas: 19800 },
  { name: "Abr", entradas: 41200, saidas: 23500 },
  { name: "Mai", entradas: 38000, saidas: 25000 },
  { name: "Jun", entradas: 45500, saidas: 22000 },
];

export const categoryDataEntradas = [
  { name: "Pix", value: 18000, color: "#8b5cf6" },
  { name: "Transferência", value: 12000, color: "#3b82f6" },
  { name: "Vendas – Disponível Débito", value: 1250, color: "#10b981" },
  { name: "Vendas – Disponível Crédito", value: 780, color: "#f59e0b" },
];

export const categoryDataSaidas = [
  { name: "Transferência", value: 6000, color: "#3b82f6" },
  { name: "Taxas", value: 105.40, color: "#64748b" },
  { name: "Outros", value: 749.90, color: "#6b7280" },
];
