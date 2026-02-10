import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ImportFinanceira from "./pages/ImportFinanceira";
import Templates from "./pages/Templates";
import Auth from "./pages/Auth";
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
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index
                      transactions={transactions}
                      setTransactions={setTransactions}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/importacao"
                element={
                  <ProtectedRoute>
                    <ImportFinanceira
                      existingTransactions={transactions}
                      onImportComplete={handleImportComplete}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/templates"
                element={
                  <ProtectedRoute>
                    <Templates />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
