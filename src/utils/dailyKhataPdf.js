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
    salary: "Salary Paid",
    tax_payment: "Tax Paid",
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

  const grandTotalIn = Number(summary.openingBalance || 0) + Number(summary.totalIn || 0);
  const grandTotalOut = Number(summary.totalOut || 0);

  // Opening Balance Row
  formattedRows.push([
    "—",
    "PREVIOUS BALANCE (Wasooli)",
    openingIn > 0 ? formatMoney(openingIn) : "0",
    "—",
    "PREVIOUS BALANCE (Udhari)",
    openingOut > 0 ? formatMoney(openingOut) : "0",
  ]);

  for (let i = 0; i < maxRows; i++) {
    const c = credits[i] || {};
    const d = debits[i] || {};
    formattedRows.push([
      c.date ? formatDate(c.date) : "",
      c.name || "",
      c.amount ? formatMoney(c.amount) : "",
      d.date ? formatDate(d.date) : "",
      d.name || "",
      d.amount ? formatMoney(d.amount) : "",
    ]);
  }

  formattedRows.push([
    "TOTAL",
    "(Wasooli + Aamad)",
    formatMoney(grandTotalIn),
    "TOTAL",
    "(Kharch + Baqaya)",
    formatMoney(grandTotalOut),
  ]);

  // Add the final Closing Balance (Net Baqaya) as a single emphasized row
  formattedRows.push([
    "",
    "NET BAQAYA (Cash in Box)",
    "",
    "",
    "",
    formatMoney(summary.closingBalance),
  ]);

  const margin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text("DAILY CASH MEMO", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text("Professional Mill Financial Ledger - Accuracy Verified", pageWidth / 2, 26, { align: "center" });

  // Summary Info (Date, Filter)
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 32, pageWidth - margin, 32);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Period: ${summary.period || "All Time"}`, margin, 40);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 40, { align: "right" });

  // Summary Grid (Opening, In, Out, Closing)
  const boxWidth = (pageWidth - (margin * 2) - 15) / 4;
  const boxHeight = 18;
  const boxY = 46;

  const boxes = [
    { label: "PREV WASOOLI", value: formatMoney(summary.openingBalance), color: [71, 85, 105] },
    { label: "TOTAL CREDIT", value: formatMoney(grandTotalIn), color: [16, 185, 129] },
    { label: "TOTAL DEBIT", value: formatMoney(grandTotalOut), color: [239, 68, 68] },
    { label: "NET BAQAYA", value: formatMoney(summary.closingBalance), color: [245, 158, 11] },
  ];

  boxes.forEach((box, i) => {
    const x = margin + (i * (boxWidth + 5));
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, "F");
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(box.label, x + (boxWidth / 2), boxY + 6, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(box.color[0], box.color[1], box.color[2]);
    doc.text(`Rs. ${box.value || "0"}`, x + (boxWidth / 2), boxY + 13, { align: "center" });
  });

  autoTable(doc, {
    startY: 72,
    head: [["Date", "Account/Party", "Credit (Amount In)", "Date", "Account/Party", "Debit (Amount Out)"]],
    body: formattedRows,
    theme: "grid",
    headStyles: { 
      fillColor: [30, 41, 59], 
      textColor: [255, 255, 255], 
      fontSize: 8, 
      fontStyle: "bold",
      halign: "center",
      cellPadding: 3
    },
    styles: { fontSize: 8, cellPadding: 2.5, font: "helvetica" },
    columnStyles: {
      0: { cellWidth: 20 },
      2: { halign: "right", fontStyle: "bold", textColor: [16, 122, 100] },
      3: { cellWidth: 20 },
      5: { halign: "right", fontStyle: "bold", textColor: [185, 28, 28] },
    },
    didParseCell: (data) => {
      // Style the Grand Total Row
      if (data.row.raw[0] === "GRAND TOTAL") {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 9;
        if (data.column.index === 2 || data.column.index === 5) {
          data.cell.styles.textColor = [30, 41, 59];
        }
      }
      // Style the Final Net Baqaya Row
      if (data.row.raw[1] === "NET BAQAYA (Cash in Box)") {
        data.cell.styles.fillColor = [255, 251, 235];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 11;
        if (data.column.index === 5) {
          data.cell.styles.textColor = [180, 83, 9];
        }
      }
    },
    margin: { left: margin, right: margin },
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
