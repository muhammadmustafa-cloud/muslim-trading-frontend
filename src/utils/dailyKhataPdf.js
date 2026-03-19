import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const MARGIN = 14;
const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatMoney = (n) =>
    n != null && n !== "" && n !== 0 ? Number(n).toLocaleString("en-PK") : "";

const TYPE_LABELS = {
    sale: "Sale",
    purchase: "Purchase",
    deposit: "Deposit",
    withdraw: "Withdraw",
    transfer: "Transfer",
    mill_expense: "Mill Expense",
    mazdoor_expense: "Mazdoor",
};

/**
 * Download Daily Khata PDF — Professional T-Account (Daily Cash Memo)
 */
export function downloadDailyKhataPdf(rows, summary, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const credits = rows.filter((r) => r.amountType === "in");
  const debits = rows.filter((r) => r.amountType === "out");

  // Ensure lists have the same number of rows for symmetry
  const maxRows = Math.max(credits.length, debits.length);
  const formattedRows = [];

  // Add "Previous Balance" as the first row in the table body
  formattedRows.push([
    "Previous Blnc",
    "",
    formatMoney(summary.openingBalance),
    "Previous Blnc",
    "",
    "",
  ]);

  for (let i = 0; i < maxRows; i++) {
    const c = credits[i] || {};
    const d = debits[i] || {};
    formattedRows.push([
      c.name || "",
      (c.description || "").slice(0, 25),
      c.amount ? formatMoney(c.amount) : "",
      d.name || "",
      (d.description || "").slice(0, 25),
      d.amount ? formatMoney(d.amount) : "",
    ]);
  }

  // Add Totals
  formattedRows.push([
    "Total",
    "",
    formatMoney(summary.totalIn),
    "Total",
    "",
    formatMoney(summary.totalOut),
  ]);

  // Add Closing Balance prominently
  formattedRows.push([
    "",
    "Closing Balance",
    "",
    formatMoney(summary.closingBalance),
    "",
    "",
  ]);

  // Header
  let y = 15;
  doc.setFontSize(22);
  doc.setFont(undefined, "bold");
  doc.text("Daily Cash Memo", doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
  y += 12;

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  const dateStr = filters.dateFrom === filters.dateTo ? `Date: ${formatDate(filters.dateFrom)}` : `Range: ${formatDate(filters.dateFrom)} — ${formatDate(filters.dateTo)}`;
  const dayStr = filters.dateFrom === filters.dateTo ? `Day: ${new Date(filters.dateFrom).toLocaleDateString("en-PK", { weekday: "long" })}` : "";
  
  doc.text(dateStr, MARGIN, y);
  if (dayStr) doc.text(dayStr, MARGIN + 60, y);
  y += 8;

  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.text("CREDIT (Cash In)", MARGIN, y);
  doc.text("DEBIT (Cash Out)", MARGIN + 91, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Name", "Description", "Amount", "Name", "Description", "Amount"]],
    body: formattedRows,
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold", fontSize: 9, halign: "left" },
    bodyStyles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 46 },
      2: { cellWidth: 25, halign: "right", fontStyle: "bold" },
      3: { cellWidth: 20 },
      4: { cellWidth: 46 },
      5: { cellWidth: 25, halign: "right", fontStyle: "bold" },
    },
    // Stripe specific rows (Opening, Totals, Closing)
    didParseCell: function (data) {
      if (data.row.index === 0 || data.row.index === formattedRows.length - 2) {
        data.cell.styles.fillColor = [245, 245, 245];
        data.cell.styles.fontStyle = "bold";
      }
      if (data.row.index === formattedRows.length - 1) {
        data.cell.styles.fillColor = [255, 248, 230];
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
  });

  // Footer generated line
  const lastY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated: ${new Date().toLocaleString("en-PK")}`, MARGIN, lastY);

  addPageNumbers(doc);
  doc.save(`daily-memo-${(filters.dateFrom || "report")}.pdf`);
}

function addPageNumbers(doc) {
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${totalPages}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);
  }
}
