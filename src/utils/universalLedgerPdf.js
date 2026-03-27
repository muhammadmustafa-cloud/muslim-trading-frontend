import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const MARGIN = 14;
const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatMoney = (n) =>
    n != null && n !== "" && n !== 0 ? Number(n).toLocaleString("en-PK") : "";

export function downloadUniversalLedgerPdf(list, summary, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const credits = list.filter((r) => r.amountType === "in");
  const debits = list.filter((r) => r.amountType === "out");
  const maxRows = Math.max(credits.length, debits.length);
  const formattedRows = [];

  for (let i = 0; i < maxRows; i++) {
    const cr = credits[i] || {};
    const dr = debits[i] || {};
    
    formattedRows.push([
      cr.date ? formatDate(cr.date) : "",
      cr.accountName || "",
      cr.name ? cr.name + (cr.description ? `\n(${cr.description})` : "") : "",
      cr.amount ? formatMoney(cr.amount) : "",
      dr.date ? formatDate(dr.date) : "",
      dr.accountName || "",
      dr.name ? dr.name + (dr.description ? `\n(${dr.description})` : "") : "",
      dr.amount ? formatMoney(dr.amount) : "",
    ]);
  }

  // Totals Row
  formattedRows.push([
    "",
    "TOTAL CREDITS",
    "",
    formatMoney(summary.totalIn),
    "",
    "TOTAL DEBITS",
    "",
    formatMoney(summary.totalOut),
  ]);

  // Net Movement Row (Centered across all columns)
  formattedRows.push([
    { 
      content: `NET MOVEMENT (BAQAYA): ${formatMoney(summary.net)}`, 
      colSpan: 8, 
      styles: { halign: 'center', fontStyle: 'bold', fontSize: 10 } 
    }
  ]);

  // Header Title
  let y = 15;
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text("Daily Cash Memo", doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
  y += 10;

  // Subtitle (Dates)
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  const dateStr = filters.dateFrom === filters.dateTo 
    ? `Date: ${formatDate(filters.dateFrom)}` 
    : `Range: ${formatDate(filters.dateFrom)} — ${formatDate(filters.dateTo)}`;
  doc.text(dateStr, MARGIN, y);
  
  if (filters.accountId) {
    // If filtered by account, we can mention it
    const accName = list.length > 0 ? list[0].accountName : "Specific Account";
    doc.text(`Filtered for: ${accName}`, doc.internal.pageSize.getWidth() - MARGIN, y, { align: "right" });
  }
  y += 6;

  // Draw "Previous Balance" row manually above the table
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = pageWidth - MARGIN * 2;
  doc.setFillColor(235, 235, 235);
  doc.rect(MARGIN, y, tableWidth, 7, "F");
  doc.setDrawColor(180);
  doc.rect(MARGIN, y, tableWidth, 7, "S");
  doc.setFontSize(8);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0);
  doc.text("Previous Balance (Opening Balance)", MARGIN + 2, y + 5);
  const balStr = summary.openingBalance !== 0 ? formatMoney(Math.abs(summary.openingBalance)) : "0";
  if (summary.openingBalance >= 0) {
    // Credit side — show amount at the end of Credit Amount column (col 0+1+2 = ~95mm from left)
    doc.text(balStr, MARGIN + 90, y + 5, { align: "right" });
  } else {
    // Debit side — show amount at the end of Debit Amount column
    doc.text(balStr, pageWidth - MARGIN - 2, y + 5, { align: "right" });
  }
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [["Date", "Account", "Party / Item", "Amount", "Date", "Account", "Party / Item", "Amount"]],
    body: formattedRows,
    headStyles: { fillColor: [0, 0, 0], textColor: 255, fontStyle: "bold", fontSize: 7, halign: "center" },
    bodyStyles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 22 },
      2: { cellWidth: 36 },
      3: { cellWidth: 19, halign: "right", fontStyle: "bold" },
      4: { cellWidth: 14 },
      5: { cellWidth: 22 },
      6: { cellWidth: 36 },
      7: { cellWidth: 19, halign: "right", fontStyle: "bold" },
    },
    didParseCell: function (data) {
      // Styling summary rows (Totals and Net)
      if (data.row.index >= formattedRows.length - 2) {
        data.cell.styles.fillColor = [240, 240, 255];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 8;
      }
    },
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
  });

  // Footer footer
  const lastY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated: ${new Date().toLocaleString("en-PK")}`, MARGIN, lastY);

  addPageNumbers(doc);
  doc.save(`universal-ledger-${(filters.dateFrom || "report")}.pdf`);
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
  }
}
