import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiPost, apiPut, apiDelete } from "../config/api.js";
import { FaBox, FaSearch, FaEdit, FaTrash, FaPlus, FaTimes, FaSort, FaSortUp, FaSortDown, FaBook } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import TablePagination from "../components/TablePagination.jsx";

export default function Items() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", parts: [{ partName: "" }] });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params = search ? { search } : {};
      const res = await fetch(`${API_BASE_URL}/items?${new URLSearchParams(params)}`);
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

  useEffect(() => { fetchList(); }, [search]);

  const resetForm = () => {
    setForm({ name: "", parts: [{ partName: "" }] });
    setEditingId(null);
    setModalOpen(false);
  };
  const openAddModal = () => { resetForm(); setModalOpen(true); };

  const addPartRow = () => setForm((f) => ({ ...f, parts: [...f.parts, { partName: "" }] }));
  const removePartRow = (index) => setForm((f) => ({ ...f, parts: f.parts.filter((_, i) => i !== index) }));
  const updatePart = (index, field, value) => setForm((f) => ({ ...f, parts: f.parts.map((p, i) => (i === index ? { ...p, [field]: value } : p)) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Item ka naam zaroori hai"); return; }
    const partsToSend = form.parts.filter((p) => (p.partName || "").trim());
    // Agar koi part nahi diya to item khud hi ek part ban jata hai (usi ka naam)
    const parts = partsToSend.length > 0
      ? partsToSend.map((p) => ({ partName: p.partName.trim() }))
      : [{ partName: form.name.trim() }];
    setError("");
    try {
      const payload = { name: form.name.trim(), parts };
      if (editingId) await apiPut(`/items/${editingId}`, payload);
      else await apiPost("/items", payload);
      resetForm();
      fetchList();
    } catch (e) { setError(e.message); }
  };

  const handleEdit = (row) => {
    setForm({
      name: row.name || "",
      parts: (row.parts && row.parts.length) ? row.parts.map((p) => ({ partName: p.partName || "" })) : [{ partName: "" }],
    });
    setEditingId(row._id);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;
    setError("");
    try {
      await apiDelete(`/items/${deleteConfirm.id}`);
      if (editingId === deleteConfirm.id) resetForm();
      fetchList();
    } catch (e) { setError(e.message); }
    setDeleteConfirm({ open: false, id: null });
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

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2"><FaBox className="w-7 h-7 text-amber-500" /> Items (Saman) — Hisse ke sath</h1>
          <p className="page-subtitle">Item aur uske parts define karein.</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary"><FaPlus className="w-4 h-4" /> Add item</button>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title={editingId ? "Edit item" : "Naya item add karein"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Item ka naam *</label>
            <input type="text" placeholder="e.g. Channa, Gehu" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label mb-0">Hisse (Parts)</label>
              <button type="button" onClick={addPartRow} className="btn-secondary text-sm py-2"><FaPlus className="w-3.5 h-3.5 mr-1" /> Add part</button>
            </div>
            <div className="space-y-2">
              {form.parts.map((p, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input type="text" placeholder="Part naam (e.g. Channa daal)" value={p.partName} onChange={(e) => updatePart(index, "partName", e.target.value)} className="input-field flex-1" />
                  <button type="button" onClick={() => removePartRow(index)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Remove"><FaTimes className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">{editingId ? "Update" : "Add item"}</button>
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })} onConfirm={handleDeleteConfirm} title="Item delete karein?" message="Is item ko delete karne se data hamesha ke liye chala jayega. Continue?" confirmLabel="Haan, delete karein" />

      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by item name..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input pl-9" />
          </div>
          <p className="text-sm text-slate-500">{list.length} item(s)</p>
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
                      <button type="button" onClick={() => toggleSort("name")} className="flex items-center hover:text-slate-800">Item<SortIcon columnKey="name" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">Hisse (Parts)</th>
                    <th className="table-header px-5 py-3.5 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      <td className="table-cell font-medium">{row.name}</td>
                      <td className="table-cell text-slate-600">
                        {row.parts && row.parts.length ? row.parts.map((p) => p.partName).join(", ") : "—"}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button type="button" onClick={() => navigate(`/items/${row._id}/khata`)} className="btn-ghost-primary flex items-center gap-1"><FaBook className="w-3.5 h-3.5" /> Khata</button>
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
          {!loading && list.length === 0 && <div className="empty-state"><FaBox className="w-12 h-12 text-slate-300 mb-2" /><p>Abhi koi item nahi. Add item button se add karein.</p></div>}
        </div>
      </section>
    </div>
  );
}
