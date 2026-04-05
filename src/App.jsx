import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerHistory from "./pages/CustomerHistory";
import CustomerReceivables from "./pages/CustomerReceivables";
import Suppliers from "./pages/Suppliers";
import SupplierHistory from "./pages/SupplierHistory";
import SupplierPayables from "./pages/SupplierPayables";
import Mazdoor from "./pages/Mazdoor";
import MazdoorHistory from "./pages/MazdoorHistory";
import MazdoorManagement from "./pages/MazdoorManagement";
import MazdoorExpenses from "./pages/MazdoorExpenses";
import Accounts from "./pages/Accounts";
import Categories from "./pages/Categories";
import Items from "./pages/Items";
import ItemKhata from "./pages/ItemKhata";
import Purchases from "./pages/Purchases.jsx";
import CurrentStock from "./pages/CurrentStock";
import Sales from "./pages/Sales";
import Transactions from "./pages/Transactions";
import DailyKhata from "./pages/DailyKhata";
import UniversalLedger from "./pages/UniversalLedger";
import MillKhata from "./pages/MillKhata";
import MachineryItems from "./pages/MachineryItems";
import MachineryItemKhata from "./pages/MachineryItemKhata.jsx";
import MachineryLedger from "./pages/MachineryLedger.jsx";
import MachineryPurchases from "./pages/MachineryPurchases";
import TaxTypes from "./pages/TaxTypes";
import TaxLedger from "./pages/TaxLedger";
import ExpenseTypes from "./pages/ExpenseTypes";
import ExpenseLedger from "./pages/ExpenseLedger";
import AuditSummary from "./pages/AuditSummary";
import RawMaterials from "./pages/RawMaterials";
import ConsolidatedLedger from "./pages/ConsolidatedLedger";
import Login from "./pages/Login";
import Users from "./pages/Users";
import SetupOpeningBalances from "./pages/SetupOpeningBalances";
import { AuthProvider, useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  // Require both a logged-in user AND a client ID (set at login for multi-tenancy)
  if (!user || !localStorage.getItem("mill_client_id")) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/receivables" element={<CustomerReceivables />} />
          <Route path="customers/:id/history" element={<CustomerHistory />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="suppliers/payables" element={<SupplierPayables />} />
          <Route path="suppliers/:id/history" element={<SupplierHistory />} />
          <Route path="mazdoor" element={<Mazdoor />} />
          <Route path="mazdoor/management" element={<MazdoorManagement />} />
          <Route path="mazdoor/expenses" element={<MazdoorExpenses />} />
          <Route path="mazdoor/:id/history" element={<MazdoorHistory />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="categories" element={<Categories />} />
          <Route path="items" element={<Items />} />
          <Route path="items/:id/khata" element={<ItemKhata />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="current-stock" element={<CurrentStock />} />
          <Route path="sales" element={<Sales />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="daily-khata" element={<DailyKhata />} />
          <Route path="universal-ledger" element={<UniversalLedger />} />
          <Route path="daily-cash-memo" element={<DailyKhata />} />
          <Route path="mill-khata" element={<MillKhata />} />
          <Route path="machinery-items" element={<MachineryItems />} />
          <Route path="machinery-items/:id/khata" element={<MachineryItemKhata />} />
          <Route path="machinery-ledger" element={<MachineryLedger />} />
          <Route path="machinery-purchases" element={<MachineryPurchases />} />
          <Route path="tax-types" element={<TaxTypes />} />
          <Route path="tax-types/:id/ledger" element={<TaxLedger />} />
          <Route path="expense-types" element={<ExpenseTypes />} />
          <Route path="expense-types/:id/ledger" element={<ExpenseLedger />} />
          <Route path="raw-materials" element={<RawMaterials />} />
          <Route path="audit-summary" element={<AuditSummary />} />
          <Route path="consolidated-ledger" element={<ConsolidatedLedger />} />
          <Route path="users" element={<Users />} />
          <Route path="setup-opening-balances" element={<SetupOpeningBalances />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);
}

export default App;
