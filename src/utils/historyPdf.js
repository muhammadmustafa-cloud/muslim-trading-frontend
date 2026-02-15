import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const formatMoney = (n) => (n != null && n !== "" ? Number(n).toLocaleString("en-PK") : "—");

/**
 * Generate PDF for customer history (sales + stock entries).
 */
export function downloadCustomerHistoryPdf(name, sales, stockEntries, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFontSize(16);
  doc.text(`Customer History — ${name}`, 14, y);
  y += 10;
  if (filters.dateFrom || filters.dateTo || filters.type) {
    doc.setFontSize(9);
    const filterStr = [
      filters.dateFrom && `From: ${filters.dateFrom}`,
      filters.dateTo && `To: ${filters.dateTo}`,
      filters.type && filters.type !== "all" && `Type: ${filters.type}`,
    ]
      .filter(Boolean)
      .join(" | ");
    doc.text(filterStr, 14, y);
    y += 6;
  }

  if (sales && sales.length > 0) {
    doc.setFontSize(11);
    doc.text("Sales (Jab isne khareeda)", 14, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [["Date", "Item", "Part", "Qty", "Received"]],
      body: sales.slice(0, 100).map((s) => [
        formatDate(s.date),
        (s.itemId && s.itemId.name) || "—",
        s.partName || "—",
        `${s.quantity || ""} ${s.partUnit || ""}`.trim(),
        formatMoney(s.amountReceived),
      ]),
      margin: { left: 14 },
      styles: { fontSize: 8 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (stockEntries && stockEntries.length > 0) {
    doc.setFontSize(11);
    doc.text("Stock Entry (Jab humne inse khareeda)", 14, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [["Date", "Item", "Weight", "Paid"]],
      body: stockEntries.slice(0, 100).map((e) => [
        formatDate(e.date),
        (e.itemId && e.itemId.name) || "—",
        e.receivedWeight ?? "—",
        formatMoney(e.amountPaid),
      ]),
      margin: { left: 14 },
      styles: { fontSize: 8 },
    });
  }

  doc.save(`customer-history-${(name || "customer").replace(/\s+/g, "-")}.pdf`);
}

/**
 * Generate PDF for supplier history (stock entries + sales).
 */
export function downloadSupplierHistoryPdf(name, stockEntries, sales, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFontSize(16);
  doc.text(`Supplier History — ${name}`, 14, y);
  y += 10;
  if (filters.dateFrom || filters.dateTo || filters.type) {
    doc.setFontSize(9);
    const filterStr = [
      filters.dateFrom && `From: ${filters.dateFrom}`,
      filters.dateTo && `To: ${filters.dateTo}`,
      filters.type && filters.type !== "all" && `Type: ${filters.type}`,
    ]
      .filter(Boolean)
      .join(" | ");
    doc.text(filterStr, 14, y);
    y += 6;
  }

  if (stockEntries && stockEntries.length > 0) {
    doc.setFontSize(11);
    doc.text("Stock Entry (Jab humne inse khareeda)", 14, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [["Date", "Item", "Weight", "Paid"]],
      body: stockEntries.slice(0, 100).map((e) => [
        formatDate(e.date),
        (e.itemId && e.itemId.name) || "—",
        e.receivedWeight ?? "—",
        formatMoney(e.amountPaid),
      ]),
      margin: { left: 14 },
      styles: { fontSize: 8 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (sales && sales.length > 0) {
    doc.setFontSize(11);
    doc.text("Sales (Jab inko becha)", 14, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [["Date", "Item", "Part", "Qty", "Received"]],
      body: sales.slice(0, 100).map((s) => [
        formatDate(s.date),
        (s.itemId && s.itemId.name) || "—",
        s.partName || "—",
        `${s.quantity || ""} ${s.partUnit || ""}`.trim(),
        formatMoney(s.amountReceived),
      ]),
      margin: { left: 14 },
      styles: { fontSize: 8 },
    });
  }

  doc.save(`supplier-history-${(name || "supplier").replace(/\s+/g, "-")}.pdf`);
}
