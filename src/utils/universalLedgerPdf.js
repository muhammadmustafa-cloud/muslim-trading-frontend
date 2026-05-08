import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const MARGIN = 14;
const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "—";
const formatMoney = (n) =>
    n != null && n !== "" && n !== 0 ? Number(n).toLocaleString("en-PK") : "";

export function downloadUniversalLedgerPdf(list, summary, filters = {}, dastiList = [], dastiSummary = {}) {
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

  // Totals Row (Rolling Balance)
  const grandTotalIn = Number(summary.totalIn || 0) + (summary.openingBalance > 0 ? Number(summary.openingBalance) : 0);
  const grandTotalOut = Number(summary.totalOut || 0) + (summary.openingBalance < 0 ? Math.abs(Number(summary.openingBalance)) : 0);
  const netBaqaya = grandTotalIn - grandTotalOut;

  formattedRows.push([
    "",
    "TOTAL CREDIT",
    "",
    formatMoney(grandTotalIn),
    "",
    "TOTAL DEBIT",
    "",
    formatMoney(grandTotalOut),
  ]);

  // Net Movement Row (Centered across all columns)
  formattedRows.push([
    { 
      content: `CLOSING BAQAYA (CASH IN BOX): ${formatMoney(netBaqaya)}`, 
      colSpan: 8, 
      styles: { halign: 'center', fontStyle: 'bold', fontSize: 10, fillColor: [255, 251, 235] } 
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
    const accName = list.length > 0 ? list[0].accountName : "Specific Account";
    doc.text(`Filtered for: ${accName}`, doc.internal.pageSize.getWidth() - MARGIN, y, { align: "right" });
  }
  y += 6;

  // Row Manually before table
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = pageWidth - MARGIN * 2;
  doc.setFillColor(242, 242, 242);
  doc.rect(MARGIN, y, tableWidth, 7, "F");
  doc.setDrawColor(200);
  doc.rect(MARGIN, y, tableWidth, 7, "S");
  doc.setFontSize(7);
  doc.setFont(undefined, "bold");
  doc.setTextColor(80);

  const balVal = Number(summary.openingBalance || 0);
  const balStr = balVal !== 0 ? formatMoney(Math.abs(balVal)) : "0";

  if (balVal >= 0) {
    doc.text("Previous Balance (Pichli Wasooli)", MARGIN + 2, y + 5);
    doc.setTextColor(0, 100, 0);
    doc.text(balStr, MARGIN + 91, y + 5, { align: "right" });
  } else {
    doc.text("Opening Deficit (Previous Udhaar)", MARGIN + 93, y + 5);
    doc.setTextColor(150, 0, 0);
    doc.text(balStr, MARGIN + 182, y + 5, { align: "right" });
  }
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [["Date", "Credit Ledger", "Description", "Amount", "Date", "Debit Ledger", "Description", "Amount"]],
    body: formattedRows,
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 7, halign: "center" },
    bodyStyles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 20 },
      2: { cellWidth: 38 },
      3: { cellWidth: 19, halign: "right", fontStyle: "bold" },
      4: { cellWidth: 14 },
      5: { cellWidth: 20 },
      6: { cellWidth: 38 },
      7: { cellWidth: 19, halign: "right", fontStyle: "bold" },
    },
    didParseCell: function (data) {
      if (data.row.index >= formattedRows.length - 2) {
        data.cell.styles.fillColor = [245, 245, 250];
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
  });

  // Dasti Table Section
  if (dastiList && dastiList.length > 0) {
    let finalY = doc.lastAutoTable.finalY + 10;
    
    // Check for page break
    if (finalY > 250) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.setTextColor(180, 83, 9); // Amber-800
    doc.text("Dasti Hisaab (Manual Informal Entries)", MARGIN, finalY);
    finalY += 6;

    // Format Dasti into T-Account Rows
    const dastiCredits = dastiList.filter(d => d.type === 'credit');
    const dastiDebits = dastiList.filter(d => d.type === 'debit');
    const dastiMax = Math.max(dastiCredits.length, dastiDebits.length);
    const dastiFormattedRows = [];

    for (let i = 0; i < dastiMax; i++) {
        const cr = dastiCredits[i] || {};
        const dr = dastiDebits[i] || {};
        dastiFormattedRows.push([
            cr.date ? formatDate(cr.date) : "",
            cr.name || "",
            cr.note || "",
            cr.amount ? formatMoney(cr.amount) : "",
            dr.date ? formatDate(dr.date) : "",
            dr.name || "",
            dr.note || "",
            dr.amount ? formatMoney(dr.amount) : "",
        ]);
    }

    // Dasti Totals Row
    dastiFormattedRows.push([
        "", "TOTAL DASTI CREDIT", "", formatMoney(dastiSummary.totalIn || 0),
        "", "TOTAL DASTI DEBIT", "", formatMoney(dastiSummary.totalOut || 0)
    ]);

    // Dasti Net Balance Row
    dastiFormattedRows.push([{
        content: `DASTI NET BAQAYA: ${formatMoney(dastiSummary.net || 0)}`,
        colSpan: 8,
        styles: { halign: 'center', fontStyle: 'bold', fontSize: 9, fillColor: [255, 251, 235] }
    }]);

    autoTable(doc, {
      startY: finalY,
      head: [["Date", "Dasti Name", "Note", "Amount", "Date", "Dasti Name", "Note", "Amount"]],
      body: dastiFormattedRows,
      headStyles: { fillColor: [180, 83, 9], textColor: 255, fontStyle: "bold", fontSize: 7, halign: "center" },
      bodyStyles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 20 },
        2: { cellWidth: 38 },
        3: { cellWidth: 19, halign: "right", fontStyle: "bold" },
        4: { cellWidth: 14 },
        5: { cellWidth: 20 },
        6: { cellWidth: 38 },
        7: { cellWidth: 19, halign: "right", fontStyle: "bold" },
      },
      didParseCell: function (data) {
        if (data.row.index >= dastiFormattedRows.length - 2) {
          data.cell.styles.fillColor = [255, 253, 240];
          data.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: MARGIN, right: MARGIN },
      theme: "grid",
    });
  }

  // Footer
  const lastY = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated: ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}`, MARGIN, lastY);

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
