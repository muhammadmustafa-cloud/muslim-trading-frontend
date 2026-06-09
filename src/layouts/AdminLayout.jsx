import { Outlet, NavLink, useLocation } from "react-router-dom";
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
  FaBookOpen,
  FaSitemap,
  FaBars,
  FaTimes,
  FaChevronLeft,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import ChangePasswordModal from "../components/ChangePasswordModal.jsx";
import { FaKey } from "react-icons/fa";

const navItems = [
  { to: "/", end: true, icon: FaChartLine, label: "Dashboard" },
  { to: "/daily-khata", icon: FaFileInvoiceDollar, label: "Daily Khata" },
  { to: "/universal-ledger", icon: FaBook, label: "Daily Cash Memo" },
  { to: "/mill-khata", icon: FaIndustry, label: "Mill Khata" },
  { to: "/customers", icon: FaUsers, label: "Customer (Sale)" },
  { to: "/customers/receivables", icon: FaHandHoldingUsd, label: "Customer Receivables" },
  { to: "/suppliers", icon: FaTruck, label: "Supplier (Purchase)" },
  { to: "/suppliers/payables", icon: FaHandHoldingUsd, label: "Supplier Payables" },
  { to: "/party-ledger", icon: FaExchangeAlt, label: "Party Ledger" },
  { to: "/mazdoor", icon: FaUser, label: "Mazdoor" },
  { to: "/mazdoor/management", icon: FaClipboardList, label: "Mazdoor Management" },
  { to: "/accounts", icon: FaWallet, label: "Accounts" },
  { to: "/categories", icon: FaTags, label: "Categories" },
  { to: "/items", icon: FaBox, label: "Items" },
  { to: "/sub-item-ledger", icon: FaSitemap, label: "Sub-Item Management" },
  { to: "/purchases", icon: FaBoxOpen, label: "Purchase" },
  { to: "/current-stock", icon: FaBoxes, label: "Current Stock" },
  { to: "/sales", icon: FaShoppingCart, label: "Sales" },
  { to: "/machinery-items", icon: FaCogs, label: "Machinery Items" },
  { to: "/machinery-purchases", icon: FaTools, label: "Machinery Purchase" },
  { to: "/machinery-ledger", icon: FaBook, label: "Machinery Ledger" },
  { to: "/transactions", icon: FaExchangeAlt, label: "Transactions" },
  { to: "/signature-book", icon: FaBookOpen, label: "Signature Book" },
  { to: "/expense-types", icon: FaReceipt, label: "Expense Management" },
  { to: "/tax-types", icon: FaBalanceScale, label: "Tax Management" },
  { to: "/raw-materials", icon: FaBoxes, label: "Raw Material Setup" },
  { to: "/audit-summary", icon: FaFileContract, label: "Audit (Submail)" },
  { to: "/consolidated-ledger", icon: FaBookOpen, label: "Daily Ledger Book" },
  { to: "/users", icon: FaUsers, label: "User Management", adminOnly: true },
  { to: "/setup-opening-balances", icon: FaTools, label: "Initial Migration Setup", adminOnly: true },
];

export default function AdminLayout() {
  const { user, logout, clientId } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const mainRef = useRef(null);
  const location = useLocation();

  // Scroll main content to top on every route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
    // Also close mobile sidebar on navigation
    setSidebarOpen(false);
  }, [location.pathname]);

  const sidebarContent = (
    <>
      {/* Logo / Brand */}
      <div className="p-5 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <span className="text-amber-400 font-bold text-lg">M</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-lg tracking-tight truncate">Mill Admin</h1>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-amber-400 font-medium truncate">{user?.username || 'Guest'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{user?.role || 'user'}</p>
              </div>
              {clientId && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {clientId}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-3 overflow-y-auto sidebar-scroll">
        <ul className="space-y-0.5">
          {navItems.map(({ to, end, icon: Icon, label, adminOnly }) => {
            if (adminOnly && user?.role !== "superadmin") return null;
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? "bg-amber-500/20 text-amber-300"
                      : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
                    } ${collapsed ? "justify-center" : ""}`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0 opacity-90" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar-darken mt-auto space-y-2 shrink-0">
        <button
          onClick={() => setShowPasswordModal(true)}
          title={collapsed ? "Change Password" : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-300 hover:bg-indigo-500/20 transition-all group ${collapsed ? "justify-center" : ""}`}
        >
          <FaKey className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform shrink-0" />
          {!collapsed && "Change Password"}
        </button>
        <button
          onClick={logout}
          title={collapsed ? "Sign Out" : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-500/20 transition-all group ${collapsed ? "justify-center" : ""}`}
        >
          <FaSignOutAlt className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen flex bg-slate-100/80 overflow-hidden">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — Desktop (collapsible) + Mobile (slide-over) */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-white shadow-soft-lg
          transition-all duration-300 ease-in-out
          lg:relative lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "lg:w-[72px] w-64" : "w-64"}
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        {sidebarContent}

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex items-center justify-center w-full py-2 text-slate-500 hover:text-white hover:bg-sidebar-hover transition-colors border-t border-sidebar-border"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <FaChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile only) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Open sidebar"
          >
            <FaBars className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <span className="text-amber-600 font-bold text-sm">M</span>
            </div>
            <h1 className="font-bold text-slate-800 truncate">Mill Admin</h1>
          </div>
        </header>

        {/* Scrollable content */}
        <main ref={mainRef} className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Password Change Modal */}
      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </div>
  );
}
