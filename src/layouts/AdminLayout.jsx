import { Outlet, NavLink } from "react-router-dom";
import {
  FaChartLine,
  FaUsers,
  FaTruck,
  FaUser,
  FaWallet,
  FaBox,
  FaBoxOpen,
  FaBoxes,
  FaShoppingCart,
  FaExchangeAlt,
} from "react-icons/fa";

const navItems = [
  { to: "/", end: true, icon: FaChartLine, label: "Dashboard" },
  { to: "/customers", icon: FaUsers, label: "Customers" },
  { to: "/suppliers", icon: FaTruck, label: "Suppliers" },
  { to: "/mazdoor", icon: FaUser, label: "Mazdoor" },
  { to: "/accounts", icon: FaWallet, label: "Accounts" },
  { to: "/items", icon: FaBox, label: "Items" },
  { to: "/stock-entries", icon: FaBoxOpen, label: "Stock Entry" },
  { to: "/current-stock", icon: FaBoxes, label: "Current Stock" },
  { to: "/sales", icon: FaShoppingCart, label: "Sales" },
  { to: "/transactions", icon: FaExchangeAlt, label: "Transactions" },
];

export default function AdminLayout() {
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
              <p className="text-xs text-slate-400">Management</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map(({ to, end, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-amber-500/20 text-amber-300"
                        : "text-slate-300 hover:bg-sidebar-hover hover:text-white"
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0 opacity-90" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <p className="text-xs text-slate-500 px-2">Mill Admin v1.0</p>
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
