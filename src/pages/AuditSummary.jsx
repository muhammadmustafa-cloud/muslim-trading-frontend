import { useState, useEffect } from "react";
import { apiGet } from "../config/api.js";
import { 
  FaFileContract, 
  FaArrowUp, 
  FaArrowDown, 
  FaWallet, 
  FaUsers, 
  FaBoxes, 
  FaTools, 
  FaFilePdf,
  FaCalendarAlt,
  FaSearch,
  FaUserTie,
  FaIndustry,
  FaTruckLoading,
  FaMoneyBillWave
} from "react-icons/fa";
import { downloadAuditSummaryPdf } from "../utils/exportPdf.js";

const formatMoney = (n) => (n == null ? "0" : Math.abs(Number(n)).toLocaleString("en-PK"));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const getToday = () => new Date().toISOString().slice(0, 10);

export default function AuditSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: getToday() });
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await apiGet("/audit/summary", filters);
      setData(resp.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []); // Only run once on mount, as requested (manual search button added below)

  const handlePdf = () => {
    if (data) {
      downloadAuditSummaryPdf(data, filters);
    }
  };

  const getNetPosition = () => {
    if (!data) return 0;
    const assets = data.totalCash + data.totalReceivables + data.totalStockValue + data.totalMachineryValue;
    return assets - data.totalPayables;
  };

  if (loading) return (
    <div className="card p-12 flex flex-col items-center justify-center min-h-[400px]">
      <div className="loading-spinner mb-4" />
      <p className="text-slate-500 animate-pulse font-medium text-lg">Preparing Detailed Submail Report...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-xl text-center">
      <p className="font-bold text-lg mb-2">Error loading audit summary</p>
      <p className="text-sm opacity-80">{error}</p>
      <button onClick={fetchSummary} className="btn-primary mt-4">Retry</button>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaFileContract },
    { id: 'customers', label: 'Customers (Receivables)', icon: FaUsers },
    { id: 'suppliers', label: 'Suppliers (Payables)', icon: FaIndustry },
    { id: 'items', label: 'Items Activity', icon: FaBoxes },
    { id: 'mazdoors', label: 'Mazdoor Outstanding', icon: FaTruckLoading },
    { id: 'inventory', label: 'Inventory & Assets', icon: FaBoxes },
    { id: 'expenses', label: 'Expenses & Taxes', icon: FaMoneyBillWave },
    { id: 'accounts', label: 'Cash & Bank Balances', icon: FaWallet },
  ];

  const filteredItems = (list) => {
    if (!list) return [];
    return list.filter(item => 
      (item.name || item.itemName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 sticky top-0 bg-slate-50 z-20 pb-4 shadow-sm -mx-4 px-4 pt-2 -mt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <FaFileContract className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Financial Audit <span className="text-indigo-600">(Submail)</span></h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest opacity-60">Consolidated Mill Balance Sheet</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button
            onClick={handlePdf}
            disabled={!data}
            className="btn-primary flex items-center gap-2 px-6 shadow-md shadow-indigo-100"
          >
            <FaFilePdf /> Export Detailed PDF
          </button>
        </div>
      </header>

      {/* Control Area */}
      <section className="card p-5 bg-white border-none shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6 pb-4 border-b border-slate-100 mb-4">
           {/* Date Range */}
           <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="input-label text-[10px] uppercase text-slate-400 font-black mb-1">From Date</label>
              <input 
                type="date" 
                value={filters.dateFrom} 
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))} 
                className="input-field w-40 text-xs py-1.5"
              />
            </div>
            <div>
              <label className="input-label text-[10px] uppercase text-slate-400 font-black mb-1">To Date</label>
              <input 
                type="date" 
                value={filters.dateTo} 
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))} 
                className="input-field w-40 text-xs py-1.5"
              />
            </div>
            <button 
              onClick={() => setFilters({ dateFrom: "", dateTo: getToday() })}
              className="btn-secondary text-[10px] uppercase font-bold py-2 mb-0.5"
            >
              Today
            </button>
            <button 
              onClick={fetchSummary}
              className="btn-primary text-[10px] uppercase font-bold py-2 px-6 mb-0.5 flex items-center gap-2"
            >
              <FaSearch /> Search Audit
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input 
              type="text"
              placeholder={`Search ${activeTab.replace('_', ' ')}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 text-sm py-2 rounded-full border-slate-100 focus:border-indigo-300"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </nav>
      </section>

      {/* CONTENT AREA */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && data && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Net Position Card */}
            <div className="card bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-800 text-white p-8 relative overflow-hidden shadow-xl shadow-indigo-100 border-none">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                  <p className="text-indigo-100 font-bold uppercase tracking-[0.2em] text-[10px] opacity-80">Estimated Net Position (Assets - Liabilities)</p>
                  <h2 className="text-5xl font-black tracking-tight leading-none">
                    Rs. {formatMoney(getNetPosition())}
                  </h2>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold border border-white/10">
                     <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                     LIVE AUDIT DATA AS OF {formatDate(filters.dateTo)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 p-5 rounded-[20px] backdrop-blur-md border border-white/10 flex flex-col justify-center min-w-[160px]">
                    <p className="text-[10px] font-black text-indigo-100/60 uppercase mb-1">Total Assets</p>
                    <p className="text-xl font-black">Rs. {formatMoney(data.totalCash + data.totalReceivables + data.totalStockValue + data.totalMachineryValue)}</p>
                  </div>
                  <div className="bg-white/10 p-5 rounded-[20px] backdrop-blur-md border border-white/10 flex flex-col justify-center min-w-[160px]">
                    <p className="text-[10px] font-black text-rose-100/60 uppercase mb-1">Total Payables</p>
                    <p className="text-xl font-black">Rs. {formatMoney(data.totalPayables)}</p>
                  </div>
                </div>
              </div>
              <FaFileContract className="absolute -right-12 -bottom-12 w-80 h-80 text-white/5 rotate-[15deg]" />
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <SummaryCard label="Cash & Bank" amount={data.totalCash} color="indigo" icon={FaWallet} />
               <SummaryCard label="Receivables" amount={data.totalReceivables} color="emerald" icon={FaUsers} />
               <SummaryCard label="Stock Value" amount={data.totalStockValue} color="orange" icon={FaBoxes} />
               <SummaryCard label="Machinery" amount={data.totalMachineryValue} color="slate" icon={FaTools} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
               {/* Account Balances list */}
               <div className="card p-0 overflow-hidden bg-white/50 border-slate-100">
                  <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <FaWallet className="text-indigo-500" /> Account Balances
                     </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {data.accounts.map((acc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]">
                        <span className="text-sm font-bold text-slate-600">{acc.name}</span>
                        <span className="text-sm font-black text-indigo-700">Rs. {formatMoney(acc.balance)}</span>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Period Stats */}
               <div className="card p-0 overflow-hidden bg-white/50 border-slate-100">
                  <div className="p-4 bg-slate-50 border-b">
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <FaCalendarAlt className="text-amber-500" /> Range Summary Stats
                     </h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                     <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Tax Paid</p>
                        <p className="text-xl font-black text-rose-600">Rs. {formatMoney(data.taxes.reduce((s,t) => s+t.amount, 0))}</p>
                     </div>
                     <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Expenses</p>
                        <p className="text-xl font-black text-orange-600">Rs. {formatMoney(data.expenses.reduce((s,e) => s+e.amount, 0))}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
             <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.1em]">Customer Balances Breakdown</h3>
                <div className="text-xs font-bold text-slate-400">Total {data.customers.length} Entries</div>
             </div>
             <div className="card p-0 overflow-hidden border-none shadow-xl">
               <table className="w-full border-collapse">
                 <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Customer Name</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Debit (Due)</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Credit (Advance)</th>
                    </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-50">
                    {filteredItems(data.customers).map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{c.name}</div>
                           <div className="text-[10px] text-slate-400 font-medium">{c.phone || 'No Phone'}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           {c.balance > 0 ? (
                             <span className="text-sm font-black text-red-600">Rs. {formatMoney(c.balance)}</span>
                           ) : <span className="text-slate-200">—</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                           {c.balance < 0 ? (
                             <span className="text-sm font-black text-emerald-600">Rs. {formatMoney(c.balance)}</span>
                           ) : <span className="text-slate-200">—</span>}
                        </td>
                      </tr>
                    ))}
                    {filteredItems(data.customers).length === 0 && (
                      <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic">No customers found matching "{searchTerm}"</td></tr>
                    )}
                 </tbody>
                 <tfoot className="bg-slate-900 text-white font-black">
                    <tr>
                      <td className="px-6 py-5 text-sm uppercase tracking-widest">Grand Total</td>
                      <td className="px-6 py-5 text-right text-base">Rs. {formatMoney(data.customers.filter(c => c.balance > 0).reduce((s,c) => s+c.balance, 0))}</td>
                      <td className="px-6 py-5 text-right text-base text-emerald-400">Rs. {formatMoney(data.customers.filter(c => c.balance < 0).reduce((s,c) => s+c.balance, 0))}</td>
                    </tr>
                 </tfoot>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
             <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.1em]">Supplier Payables Breakdown</h3>
                <div className="text-xs font-bold text-slate-400">Total {data.suppliers.length} Entries</div>
             </div>
             <div className="card p-0 overflow-hidden border-none shadow-xl">
               <table className="w-full border-collapse">
                 <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Supplier Name</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Payable Amount</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Advance Paid</th>
                    </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-50">
                    {filteredItems(data.suppliers).map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="text-sm font-bold text-slate-700 group-hover:text-amber-600 transition-colors">{s.name}</div>
                           <div className="text-[10px] text-slate-400 font-medium">{s.phone || 'No Phone'}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           {s.balance < 0 ? (
                             <span className="text-sm font-black text-rose-600 font-mono">Rs. {formatMoney(s.balance)}</span>
                           ) : <span className="text-slate-200">—</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                           {s.balance > 0 ? (
                             <span className="text-sm font-black text-indigo-600 font-mono">Rs. {formatMoney(s.balance)}</span>
                           ) : <span className="text-slate-200">—</span>}
                        </td>
                      </tr>
                    ))}
                 </tbody>
                 <tfoot className="bg-rose-950 text-white font-black">
                    <tr>
                      <td className="px-6 py-5 text-sm uppercase tracking-widest">Total Payables</td>
                      <td className="px-6 py-5 text-right text-base text-rose-300">Rs. {formatMoney(data.suppliers.filter(s => s.balance < 0).reduce((sum, s) => sum+Math.abs(s.balance),0))}</td>
                      <td className="px-6 py-5 text-right text-base text-indigo-300">Rs. {formatMoney(data.suppliers.filter(s => s.balance > 0).reduce((sum, s) => sum+s.balance,0))}</td>
                    </tr>
                 </tfoot>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
             <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.1em]">Item-Wise Trading Scenario</h3>
                <div className="text-xs font-bold text-slate-400">Total {data.items.length} Active Items</div>
             </div>
             <div className="card p-0 overflow-hidden border-none shadow-xl">
               <table className="w-full border-collapse">
                 <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Item Name</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Total Purchased (Dr)</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Total Sold (Cr)</th>
                    </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-50">
                    {filteredItems(data.items).map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="text-sm font-black text-rose-600">Rs. {formatMoney(item.purchaseVolume)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="text-sm font-black text-emerald-600">Rs. {formatMoney(item.saleVolume)}</span>
                        </td>
                      </tr>
                    ))}
                    {filteredItems(data.items).length === 0 && (
                      <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic">No trading activity found for items matching "{searchTerm}"</td></tr>
                    )}
                 </tbody>
                 <tfoot className="bg-slate-900 text-white font-black">
                    <tr>
                      <td className="px-6 py-5 text-sm uppercase tracking-widest">Grand Total Trading</td>
                      <td className="px-6 py-5 text-right text-base text-rose-300">Rs. {formatMoney(data.items.reduce((s,i) => s+i.purchaseVolume, 0))}</td>
                      <td className="px-6 py-5 text-right text-base text-emerald-300">Rs. {formatMoney(data.items.reduce((s,i) => s+i.saleVolume, 0))}</td>
                    </tr>
                 </tfoot>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'mazdoors' && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
             <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.1em]">Mazdoor Outstanding Wages</h3>
             </div>
             <div className="card p-0 overflow-hidden border-none shadow-xl">
               <table className="w-full border-collapse">
                 <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Mazdoor Name</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Current Owed (Rs)</th>
                    </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-50">
                    {filteredItems(data.mazdoors).map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="text-sm font-bold text-slate-700">{m.name}</div>
                           <div className="text-[10px] text-slate-400 font-medium">{m.contact || 'No Contact'}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className={`text-sm font-black ${m.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                             Rs. {formatMoney(m.balance)}
                           </span>
                        </td>
                      </tr>
                    ))}
                 </tbody>
                 <tfoot className="bg-slate-900 text-white font-black">
                    <tr>
                      <td className="px-6 py-5 text-sm uppercase tracking-widest">Total Outstanding Owed</td>
                      <td className="px-6 py-5 text-right text-lg text-rose-400">
                         Rs. {formatMoney(data.mazdoors.filter(m => m.balance > 0).reduce((s,m) => s+m.balance, 0))}
                      </td>
                    </tr>
                 </tfoot>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
             {/* Stock Table */}
             <div className="card p-0 overflow-hidden border-none shadow-lg">
                <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Current Inventory Valuation</h3>
                </div>
                <table className="w-full">
                   <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Item Name</th>
                        <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase">Weight</th>
                        <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase">Kattay</th>
                        <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase">Avg Rate</th>
                        <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase text-indigo-600">Total Value</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredItems(data.stock).map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="text-sm font-bold text-slate-700">{item.itemName}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">{item.category} | {item.quality}</div>
                           </td>
                           <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">{item.quantity.toLocaleString()} kg</td>
                           <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">{item.kattay}</td>
                           <td className="px-6 py-4 text-right text-sm font-black text-slate-400">Rs. {formatMoney(item.value / item.quantity)}</td>
                           <td className="px-6 py-4 text-right text-sm font-black text-indigo-600">Rs. {formatMoney(item.value)}</td>
                        </tr>
                      ))}
                   </tbody>
                   <tfoot className="bg-slate-100 font-black">
                      <tr>
                         <td colSpan="4" className="px-6 py-4 text-xs tracking-widest uppercase">Stock Grand Total</td>
                         <td className="px-6 py-4 text-right text-indigo-700">Rs. {formatMoney(data.totalStockValue)}</td>
                      </tr>
                   </tfoot>
                </table>
             </div>

             {/* Machinery Table */}
             <div className="card p-0 overflow-hidden border-none shadow-lg">
                <div className="px-6 py-4 bg-slate-50 border-b">
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Fixed Asset Purchases (Machinery)</h3>
                </div>
                <table className="w-full">
                   <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Particulars</th>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Supplier</th>
                        <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase">Amount</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {data.machinery.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                           <td className="px-6 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">{formatDate(m.date)}</td>
                           <td className="px-6 py-4 text-sm font-bold text-slate-700">{m.machineryItemId?.name}</td>
                           <td className="px-6 py-4 text-sm font-medium text-slate-500">{m.supplierId?.name}</td>
                           <td className="px-6 py-4 text-right text-sm font-black text-slate-800">Rs. {formatMoney(m.amount)}</td>
                        </tr>
                      ))}
                   </tbody>
                   <tfoot className="bg-slate-900 text-white font-black">
                      <tr>
                         <td colSpan="3" className="px-6 py-4 text-xs tracking-widest uppercase">Total Investment</td>
                         <td className="px-6 py-4 text-right text-lg">Rs. {formatMoney(data.totalMachineryValue)}</td>
                      </tr>
                   </tfoot>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expenses Table */}
                <div className="card p-0 overflow-hidden border-none shadow-lg">
                  <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
                    <h3 className="text-sm font-black text-orange-900 uppercase tracking-widest italic">General Expenses</h3>
                  </div>
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                         <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase italic">Date</th>
                         <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase italic">Particulars</th>
                         <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase italic">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {data.expenses.map((e, i) => (
                         <tr key={i} className="hover:bg-slate-50/70">
                            <td className="px-6 py-4 text-xs font-bold text-slate-400">{formatDate(e.date)}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-700">{e.expenseTypeId?.name || e.category}</td>
                            <td className="px-6 py-4 text-right text-sm font-black text-orange-600">Rs. {formatMoney(e.amount)}</td>
                         </tr>
                       ))}
                    </tbody>
                    <tfoot className="bg-orange-600 text-white font-black border-none">
                       <tr>
                          <td colSpan="2" className="px-6 py-4 text-xs tracking-widest uppercase">Total Expenses</td>
                          <td className="px-6 py-4 text-right text-lg">Rs. {formatMoney(data.expenses.reduce((s,e) => s+e.amount,0))}</td>
                       </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Taxes Table */}
                <div className="card p-0 overflow-hidden border-none shadow-lg">
                  <div className="px-6 py-4 bg-rose-50 border-b border-rose-100">
                    <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest italic">Tax Payments</h3>
                  </div>
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                         <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase italic">Date</th>
                         <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase italic">Tax Head</th>
                         <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase italic">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {data.taxes.map((t, i) => (
                         <tr key={i} className="hover:bg-slate-50/70">
                            <td className="px-6 py-4 text-xs font-bold text-slate-400">{formatDate(t.date)}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-700">{t.taxTypeId?.name || 'General Tax'}</td>
                            <td className="px-6 py-4 text-right text-sm font-black text-rose-600">Rs. {formatMoney(t.amount)}</td>
                         </tr>
                       ))}
                    </tbody>
                    <tfoot className="bg-rose-600 text-white font-black border-none">
                       <tr>
                          <td colSpan="2" className="px-6 py-4 text-xs tracking-widest uppercase">Total Taxes</td>
                          <td className="px-6 py-4 text-right text-lg">Rs. {formatMoney(data.taxes.reduce((s,t) => s+t.amount,0))}</td>
                       </tr>
                    </tfoot>
                  </table>
                </div>
             </div>
          </div>
        )}
         {activeTab === 'accounts' && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
             <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.1em]">Cash & Bank Balances Detail</h3>
             </div>
             <div className="card p-0 overflow-hidden border-none shadow-xl">
               <table className="w-full border-collapse">
                 <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Account Name</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Current Balance (Rs)</th>
                    </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-50">
                    {filteredItems(data.accounts).map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="text-sm font-bold text-slate-700">{a.name}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="text-sm font-black text-indigo-600 font-mono">Rs. {formatMoney(a.balance)}</span>
                        </td>
                      </tr>
                    ))}
                 </tbody>
                 <tfoot className="bg-slate-900 text-white font-black">
                    <tr>
                      <td className="px-6 py-5 text-sm uppercase tracking-widest">Total Liquidity</td>
                      <td className="px-6 py-5 text-right text-lg text-indigo-400">Rs. {formatMoney(data.totalCash)}</td>
                    </tr>
                 </tfoot>
               </table>
             </div>
          </div>
        )}
      </div>

      <footer className="pt-10 pb-6 text-center border-t border-slate-100">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Mill Management System | Submail Dashboard</p>
      </footer>
    </div>
  );
}

function SummaryCard({ label, amount, color, icon: Icon }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <div className={`card p-5 border-2 ${colors[color]} shadow-none flex items-center gap-4 transition-all hover:shadow-lg hover:-translate-y-1`}>
       <div className={`w-12 h-12 rounded-2xl ${colors[color].replace('text-', 'bg-').split(' ')[0]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
       </div>
       <div>
          <p className="text-[10px] font-black uppercase opacity-60 tracking-wider mb-1">{label}</p>
          <p className="text-lg font-black text-slate-800 leading-tight">Rs. {formatMoney(amount)}</p>
       </div>
    </div>
  );
}
