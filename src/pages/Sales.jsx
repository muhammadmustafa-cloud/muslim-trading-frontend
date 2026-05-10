import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, apiGet, apiPost, apiPut, apiDelete, apiPostFormData, apiPutFormData } from "../config/api.js";
import { buildCsv, downloadCsv } from "../utils/exportToCsv.js";
import { downloadSalesPdf, downloadSaleInvoicePdf } from "../utils/exportPdf.js";
import { FaMoneyBillWave, FaHandHoldingUsd, FaFilePdf, FaPlus, FaSearch, FaShoppingCart, FaImage, FaFileExport, FaSort, FaSortUp, FaSortDown, FaSitemap } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";
import CollectPaymentModal from "../components/CollectPaymentModal.jsx";
import SearchableSelect from "../components/SearchableSelect.jsx";
import ImagePreviewModal from "../components/ImagePreviewModal.jsx";

const today = (() => {
  const d = new Date();
  return d.toLocaleString("en-CA", { timeZone: "Asia/Karachi" }).slice(0, 10);
})();

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
      subItemId: "",
      kattay: "",
      kgPerKata: "",
      grossWeight: "",
      rate: "",
      totalAmount: "",
      quantity: "",
      deductionKg: "",
      addKg: "",
    }],
    truckNumber: "",
    gatePassNo: "",
    goods: "",
    amountReceived: "",
    totalBardanaAmount: "",
    totalMazdori: "",
    extras: "",
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
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "—");

  const resetForm = () => {
    setForm({
      date: today,
      customerId: "",
      totalGrossWeight: "",
      totalSHCut: "",
      netWeight: "",
      items: [{
        itemId: "",
        subItemId: "",
        kattay: "",
        kgPerKata: "",
        grossWeight: "",
        rate: "",
        totalAmount: "",
        quantity: "",
        deductionKg: "",
        addKg: "",
      }],
      truckNumber: "",
      gatePassNo: "",
      goods: "",
      amountReceived: "",
      totalBardanaAmount: "",
      totalMazdori: "",
      extras: "",
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
    const newItems = [...form.items, {
      itemId: "",
      subItemId: "",
      kattay: "",
      kgPerKata: "",
      grossWeight: "",
      rate: "",
      totalAmount: "",
      deductionKg: "",
      addKg: "",
    }];
    updateFormWithAutoCalc({ items: newItems });
  };

  const removeItemRow = (index) => {
    if (form.items.length <= 1) return;
    const newItems = form.items.filter((_, i) => i !== index);
    updateFormWithAutoCalc({ items: newItems });
  };

  const updateFormWithAutoCalc = (updates) => {
    setForm((prev) => {
      let next = { ...prev, ...updates };

      const lineGrosses = next.items.map(item => {
        const k = Number(item.kattay) || 0;
        const kpk = Number(item.kgPerKata) || 0;
        const dKg = Number(item.deductionKg) || 0;
        const aKg = Number(item.addKg) || 0;
        if (k > 0 && kpk > 0) return Math.max(0, (k * kpk) - dKg + aKg);
        return Math.max(0, Number(item.grossWeight) || 0);
      });
      const sumLineGross = lineGrosses.reduce((a, b) => a + b, 0);

      if (updates.items && (!next.totalGrossWeight || Number(next.totalGrossWeight) === 0)) {
        next.totalGrossWeight = sumLineGross > 0 ? String(sumLineGross) : "";
      }
      
      const totalGross = Number(next.totalGrossWeight) || sumLineGross;
      const totalCut = Number(next.totalSHCut) || 0;
      const totalNet = Math.max(0, totalGross - totalCut);
      const totalMun = totalNet / 40;
      
      next.netWeight = String(totalNet);

      const nextItems = next.items.map((item, idx) => {
        const lineGross = lineGrosses[idx];
        const ratio = sumLineGross > 0 ? (lineGross / sumLineGross) : (next.items.length === 1 ? 1 : 0);
        
        const itemMun = totalMun * ratio;
        const itemNet = totalNet * ratio;
        const itemSHCut = totalCut * ratio;
        
        const rate = Number(item.rate) || 0;
        const lineTotalBase = Math.round(itemMun * rate);

        return {
          ...item,
          grossWeight: String(lineGross),
          shCut: String(itemSHCut.toFixed(2)),
          quantity: String(itemNet.toFixed(3)),
          totalAmount: String(Math.max(0, lineTotalBase)),
          _calcInfo: { itemMun, lineTotalBase }
        };
      });

      const totalExtras = Number(next.extras) || 0;
      const totalBardana = Number(next.totalBardanaAmount) || 0;
      const totalMazdori = Number(next.totalMazdori) || 0;

      const extraPerMun = totalMun > 0 ? (totalExtras / totalMun) : 0;
      const bardanaPerMun = totalMun > 0 ? (totalBardana / totalMun) : 0;
      const mazdoriPerMun = totalMun > 0 ? (totalMazdori / totalMun) : 0;

      next.items = nextItems.map(item => {
        const itemProportionalExtra = item._calcInfo.itemMun * extraPerMun;
        const itemProportionalBardana = item._calcInfo.itemMun * bardanaPerMun;
        const itemProportionalMazdori = item._calcInfo.itemMun * mazdoriPerMun;

        const finalTotal = Math.round(item._calcInfo.lineTotalBase + itemProportionalBardana + itemProportionalMazdori - itemProportionalExtra);
        
        const { _calcInfo, ...rest } = item;
        return {
          ...rest,
          totalAmount: String(Math.max(0, finalTotal))
        };
      });

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
        subItemId: item.subItemId || "",
        kattay: String(item.kattay || ""),
        kgPerKata: String(item.kgPerKata || ""),
        grossWeight: String(item.grossWeight || ""),
        rate: String(item.rate || ""),
        totalAmount: String(item.totalAmount || ""),
        quantity: String(item.quantity || ""),
        deductionKg: String(item.deductionKg || ""),
        addKg: String(item.addKg || ""),
      })) : [{
        itemId: "",
        subItemId: "",
        kattay: "",
        kgPerKata: "",
        grossWeight: "",
        rate: "",
        totalAmount: "",
        deductionKg: "",
        addKg: "",
      }],
      truckNumber: row.truckNumber || "",
      gatePassNo: row.gatePassNo || "",
      goods: row.goods || "",
      amountReceived: String(row.amountReceived || ""),
      totalBardanaAmount: String(row.totalBardanaAmount || ""),
      totalMazdori: String(row.totalMazdori || ""),
      extras: String(row.extras || ""),
      accountId: row.accountId?._id || row.accountId || "",
      notes: row.notes || "",
      paymentTerms: row.paymentTerms || "custom",
      dueDate: row.dueDate ? formatDateForInput(row.dueDate) : "",
      image: null,
    });
    setView("form");
  };

  const formatDateForInput = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleString("en-CA", { timeZone: "Asia/Karachi" }).slice(0, 10);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId || !form.items || !form.items.length) {
      setError("Customer aur kam az kam aik item select karein.");
      return;
    }
    
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
          subItemId: item.subItemId || undefined,
          kattay: Number(item.kattay) || 0,
          kgPerKata: Number(item.kgPerKata) || 0,
          grossWeight: Number(item.grossWeight) || 0,
          rate: Number(item.rate) || 0,
          totalAmount: Number(item.totalAmount) || 0,
          deductionKg: Number(item.deductionKg) || 0,
          addKg: Number(item.addKg) || 0,
        })),
        truckNumber: (form.truckNumber || "").trim(),
        gatePassNo: (form.gatePassNo || "").trim(),
        goods: (form.goods || "").trim(),
        amountReceived: Number(form.amountReceived) || 0,
        totalBardanaAmount: Number(form.totalBardanaAmount) || 0,
        totalMazdori: Number(form.totalMazdori) || 0,
        extras: Number(form.extras) || 0,
        accountId: form.accountId || undefined,
        notes: (form.notes || "").trim(),
        dueDate: form.dueDate || undefined,
      };

      const formData = new FormData();
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
      fetchStockData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const mainItemsList = useMemo(() => items.filter(i => !i.parentId), [items]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedList = useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      let va = (a[sortKey] || "");
      let vb = (b[sortKey] || "");
      if (sortKey === "customerId") {
        va = a.customerId?.name || "";
        vb = b.customerId?.name || "";
      }
      va = va.toString().toLowerCase();
      vb = vb.toString().toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : -va.localeCompare(vb);
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
          <button type="button" onClick={resetForm} className="btn-secondary">Back to List</button>
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
                <SearchableSelect options={customers} value={form.customerId} onChange={(val) => setForm((f) => ({ ...f, customerId: val }))} placeholder="Select customer" />
              </div>
              <div>
                <label className="input-label">Truck number</label>
                <input type="text" placeholder="e.g. LEA-1234" value={form.truckNumber} onChange={(e) => setForm((f) => ({ ...f, truckNumber: e.target.value }))} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div>
                <label className="input-label font-bold text-amber-800 tracking-tight">Master Gross (Kg)</label>
                <input type="number" value={form.totalGrossWeight} onChange={(e) => updateFormWithAutoCalc({ totalGrossWeight: e.target.value })} className="input-field border-amber-300 shadow-sm font-bold" placeholder="0" />
              </div>
              <div>
                <label className="input-label font-bold text-rose-800 tracking-tight">Master S.H Cut (Kg)</label>
                <input type="number" value={form.totalSHCut} onChange={(e) => updateFormWithAutoCalc({ totalSHCut: e.target.value })} className="input-field border-rose-200 shadow-sm font-bold bg-rose-50/10" placeholder="0" />
              </div>
              <div>
                <label className="input-label font-black text-amber-900 tracking-tight">Master Net (Kg)</label>
                <div className="bg-amber-100 border border-amber-300 rounded-lg h-[42px] flex items-center px-3 font-black text-amber-900 text-lg shadow-inner">{form.netWeight} Kg</div>
              </div>
              <div>
                 {(() => {
                   const sumItems = form.items.reduce((sum, it) => sum + (Number(it.grossWeight) || 0), 0);
                   const masterGross = Number(form.totalGrossWeight) || 0;
                   const diff = masterGross - sumItems;
                   return (
                     <div className={`p-2 rounded-lg border h-[42px] flex flex-col justify-center ${Math.abs(diff) > 0.1 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                        <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase tracking-widest">{Math.abs(diff) > 0.1 ? 'Mismatch!' : 'Matched'}</span></div>
                        <div className="flex justify-between items-center"><p className="text-[12px] font-bold">Sum: {sumItems.toLocaleString()} Kg</p></div>
                     </div>
                   );
                 })()}
              </div>
              <div>
                <label className="input-label">GP# / Remark / Goods</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="GP#" value={form.gatePassNo} onChange={(e) => setForm(f => ({ ...f, gatePassNo: e.target.value }))} className="input-field w-1/2 shadow-sm text-sm" />
                  <input type="text" placeholder="Goods" value={form.goods} onChange={(e) => setForm(f => ({ ...f, goods: e.target.value }))} className="input-field w-1/2 shadow-sm text-sm" />
                </div>
              </div>
            </div>
          </section>

          <section className="card overflow-hidden border-t-4 border-t-indigo-500">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Items List</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-black">
                  <tr>
                    <th className="px-4 py-3 text-left w-64">Item & Sub-Item *</th>
                    <th className="px-4 py-3 text-left w-20">Bags</th>
                    <th className="px-4 py-3 text-left w-20">Kg/Bag</th>
                    <th className="px-4 py-3 text-left w-20 text-rose-800">Less (Kg)</th>
                    <th className="px-4 py-3 text-left w-20 text-emerald-800">Add (Kg)</th>
                    <th className="px-4 py-3 text-left w-24 bg-amber-50">Total KG</th>
                    <th className="px-4 py-3 text-left w-24 bg-amber-100/50">Net MUN</th>
                    <th className="px-4 py-3 text-left w-32">Rate (MUN) *</th>
                    <th className="px-4 py-3 text-right font-bold bg-slate-200/50">Line Total</th>
                    <th className="px-4 py-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {form.items.map((item, idx) => {
                    const subOptions = items.filter(i => i.parentId === item.itemId);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-3 space-y-2">
                          <SearchableSelect
                            options={mainItemsList.map(i => ({ _id: i._id, name: `${i.name} (${i.quality})` }))}
                            value={item.itemId}
                            onChange={(val) => {
                              const newItems = [...form.items];
                              newItems[idx].itemId = val;
                              newItems[idx].subItemId = ""; // Reset sub-item
                              updateFormWithAutoCalc({ items: newItems });
                            }}
                            placeholder="Select Main Item"
                          />
                          {subOptions.length > 0 && (
                            <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                               <FaSitemap className="text-amber-500 w-3 h-3" />
                               <select 
                                 value={item.subItemId} 
                                 onChange={(e) => {
                                   const newItems = [...form.items];
                                   newItems[idx].subItemId = e.target.value;
                                   updateFormWithAutoCalc({ items: newItems });
                                 }}
                                 className="input-field py-1 text-xs border-amber-200 bg-amber-50/50"
                               >
                                 <option value="">— Select Sub-Item (Required) —</option>
                                 {subOptions.map(s => <option key={s._id} value={s._id}>{s.name} ({s.quality})</option>)}
                               </select>
                            </div>
                          )}
                        </td>
                        <td className="p-3"><input type="number" value={item.kattay} onChange={(e) => { const newItems = [...form.items]; newItems[idx].kattay = e.target.value; updateFormWithAutoCalc({ items: newItems }); }} className="input-field py-1.5 px-2 text-center" placeholder="0" /></td>
                        <td className="p-3"><input type="number" value={item.kgPerKata} onChange={(e) => { const newItems = [...form.items]; newItems[idx].kgPerKata = e.target.value; updateFormWithAutoCalc({ items: newItems }); }} className="input-field py-1.5 px-2 text-center" placeholder="0" /></td>
                        <td className="p-3"><input type="number" value={item.deductionKg} onChange={(e) => { const newItems = [...form.items]; newItems[idx].deductionKg = e.target.value; updateFormWithAutoCalc({ items: newItems }); }} className="input-field py-1.5 px-2 text-center border-rose-200 bg-rose-50" placeholder="0" /></td>
                        <td className="p-3"><input type="number" value={item.addKg} onChange={(e) => { const newItems = [...form.items]; newItems[idx].addKg = e.target.value; updateFormWithAutoCalc({ items: newItems }); }} className="input-field py-1.5 px-2 text-center border-emerald-200 bg-emerald-50" placeholder="0" /></td>
                        <td className="p-3 bg-amber-50/50"><div className="font-bold text-amber-900 text-center">{item.grossWeight ? Number(item.grossWeight).toLocaleString() : "—"}</div></td>
                        <td className="p-3 bg-amber-100/30"><div className="font-black text-amber-900 text-center">{(Number(item.quantity) / 40).toFixed(4)}</div></td>
                        <td className="p-3"><input type="number" value={item.rate} onChange={(e) => { const newItems = [...form.items]; newItems[idx].rate = e.target.value; updateFormWithAutoCalc({ items: newItems }); }} className="input-field py-1.5 px-2 font-bold text-emerald-700 bg-emerald-50/20" placeholder="0" /></td>
                        <td className="p-3 text-right font-black text-slate-900 bg-slate-50/50 text-base">{formatMoney(item.totalAmount)}</td>
                        <td className="p-3 text-center">{form.items.length > 1 && <button type="button" onClick={() => removeItemRow(idx)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded"><FaPlus className="w-4 h-4 rotate-45" /></button>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button type="button" onClick={addItemRow} className="w-full py-4 bg-slate-50 text-indigo-600 font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 border-t border-slate-200 group"><FaPlus className="w-4 h-4 group-hover:scale-110" /> Add Another Item to this Invoice</button>
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
                  <label className="input-label">Payment Terms & Due Date</label>
                  <div className="flex gap-2">
                    <select value={form.paymentTerms} onChange={(e) => updateFormWithAutoCalc({ paymentTerms: e.target.value })} className="input-field w-1/2">
                      <option value="cash">Full Cash (Aaj)</option>
                      <option value="15">15 Din baad</option>
                      <option value="30">30 Din baad</option>
                      <option value="custom">Custom Date</option>
                    </select>
                    <input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value, paymentTerms: 'custom' }))} className="input-field w-1/2" />
                  </div>
                </div>
                <div><label className="input-label font-bold text-slate-600">Total Bardana (Truck)</label><input type="number" value={form.totalBardanaAmount} onChange={(e) => setForm(f => ({ ...f, totalBardanaAmount: e.target.value }))} className="input-field bg-slate-50 border-slate-200" placeholder="0" /></div>
                <div><label className="input-label font-bold text-slate-600">Total Mazdori (Truck)</label><input type="number" value={form.totalMazdori} onChange={(e) => setForm(f => ({ ...f, totalMazdori: e.target.value }))} className="input-field bg-slate-50 border-slate-200" placeholder="0" /></div>
                <div><label className="input-label text-rose-600 font-bold">Extras (Deduction)</label><input type="number" value={form.extras} onChange={(e) => setForm(f => ({ ...f, extras: e.target.value }))} className="input-field border-rose-300 bg-rose-50" placeholder="e.g. 870" /></div>
              </div>
              <div><label className="input-label flex items-center gap-2"><FaImage className="text-slate-400" /> Image / Receipt</label><input type="file" accept="image/*" onChange={(e) => setForm(f => ({ ...f, image: e.target.files[0] }))} className="input-field" /></div>
              <div><label className="input-label">Special Notes</label><textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="input-field h-20" placeholder="Koi khaas baat likhni ho tw..." /></div>
            </div>

            <div className="card p-6 bg-slate-900 text-white flex flex-col justify-between border-t-4 border-t-emerald-500 shadow-xl">
              <div className="space-y-4">
                <h3 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Invoice Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-400 text-sm"><span>Total Net MUN:</span><span className="text-white font-bold">{(Number(form.netWeight) / 40).toFixed(4)} MUN</span></div>
                  <div className="flex justify-between text-slate-400 text-sm border-b border-slate-800 pb-1"><span>Net Weight (Kg):</span><span className="text-white font-bold">{form.netWeight} Kg</span></div>
                  <div className="flex justify-between text-amber-400 text-sm"><span>Bardana:</span><span className="font-bold">+ Rs. {formatMoney(form.totalBardanaAmount || 0)}</span></div>
                  <div className="flex justify-between text-blue-400 text-sm"><span>Mazdori:</span><span className="font-bold">+ Rs. {formatMoney(form.totalMazdori || 0)}</span></div>
                  <div className="flex justify-between text-rose-400 text-sm border-b border-slate-800 pb-2"><span>Extras (Deduction):</span><span className="font-bold">- Rs. {formatMoney(form.extras || 0)}</span></div>
                </div>
                <div className="pt-2"><p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Total Receivable</p><p className="text-4xl font-black">Rs. {formatMoney(form.items.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0))}</p></div>
              </div>

              <div className="mt-8 space-y-3">
                {error && <p className="text-xs text-red-400 font-bold bg-red-400/10 p-2 rounded border border-red-400/20">{error}</p>}
                <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-xl transition-all shadow-lg flex items-center justify-center gap-2" disabled={submitting}>{submitting ? "Processing..." : (editingId ? "Update Sale" : "Save & Generate Invoice")}</button>
                <button type="button" onClick={resetForm} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all" disabled={submitting}>Cancel / Exit</button>
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
        <div><h1 className="page-title flex items-center gap-2"><FaShoppingCart className="w-7 h-7 text-amber-500" />Sales (Bechai)</h1><p className="page-subtitle">Multiple items invoice system. Total weight aur S.H cut master level pe enter karein.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => downloadSalesPdf(list)} className="btn-secondary flex items-center gap-2"><FaFilePdf className="w-4 h-4" /> Reports</button>
          <button type="button" onClick={openAddModal} className="btn-primary flex items-center gap-2"><FaPlus className="w-4 h-4" /> Add Multi-Item Sale</button>
        </div>
      </header>

      {/* Filters */}
      <section className="card p-4 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div><label className="input-label">Date from</label><input type="date" value={filters.dateFrom} onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="input-field" /></div>
          <div><label className="input-label">Date to</label><input type="date" value={filters.dateTo} onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="input-field" /></div>
          <div><label className="input-label">Customer</label><SearchableSelect options={customers} value={filters.customerId} onChange={(val) => setFilters(f => ({ ...f, customerId: val }))} placeholder="All Customers" /></div>
        </div>
      </section>

      {/* Table */}
      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="empty-state"><div className="loading-spinner mb-3" /><p>Loading sales...</p></div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-4 text-left"><button type="button" onClick={() => toggleSort("date")} className="flex items-center hover:text-slate-800 font-bold uppercase tracking-wider text-[10px] text-slate-500">Date <SortIcon columnKey="date" /></button></th>
                    <th className="px-5 py-4 text-left"><button type="button" onClick={() => toggleSort("customerId")} className="flex items-center hover:text-slate-800 font-bold uppercase tracking-wider text-[10px] text-slate-500">Customer <SortIcon columnKey="customerId" /></button></th>
                    <th className="px-5 py-4 text-left font-bold uppercase tracking-wider text-[10px] text-slate-500">Items (Main & Sub)</th>
                    <th className="px-5 py-4 text-right"><button type="button" onClick={() => toggleSort("totalAmount")} className="flex items-center justify-end hover:text-slate-800 font-bold uppercase tracking-wider text-[10px] text-slate-500">Total Amount <SortIcon columnKey="totalAmount" /></button></th>
                    <th className="px-5 py-4 text-center font-bold uppercase tracking-wider text-[10px] text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4 font-medium text-slate-700">{formatDate(row.date)}</td>
                      <td className="px-5 py-4"><span className="font-bold text-indigo-700">{row.customerId?.name || "—"}</span></td>
                      <td className="px-5 py-4">
                         <div className="flex flex-col gap-1">
                           {row.items?.map((it, idx) => (
                             <div key={idx} className="text-xs text-slate-600 flex items-center gap-1">
                               <span className="font-bold">{it.itemId?.name}</span>
                               {it.subItemId && <span className="text-amber-600 bg-amber-50 px-1 rounded flex items-center gap-0.5"><FaSitemap className="w-2 h-2" /> {items.find(i => i._id === it.subItemId)?.name || "Sub-Item"}</span>}
                               <span className="text-slate-400">({(it.quantity / 40).toFixed(2)} MUN)</span>
                             </div>
                           ))}
                         </div>
                      </td>
                      <td className="px-5 py-4 text-right font-black text-slate-900">Rs. {formatMoney(row.totalAmount)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                           <button type="button" onClick={() => handleEdit(row)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><FaEdit className="w-4 h-4" /></button>
                           <button type="button" onClick={() => downloadSaleInvoicePdf(row)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><FaFilePdf className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} totalItems={sortedList.length} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
