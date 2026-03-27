import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiGet, apiPost, apiPut, apiDelete } from "../config/api.js";
import { downloadMachineryItemsPdf } from "../utils/exportPdf.js";
import { FaCogs, FaSearch, FaEdit, FaPlus, FaBook, FaSort, FaSortUp, FaSortDown, FaFilePdf } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";

export default function MachineryItems() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", categoryId: "", quality: "", description: "" });
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/machinery-items", { search: search || undefined });
      setList(data.data || []);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [search]);

  const resetForm = () => {
    setForm({ name: "", quality: "", description: "" });
    setEditingId(null);
    setModalOpen(false);
  };
  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Machinery item ka naam zaroori hai");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        quality: (form.quality || "").trim(),
        description: (form.description || "").trim(),
      };
      if (editingId) await apiPut(`/machinery-items/${editingId}`, payload);
      else await apiPost("/machinery-items", payload);
      resetForm();
      fetchList();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row) => {
    setForm({
      name: row.name || "",
      quality: row.quality || "",
      description: row.description || "",
    });
    setEditingId(row._id);
    setModalOpen(true);
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getCategoryName = (row) => row.categoryId?.name ?? (row.category ?? "—");

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
          <h1 className="page-title flex items-center gap-2">
            <FaCogs className="w-7 h-7 text-amber-500" /> Machinery Items
          </h1>
          <p className="page-subtitle">Machinery ka saman yahan manage karein — motor, parts, etc.</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary">
          <FaPlus className="w-4 h-4" /> Add Machine/Part
        </button>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title={editingId ? "Edit Item" : "Naya machinery item add karein"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Item Name *</label>
            <input type="text" placeholder="e.g. Grinder Motor, Belt" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="input-label">Model / Quality</label>
            <input type="text" placeholder="e.g. Premium, G5" value={form.quality} onChange={(e) => setForm((f) => ({ ...f, quality: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field" rows="2" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" onClick={resetForm} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : (editingId ? "Update" : "Add item")}
            </button>
          </div>
        </form>
      </Modal>

      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search machinery..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input pl-9" />
          </div>
          <p className="text-sm text-slate-500">{list.length} item(s)</p>
          <button type="button" onClick={() => downloadMachineryItemsPdf(sortedList)} className="btn-primary flex items-center gap-1.5" disabled={list.length === 0} title="Download PDF"><FaFilePdf className="w-4 h-4" /> Export PDF</button>
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
                      <button type="button" onClick={() => toggleSort("name")} className="flex items-center hover:text-slate-800">
                        Item <SortIcon columnKey="name" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">Model/Quality</th>
                    <th className="table-header px-5 py-3.5 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      <td className="table-cell font-medium">{row.name}</td>
                      <td className="table-cell">{row.quality || "—"}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button type="button" onClick={() => navigate(`/machinery-items/${row._id}/khata`)} className="btn-ghost-primary flex items-center gap-1">
                            <FaBook className="w-3.5 h-3.5" /> Khata
                          </button>
                          <button type="button" onClick={() => handleEdit(row)} className="btn-ghost-primary flex items-center gap-1">
                            <FaEdit className="w-3.5 h-3.5" /> Edit
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
        </div>
      </section>
    </div>
  );
}
