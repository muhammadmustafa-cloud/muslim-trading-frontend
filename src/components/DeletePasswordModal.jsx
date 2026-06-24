import { useState, useEffect, useRef } from "react";
import { FaTrash, FaLock, FaExclamationTriangle, FaTimes } from "react-icons/fa";

const DELETE_PASSWORD = "infinix@001";

/**
 * DeletePasswordModal
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onConfirm: () => void   — called only when password is correct
 *  - title: string           — e.g. "Delete Item"
 *  - message: string         — e.g. "Kya aap waqai yeh record delete karna chahte hain?"
 */
export default function DeletePasswordModal({
  open,
  onClose,
  onConfirm,
  title = "Delete Confirm Karen",
  message = "Kya aap waqai yeh record delete karna chahte hain?",
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef(null);

  /* Reset state whenever modal opens */
  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (password === DELETE_PASSWORD) {
      setError("");
      onConfirm();
      onClose();
    } else {
      setError("Galat password! Delete nahi ho sakta.");
      setShakeKey((k) => k + 1);
      setPassword("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Card */}
      <div
        key={shakeKey === 0 ? "static" : `shake-${shakeKey}`}
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
        style={{ animation: shakeKey > 0 ? "dpm-shake 0.5s ease" : undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Red top gradient strip */}
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#ef4444,#f43f5e,#dc2626)" }} />

        {/* Header */}
        <div className="flex items-start gap-3 p-5 pb-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
            <FaExclamationTriangle className="text-red-600" style={{ width: 18, height: 18 }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <FaTimes style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-slate-100" />

        {/* Password Section */}
        <div className="p-5 pt-4 space-y-3">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            <FaLock style={{ width: 11, height: 11 }} />
            Delete Password
          </label>

          <div className="relative">
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="Password enter karein..."
              className="w-full px-4 py-2.5 pr-10 rounded-lg border text-sm outline-none transition-all"
              style={{
                borderColor: error ? "#f87171" : "#e2e8f0",
                background: error ? "#fff1f2" : "#f8fafc",
                boxShadow: error ? "0 0 0 3px #fee2e2" : undefined,
              }}
            />
            <FaLock
              className="absolute right-3"
              style={{ top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#cbd5e1" }}
            />
          </div>

          {/* Error message */}
          {error && (
            <p
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: "#dc2626", animation: "dpm-fadeIn 0.2s ease" }}
            >
              <FaExclamationTriangle style={{ width: 11, height: 11, flexShrink: 0 }} />
              {error}
            </p>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
            style={{ background: "#dc2626" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
          >
            <FaTrash style={{ width: 13, height: 13 }} />
            Delete Karen
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes dpm-shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-7px); }
          30%       { transform: translateX(7px); }
          45%       { transform: translateX(-5px); }
          60%       { transform: translateX(5px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        @keyframes dpm-fadeIn {
          from { opacity: 0; transform: translateY(-3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

