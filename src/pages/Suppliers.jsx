import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiPost, apiPut, apiDelete } from "../config/api.js";
import { FaTruck, FaSearch, FaEdit, FaPlus, FaSort, FaSortUp, FaSortDown, FaHistory } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";

export default function Suppliers() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "", isAlsoCustomer: false, linkedCustomerId: "", createLinkedCustomer: false });
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params = search ? { search } : {};
      const res = await fetch(`${API_BASE_URL}/suppliers?${new URLSearchParams(params)}`);
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

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`);
      const data = await res.json();
      if (res.ok) setCustomers(data.data || []);
    } catch (_) { }
  };

  useEffect(() => { fetchList(); }, [search]);
  useEffect(() => { fetchCustomers(); }, []);

  const resetForm = () => { setForm({ name: "", phone: "", address: "", notes: "", isAlsoCustomer: false, linkedCustomerId: "", createLinkedCustomer: false }); setEditingId(null); setModalOpen(false); };
  const openAddModal = () => { resetForm(); setModalOpen(true); };

  const handleEdit = (row) => {
    setForm({
      name: row.name || "",
      phone: row.phone || "",
      address: row.address || "",
      notes: row.notes || "",
      isAlsoCustomer: !!row.isAlsoCustomer,
      linkedCustomerId: row.linkedCustomerId?._id || row.linkedCustomerId || "",
      createLinkedCustomer: false,
    });
    setEditingId(row._id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name zaroori hai"); return; }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: (form.phone || "").trim(),
        address: (form.address || "").trim(),
        notes: (form.notes || "").trim(),
        isAlsoCustomer: !!form.isAlsoCustomer,
        linkedCustomerId: form.isAlsoCustomer && form.linkedCustomerId ? form.linkedCustomerId : undefined,
        createLinkedCustomer: form.isAlsoCustomer && form.createLinkedCustomer ? true : undefined,
      };
      if (editingId) await apiPut(`/suppliers/${editingId}`, payload);
      else await apiPost("/suppliers", payload);
      resetForm();
      fetchList();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };


  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };
  const sortedList = useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
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

  const cols = [
    { key: "name", label: "Naam" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Pata" },
    { key: "notes", label: "Notes" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2"><FaTruck className="w-7 h-7 text-amber-500" /> Suppliers</h1>
          <p className="page-subtitle">Raw material dene walon ko manage karein.</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary"><FaPlus className="w-4 h-4" /> Add supplier</button>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title={editingId ? "Edit supplier" : "Naya supplier add karein"}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="input-label">Naam *</label><input type="text" placeholder="Supplier ka naam" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" required /></div>
          <div><label className="input-label">Phone</label><input type="text" placeholder="0321-9876543" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field" /></div>
          <div className="sm:col-span-2"><label className="input-label">Pata</label><input type="text" placeholder="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="input-field" /></div>
          <div className="sm:col-span-2"><label className="input-label">Notes</label><input type="text" placeholder="Optional notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input-field" /></div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" id="isAlsoCustomer" checked={form.isAlsoCustomer} onChange={(e) => setForm((f) => ({ ...f, isAlsoCustomer: e.target.checked, linkedCustomerId: e.target.checked ? f.linkedCustomerId : "", createLinkedCustomer: false }))} className="rounded border-slate-300" />
            <label htmlFor="isAlsoCustomer" className="text-sm font-medium text-slate-700">Ye customer bhi hai (hum inko bhi bechte hain)</label>
          </div>
          {form.isAlsoCustomer && (
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="createLinkedCustomer" checked={form.createLinkedCustomer} onChange={(e) => setForm((f) => ({ ...f, createLinkedCustomer: e.target.checked, linkedCustomerId: e.target.checked ? "" : f.linkedCustomerId }))} className="rounded border-slate-300" />
                <label htmlFor="createLinkedCustomer" className="text-sm">Naya customer bana ke link karein (same naam)</label>
              </div>
              {!form.createLinkedCustomer && (
                <div>
                  <label className="input-label">Existing customer select karein</label>
                  <select value={form.linkedCustomerId} onChange={(e) => setForm((f) => ({ ...f, linkedCustomerId: e.target.value }))} className="input-field">
                    <option value="">— Select —</option>
                    {customers.filter((c) => c._id !== editingId).map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (editingId ? "Update" : "Add supplier")}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary" disabled={submitting}>Cancel</button>
          </div>
        </form>
      </Modal>


      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input pl-9" />
          </div>
          <p className="text-sm text-slate-500">{list.length} supplier(s)</p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="empty-state"><div className="loading-spinner mb-3" /><p>Loading...</p></div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr>
                    {cols.map(({ key, label }) => (
                      <th key={key} className="table-header px-5 py-3.5">
                        <button type="button" onClick={() => toggleSort(key)} className="flex items-center hover:text-slate-800">{label}<SortIcon columnKey={key} /></button>
                      </th>
                    ))}
                    <th className="table-header px-5 py-3.5">Customer?</th>
                    <th className="table-header px-5 py-3.5 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      {cols.map(({ key }) => <td key={key} className="table-cell">{key === "name" ? <span className="font-medium">{row[key]}</span> : (row[key] || "—")}</td>)}
                      <td className="table-cell">{row.isAlsoCustomer ? (row.linkedCustomerId?.name ? `✓ ${row.linkedCustomerId.name}` : "✓ Linked") : "—"}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button type="button" onClick={() => navigate(`/suppliers/${row._id}/history`)} className="btn-ghost-primary flex items-center gap-1"><FaHistory className="w-3.5 h-3.5" /> History</button>
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
          {!loading && list.length === 0 && <div className="empty-state"><FaTruck className="w-12 h-12 text-slate-300 mb-2" /><p>Abhi koi supplier nahi. Add supplier button se add karein.</p></div>}
        </div>
      </section>

    </div>
  );
}
