/**
 * Build a CSV string from an array of objects and column config.
 * @param {Array<object>} rows - Data rows
 * @param {Array<{ key: string, label: string }>} columns - Column key and header label
 * @returns {string} CSV string
 */
export function buildCsv(rows, columns) {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const body = rows.map((row) =>
    columns.map((c) => escapeCsvCell(getNestedValue(row, c.key))).join(",")
  ).join("\n");
  return "\uFEFF" + header + "\n" + body; // BOM for Excel UTF-8
}

function escapeCsvCell(val) {
  if (val == null) return "";
  const s = String(val).replace(/"/g, '""');
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
}

function getNestedValue(obj, key) {
  const parts = key.split(".");
  let v = obj;
  for (const p of parts) {
    v = v?.[p];
  }
  return v;
}

/**
 * Trigger download of a CSV file.
 * @param {string} csvContent - Full CSV string
 * @param {string} filename - e.g. "sales.csv"
 */
export function downloadCsv(csvContent, filename) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
