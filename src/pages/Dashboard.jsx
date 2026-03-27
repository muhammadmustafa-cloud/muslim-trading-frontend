import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../config/api.js";
import {
  FaChartLine,
  FaUsers,
  FaTruck,
  FaUser,
  FaWallet,
  FaTags,
  FaBox,
  FaBoxOpen,
  FaBoxes,
  FaShoppingCart,
  FaExchangeAlt,
} from "react-icons/fa";

const statCards = [
  { label: "Customers", icon: FaUsers, color: "bg-blue-500/10 text-blue-600", path: "/customers", key: "customers" },
  { label: "Suppliers", icon: FaTruck, color: "bg-emerald-500/10 text-emerald-600", path: "/suppliers", key: "suppliers" },
  { label: "Mazdoor", icon: FaUser, color: "bg-violet-500/10 text-violet-600", path: "/mazdoor", key: "mazdoor" },
  { label: "Accounts", icon: FaWallet, color: "bg-amber-500/10 text-amber-600", path: "/accounts" },
  { label: "Categories", icon: FaTags, color: "bg-teal-500/10 text-teal-600", path: "/categories" },
  { label: "Items", icon: FaBox, color: "bg-slate-500/10 text-slate-600", path: "/items" },
  { label: "Purchases", icon: FaBoxOpen, color: "bg-teal-500/10 text-teal-600", path: "/purchases" },
  { label: "Current Stock", icon: FaBoxes, color: "bg-indigo-500/10 text-indigo-600", path: "/current-stock" },
  { label: "Sales", icon: FaShoppingCart, color: "bg-rose-500/10 text-rose-600", path: "/sales" },
  { label: "Transactions", icon: FaExchangeAlt, color: "bg-cyan-500/10 text-cyan-600", path: "/transactions" },
];

