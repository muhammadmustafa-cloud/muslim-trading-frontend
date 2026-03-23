import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../config/api.js";
import { FaBalanceScale, FaPlus, FaTrash, FaHistory } from "react-icons/fa";
import Modal from "../components/Modal.jsx";

export default function TaxTypes() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/tax-types");
      setList(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiPost("/tax-types", form);
      setForm({ name: "", description: "" });
      setModalOpen(false);
      fetchList();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will only work if no payments are recorded for this tax type.")) return;
    try {
      await apiDelete(`/tax-types/${id}`);
      fetchList();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-600">
            <FaBalanceScale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tax Types</h1>
            <p className="text-slate-500 text-sm">Manage dynamic taxes like Income Tax, Social Security, etc.</p>
          </div>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <FaPlus className="w-4 h-4" /> Add Tax Type
        </button>
      </header>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-10 text-center text-slate-500">
            <div className="loading-spinner mb-3 mx-auto" />
            <p>Loading tax types...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="col-span-full p-10 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-500">
            <FaBalanceScale className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium text-slate-700">No Tax Types found</p>
            <p className="text-sm">Click the button above to add your first tax type (e.g., Income Tax).</p>
          </div>
        ) : (
          list.map((t) => (
            <div key={t._id} className="card p-5 group hover:border-orange-200 transition-all flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-orange-600 transition-colors uppercase">{t.name}</h3>
                <p className="text-slate-500 text-sm mt-1 mb-4 leading-relaxed line-clamp-2">{t.description || "No description provided."}</p>
              </div>
              <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-2">
                <Link to={`/tax-types/${t._id}/ledger`} className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1.5 py-2 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200">
                  <FaHistory className="w-3 h-3" /> View Ledger
                </Link>
                <button onClick={() => handleDelete(t._id)} className="w-10 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
                  <FaTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Tax Type">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Tax Name (e.g. Income Tax) *</label>
            <input 
              type="text" 
              required 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              className="input-field" 
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="input-label">Description (optional)</label>
            <textarea 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
              className="input-field min-h-[100px]" 
              placeholder="Purpose of this tax..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? "Saving..." : "Create Tax Type"}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
