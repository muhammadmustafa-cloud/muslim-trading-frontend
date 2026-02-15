export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirm",
  message = "Kya aap sure hain?",
  confirmLabel = "Haan, delete karein",
  cancelLabel = "Cancel",
  danger = true,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={
              danger
                ? "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                : "btn-primary"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
