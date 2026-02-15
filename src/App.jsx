import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerHistory from "./pages/CustomerHistory";
import Suppliers from "./pages/Suppliers";
import SupplierHistory from "./pages/SupplierHistory";
import Mazdoor from "./pages/Mazdoor";
import MazdoorHistory from "./pages/MazdoorHistory";
import Accounts from "./pages/Accounts";
import Items from "./pages/Items";
import ItemKhata from "./pages/ItemKhata";
import StockEntries from "./pages/StockEntries";
import CurrentStock from "./pages/CurrentStock";
import Sales from "./pages/Sales";
import Transactions from "./pages/Transactions";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id/history" element={<CustomerHistory />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="suppliers/:id/history" element={<SupplierHistory />} />
          <Route path="mazdoor" element={<Mazdoor />} />
          <Route path="mazdoor/:id/history" element={<MazdoorHistory />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="items" element={<Items />} />
          <Route path="items/:id/khata" element={<ItemKhata />} />
          <Route path="stock-entries" element={<StockEntries />} />
          <Route path="current-stock" element={<CurrentStock />} />
          <Route path="sales" element={<Sales />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
