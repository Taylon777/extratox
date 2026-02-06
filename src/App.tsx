import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ImportFinanceira from "./pages/ImportFinanceira";
import Templates from "./pages/Templates";
import NotFound from "./pages/NotFound";
import { Transaction } from "./components/dashboard/TransactionTable";
import { mockTransactions } from "./data/mockTransactions";

const queryClient = new QueryClient();

const App = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

  const handleImportComplete = (newTransactions: Transaction[]) => {
    setTransactions((prev) => [...newTransactions, ...prev]);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <Index
                  transactions={transactions}
                  setTransactions={setTransactions}
                />
              }
            />
            <Route
              path="/importacao"
              element={
                <ImportFinanceira
                  existingTransactions={transactions}
                  onImportComplete={handleImportComplete}
                />
              }
            />
            <Route path="/templates" element={<Templates />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
