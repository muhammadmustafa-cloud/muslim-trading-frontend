import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { FaHandHoldingUsd, FaFileInvoiceDollar, FaChevronRight, FaHistory, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import PayBillModal from "../components/PayBillModal";

const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function SupplierPayables() {
    const [payables, setPayables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [expandedSupplier, setExpandedSupplier] = useState(null);

    const fetchPayables = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/suppliers/payables`);
            const data = await res.json();
            if (res.ok) setPayables(data.data || []);
            else throw new Error(data.message || "Failed to fetch payables");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayables();
    }, []);

    const handlePaymentSuccess = () => {
        fetchPayables(); // Refresh the list
        // You could show a toast here if you have a toast system
    };

    const openPayModal = (entry) => {
        setSelectedEntry(entry);
        setPayModalOpen(true);
    };

    if (loading) return <div className="empty-state"><div className="loading-spinner" /></div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="page-title flex items-center gap-2">
                    <FaHandHoldingUsd className="text-emerald-600" />
                    Supplier Payables (Baqaya Adaiygi)
                </h1>
                <p className="page-subtitle">Saare suppliers jin ke paise dena baqi hain, grouped by supplier.</p>
            </header>

            {error && <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">{error}</div>}

            <div className="grid grid-cols-1 gap-4">
                {payables.length === 0 ? (
                    <div className="card p-12 text-center text-slate-500">
                        <FaCheckCircle className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                        <p className="font-medium text-lg text-slate-700">Koi outstanding payments nahi hain!</p>
                        <p className="text-sm">Abhi saare bill clear hain.</p>
                    </div>
                ) : (
                    payables.map((supplier) => (
                        <div key={supplier.supplierId} className="card overflow-hidden">
                            {/* Supplier Summary Row */}
                            <div
                                className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setExpandedSupplier(expandedSupplier === supplier.supplierId ? null : supplier.supplierId)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${expandedSupplier === supplier.supplierId ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        <FaFileInvoiceDollar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{supplier.supplierName}</h3>
                                        <p className="text-sm text-slate-500">{supplier.pendingBillsCount} pending bill(s)</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 text-right">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Remaining</p>
                                        <p className="text-xl font-black text-red-600">Rs. {formatMoney(supplier.totalRemaining)}</p>
                                    </div>
                                    <FaChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${expandedSupplier === supplier.supplierId ? 'rotate-90' : ''}`} />
                                </div>
                            </div>

                            {/* Collapsible Details */}
                            {expandedSupplier === supplier.supplierId && (
                                <div className="border-t border-slate-100 bg-slate-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="mb-3 flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">Bill Wise Details</span>
                                        <Link to={`/suppliers/${supplier.supplierId}/history`} className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:underline">
                                            <FaHistory /> View Ledger/History
                                        </Link>
                                    </div>

                                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-100 text-slate-600">
                                                    <th className="px-3 py-2 text-left">Date</th>
                                                    <th className="px-3 py-2 text-left">Bill ID</th>
                                                    <th className="px-3 py-2 text-right">Total</th>
                                                    <th className="px-3 py-2 text-right">Paid</th>
                                                    <th className="px-3 py-2 text-right text-red-600">Baqaya</th>
                                                    <th className="px-3 py-2 text-center">Due Date</th>
                                                    <th className="px-3 py-2 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {supplier.bills.map((bill) => {
                                                    const rem = bill.amount - (bill.amountPaid || 0);
                                                    const isOverdue = bill.dueDate && new Date(bill.dueDate) < new Date();
                                                    return (
                                                        <tr key={bill._id} className="border-t border-slate-100 hover:bg-emerald-50/30">
                                                            <td className="px-3 py-3 whitespace-nowrap">{formatDate(bill.date)}</td>
                                                            <td className="px-3 py-3 font-mono text-xs">{bill._id.slice(-6).toUpperCase()}</td>
                                                            <td className="px-3 py-3 text-right">{formatMoney(bill.amount)}</td>
                                                            <td className="px-3 py-3 text-right text-emerald-600 font-medium">{formatMoney(bill.amountPaid)}</td>
                                                            <td className="px-3 py-3 text-right font-bold text-red-600">{formatMoney(rem)}</td>
                                                            <td className="px-3 py-3 text-center">
                                                                {bill.dueDate ? (
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                        {isOverdue && <FaExclamationCircle className="inline mr-1" />}
                                                                        {formatDate(bill.dueDate)}
                                                                    </span>
                                                                ) : "—"}
                                                            </td>
                                                            <td className="px-3 py-3 text-right">
                                                                <button
                                                                    onClick={() => openPayModal({ ...bill, supplierId: supplier.supplierId })}
                                                                    className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 shadow-sm"
                                                                >
                                                                    Pay Bill
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <PayBillModal
                open={payModalOpen}
                onClose={() => setPayModalOpen(false)}
                entry={selectedEntry}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}
