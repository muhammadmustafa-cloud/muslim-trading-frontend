import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, apiPost, apiPut, apiDelete } from "../config/api.js";
import { buildCsv, downloadCsv } from "../utils/exportToCsv.js";
import { downloadSalesPdf } from "../utils/exportPdf.js";
import { FaShoppingCart, FaEdit, FaTrash, FaPlus, FaSort, FaSortUp, FaSortDown, FaFileExport, FaFilePdf } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import TablePagination from "../components/TablePagination.jsx";

const today = new Date().toISOString().slice(0, 10);

export default function Sales() {
  const [list, setList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    date: today,
    customerId: "",
    itemId: "",
    partId: "",
    quantity: "",
    rate: "",
    totalAmount: "",
    amountReceived: "",
    accountId: "",
    notes: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", customerId: "", itemId: "" });
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const selectedItem = useMemo(() => items.find((i) => i._id === form.itemId), [items, form.itemId]);
  const itemParts = selectedItem?.parts || [];

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`);
      const data = await res.json();
      if (res.ok) setCustomers(data.data || []);
    } catch (_) {}
  };
  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/items`);
      const data = await res.json();
      if (res.ok) setItems(data.data || []);
    } catch (_) {}
  };
  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/accounts`);
      const data = await res.json();
      if (res.ok) setAccounts(data.data || []);
    } catch (_) {}
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
  }, []);
  useEffect(() => {
    fetchList();
  }, [filters.dateFrom, filters.dateTo, filters.customerId, filters.itemId]);

  const resetForm = () => {
    setForm({
      date: today,
      customerId: "",
      itemId: "",
      partId: "",
      quantity: "",
      rate: "",
      totalAmount: "",
      amountReceived: "",
      accountId: "",
      notes: "",
    });
    setEditingId(null);
    setModalOpen(false);
  };
  const openAddModal = () => {
    resetForm();
    setForm((f) => ({ ...f, date: today }));
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId || !form.itemId || !form.partId) {
      setError("Customer, item aur part select karein.");
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
        partId: form.partId,
        quantity: qty,
        rate: Number(form.rate) || 0,
        totalAmount: Number(form.totalAmount) || 0,
        amountReceived: Number(form.amountReceived) || 0,
        accountId: form.accountId || undefined,
        notes: form.notes || "",
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
    const partId = row.partId?.toString?.() || row.partId;
    setForm({
      date: row.date ? new Date(row.date).toISOString().slice(0, 10) : today,
      customerId: row.customerId?._id || row.customerId || "",
      itemId: row.itemId?._id || row.itemId || "",
      partId: partId || "",
      quantity: row.quantity ?? "",
      rate: row.rate ?? "",
      totalAmount: row.totalAmount ?? "",
      amountReceived: row.amountReceived ?? "",
      accountId: row.accountId?._id || row.accountId || "",
      notes: row.notes || "",
    });
    setEditingId(row._id);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;
    setError("");
    try {
      await apiDelete(`/sales/${deleteConfirm.id}`);
      if (editingId === deleteConfirm.id) resetForm();
      fetchList();
    } catch (e) {
      setError(e.message);
    }
    setDeleteConfirm({ open: false, id: null });
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
        const va = Number(a.amountReceived) || 0;
        const vb = Number(b.amountReceived) || 0;
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
          <p className="page-subtitle">Customer ko bechi hui cheez, quantity aur amount record karein. Stock auto-deduct, account mein amount add.</p>
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
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input-field" required />
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
              <label className="input-label">Item *</label>
              <select value={form.itemId} onChange={(e) => setForm((f) => ({ ...f, itemId: e.target.value, partId: "" }))} className="input-field" required>
                <option value="">Select item</option>
                {items.map((i) => (
                  <option key={i._id} value={i._id}>{i.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Part (Hisse) *</label>
              <select value={form.partId} onChange={(e) => setForm((f) => ({ ...f, partId: e.target.value }))} className="input-field" required>
                <option value="">Select part</option>
                {itemParts.map((p) => (
                  <option key={p._id} value={p._id}>{p.partName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Quantity *</label>
              <input type="number" placeholder="0" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="input-field" min="0" step="any" required />
            </div>
            <div>
              <label className="input-label">Rate (optional)</label>
              <input type="number" placeholder="0" value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} className="input-field" min="0" step="any" />
            </div>
            <div>
              <label className="input-label">Total amount</label>
              <input type="number" placeholder="0" value={form.totalAmount} onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))} className="input-field" min="0" step="1" />
            </div>
            <div>
              <label className="input-label">Amount received</label>
              <input type="number" placeholder="0" value={form.amountReceived} onChange={(e) => setForm((f) => ({ ...f, amountReceived: e.target.value }))} className="input-field" min="0" step="1" />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Account (jahan paisa aaya)</label>
              <select value={form.accountId} onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))} className="input-field">
                <option value="">—</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Notes</label>
              <input type="text" placeholder="Optional" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input-field" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">{editingId ? "Update" : "Add sale"}</button>
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })} onConfirm={handleDeleteConfirm} title="Sale delete karein?" message="Is sale ko delete karne se stock wapas add ho jayega. Continue?" confirmLabel="Haan, delete karein" />

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
          <button type="button" onClick={() => { const csv = buildCsv(list, [{ key: "date", label: "Date" }, { key: "customerId.name", label: "Customer" }, { key: "itemId.name", label: "Item" }, { key: "partName", label: "Part" }, { key: "quantity", label: "Quantity" }, { key: "amountReceived", label: "Amount Received" }, { key: "accountId.name", label: "Account" }, { key: "notes", label: "Notes" }]); downloadCsv(csv, "sales.csv"); }} className="btn-secondary flex items-center gap-1.5" disabled={list.length === 0}><FaFileExport className="w-4 h-4" /> Export CSV</button>
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
                    <th className="table-header px-5 py-3.5">Part</th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("quantity")} className="flex items-center hover:text-slate-800">Qty<SortIcon columnKey="quantity" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("amount")} className="flex items-center hover:text-slate-800">Received<SortIcon columnKey="amount" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      <td className="table-cell">{formatDate(row.date)}</td>
                      <td className="table-cell font-medium">{row.customerId?.name || "—"}</td>
                      <td className="table-cell">{row.itemId?.name || "—"}</td>
                      <td className="table-cell">{row.partName || "—"}</td>
                      <td className="table-cell">{row.quantity != null ? row.quantity : "—"}</td>
                      <td className="table-cell font-medium">{formatMoney(row.amountReceived)}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => handleEdit(row)} className="btn-ghost-primary flex items-center gap-1"><FaEdit className="w-3.5 h-3.5" /> Edit</button>
                          <button type="button" onClick={() => setDeleteConfirm({ open: true, id: row._id })} className="btn-ghost-danger flex items-center gap-1"><FaTrash className="w-3.5 h-3.5" /> Delete</button>
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
    </div>
  );
}
