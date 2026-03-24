import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { FaHandHoldingUsd, FaFileInvoiceDollar, FaChevronRight, FaHistory, FaCheckCircle, FaExclamationCircle, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import CollectPaymentModal from "../components/CollectPaymentModal";

const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function CustomerReceivables() {
    const [receivables, setReceivables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [collectModalOpen, setCollectModalOpen] = useState(false);
    const [expandedCustomer, setExpandedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchReceivables = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/customers/receivables`);
            const data = await res.json();
            if (res.ok) setReceivables(data.data || []);
            else throw new Error(data.message || "Failed to fetch receivables");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceivables();
    }, []);

    const handleCollectionSuccess = () => {
        fetchReceivables();
    };

    const openCollectModal = (entry) => {
        setSelectedEntry(entry);
        setCollectModalOpen(true);
    };

    if (loading) return <div className="empty-state"><div className="loading-spinner" /></div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="page-title flex items-center gap-2">
                    <FaHandHoldingUsd className="text-blue-600" />
                    Customer Receivables (Wasooliyan)
                </h1>
                <p className="page-subtitle">Saare customers jin se paise lena baqi hain, grouped by customer.</p>
            </header>

            {error && <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">{error}</div>}

            <div className="relative max-w-md">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search customer by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10 h-11"
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {receivables.filter(c => c.customerName.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                    <div className="card p-12 text-center text-slate-500">
                        <FaCheckCircle className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                        <p className="font-medium text-lg text-slate-700">Koi outstanding receivables nahi hain!</p>
                        <p className="text-sm">Abhi saari bechai ki raqam wasool ho chuki hai ya aapki search ka koi result nahi.</p>
                    </div>
                ) : (
                    receivables
                        .filter(c => c.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((customer) => (
                        <div key={customer.customerId} className="card overflow-hidden">
                            {/* Customer Summary Row */}
                            <div
                                className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setExpandedCustomer(expandedCustomer === customer.customerId ? null : customer.customerId)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${expandedCustomer === customer.customerId ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                        <FaFileInvoiceDollar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{customer.customerName}</h3>
                                        <p className="text-sm text-slate-500">{customer.pendingBillsCount} pending sale(s)</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 text-right">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Receivable</p>
                                        <p className="text-xl font-black text-blue-600">Rs. {formatMoney(customer.totalRemaining)}</p>
                                    </div>
                                    <FaChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${expandedCustomer === customer.customerId ? 'rotate-90' : ''}`} />
                                </div>
                            </div>

                            {/* Collapsible Details */}
                            {expandedCustomer === customer.customerId && (
                                <div className="border-t border-slate-100 bg-slate-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="mb-3 flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">Sale Wise Details</span>
                                        <Link to={`/customers/${customer.customerId}/history`} className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline">
                                            <FaHistory /> View History
                                        </Link>
                                    </div>

                                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-100 text-slate-600">
                                                    <th className="px-3 py-2 text-left">Date</th>
                                                    <th className="px-3 py-2 text-left">Sale ID</th>
                                                    <th className="px-3 py-2 text-left">Item</th>
                                                    <th className="px-3 py-2 text-right">Total</th>
                                                    <th className="px-3 py-2 text-right">Received</th>
                                                    <th className="px-3 py-2 text-right text-blue-600">Baqaya</th>
                                                    <th className="px-3 py-2 text-center">Due Date</th>
                                                    <th className="px-3 py-2 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customer.bills.map((bill) => {
                                                    const rem = bill.totalAmount - (bill.amountReceived || 0);
                                                    const isOverdue = bill.dueDate && new Date(bill.dueDate) < new Date();
                                                    return (
                                                        <tr key={bill._id} className="border-t border-slate-100 hover:bg-blue-50/30">
                                                            <td className="px-3 py-3 whitespace-nowrap">{formatDate(bill.date)}</td>
                                                            <td className="px-3 py-3 font-mono text-xs">{bill._id.slice(-6).toUpperCase()}</td>
                                                            <td className="px-3 py-3">{bill.itemId?.name || '—'}</td>
                                                            <td className="px-3 py-3 text-right">{formatMoney(bill.totalAmount)}</td>
                                                            <td className="px-3 py-3 text-right text-emerald-600 font-medium">{formatMoney(bill.amountReceived)}</td>
                                                            <td className="px-3 py-3 text-right font-bold text-blue-600">{formatMoney(rem)}</td>
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
                                                                    onClick={() => openCollectModal({ ...bill, customerId: customer.customerId })}
                                                                    className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 shadow-sm"
                                                                >
                                                                    Collect
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

            <CollectPaymentModal
                open={collectModalOpen}
                onClose={() => setCollectModalOpen(false)}
                entry={selectedEntry}
                onSuccess={handleCollectionSuccess}
            />
        </div>
    );
}
