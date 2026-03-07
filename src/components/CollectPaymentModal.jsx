import { useState, useEffect } from 'react';
import { API_BASE_URL, apiPost } from '../config/api';
import Modal from './Modal';
import { FaMoneyBillWave, FaExclamationCircle } from 'react-icons/fa';

/**
 * CollectPaymentModal - Records payment collection against a specific Sale.
 * @param {Object} entry - The Sale object to collect payment for.
 * @param {boolean} open - Modal open state.
 * @param {Function} onClose - Close callback.
 * @param {Function} onSuccess - Success callback after collection.
 */
export default function CollectPaymentModal({ entry, open, onClose, onSuccess }) {
    const [amount, setAmount] = useState('');
    const [accountId, setAccountId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            fetchAccounts();
            const remaining = entry?.totalAmount - (entry?.amountReceived || 0);
            setAmount(remaining > 0 ? remaining : '');
            setNote(`Collection for Sale: ${entry?.itemId?.name || ''} | Date: ${new Date(entry?.date).toLocaleDateString()}`);
            setError('');
        }
    }, [open, entry]);

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/accounts`);
            const data = await res.json();
            if (res.ok) setAccounts(data.data || []);
        } catch (err) {
            console.error('Failed to fetch accounts');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!accountId) {
            setError('Pehle account select karein.');
            return;
        }
        const payAmt = Number(amount);
        const balance = entry.totalAmount - (entry.amountReceived || 0);

        if (isNaN(payAmt) || payAmt <= 0) {
            setError('Sahi amount likhein.');
            return;
        }
        if (payAmt > balance) {
            setError(`Amount balance (${balance.toLocaleString()}) se zyada nahi ho sakti.`);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await apiPost(`/sales/${entry._id}/collect-payment`, {
                amount: payAmt,
                accountId,
                date,
                note
            });
            onSuccess(response.data);
            onClose();
        } catch (err) {
            setError(err.message || 'Collection failed');
        } finally {
            setLoading(false);
        }
    };

    if (!entry) return null;

    const remaining = entry.totalAmount - (entry.amountReceived || 0);

    return (
        <Modal open={open} onClose={onClose} title="Collect Payment (Raqam Wasool Karein)">
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Sale Reference</span>
                    <span className="text-xs font-bold text-slate-700">ID: {entry._id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-slate-500">Item:</p><p className="font-semibold">{entry.itemId?.name}</p></div>
                    <div><p className="text-slate-500">Date:</p><p className="font-semibold">{new Date(entry.date).toLocaleDateString()}</p></div>
                    <div><p className="text-slate-500">Total:</p><p className="font-semibold text-slate-900">{entry.totalAmount.toLocaleString()}</p></div>
                    <div><p className="text-slate-500">Remaining:</p><p className="font-bold text-emerald-600">{remaining.toLocaleString()}</p></div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="input-label">Date *</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" required />
                </div>

                <div>
                    <label className="input-label">Account (Paise kahan aayenge?) *</label>
                    <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input-field" required>
                        <option value="">Select Account</option>
                        {accounts.map((a) => (
                            <option key={a._id} value={a._id}>{a.name} (Balance: {a.currentBalance?.toLocaleString()})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="input-label">Collection Amount *</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rs.</span>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field pl-10 text-lg font-bold text-emerald-700" placeholder="0" required />
                    </div>
                </div>

                <div>
                    <label className="input-label">Audit Note</label>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input-field min-h-[80px]" placeholder="Add details..." />
                </div>

                {error && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-600 text-sm">
                        <FaExclamationCircle className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 text-lg flex items-center justify-center gap-2">
                        <FaMoneyBillWave /> {loading ? 'Processing...' : 'Collect Payment'}
                    </button>
                    <button type="button" onClick={onClose} className="btn-secondary px-6">Cancel</button>
                </div>
            </form>
        </Modal>
    );
}
