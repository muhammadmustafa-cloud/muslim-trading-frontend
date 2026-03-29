import { Outlet, NavLink } from "react-router-dom";
import {
  FaChartLine,
  FaUsers,
  FaTruck,
  FaUser,
  FaClipboardList,
  FaWallet,
  FaTags,
  FaBox,
  FaBoxOpen,
  FaBoxes,
  FaShoppingCart,
  FaExchangeAlt,
  FaFileInvoiceDollar,
  FaIndustry,
  FaHandHoldingUsd,
  FaBook,
  FaCogs,
  FaTools,
  FaBalanceScale,
  FaReceipt,
  FaFileContract,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", end: true, icon: FaChartLine, label: "Dashboard" },
  { to: "/daily-khata", icon: FaFileInvoiceDollar, label: "Daily Khata" },
  { to: "/universal-ledger", icon: FaBook, label: "Daily Cash Memo" },
  { to: "/mill-khata", icon: FaIndustry, label: "Mill Khata" },
  { to: "/customers", icon: FaUsers, label: "Customer (Sale)" },
  { to: "/customers/receivables", icon: FaHandHoldingUsd, label: "Customer Receivables" },
  { to: "/suppliers", icon: FaTruck, label: "Supplier (Purchase)" },
  { to: "/suppliers/payables", icon: FaHandHoldingUsd, label: "Supplier Payables" },
  { to: "/mazdoor", icon: FaUser, label: "Mazdoor" },
  { to: "/mazdoor/management", icon: FaClipboardList, label: "Mazdoor Management" },
  { to: "/accounts", icon: FaWallet, label: "Accounts" },
  { to: "/categories", icon: FaTags, label: "Categories" },
  { to: "/items", icon: FaBox, label: "Items" },
  { to: "/purchases", icon: FaBoxOpen, label: "Purchase" },
  { to: "/current-stock", icon: FaBoxes, label: "Current Stock" },
  { to: "/sales", icon: FaShoppingCart, label: "Sales" },
  { to: "/machinery-items", icon: FaCogs, label: "Machinery Items" },
  { to: "/machinery-purchases", icon: FaTools, label: "Machinery Purchase" },
  { to: "/machinery-ledger", icon: FaBook, label: "Machinery Ledger" },
  { to: "/transactions", icon: FaExchangeAlt, label: "Transactions" },
  { to: "/expense-types", icon: FaReceipt, label: "Expense Management" },
  { to: "/tax-types", icon: FaBalanceScale, label: "Tax Management" },
  { to: "/audit-summary", icon: FaFileContract, label: "Audit (Submail)" },
  { to: "/users", icon: FaUsers, label: "User Management", adminOnly: true },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex bg-slate-100/80">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col bg-sidebar text-white shadow-soft-lg">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <span className="text-amber-400 font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Mill Admin</h1>
              <div className="flex flex-col">
                <p className="text-xs text-amber-400 font-medium">{user?.username || 'Guest'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{user?.role || 'user'}</p>
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map(({ to, end, icon: Icon, label, adminOnly }) => {
              if (adminOnly && user?.role !== "superadmin") return null;
              return (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                        ? "bg-amber-500/20 text-amber-300"
                        : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0 opacity-90" />
                    {label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-3 border-t border-sidebar-border bg-sidebar-darken mt-auto">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-500/20 transition-all group"
          >
            <FaSignOutAlt className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-auto min-h-screen">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
