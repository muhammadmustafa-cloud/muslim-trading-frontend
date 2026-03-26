import { useState, useEffect } from "react";
import { API_BASE_URL, apiPost, apiPostFormData } from "../config/api.js";
import { FaIndustry, FaPlus, FaCalendarDay, FaFilePdf, FaImage } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import ImagePreviewModal from "../components/ImagePreviewModal.jsx";
import { downloadMillKhataPdf } from "../utils/millKhataPdf.js";

const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const getToday = () => new Date().toISOString().slice(0, 10);

export default function MillKhata() {
  const today = getToday();
  const [filters, setFilters] = useState({ dateFrom: today, dateTo: today });
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({ total: 0, accountBalance: 0 });
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ date: today, amount: "", category: "", note: "", image: null });
  const [previewImage, setPreviewImage] = useState(null);

  const fetchDaybook = async (dateFrom, dateTo) => {
    setLoading(true);
    setError("");
    try {
      const params = { limit: 1000 };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await fetch(`${API_BASE_URL}/mill-expenses?${new URLSearchParams(params)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch daybook");
      setList(data.data || []);
      setSummary(data.summary || { total: 0, accountBalance: 0 });
      setAccount(data.account || null);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaybook(filters.dateFrom, filters.dateTo);
  }, [filters.dateFrom, filters.dateTo]);

  const handleOpenAdd = () => {
    setForm({ date: filters.dateTo || today, amount: "", category: "", note: "", image: null });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const amt = Number(form.amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Valid amount daalein.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        date: form.date,
        amount: amt,
        category: (form.category || "").trim(),
        note: (form.note || "").trim(),
      };

      const formData = new FormData();
      Object.keys(payload).forEach(key => formData.append(key, payload[key]));
      if (form.image) {
        formData.append("image", form.image);
      }

      await apiPostFormData("/mill-expenses", formData);
      setModalOpen(false);
      fetchDaybook(filters.dateFrom, filters.dateTo);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };


  const handleDownloadPdf = () => {
    downloadMillKhataPdf(filters.dateFrom, filters.dateTo, list, summary);
  };

  // Group by date
  const groupedList = list.reduce((acc, curr) => {
    const d = curr.date.slice(0, 10);
    if (!acc[d]) acc[d] = [];
    acc[d].push(curr);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedList).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <FaIndustry className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Mill Khata <span className="text-violet-600 font-light hidden sm:inline">| Register</span></h1>
            <p className="text-slate-500 text-sm">Har din ka mukammal hisab kitam</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleDownloadPdf} disabled={list.length === 0} className="btn-secondary flex items-center gap-2">
            <FaFilePdf className="text-red-500" /> <span className="hidden sm:inline">Download</span> PDF
          </button>
          <button type="button" onClick={handleOpenAdd} className="btn-primary">
            <FaPlus className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Add Entry</span>
          </button>
        </div>
      </header>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

      {/* Account Info Bar */}
      {account && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-wrap items-center justify-between">
          <div className="p-4 border-r border-slate-100 bg-slate-50 flex-1 min-w-[200px]">
            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Account Active</p>
            <p className="font-semibold text-slate-800">{account.name}</p>
          </div>
          <div className="p-4 flex-1 min-w-[200px]">
            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Current Balance</p>
            <p className="text-xl font-bold text-violet-700">Rs. {formatMoney(summary.accountBalance)}</p>
          </div>
        </div>
      )}

      {/* Date Filter Bar */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-3 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Start Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">End Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setFilters({ dateFrom: today, dateTo: today })}
            className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
          >
            Today Only
          </button>
        </div>
      </div>

      {/* Daybook Ledger */}
      <section className="card overflow-hidden border-t-4 border-t-violet-500">
        <div className="bg-slate-50/80 px-4 py-3 border-b flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-bold text-slate-700">
            Records {filters.dateFrom && filters.dateTo ? `from ${formatDate(filters.dateFrom)} to ${formatDate(filters.dateTo)}` : ""}
          </h2>
          <div className="text-right flex items-center gap-4">
            <div>
              <p className="text-xs uppercase text-slate-500 font-bold">Days Found</p>
              <p className="text-sm font-bold text-slate-700">{sortedDates.length} Days</p>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div>
              <p className="text-xs uppercase text-slate-500 font-bold">Total Expenses</p>
              <p className="text-lg font-black text-rose-600">Rs. {formatMoney(summary.total)}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><div className="loading-spinner text-violet-600" /></div>
        ) : list.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <FaCalendarDay className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-600 mb-1">No expenses found</p>
            <p className="text-sm">Is date range mein koi mill entry nahi hui.</p>
          </div>
        ) : (
          <div>
            {sortedDates.map((dateKey) => {
              const dayItems = groupedList[dateKey];
              const dailyTotal = dayItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

              return (
                <div key={dateKey} className="mb-4">
                  <div className="bg-white border-y border-slate-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-2">
                      <FaCalendarDay className="text-violet-500 w-4 h-4" />
                      <span className="font-bold text-slate-800">{formatDate(dateKey)}</span>
                    </div>
                    <span className="font-black text-violet-700">Rs. {formatMoney(dailyTotal)}</span>
                  </div>

                  <div className="overflow-x-auto bg-slate-50/30">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-left text-xs uppercase tracking-wider">
                          <th className="px-6 py-3 font-semibold w-1/5">Category</th>
                          <th className="px-6 py-3 font-semibold w-2/5">Note / Description</th>
                          <th className="px-6 py-3 font-semibold w-1/5 text-center">Receipt</th>
                          <th className="px-6 py-3 font-semibold text-right w-1/5">Amount (Rs)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dayItems.map((row) => (
                          <tr key={row._id} className="hover:bg-white transition-colors group">
                            <td className="py-3 px-6 text-slate-700 font-medium">{row.category || "—"}</td>
                            <td className="py-3 px-6 text-slate-500">{row.note || "—"}</td>
                            <td className="py-3 px-6 text-center">
                              {row.image && (
                                <button type="button" onClick={() => setPreviewImage(row.image)} className="btn-ghost-primary inline-flex items-center justify-center p-2 rounded-full text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors" title="Preview Receipt">
                                  <FaImage className="w-4 h-4" /> 
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-6 text-right font-bold text-slate-800">{formatMoney(row.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Mill Expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="input-label">Date *</label><input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input-field" required /></div>
          <div><label className="input-label">Amount (Rs.) *</label><input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input-field text-lg font-bold" required min="0" step="1" placeholder="0" autoFocus /></div>
          <div><label className="input-label">Category</label><input type="text" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field" placeholder="e.g. Rent, Bijli, Maintenance, Chai" /></div>
          <div><label className="input-label">Note / Description</label><textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="input-field min-h-[60px]" placeholder="Add specific details..." /></div>
          <div>
            <label className="input-label flex items-center gap-2"><FaImage className="text-slate-400" /> Upload Image / Receipt (Max 5MB)</label>
            <input type="file" accept="image/jpeg, image/png, image/jpg, image/webp" onChange={(e) => {
              const file = e.target.files[0];
              if (file && file.size > 5 * 1024 * 1024) {
                alert("File size exceeds 5MB limit. Please choose a smaller image.");
                e.target.value = "";
                return;
              }
              setForm(f => ({ ...f, image: file }));
            }} className="input-field cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            {form.image && (
              <div className="mt-3 bg-slate-50 p-2 rounded border border-slate-200 text-center">
                <p className="text-xs text-slate-500 font-medium mb-2">Selected File Preview:</p>
                <img src={URL.createObjectURL(form.image)} alt="Preview" className="max-h-24 object-contain mx-auto rounded shadow-sm" />
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? (
                 <span className="flex items-center justify-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Saving...
                 </span>
              ) : "Save Expense"}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary px-6" disabled={submitting}>Cancel</button>
          </div>
        </form>
      </Modal>

      <ImagePreviewModal
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage}
        title="Mill Expense Receipt"
      />
    </div>
  );
}
