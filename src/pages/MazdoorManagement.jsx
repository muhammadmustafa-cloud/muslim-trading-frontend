import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPut, apiDelete } from "../config/api.js";
import {
  FaClipboardList,
  FaMoneyBillWave,
  FaBox,
  FaEdit,
  FaPlus,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";

const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));

export default function MazdoorManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", rate: "" });
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchItems = async () => {
    setItemsLoading(true);
    setError("");
    try {
      const data = await apiGet("/mazdoor-items", { search: search || undefined });
      setItems(data.data || []);
    } catch (e) {
      setError(e.message);
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search]);

  const resetForm = () => {
    setForm({ name: "", rate: "" });
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
      rate: row.rate ?? "",
    });
    setEditingId(row._id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Item ka naam zaroori hai");
      return;
    }
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        rate: Number(form.rate) || 0,
      };
      if (editingId) await apiPut(`/mazdoor-items/${editingId}`, payload);
      else await apiPost("/mazdoor-items", payload);
      resetForm();
      fetchItems();
    } catch (e) {
      setError(e.message);
    }
  };


  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedItems = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      if (sortKey === "rate") {
        const va = Number(a.rate) || 0;
        const vb = Number(b.rate) || 0;
        return sortDir === "asc" ? va - vb : vb - va;
      }
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : -va.localeCompare(vb);
    });
    return arr;
  }, [items, sortKey, sortDir]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, page, pageSize]);

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) return <FaSort className="w-3.5 h-3.5 ml-1 opacity-50" />;
    return sortDir === "asc" ? <FaSortUp className="w-3.5 h-3.5 ml-1" /> : <FaSortDown className="w-3.5 h-3.5 ml-1" />;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaClipboardList className="w-7 h-7 text-amber-500" />
            Mazdoor Management
          </h1>
          <p className="page-subtitle">Items & rates manage karein.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/mazdoor/expenses")}
          className="btn-primary flex items-center gap-2"
        >
          <FaMoneyBillWave className="w-5 h-5" /> Mazdoor Expenses
        </button>
      </header>

      {error && (
        <div className="card p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>
      )}

      {/* Items & Rates */}
      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <FaBox className="w-5 h-5 text-amber-500" />
              Items & Rates
            </h2>
            <div className="relative min-w-[200px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input pl-9"
              />
            </div>
            <p className="text-sm text-slate-500">{items.length} item(s)</p>
          </div>
          <button type="button" onClick={openAddModal} className="btn-primary">
            <FaPlus className="w-4 h-4" /> Add item
          </button>
        </div>

        <Modal
          open={modalOpen}
          onClose={resetForm}
          title={editingId ? "Edit item" : "Naya item add karein (naam + rate)"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Item ka naam *</label>
              <input
                type="text"
                placeholder="e.g. Cutting, Loading"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label">Rate</label>
              <input
                type="number"
                placeholder="0"
                value={form.rate}
                onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                className="input-field"
                min="0"
                step="0.01"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingId ? "Update" : "Add item"}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </Modal>


        <div className="overflow-x-auto">
          {itemsLoading ? (
            <div className="empty-state">
              <div className="loading-spinner mb-3" />
              <p>Loading...</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleSort("name")}
                        className="flex items-center hover:text-slate-800"
                      >
                        Item name
                        <SortIcon columnKey="name" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleSort("rate")}
                        className="flex items-center hover:text-slate-800"
                      >
                        Rate
                        <SortIcon columnKey="rate" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5 w-36">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      <td className="table-cell font-medium">{row.name}</td>
                      <td className="table-cell font-semibold text-slate-800">{formatMoney(row.rate)}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(row)}
                            className="btn-ghost-primary flex items-center gap-1"
                          >
                            <FaEdit className="w-3.5 h-3.5" /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
                totalItems={sortedItems.length}
              />
            </>
          )}
          {!itemsLoading && items.length === 0 && (
            <div className="empty-state py-8">
              <FaBox className="w-12 h-12 text-slate-300 mb-2" />
              <p>Abhi koi item nahi. Add item button se item naam aur rate add karein.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
