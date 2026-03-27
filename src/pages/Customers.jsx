import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiGet, apiPost, apiPut, apiDelete } from "../config/api.js";
import { FaUsers, FaSearch, FaEdit, FaPlus, FaSort, FaSortUp, FaSortDown, FaHistory } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";

export default function Customers() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "", isAlsoSupplier: false, linkedSupplierId: "", createLinkedSupplier: false });
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params = search ? { search } : {};
      const data = await apiGet("/customers", params);
      setList(data.data || []);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await apiGet("/suppliers");
      setSuppliers(data.data || []);
    } catch (_) { }
  };

  useEffect(() => {
    fetchList();
  }, [search]);
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const resetForm = () => {
    setForm({ name: "", phone: "", address: "", notes: "", isAlsoSupplier: false, linkedSupplierId: "", createLinkedSupplier: false });
    setEditingId(null);
    setModalOpen(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setForm({
      name: row.name || "",
      phone: row.phone || "",
      address: row.address || "",
      notes: row.notes || "",
      isAlsoSupplier: !!row.isAlsoSupplier,
      linkedSupplierId: row.linkedSupplierId?._id || row.linkedSupplierId || "",
      createLinkedSupplier: false,
    });
    setEditingId(row._id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name zaroori hai");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: (form.phone || "").trim(),
        address: (form.address || "").trim(),
        notes: (form.notes || "").trim(),
        isAlsoSupplier: !!form.isAlsoSupplier,
        linkedSupplierId: form.isAlsoSupplier && form.linkedSupplierId ? form.linkedSupplierId : undefined,
        createLinkedSupplier: form.isAlsoSupplier && form.createLinkedSupplier ? true : undefined,
      };
      if (editingId) {
        await apiPut(`/customers/${editingId}`, payload);
      } else {
        await apiPost("/customers", payload);
      }
      resetForm();
      fetchList();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };


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
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
      const cmp = va.localeCompare(vb);
      return sortDir === "asc" ? cmp : -cmp;
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

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaUsers className="w-7 h-7 text-amber-500" />
            Customers (Gahak)
          </h1>
          <p className="page-subtitle">Add, edit aur list manage karein.</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary">
          <FaPlus className="w-4 h-4" /> Add customer
        </button>
      </header>

      <Modal
        open={modalOpen}
        onClose={resetForm}
        title={editingId ? "Edit customer" : "Naya customer add karein"}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Naam *</label>
            <input type="text" placeholder="Customer ka naam" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="input-label">Phone</label>
            <input type="text" placeholder="0300-1234567" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="input-label">Pata</label>
            <input type="text" placeholder="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="input-label">Notes</label>
            <input type="text" placeholder="Optional notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input-field" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" id="isAlsoSupplier" checked={form.isAlsoSupplier} onChange={(e) => setForm((f) => ({ ...f, isAlsoSupplier: e.target.checked, linkedSupplierId: e.target.checked ? f.linkedSupplierId : "", createLinkedSupplier: false }))} className="rounded border-slate-300" />
            <label htmlFor="isAlsoSupplier" className="text-sm font-medium text-slate-700">Ye supplier bhi hai (hum inse bhi khareedte hain)</label>
          </div>
          {form.isAlsoSupplier && (
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="createLinkedSupplier" checked={form.createLinkedSupplier} onChange={(e) => setForm((f) => ({ ...f, createLinkedSupplier: e.target.checked, linkedSupplierId: e.target.checked ? "" : f.linkedSupplierId }))} className="rounded border-slate-300" />
                <label htmlFor="createLinkedSupplier" className="text-sm">Naya supplier bana ke link karein (same naam)</label>
              </div>
              {!form.createLinkedSupplier && (
                <div>
                  <label className="input-label">Existing supplier select karein</label>
                  <select value={form.linkedSupplierId} onChange={(e) => setForm((f) => ({ ...f, linkedSupplierId: e.target.value }))} className="input-field">
                    <option value="">— Select —</option>
                    {suppliers.filter((s) => s._id !== editingId).map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
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
              ) : (editingId ? "Update" : "Add customer")}
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
          <p className="text-sm text-slate-500">{list.length} customer(s)</p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="empty-state"><div className="loading-spinner mb-3" /><p>Loading...</p></div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr>
                    {["name", "phone", "address", "notes"].map((key) => (
                      <th key={key} className="table-header px-5 py-3.5">
                        <button type="button" onClick={() => toggleSort(key)} className="flex items-center hover:text-slate-800">
                          {key === "name" ? "Naam" : key === "phone" ? "Phone" : key === "address" ? "Pata" : "Notes"}
                          <SortIcon columnKey={key} />
                        </button>
                      </th>
                    ))}
                    <th className="table-header px-5 py-3.5">Supplier?</th>
                    <th className="table-header px-5 py-3.5 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      <td className="table-cell font-medium">{row.name}</td>
                      <td className="table-cell">{row.phone || "—"}</td>
                      <td className="table-cell">{row.address || "—"}</td>
                      <td className="table-cell">{row.notes || "—"}</td>
                      <td className="table-cell">{row.isAlsoSupplier ? (row.linkedSupplierId?.name ? `✓ ${row.linkedSupplierId.name}` : "✓ Linked") : "—"}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button type="button" onClick={() => navigate(`/customers/${row._id}/history`)} className="btn-ghost-primary flex items-center gap-1"><FaHistory className="w-3.5 h-3.5" /> History</button>
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
              <FaUsers className="w-12 h-12 text-slate-300 mb-2" />
              <p>Abhi koi customer nahi. Add customer button se add karein.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
