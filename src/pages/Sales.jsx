import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, apiPost, apiPut, apiDelete } from "../config/api.js";
import { buildCsv, downloadCsv } from "../utils/exportToCsv.js";
import { downloadSalesPdf } from "../utils/exportPdf.js";
import { FaShoppingCart, FaEdit, FaPlus, FaSort, FaSortUp, FaSortDown, FaFileExport, FaFilePdf, FaHandHoldingUsd } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";
import CollectPaymentModal from "../components/CollectPaymentModal.jsx";

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
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    date: today,
    customerId: "",
    itemId: "",
    kattay: "",
    kgPerKata: "",
    ratePerKata: "",
    quantity: "",
    rate: "",
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
    if (editingId) params.set('excludeSaleId', editingId);
    fetch(`${API_BASE_URL}/sales/available?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && data.data) setAvailableStock(data.data.available);
        else setAvailableStock(null);
      })
      .catch(() => { if (!cancelled) setAvailableStock(null); });
    return () => { cancelled = true; };
  }, [form.itemId, editingId]);

  const resetForm = () => {
    setForm({
      date: today,
      customerId: "",
      itemId: "",
      kattay: "",
      kgPerKata: "",
      ratePerKata: "",
      quantity: "",
      rate: "",
      totalAmount: "",
      truckNumber: "",
      amountReceived: "",
      accountId: "",
      notes: "",
      paymentTerms: "cash",
      dueDate: "",
    });
    setEditingId(null);
    setModalOpen(false);
  };

  const updateFormWithAutoCalc = (updates) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };

      const kattay = Number(next.kattay) || 0;
      const kgPerKata = Number(next.kgPerKata) || 0;
      const ratePerKata = Number(next.ratePerKata) || 0;

      // Auto-calc quantity (total weight) = kattay × kgPerKata
      if (kattay > 0 && kgPerKata > 0) {
        next.quantity = String(kattay * kgPerKata);
      } else if ("kattay" in updates || "kgPerKata" in updates) {
        next.quantity = "";
      }

      // Auto-calc totalAmount = kattay × ratePerKata
      if (kattay > 0 && ratePerKata > 0) {
        next.totalAmount = String(Math.round(kattay * ratePerKata));
      } else if ("kattay" in updates || "ratePerKata" in updates) {
        next.totalAmount = "";
      }

      // Fallback: quantity × rate if no kattay
      if (!next.totalAmount) {
        const qty = Number(next.quantity) || 0;
        const rate = Number(next.rate) || 0;
        if (qty > 0 && rate > 0) next.totalAmount = String(Math.round(qty * rate));
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
        ratePerKata: Number(form.ratePerKata) || 0,
        quantity: qty,
        rate: Number(form.rate) || 0,
        totalAmount: Number(form.totalAmount) || 0,
        truckNumber: (form.truckNumber || "").trim(),
        amountReceived: Number(form.amountReceived) || 0,
        accountId: form.accountId || undefined,
        notes: form.notes || "",
        dueDate: form.dueDate || undefined,
      };
      if (editingId) await apiPut(`/sales/${editingId}`, payload);
      else await apiPost("/sales", payload);
      resetForm();
      fetchList();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEdit = (row) => {
    const kattay = row.kattay != null ? row.kattay : "";
    const kgPerKata = row.kgPerKata != null ? row.kgPerKata : "";
    const ratePerKata = row.ratePerKata != null ? row.ratePerKata : "";
    const qty = row.quantity != null ? row.quantity : "";
    const total = row.totalAmount != null ? row.totalAmount : "";
    const rate = qty && total && Number(qty) > 0 ? String(Number(total) / Number(qty)) : (row.rate ?? "");
    setForm({
      date: row.date ? new Date(row.date).toISOString().slice(0, 10) : today,
      customerId: row.customerId?._id || row.customerId || "",
      itemId: row.itemId?._id || row.itemId || "",
      kattay: kattay !== "" ? String(kattay) : "",
      kgPerKata: kgPerKata !== "" ? String(kgPerKata) : "",
      ratePerKata: ratePerKata !== "" ? String(ratePerKata) : "",
      quantity: qty !== "" ? String(qty) : "",
      rate: rate !== "" ? String(rate) : "",
      totalAmount: total !== "" ? String(total) : "",
      truckNumber: row.truckNumber || "",
      amountReceived: row.amountReceived ?? "",
      accountId: row.accountId?._id || row.accountId || "",
      notes: row.notes || "",
      paymentTerms: "custom",
      dueDate: row.dueDate ? new Date(row.dueDate).toISOString().slice(0, 10) : "",
    });
    setEditingId(row._id);
    setModalOpen(true);
  };


  const handleCollectSuccess = () => {
    fetchList();
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

      <Modal open={modalOpen} onClose={resetForm} title={editingId ? "Edit sale" : "Nayi sale add karein"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Tarikh *</label>
              <input type="date" value={form.date} onChange={(e) => updateFormWithAutoCalc({ date: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Customer *</label>
              <select value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} className="input-field" required>
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Item * <span className="text-[10px] text-slate-400">(sirf stock wale items)</span></label>
              <select value={form.itemId} onChange={(e) => setForm((f) => ({ ...f, itemId: e.target.value }))} className="input-field" required>
                <option value="">Select item</option>
                {items.map((i) => {
                  const stock = stockData.find(s => s.itemId?.toString() === i._id?.toString());
                  const availQty = stock?.kattay || 0;
                  if (availQty <= 0 && form.itemId !== i._id) return null;
                  return (
                    <option key={i._id} value={i._id}>
                      {i.name}{i.categoryId?.name ? ` (${i.categoryId.name})` : ""} — {availQty} kattay
                    </option>
                  );
                })}
              </select>
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
              <label className="input-label">Aik katta kitne ka becha (Rs)</label>
              <input type="number" placeholder="0" value={form.ratePerKata} onChange={(e) => updateFormWithAutoCalc({ ratePerKata: e.target.value })} className="input-field" min="0" step="1" />
              <p className="text-xs text-slate-500 mt-0.5">Total amount auto: kattay × rate</p>
            </div>
            <div>
              <label className="input-label">Total weight / Quantity (kg)</label>
              <input type="number" placeholder="0" value={form.quantity} onChange={(e) => updateFormWithAutoCalc({ quantity: e.target.value })} className="input-field" min="0" step="any" />
              {availableStock != null && (
                <p className="text-xs text-slate-600 mt-0.5">Available stock: <strong>{availableStock} kg</strong> — jo yahan daalogi wo yahi se cut ho jayegi.</p>
              )}
              {form.itemId && availableStock == null && <p className="text-xs text-slate-500 mt-0.5">Yahi quantity (kg) is item ki stock se minus ho jayegi.</p>}
            </div>
            <div>
              <label className="input-label">Total amount (Rs)</label>
              <input type="number" placeholder="0" value={form.totalAmount} onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))} className="input-field" min="0" step="1" title="Auto: kattay × rate" />
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
            <button type="submit" className="btn-primary">{editingId ? "Update" : "Add sale"}</button>
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>


      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} className="input-field w-40" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} className="input-field w-40" />
          <select value={filters.customerId} onChange={(e) => setFilters((f) => ({ ...f, customerId: e.target.value }))} className="input-field w-48">
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select value={filters.itemId} onChange={(e) => setFilters((f) => ({ ...f, itemId: e.target.value }))} className="input-field w-48">
            <option value="">All items</option>
            {items.map((i) => (
              <option key={i._id} value={i._id}>{i.name}</option>
            ))}
          </select>
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
                          <button type="button" onClick={() => handleEdit(row)} className="btn-ghost-primary flex items-center gap-1"><FaEdit className="w-3.5 h-3.5" /> Edit</button>
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
