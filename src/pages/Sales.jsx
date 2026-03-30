import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, apiGet, apiPost, apiPut, apiDelete, apiPostFormData, apiPutFormData } from "../config/api.js";
import { buildCsv, downloadCsv } from "../utils/exportToCsv.js";
import { downloadSalesPdf, downloadSaleInvoicePdf } from "../utils/exportPdf.js";
import { FaMoneyBillWave, FaHandHoldingUsd, FaFilePdf, FaPlus, FaSearch, FaShoppingCart, FaImage, FaFileExport, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";
import CollectPaymentModal from "../components/CollectPaymentModal.jsx";
import SearchableSelect from "../components/SearchableSelect.jsx";
import ImagePreviewModal from "../components/ImagePreviewModal.jsx";

const today = new Date().toISOString().slice(0, 10);

export default function Sales() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("list"); // "list" or "form"
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: today,
    customerId: "",
    totalGrossWeight: "",
    totalSHCut: "",
    netWeight: "",
    items: [{
      itemId: "",
      kattay: "",
      kgPerKata: "",
      grossWeight: "",
      rate: "",
      bardanaRate: "",
      bardanaAmount: "",
      mazdori: "",
      totalAmount: "",
    }],
    truckNumber: "",
    gatePassNo: "",
    goods: "",
    amountReceived: "",
    accountId: "",
    notes: "",
    paymentTerms: "cash",
    dueDate: "",
    image: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", itemId: "", customerId: "" });
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [selectedCollectEntry, setSelectedCollectEntry] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchList();
  }, [filters.dateFrom, filters.dateTo, filters.customerId, filters.itemId]);

  useEffect(() => {
    fetchCustomers();
    fetchItems();
    fetchAccounts();
    fetchStockData();
  }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/sales", { 
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        customerId: filters.customerId || undefined,
        itemId: filters.itemId || undefined
      });
      setList(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await apiGet("/customers");
      setCustomers(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchItems = async () => {
    try {
      const data = await apiGet("/items");
      setItems(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAccounts = async () => {
    try {
      const data = await apiGet("/accounts");
      setAccounts(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchStockData = async () => {
    try {
      const data = await apiGet("/stock");
      setStockData(data.data || []);
    } catch (e) { console.error(e); }
  };

  const formatMoney = (n) => (n != null ? Number(n).toLocaleString("en-PK") : "—");
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");

  const resetForm = () => {
    setForm({
      date: today,
      customerId: "",
      totalGrossWeight: "",
      totalSHCut: "",
      netWeight: "",
      items: [{
        itemId: "",
        kattay: "",
        kgPerKata: "",
        grossWeight: "",
        rate: "",
        bardanaAmount: "",
        mazdori: "",
        totalAmount: "",
      }],
      truckNumber: "",
      gatePassNo: "",
      goods: "",
      amountReceived: "",
      accountId: "",
      notes: "",
      paymentTerms: "cash",
      dueDate: "",
      image: null,
    });
    setEditingId(null);
    setView("list");
  };

  const addItemRow = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        itemId: "",
        kattay: "",
        kgPerKata: "",
        grossWeight: "",
        rate: "",
        bardanaAmount: "",
        mazdori: "",
        totalAmount: "",
      }]
    }));
  };

  const removeItemRow = (index) => {
    if (form.items.length <= 1) return;
    setForm(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems };
    });
  };

  const updateFormWithAutoCalc = (updates) => {
    setForm((prev) => {
      let next = { ...prev, ...updates };

      // 1. Master Weights
      const totalGross = Number(next.totalGrossWeight) || 0;
      const totalCut = Number(next.totalSHCut) || 0;
      const mainNet = Math.max(0, totalGross - totalCut);
      next.netWeight = String(mainNet);

      // 2. Individual Items
      next.items = next.items.map(item => {
        const k = Number(item.kattay) || 0;
        const kpk = Number(item.kgPerKata) || 0;
        
        // Auto-calc line gross
        // If only 1 item, FORCE it to match master gross to prevent 10x errors
        let lineGross = (next.items.length === 1 && totalGross > 0) 
          ? totalGross 
          : (Number(item.grossWeight) || (k * kpk));
        
        // Proportional S.H Cut
        const lineSHCut = totalGross > 0 ? (lineGross / totalGross) * totalCut : 0;
        const lineNet = Math.max(0, lineGross - lineSHCut);
        
        const rate = Number(item.rate) || 0;
        const bAmt = Number(item.bardanaAmount) || 0;
        const mazdori = Number(item.mazdori) || 0;

        // Line Total: (Net / 40) * Rate + Bardana + Mazdori
        // Recalculate from scratch to avoid cumulative errors
        const lineTotal = Math.round((lineNet / 40) * rate) + bAmt + mazdori;

        return {
          ...item,
          grossWeight: String(lineGross),
          bardanaAmount: String(bAmt),
          totalAmount: String(lineTotal)
        };
      });

      // 3. Payment Terms & Due Date
      if ("paymentTerms" in updates || "date" in updates) {
        if (next.paymentTerms === "cash") {
          next.dueDate = next.date;
        } else if (next.paymentTerms !== "custom") {
          const days = parseInt(next.paymentTerms);
          if (!isNaN(days) && next.date) {
            const d = new Date(next.date);
            d.setDate(d.getDate() + days);
            next.dueDate = d.toISOString().slice(0, 10);
          }
        }
      }

      return next;
    });
  };

  const openAddModal = () => {
    resetForm();
    setForm((f) => ({ ...f, date: today }));
    setEditingId(null);
    setView("form");
  };

  const handleEdit = (row) => {
    setEditingId(row._id);
    setForm({
      date: formatDateForInput(row.date),
      customerId: row.customerId?._id || "",
      totalGrossWeight: String(row.totalGrossWeight || ""),
      totalSHCut: String(row.totalSHCut || ""),
      netWeight: String(row.netWeight || ""),
      items: (row.items && row.items.length > 0) ? row.items.map(item => ({
        itemId: item.itemId?._id || item.itemId || "",
        kattay: String(item.kattay || ""),
        kgPerKata: String(item.kgPerKata || ""),
        grossWeight: String(item.grossWeight || ""),
        rate: String(item.rate || ""),
        bardanaAmount: String(item.bardanaAmount || ""),
        mazdori: String(item.mazdori || ""),
        totalAmount: String(item.totalAmount || ""),
      })) : [{
        itemId: "",
        kattay: "",
        kgPerKata: "",
        grossWeight: "",
        rate: "",
        bardanaAmount: "",
        mazdori: "",
        totalAmount: "",
      }],
      truckNumber: row.truckNumber || "",
      gatePassNo: row.gatePassNo || "",
      goods: row.goods || "",
      amountReceived: String(row.amountReceived || ""),
      accountId: row.accountId?._id || row.accountId || "",
      notes: row.notes || "",
      paymentTerms: "custom",
      dueDate: row.dueDate ? formatDateForInput(row.dueDate) : "",
      image: null,
    });
    setView("form");
  };

  const formatDateForInput = (d) => {
    if (!d) return "";
    return new Date(d).toISOString().slice(0, 10);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId || !form.items || !form.items.length) {
      setError("Customer aur kam az kam aik item select karein.");
      return;
    }
    
    // Check if all items have an itemId
    if (form.items.some(i => !i.itemId)) {
      setError("Tamam items select karein.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const payload = {
        date: form.date,
        customerId: form.customerId,
        totalGrossWeight: Number(form.totalGrossWeight) || 0,
        totalSHCut: Number(form.totalSHCut) || 0,
        items: form.items.map(item => ({
          itemId: item.itemId,
          kattay: Number(item.kattay) || 0,
          kgPerKata: Number(item.kgPerKata) || 0,
          grossWeight: Number(item.grossWeight) || 0,
          rate: Number(item.rate) || 0,
          bardanaAmount: Number(item.bardanaAmount) || 0,
          mazdori: Number(item.mazdori) || 0,
          totalAmount: Number(item.totalAmount) || 0,
        })),
        truckNumber: (form.truckNumber || "").trim(),
        gatePassNo: (form.gatePassNo || "").trim(),
        goods: (form.goods || "").trim(),
        amountReceived: Number(form.amountReceived) || 0,
        accountId: form.accountId || undefined,
        notes: form.notes || "",
        dueDate: form.dueDate || undefined,
      };

      const formData = new FormData();
      // Special handling for JSON fields in FormData
      Object.keys(payload).forEach(key => {
        if (key === 'items') {
          formData.append(key, JSON.stringify(payload[key]));
        } else if (payload[key] !== undefined) {
          formData.append(key, payload[key]);
        }
      });
      
      if (form.image) {
        formData.append("image", form.image);
      }
      
      if (editingId) {
        await apiPutFormData(`/sales/${editingId}`, formData);
      } else {
        await apiPostFormData("/sales", formData);
      }
      resetForm();
      setView("list");
      fetchList();
      fetchStockData(); // Refresh dropdown labels
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };



  const handleCollectSuccess = () => {
    fetchList();
    fetchStockData();
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };


  const sortedList = useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      if (sortKey === "date") {
        const va = new Date(a.date).getTime();
        const vb = new Date(b.date).getTime();
        return sortDir === "asc" ? va - vb : vb - va;
      }
      if (sortKey === "customer") {
        const va = (a.customerId?.name || "").toLowerCase();
        const vb = (b.customerId?.name || "").toLowerCase();
        return sortDir === "asc" ? va.localeCompare(vb) : -va.localeCompare(vb);
      }
      if (sortKey === "amount") {
        const va = Number(a.totalAmount) || 0;
        const vb = Number(b.totalAmount) || 0;
        return sortDir === "asc" ? va - vb : vb - va;
      }
      return 0;
    });
    return arr;
  }, [list, sortKey, sortDir]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, page, pageSize]);

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) return <FaSort className="w-3.5 h-3.5 ml-1 opacity-50" />;
    return sortDir === "asc" ? <FaSortUp className="w-3.5 h-3.5 ml-1" /> : <FaSortDown className="w-3.5 h-3.5 ml-1" />;
  };


  if (view === "form") {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <header className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FaShoppingCart className="text-amber-500" />
              {editingId ? "Edit Sale Invoice" : "Nayi Multi-Item Sale"}
            </h1>
            <p className="text-slate-500 text-sm">Sale details enter karein aur items add karein.</p>
          </div>
          <button type="button" onClick={resetForm} className="btn-secondary">
            Back to List
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="card p-6 border-t-4 border-t-amber-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="input-label">Tarikh *</label>
                <input type="date" value={form.date} onChange={(e) => updateFormWithAutoCalc({ date: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="input-label">Customer *</label>
                <SearchableSelect
                  options={customers}
                  value={form.customerId}
                  onChange={(val) => setForm((f) => ({ ...f, customerId: val }))}
                  placeholder="Select customer"
                />
              </div>
              <div>
                <label className="input-label">Truck number</label>
                <input type="text" placeholder="e.g. LEA-1234" value={form.truckNumber} onChange={(e) => setForm((f) => ({ ...f, truckNumber: e.target.value }))} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div>
                <label className="input-label font-bold text-amber-800">Total Gross Weight (Kg)</label>
                <input type="number" value={form.totalGrossWeight} onChange={(e) => updateFormWithAutoCalc({ totalGrossWeight: e.target.value })} className="input-field border-amber-300 shadow-sm" placeholder="0" />
              </div>
              <div>
                <label className="input-label font-bold text-amber-800">Total S.H Cut (Kg)</label>
                <input type="number" value={form.totalSHCut} onChange={(e) => updateFormWithAutoCalc({ totalSHCut: e.target.value })} className="input-field border-amber-300 shadow-sm" placeholder="0" />
              </div>
              <div>
                <label className="input-label font-bold text-amber-800">Net Weight (Kg)</label>
                <div className="bg-amber-100 border border-amber-300 rounded-lg py-2.5 px-3 font-black text-amber-900 text-lg shadow-inner">
                  {form.netWeight} Kg
                </div>
              </div>
              <div>
                <label className="input-label">GP# / Remark / Goods</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="GP#" value={form.gatePassNo} onChange={(e) => setForm(f => ({ ...f, gatePassNo: e.target.value }))} className="input-field w-1/2 shadow-sm" />
                  <input type="text" placeholder="Goods" value={form.goods} onChange={(e) => setForm(f => ({ ...f, goods: e.target.value }))} className="input-field w-1/2 shadow-sm" />
                </div>
              </div>
            </div>
          </section>

          <section className="card overflow-hidden border-t-4 border-t-indigo-500">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Items List</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Line items for this truck</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-black">
                  <tr>
                    <th className="px-4 py-3 text-left w-64">Item *</th>
                    <th className="px-4 py-3 text-left w-20">Bags</th>
                    <th className="px-4 py-3 text-left w-20">Kg/Bag</th>
                    <th className="px-4 py-3 text-left w-24 bg-amber-50">Total KG</th>
                    <th className="px-4 py-3 text-left w-24 bg-amber-100/50">Total MUN</th>
                    <th className="px-4 py-3 text-left w-32">Rate (MUN)</th>
                    <th className="px-4 py-3 text-left w-20">Bardana Amount</th>
                    <th className="px-4 py-3 text-left w-20">Mazdori</th>
                    <th className="px-4 py-3 text-right font-bold bg-slate-200/50">Line Total</th>
                    <th className="px-4 py-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {form.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-3">
                        <SearchableSelect
                          options={items.map(i => ({ _id: i._id, name: `${i.name} (${i.quality})` }))}
                          value={item.itemId}
                          onChange={(val) => {
                            const newItems = [...form.items];
                            newItems[idx].itemId = val;
                            updateFormWithAutoCalc({ items: newItems });
                          }}
                          placeholder="Select Item"
                        />
                      </td>
                      <td className="p-3">
                        <input type="number" value={item.kattay} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].kattay = e.target.value;
                          updateFormWithAutoCalc({ items: newItems });
                        }} className="input-field py-1.5 px-2 text-center" placeholder="0" />
                      </td>
                      <td className="p-3">
                        <input type="number" value={item.kgPerKata} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].kgPerKata = e.target.value;
                          updateFormWithAutoCalc({ items: newItems });
                        }} className="input-field py-1.5 px-2 text-center" placeholder="0" />
                      </td>
                      <td className="p-3 bg-amber-50/50">
                        <div className="font-bold text-amber-900 text-center">
                          {item.grossWeight ? Number(item.grossWeight).toLocaleString() : "—"}
                        </div>
                      </td>
                      <td className="p-3 bg-amber-100/30">
                        <div className="font-black text-amber-900 text-center">
                          {item.grossWeight ? (Number(item.grossWeight) / 40).toFixed(3) : "—"}
                        </div>
                      </td>
                      <td className="p-3">
                        <input type="number" value={item.rate} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].rate = e.target.value;
                          updateFormWithAutoCalc({ items: newItems });
                        }} className="input-field py-1.5 px-2 font-bold text-emerald-700 bg-emerald-50/20" placeholder="0" />
                      </td>
                      <td className="p-3">
                        <input type="number" value={item.bardanaAmount} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].bardanaAmount = e.target.value;
                          updateFormWithAutoCalc({ items: newItems });
                        }} className="input-field py-1.5 px-2" placeholder="0" />
                      </td>
                      <td className="p-3">
                        <input type="number" value={item.mazdori} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].mazdori = e.target.value;
                          updateFormWithAutoCalc({ items: newItems });
                        }} className="input-field py-1.5 px-2" placeholder="0" />
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 bg-slate-50/50 text-base">
                        {formatMoney(item.totalAmount)}
                      </td>
                      <td className="p-3 text-center">
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItemRow(idx)} className="text-red-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded" title="Remove row">
                            <FaPlus className="w-4 h-4 rotate-45" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" onClick={addItemRow} className="w-full py-4 bg-slate-50 text-indigo-600 font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 border-t border-slate-200 group">
                <FaPlus className="w-4 h-4 group-hover:scale-110" /> Add Another Item to this Invoice
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6 space-y-4 lg:col-span-2">
              <h3 className="font-bold text-slate-700 border-b pb-2">Payment & Notes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Amount Received / Bank</label>
                  <div className="flex gap-2">
                    <input type="number" value={form.amountReceived} onChange={(e) => setForm(f => ({ ...f, amountReceived: e.target.value }))} className="input-field w-1/2" placeholder="0" />
                    <select value={form.accountId} onChange={(e) => setForm(f => ({ ...f, accountId: e.target.value }))} className="input-field w-1/2">
                      <option value="">Account —</option>
                      {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="input-label">Payment Terms</label>
                  <select value={form.paymentTerms} onChange={(e) => updateFormWithAutoCalc({ paymentTerms: e.target.value })} className="input-field">
                    <option value="cash">Full Cash (Aaj)</option>
                    <option value="15">15 Din baad</option>
                    <option value="30">30 Din baad</option>
                    <option value="custom">Custom Date</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label flex items-center gap-2"><FaImage className="text-slate-400" /> Image / Receipt</label>
                <input type="file" accept="image/*" onChange={(e) => setForm(f => ({ ...f, image: e.target.files[0] }))} className="input-field" />
              </div>
              <div>
                <label className="input-label">Special Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="input-field h-20" placeholder="Koi khaas baat likhni ho tw..." />
              </div>
            </div>

            <div className="card p-6 bg-slate-900 text-white flex flex-col justify-between border-t-4 border-t-emerald-500 shadow-xl">
              <div className="space-y-4">
                <h3 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Invoice Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>Net Weight:</span>
                    <span className="text-white font-bold">{form.netWeight} Kg</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-sm border-b border-slate-800 pb-2">
                    <span>Total Items:</span>
                    <span className="text-white font-bold">{form.items.length}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Total Receivable</p>
                  <p className="text-4xl font-black">Rs. {formatMoney(form.items.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0))}</p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {error && <p className="text-xs text-red-400 font-bold bg-red-400/10 p-2 rounded border border-red-400/20">{error}</p>}
                <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2" disabled={submitting}>
                  {submitting ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                  ) : (editingId ? "Update Sale" : "Save & Generate Invoice")}
                </button>
                <button type="button" onClick={resetForm} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all" disabled={submitting}>
                  Cancel / Exit
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaShoppingCart className="w-7 h-7 text-amber-500" />
            Sales (Bechai)
          </h1>
          <p className="page-subtitle">Multiple items invoice system. Total weight aur S.H cut master level pe enter karein.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => downloadSalesPdf(list)} className="btn-secondary flex items-center gap-2">
            <FaFilePdf className="w-4 h-4" /> Reports
          </button>
          <button type="button" onClick={() => downloadCsv(buildCsv(list, "Sales Report"), "sales-report.csv")} className="btn-secondary flex items-center gap-2">
            <FaFileExport className="w-4 h-4" /> CSV
          </button>
          <button type="button" onClick={openAddModal} className="btn-primary flex items-center gap-2">
            <FaPlus className="w-4 h-4" /> Add Multi-Item Sale
          </button>
        </div>
      </header>

      {/* Filters */}
      <section className="card p-4 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="input-label">Date from</label>
            <input type="date" value={filters.dateFrom} onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="input-label">Date to</label>
            <input type="date" value={filters.dateTo} onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="input-label">Customer</label>
            <SearchableSelect
              options={customers}
              value={filters.customerId}
              onChange={(val) => setFilters(f => ({ ...f, customerId: val }))}
              placeholder="All Customers"
            />
          </div>
          <div className="flex gap-2">
             <div className="flex-1">
              <label className="input-label">Item</label>
              <SearchableSelect
                options={items.map(i => ({ _id: i._id, name: `${i.name} (${i.quality})` }))}
                value={filters.itemId}
                onChange={(val) => setFilters(f => ({ ...f, itemId: val }))}
                placeholder="All Items"
              />
            </div>
            <button type="button" onClick={() => setFilters({ dateFrom: "", dateTo: "", itemId: "", customerId: "" })} className="btn-ghost-secondary h-10 px-3 mt-auto" title="Clear Filters">
              <FaSearch className="w-4 h-4 rotate-45" />
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">

          <p className="text-sm text-slate-500">{list.length} sale(s)</p>
          <button type="button" onClick={() => downloadSalesPdf(sortedList, filters)} className="btn-primary flex items-center gap-1.5" disabled={list.length === 0} title="Download PDF"><FaFilePdf className="w-4 h-4" /> Export PDF</button>
          <button type="button" onClick={() => { const csv = buildCsv(list, [{ key: "date", label: "Date" }, { key: "customerId.name", label: "Customer" }, { key: "itemName", label: "Item" }, { key: "category", label: "Category" }, { key: "kattay", label: "Kattay" }, { key: "kgPerKata", label: "Kg/Katta" }, { key: "ratePerKata", label: "Rate/Katta" }, { key: "quantity", label: "Quantity (kg)" }, { key: "totalAmount", label: "Total Amount" }, { key: "amountReceived", label: "Amount Received" }, { key: "truckNumber", label: "Truck" }, { key: "accountId.name", label: "Account" }, { key: "paymentStatus", label: "Status" }, { key: "notes", label: "Notes" }]); downloadCsv(csv, "sales.csv"); }} className="btn-secondary flex items-center gap-1.5" disabled={list.length === 0}><FaFileExport className="w-4 h-4" /> Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="empty-state"><div className="loading-spinner mb-3" /><p>Loading...</p></div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("date")} className="flex items-center hover:text-slate-800">Date<SortIcon columnKey="date" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("customer")} className="flex items-center hover:text-slate-800">Customer<SortIcon columnKey="customer" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">Products</th>
                    <th className="table-header px-5 py-3.5">Total Qty (Bags)</th>
                    <th className="table-header px-5 py-3.5">Net Wt (Kg)</th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("amount")} className="flex items-center hover:text-slate-800">Total Invoice<SortIcon columnKey="amount" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">Received</th>
                    <th className="table-header px-5 py-3.5">Truck</th>
                    <th className="table-header px-5 py-3.5">Status</th>
                    <th className="table-header px-5 py-3.5 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover text-sm">
                      <td className="table-cell">{formatDate(row.date)}</td>
                      <td className="table-cell font-bold text-slate-900">{row.customerId?.name || "—"}</td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-0.5">
                          {row.items?.slice(0, 2).map((it, idx) => (
                            <span key={idx} className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 truncate max-w-[120px]">
                              {it.itemId?.name || "Item"}
                            </span>
                          ))}
                          {(row.items?.length > 2) && <span className="text-[10px] text-slate-500 font-medium">+{row.items.length - 2} more items</span>}
                        </div>
                      </td>
                      <td className="table-cell text-center font-medium">
                        {row.items?.reduce((sum, it) => sum + (it.kattay || 0), 0) || "—"}
                      </td>
                      <td className="table-cell font-bold text-indigo-700">
                        {row.netWeight || row.totalGrossWeight - row.totalSHCut || "—"}
                      </td>
                      <td className="table-cell font-black text-slate-900">{formatMoney(row.totalAmount)}</td>
                      <td className="table-cell font-bold text-emerald-700">{formatMoney(row.amountReceived)}</td>
                      <td className="table-cell text-xs uppercase font-medium">{row.truckNumber || "—"}</td>
                      <td className="table-cell">
                        {row.paymentStatus === 'paid' ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">Paid</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold w-fit ${row.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                              {row.paymentStatus === 'partial' ? 'Partial' : 'Pending'}
                            </span>
                            {row.dueDate && (
                              <span className={`text-[10px] whitespace-nowrap ${new Date(row.dueDate) < new Date() ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                                Due: {formatDate(row.dueDate)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          {row.image && (
                            <button type="button" onClick={() => setPreviewImage(row.image)} className="btn-ghost-primary flex items-center gap-1 text-indigo-500 hover:text-indigo-700 bg-indigo-50" title="Preview Image">
                              <FaImage className="w-3.5 h-3.5" /> 
                            </button>
                          )}
                          {row.paymentStatus !== 'paid' && (
                            <button type="button" onClick={() => { setSelectedCollectEntry(row); setCollectModalOpen(true); }} className="btn-ghost-primary flex items-center gap-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50" title="Collect Payment">
                              <FaHandHoldingUsd className="w-3.5 h-3.5" /> Rec
                            </button>
                          )}
                          {isAdmin && (
                            <button type="button" onClick={() => handleEdit(row)} className="btn-ghost-primary flex items-center gap-1">
                              <FaPlus className="w-3.5 h-3.5" /> Edit
                            </button>
                          )}
                          <button type="button" onClick={() => downloadSaleInvoicePdf(row)} className="btn-ghost-secondary flex items-center gap-1">
                            <FaFilePdf className="w-3.5 h-3.5" /> Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} totalItems={sortedList.length} />
            </>
          )}
          {!loading && list.length === 0 && (
            <div className="empty-state">
              <FaShoppingCart className="w-12 h-12 text-slate-300 mb-2" />
              <p>Abhi koi sale nahi. Add sale button se add karein.</p>
            </div>
          )}
        </div>
      </section>

      <CollectPaymentModal
        open={collectModalOpen}
        onClose={() => setCollectModalOpen(false)}
        entry={selectedCollectEntry}
        onSuccess={handleCollectSuccess}
      />

      <ImagePreviewModal
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage}
        title="Sale Receipt Preview"
      />
    </div>
  );
}
