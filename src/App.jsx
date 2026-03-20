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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