const formatMoney = (n) => (n == null ? "0" : Number(n).toLocaleString("en-PK"));

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchSummary() {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet("/dashboard", { lowStockThreshold: 50 });
        if (!cancelled) setSummary(data.data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSummary();
    return () => { cancelled = true; };
  }, []);

  const counts = summary?.counts ?? {};
  const totalBalance = summary?.totalBalance ?? 0;
  const todaySales = summary?.todaySales ?? { count: 0, totalAmount: 0 };
  const profitSummary = summary?.profitSummary ?? { totalPurchaseCost: 0, totalSalesRevenue: 0, overallProfit: 0 };
  const stockSummary = summary?.stockSummary ?? [];
  const lowStockCount = summary?.lowStockCount;
  const pendingPayments = summary?.pendingPayments ?? { count: 0, totalAmount: 0 };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="page-title flex items-center gap-2">
          <FaChartLine className="w-7 h-7 text-amber-500" />
          Dashboard
        </h1>
        <p className="page-subtitle">Mill Admin — yahan se management shuru hogi.</p>
      </header>

      {error && (
        <div className="card p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Summary stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="card p-5 flex items-center justify-center col-span-full min-h-[100px]">
            <div className="loading-spinner" />
          </div>
        ) : (
          <>
            <div className="card p-5 border-l-4 border-l-amber-500">
              <p className="text-sm text-slate-500 font-medium">Total balance (sab accounts)</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{formatMoney(totalBalance)}</p>
              <Link to="/accounts" className="text-sm text-amber-600 hover:underline mt-2 inline-block">Accounts →</Link>
            </div>
            <div className="card p-5 border-l-4 border-l-rose-500">
              <p className="text-sm text-slate-500 font-medium">Aaj ki sales</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{todaySales.count} sale(s)</p>
              <p className="text-lg font-semibold text-slate-700">{formatMoney(todaySales.totalAmount)}</p>
              <Link to="/sales" className="text-sm text-rose-600 hover:underline mt-2 inline-block">Sales →</Link>
            </div>
            <div className="card p-5 border-l-4 border-l-blue-500">
              <p className="text-sm text-slate-500 font-medium">Customers</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{counts.customers ?? 0}</p>
              <Link to="/customers" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Manage →</Link>
            </div>
            <div className="card p-5 border-l-4 border-l-violet-500">
              <p className="text-sm text-slate-500 font-medium">Suppliers / Mazdoor</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{counts.suppliers ?? 0} / {counts.mazdoor ?? 0}</p>
              <div className="flex gap-2 mt-2">
                <Link to="/suppliers" className="text-sm text-emerald-600 hover:underline">Suppliers</Link>
                <Link to="/mazdoor" className="text-sm text-violet-600 hover:underline">Mazdoor</Link>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Profit summary: purchase vs sales = profit */}
      {!loading && (
        <section className="card p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FaChartLine className="w-5 h-5 text-emerald-600" />
            Business profit (Purchase vs Sales)
          </h2>
          <p className="text-sm text-slate-500 mb-4">Supplier se jo khareeda (purchases) aur customers ko jo becha (sales) — inka farq profit.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total purchase (cost)</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{formatMoney(profitSummary.totalPurchaseCost)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Purchases ka total amount</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total sales (revenue)</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{formatMoney(profitSummary.totalSalesRevenue)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Sales ka total amount</p>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-emerald-200 bg-emerald-50/50">
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Profit</p>
              <p className={`text-xl font-bold mt-1 ${profitSummary.overallProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {formatMoney(profitSummary.overallProfit)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Revenue − Cost</p>
            </div>
          </div>
        </section>
      )}

      {/* Low stock alert */}
      {!loading && lowStockCount != null && lowStockCount > 0 && (
        <div className="card p-4 bg-amber-50 border border-amber-200 flex items-center justify-between flex-wrap gap-2">
          <p className="font-medium text-amber-800">
            <span className="font-bold">{lowStockCount}</span> item(s) ka stock 50 se kam hai.
          </p>
          <Link to="/current-stock" className="btn-secondary text-sm">Current Stock dekhein</Link>
        </div>
      )}

      {/* Pending payments alert */}
      {!loading && pendingPayments.count > 0 && (
        <div className="card p-4 bg-red-50 border-2 border-red-200 flex items-center justify-between flex-wrap gap-2 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <FaWallet className="text-red-600" />
            </div>
            <div>
              <p className="font-bold text-red-800">Pending Payments Alert!</p>
              <p className="text-sm text-red-700">
                Aapki <span className="font-bold">{pendingPayments.count}</span> purchases ki payment pending he.
                Total baqaya: <span className="font-bold text-red-900">{formatMoney(pendingPayments.totalAmount)}</span>
              </p>
            </div>
          </div>
          <Link to="/purchases" className="btn-primary bg-red-600 hover:bg-red-700 text-sm">Bills dekhein</Link>
        </div>
      )}

      {/* Quick links */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map(({ label, icon: Icon, color, path }) => (
          <Link
            key={path}
            to={path}
            className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-105 transition-transform`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{label}</p>
              <p className="text-sm text-slate-500">Manage →</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Current stock summary */}
      <section className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Current stock (summary)</h2>
          <Link to="/current-stock" className="text-sm text-amber-600 hover:underline">Full list →</Link>
        </div>
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          {loading ? (
            <div className="p-8 flex justify-center"><div className="loading-spinner" /></div>
          ) : stockSummary.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Abhi koi stock nahi. Purchase se add karein.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="table-header px-4 py-2.5 text-left">Item</th>
                  <th className="table-header px-4 py-2.5 text-left">Category</th>
                  <th className="table-header px-4 py-2.5 text-right">Quantity</th>
                  <th className="table-header px-4 py-2.5 text-left w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {stockSummary.slice(0, 15).map((row) => (
                  <tr key={row.itemId?.toString?.() || row.itemName} className="table-row-hover border-b border-slate-100">
                    <td className="table-cell py-2.5">
                      <span className="font-medium">{row.itemName}</span>
                    </td>
                    <td className="table-cell py-2.5 text-slate-600">{row.category || "—"}</td>
                    <td className="table-cell py-2.5 text-right font-medium">
                      {row.quantity} {row.quality || ""}
                    </td>
                    <td className="table-cell py-2.5">
                      {row.lowStock ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Low</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && stockSummary.length > 15 && (
          <div className="p-2 border-t border-slate-100 text-center text-sm text-slate-500">
            {stockSummary.length - 15} aur item(s). <Link to="/current-stock" className="text-amber-600 hover:underline">Full list</Link>
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-semibold text-slate-800 mb-2">Quick start</h2>
        <ul className="text-slate-600 space-y-1.5 text-sm">
          <li>• Pehle <strong>Accounts</strong> add karein (bank/cash).</li>
          <li>• Phir <strong>Suppliers</strong> aur <strong>Customers</strong> add karein.</li>
          <li>• <strong>Categories</strong> add karein — phir <strong>Items</strong> add karke category select karein aur quality daalein.</li>
          <li>• <strong>Purchases</strong> se raw material aur output record karein.</li>
          <li>• <strong>Sales</strong> se bechai record karein; <strong>Transactions</strong> se deposit/withdraw/transfer.</li>
        </ul>
      </section>
    </div>
  );
}
