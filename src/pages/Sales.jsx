import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, apiPost, apiPut, apiDelete } from "../config/api.js";
import { buildCsv, downloadCsv } from "../utils/exportToCsv.js";
import { downloadSalesPdf, downloadSaleInvoicePdf } from "../utils/exportPdf.js";
import { FaShoppingCart, FaEdit, FaPlus, FaSort, FaSortUp, FaSortDown, FaFileExport, FaFilePdf, FaHandHoldingUsd } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";
import CollectPaymentModal from "../components/CollectPaymentModal.jsx";
import SearchableSelect from "../components/SearchableSelect.jsx";

const today = new Date().toISOString().slice(0, 10);

export default function Sales() {
  const [list, setList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: today,
    customerId: "",
    itemId: "",
    kattay: "",
    kgPerKata: "",
    quantity: "",
    shCut: "",
    rate: "",
    bardanaRate: "",
    bardanaAmount: "",
    mazdori: "",
    totalAmount: "",
    truckNumber: "",
    amountReceived: "",
    accountId: "",
    notes: "",
    paymentTerms: "cash",
    dueDate: "",
  });
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", customerId: "", itemId: "" });
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [availableStock, setAvailableStock] = useState(null);
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [selectedCollectEntry, setSelectedCollectEntry] = useState(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`);
      const data = await res.json();
      if (res.ok) setCustomers(data.data || []);
    } catch (_) { }
  };
  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/items`);
      const data = await res.json();
      if (res.ok) setItems(data.data || []);
    } catch (_) { }
  };
  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/accounts`);
      const data = await res.json();
      if (res.ok) setAccounts(data.data || []);
    } catch (_) { }
  };
  const fetchStockData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/stock/current`);
      const data = await res.json();
      if (res.ok) setStockData(data.data || []);
    } catch (_) { }
  };
  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.customerId) params.set("customerId", filters.customerId);
      if (filters.itemId) params.set("itemId", filters.itemId);
      const res = await fetch(`${API_BASE_URL}/sales?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch");
      setList(data.data || []);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchItems();
    fetchAccounts();
    fetchStockData();
  }, []);
  useEffect(() => {
    fetchList();
  }, [filters.dateFrom, filters.dateTo, filters.customerId, filters.itemId]);

  useEffect(() => {
    if (!form.itemId) {
      setAvailableStock(null);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({ itemId: form.itemId });
    fetch(`${API_BASE_URL}/sales/available?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && data.data) {
          setAvailableStock({
            weight: data.data.availableWeight ?? data.data.available,
            kattay: data.data.availableKattay ?? 0
          });
        }
        else setAvailableStock(null);
      })
      .catch(() => { if (!cancelled) setAvailableStock(null); });
    return () => { cancelled = true; };
  }, [form.itemId]);

  const resetForm = () => {
    setForm({
      date: today,
      customerId: "",
      itemId: "",
      kattay: "",
      kgPerKata: "",
      quantity: "",
      shCut: "",
      rate: "",
      bardanaRate: "",
      bardanaAmount: "",
      mazdori: "",
      totalAmount: "",
      truckNumber: "",
      amountReceived: "",
      accountId: "",
      notes: "",
      paymentTerms: "cash",
      dueDate: "",
    });
    setModalOpen(false);
  };

  const updateFormWithAutoCalc = (updates) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };

      const kattay = Number(next.kattay) || 0;
      const kgPerKata = Number(next.kgPerKata) || 0;
      const rate = Number(next.rate) || 0;
      
      // Standard Rule: 0.1 kg S.H Cut per bag
      let shCut = Number(next.shCut) || 0;
      if ("kattay" in updates && kattay > 0) {
        shCut = Number((kattay * 0.1).toFixed(2));
        next.shCut = String(shCut);
      } else {
        shCut = Number(next.shCut) || 0;
      }

      const bardanaRate = Number(next.bardanaRate) || 0;
      const mazdori = Number(next.mazdori) || 0;

      // Auto-calc quantity (total weight) = (kattay × kgPerKata) - shCut
      if (kattay > 0 && kgPerKata > 0) {
        next.quantity = String(Math.max(0, (kattay * kgPerKata) - shCut));
      }
 else if ("kattay" in updates || "kgPerKata" in updates) {
        // Only clear if neither exists
        if (!kattay && !kgPerKata && next.quantity !== "") {
          next.quantity = String(Math.max(0, Number(next.quantity || 0) - shCut));
        }
      } else if ("shCut" in updates) {
        // If only shCut changed, recalculate quantity if we don't have kattay math
        if (!(kattay > 0 && kgPerKata > 0)) {
           // Fallback to whatever is in quantity, deducting new shCut
           // Note: This isn't perfect if they manually type quantity then change shcut,
           // but the server logic handles it perfectly.
        }
      }

      // Auto-calc Bardana Amount
      let bardanaAmt = Number(next.bardanaAmount) || 0;
      if (kattay > 0 && bardanaRate > 0) {
        bardanaAmt = kattay * bardanaRate;
        next.bardanaAmount = String(bardanaAmt);
      }

      // Auto-calc totalAmount
      // (Quantity / 40) × rate (user rate is per MUN)
      let calculatedTotalAmount = 0;
      const qty = Number(next.quantity) || 0;
      if (qty > 0 && rate > 0) {
        const mun = qty / 40;
        calculatedTotalAmount = Math.round(mun * rate) + bardanaAmt + mazdori;
      }
      
      // Only override total amount if we have rate formulas firing
      if (calculatedTotalAmount > 0 || ("quantity" in updates || "rate" in updates || "bardanaRate" in updates || "mazdori" in updates || "shCut" in updates)) {
          next.totalAmount = calculatedTotalAmount > 0 ? String(calculatedTotalAmount) : "";
      }

      // Auto calc dueDate if paymentTerms changed or date changed
      if ("paymentTerms" in updates || "date" in updates) {
        if (next.paymentTerms === "custom") {
          // keep existing or manual
        } else if (next.paymentTerms === "cash") {
          next.dueDate = next.date;
        } else {
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
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId || !form.itemId) {
      setError("Customer aur item select karein.");
      return;
    }
    const qty = Number(form.quantity);
    if (isNaN(qty) || qty < 0) {
      setError("Valid quantity enter karein.");
      return;
    }
    setError("");
    try {
      const payload = {
        date: form.date,
        customerId: form.customerId,
        itemId: form.itemId,
        kattay: Number(form.kattay) || 0,
        kgPerKata: Number(form.kgPerKata) || 0,
        quantity: qty,
        shCut: Number(form.shCut) || 0,
        rate: Number(form.rate) || 0,
        bardanaRate: Number(form.bardanaRate) || 0,
        bardanaAmount: Number(form.bardanaAmount) || 0,
        mazdori: Number(form.mazdori) || 0,
        totalAmount: Number(form.totalAmount) || 0,
        truckNumber: (form.truckNumber || "").trim(),
        amountReceived: Number(form.amountReceived) || 0,
        accountId: form.accountId || undefined,
        notes: form.notes || "",
        dueDate: form.dueDate || undefined,
      };
      await apiPost("/sales", payload);
      resetForm();
      fetchList();
      fetchStockData(); // Refresh dropdown labels
    } catch (e) {
      setError(e.message);
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
      if (sortKey === "item") {
        const va = (a.itemId?.name || "").toLowerCase();
        const vb = (b.itemId?.name || "").toLowerCase();
        return sortDir === "asc" ? va.localeCompare(vb) : -va.localeCompare(vb);
      }
      if (sortKey === "quantity") {
        const va = Number(a.quantity) || 0;
        const vb = Number(b.quantity) || 0;
        return sortDir === "asc" ? va - vb : vb - va;
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

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");
  const formatMoney = (n) => (n != null ? Number(n).toLocaleString("en-PK") : "—");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaShoppingCart className="w-7 h-7 text-amber-500" />
            Sales (Bechai)
          </h1>
          <p className="page-subtitle">Jis item ki bechai kar rahe ho, customer select karo, kitne katte beche, aik katta kitne kg ka tha aur kitne ka — total auto niklega.</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary">
          <FaPlus className="w-4 h-4" /> Add sale
        </button>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title="Nayi sale add karein">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="input-label">Item * <span className="text-[10px] text-slate-400">(sirf stock wale items)</span></label>
              <SearchableSelect
                options={items
                  .map((i) => {
                    const stock = stockData.find(s => s.itemId?.toString() === i._id?.toString());
                    const availQty = stock?.kattay || 0;
                    return {
                      ...i,
                      displayName: `${i.name}${i.categoryId?.name ? ` (${i.categoryId.name})` : ""} — ${availQty} kattay`,
                      availQty
                    };
                  })
                  .filter(i => i.availQty > 0 || form.itemId === i._id)
                  .map(i => ({ _id: i._id, name: i.displayName }))
                }
                value={form.itemId}
                onChange={(val) => setForm((f) => ({ ...f, itemId: val }))}
                placeholder="Select item"
              />
            </div>
            <div>
              <label className="input-label">Truck number</label>
              <input type="text" placeholder="e.g. LEA-1234" value={form.truckNumber} onChange={(e) => setForm((f) => ({ ...f, truckNumber: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="input-label">Kitne katte beche</label>
              <input type="number" placeholder="0" value={form.kattay} onChange={(e) => updateFormWithAutoCalc({ kattay: e.target.value })} className="input-field" min="0" step="1" />
            </div>
            <div>
              <label className="input-label">Aik katta kitne kg ka tha</label>
              <input type="number" placeholder="0" value={form.kgPerKata} onChange={(e) => updateFormWithAutoCalc({ kgPerKata: e.target.value })} className="input-field" min="0" step="any" />
              <p className="text-xs text-slate-500 mt-0.5">Total weight auto: kattay × kg/katta</p>
            </div>
            <div>
              <label className="input-label">Total SH.CUT (kg)</label>
              <input type="number" placeholder="0" value={form.shCut} onChange={(e) => updateFormWithAutoCalc({ shCut: e.target.value })} className="input-field" min="0" step="any" />
            </div>
            <div>
              <label className="input-label">Net Weight (kg)</label>
              <input type="number" placeholder="0" value={form.quantity} onChange={(e) => updateFormWithAutoCalc({ quantity: e.target.value })} className="input-field border-amber-200 bg-amber-50/50" min="0" step="any" />
              {availableStock != null && (
                <p className="text-[10px] text-slate-600 mt-0.5">Avail: <strong>{availableStock.weight} kg</strong>, <strong>{availableStock.kattay} bags</strong>.</p>
              )}
            </div>
            <div>
              <label className="input-label font-bold text-amber-700">Rate (Per MUN / 40Kg)</label>
              <input type="number" placeholder="0" value={form.rate} onChange={(e) => updateFormWithAutoCalc({ rate: e.target.value })} className="input-field" min="0" step="any" />
            </div>
            <div>
              <label className="input-label">Aik Bardana Amount (Rate)</label>
              <input type="number" placeholder="0" value={form.bardanaRate} onChange={(e) => updateFormWithAutoCalc({ bardanaRate: e.target.value })} className="input-field" min="0" />
            </div>
            <div>
              <label className="input-label">Total Bardana Amount</label>
              <input type="number" placeholder="0" value={form.bardanaAmount} onChange={(e) => updateFormWithAutoCalc({ bardanaAmount: e.target.value })} className="input-field bg-slate-50" min="0" />
            </div>
            <div>
              <label className="input-label">Mazdoori (Rs)</label>
              <input type="number" placeholder="0" value={form.mazdori} onChange={(e) => updateFormWithAutoCalc({ mazdori: e.target.value })} className="input-field" min="0" />
            </div>
            <div>
              <label className="input-label font-bold text-amber-700">Total Amount</label>
              <input type="number" placeholder="0" value={form.totalAmount} onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))} className="input-field font-bold text-amber-900 bg-amber-50" min="0" />
            </div>
            <div>
              <label className="input-label">Amount received</label>
              <input type="number" placeholder="0" value={form.amountReceived} onChange={(e) => setForm((f) => ({ ...f, amountReceived: e.target.value }))} className="input-field" min="0" step="1" />
            </div>
            <div>
              <label className="input-label">Account (jahan paisa aaya)</label>
              <select value={form.accountId} onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))} className="input-field">
                <option value="">—</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div>
              <label className="input-label font-semibold text-amber-700">Payment Terms (Kab paise dene hain?)</label>
              <select
                value={form.paymentTerms}
                onChange={(e) => updateFormWithAutoCalc({ paymentTerms: e.target.value })}
                className="input-field border-amber-200 bg-amber-50/30"
              >
                <option value="cash">Full Cash (Aaj)</option>
                <option value="10">10 Din baad (10 Days)</option>
                <option value="15">15 Din baad (15 Days)</option>
                <option value="30">30 Din baad (30 Days)</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>
            <div>
              <label className="input-label">Due Date (Bhugtan ki tareekh)</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value, paymentTerms: 'custom' }))}
                className="input-field"
              />
              <p className="text-xs text-slate-500 mt-1">Audit ke liye yeh tareekh zaroori he.</p>
            </div>
          </div>
          <div>
            <label className="input-label">Notes</label>
            <input type="text" placeholder="Optional" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input-field" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Add sale</button>
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>


      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} className="input-field w-40" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} className="input-field w-40" />
          
          <SearchableSelect
            options={customers}
            value={filters.customerId}
            onChange={(val) => setFilters((f) => ({ ...f, customerId: val }))}
            placeholder="All customers"
            className="w-56"
          />

          <SearchableSelect
            options={items}
            value={filters.itemId}
            onChange={(val) => setFilters((f) => ({ ...f, itemId: val }))}
            placeholder="All items"
            className="w-56"
          />

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
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("item")} className="flex items-center hover:text-slate-800">Item<SortIcon columnKey="item" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">Kattay</th>
                    <th className="table-header px-5 py-3.5">Kg/Katta</th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("quantity")} className="flex items-center hover:text-slate-800">Weight (kg)<SortIcon columnKey="quantity" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">Rate/Katta</th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("amount")} className="flex items-center hover:text-slate-800">Total<SortIcon columnKey="amount" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">Received</th>
                    <th className="table-header px-5 py-3.5">Truck</th>
                    <th className="table-header px-5 py-3.5">Status</th>
                    <th className="table-header px-5 py-3.5 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      <td className="table-cell">{formatDate(row.date)}</td>
                      <td className="table-cell font-medium">{row.customerId?.name || "—"}</td>
                      <td className="table-cell">{row.itemName || row.itemId?.name || "—"}</td>
                      <td className="table-cell">{row.kattay != null && row.kattay > 0 ? row.kattay : "—"}</td>
                      <td className="table-cell">{row.kgPerKata != null && row.kgPerKata > 0 ? row.kgPerKata : "—"}</td>
                      <td className="table-cell">{row.quantity != null ? row.quantity : "—"}</td>
                      <td className="table-cell">{row.ratePerKata != null && row.ratePerKata > 0 ? formatMoney(row.ratePerKata) : "—"}</td>
                      <td className="table-cell font-medium">{formatMoney(row.totalAmount)}</td>
                      <td className="table-cell font-medium">{formatMoney(row.amountReceived)}</td>
                      <td className="table-cell">{row.truckNumber ? row.truckNumber : "—"}</td>
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
                          {row.paymentStatus !== 'paid' && (
                            <button type="button" onClick={() => { setSelectedCollectEntry(row); setCollectModalOpen(true); }} className="btn-ghost-primary flex items-center gap-1">
                              <FaHandHoldingUsd className="w-3.5 h-3.5" /> Collect
                            </button>
                          )}
                          {/* Edit removed for data integrity */}
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
    </div>
  );
}
