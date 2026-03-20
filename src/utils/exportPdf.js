import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const MARGIN = 14;
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatMoney = (n) =>
  n != null && n !== "" ? Number(n).toLocaleString("en-PK") : "—";

function addReportHeader(doc, title, subtitleLines = []) {
  let y = 15;
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(title, MARGIN, y);
  y += 8;
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  const generated = `Generated: ${new Date().toLocaleDateString("en-PK", { dateStyle: "medium" })} ${new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}`;
  doc.text(generated, MARGIN, y);
  y += 5;
  subtitleLines.filter(Boolean).forEach((line) => {
    doc.text(line, MARGIN, y);
    y += 5;
  });
  return y + 4;
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

const tableTheme = {
  theme: "grid",
  headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold", fontSize: 9 },
  alternateRowColors: true,
  rowStartY: undefined,
  margin: { left: MARGIN, right: MARGIN },
  styles: { fontSize: 8, cellPadding: 3, lineWidth: 0.1 },
  didDrawPage: (data) => { },
};

/**
 * Sales report PDF — full list with filters.
 */
export function downloadSalesPdf(sales, filters = {}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const subtitleLines = [];
  if (filters.dateFrom || filters.dateTo) subtitleLines.push(`Date: ${filters.dateFrom || "—"} to ${filters.dateTo || "—"}`);
  if (filters.customerId) subtitleLines.push("Filter: Customer");
  if (filters.itemId) subtitleLines.push("Filter: Item");
  subtitleLines.push(`Total records: ${sales.length}`);

  let startY = addReportHeader(doc, "Sales Report (Bechai)", subtitleLines);

  if (!sales.length) {
    doc.setFontSize(10);
    doc.text("No sales records in this period.", MARGIN, startY);
    doc.save("sales-report.pdf");
    return;
  }

  autoTable(doc, {
    startY,
    head: [["#", "Date", "Customer", "Item", "Category", "Qty", "Rate", "Total", "Received", "Truck", "Account", "Notes"]],
    body: sales.map((row, i) => [
      i + 1,
      formatDate(row.date),
      (row.customerId && row.customerId.name) || "—",
      row.itemName || (row.itemId && row.itemId.name) || "—",
      row.category || "—",
      row.quantity != null ? row.quantity : "—",
      formatMoney(row.rate),
      formatMoney(row.totalAmount),
      formatMoney(row.amountReceived),
      (row.truckNumber || "—").slice(0, 12),
      (row.accountId && row.accountId.name) || "—",
      (row.notes || "—").slice(0, 25),
    ]),
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { cellWidth: 26 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 16 },
      7: { cellWidth: 30 },
      8: { cellWidth: 18 },
      9: { cellWidth: 18 },
      10: { cellWidth: 20 },
      11: { cellWidth: 30 },
    },
  });

  addPageNumbers(doc);
  doc.save("sales-report.pdf");
}

/**
 * Purchases report PDF.
 */
export function downloadPurchasesPdf(entries, filters = {}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const subtitleLines = [];
  if (filters.dateFrom || filters.dateTo)
    subtitleLines.push(`Date: ${filters.dateFrom || "—"} to ${filters.dateTo || "—"}`);
  if (filters.itemId) subtitleLines.push("Filter: Item selected");
  if (filters.supplierId) subtitleLines.push("Filter: Supplier selected");
  subtitleLines.push(`Total records: ${entries.length}`);

  let startY = addReportHeader(doc, "Purchase Report", subtitleLines);

  if (!entries.length) {
    doc.setFontSize(10);
    doc.text("No purchases in this period.", MARGIN, startY);
    doc.save("purchases-report.pdf");
    return;
  }

  autoTable(doc, {
    startY,
    head: [["#", "Date", "Item", "Supplier", "Weight", "Total", "Paid", "Balance", "Status"]],
    body: entries.map((row, i) => [
      i + 1,
      formatDate(row.date),
      (row.itemId && row.itemId.name) || "—",
      (row.supplierId && row.supplierId.name) || "—",
      row.receivedWeight != null ? row.receivedWeight : "—",
      formatMoney(row.amount),
      formatMoney(row.amountPaid),
      formatMoney((row.amount || 0) - (row.amountPaid || 0)),
      (row.paymentStatus || 'pending').toUpperCase() + (row.dueDate && row.paymentStatus !== 'paid' ? `\n(${formatDate(row.dueDate)})` : ""),
    ]),
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { cellWidth: 24 },
      3: { cellWidth: 24 },
      4: { cellWidth: 18 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 },
      7: { cellWidth: 20 },
      8: { cellWidth: 25 },
    },
  });

  addPageNumbers(doc);
  doc.save("purchases-report.pdf");
}

/**
 * Transactions report PDF.
 */
export function downloadTransactionsPdf(transactions, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const subtitleLines = [];
  if (filters.dateFrom || filters.dateTo)
    subtitleLines.push(`Date: ${filters.dateFrom || "—"} to ${filters.dateTo || "—"}`);
  
  const accountName = transactions.length > 0 && filters.accountId 
    ? (transactions.find(t => (t.fromAccountId?._id === filters.accountId || t.toAccountId?._id === filters.accountId))?.fromAccountId?.name || 
       transactions.find(t => (t.fromAccountId?._id === filters.accountId || t.toAccountId?._id === filters.accountId))?.toAccountId?.name || "Account")
    : "All Accounts";

  subtitleLines.push(`Total records: ${transactions.length}`);

  let startY = addReportHeader(doc, `${accountName} - Ledger`, subtitleLines);

  if (!transactions.length) {
    doc.setFontSize(10);
    doc.text("No transactions in this period.", MARGIN, startY);
    doc.save("transactions-report.pdf");
    return;
  }

  // Calculate Totals
  let totalCredit = 0;
  let totalDebit = 0;

  const formattedRows = transactions.map((row, i) => {
    let credit = 0;
    let debit = 0;

    if (row.type === "deposit" || row.type === "sale") {
      credit = row.amount;
    } else if (row.type === "withdraw" || row.type === "purchase") {
      debit = row.amount;
    } else if (row.type === "transfer") {
      if (filters.accountId && row.toAccountId?._id === filters.accountId) credit = row.amount;
      else if (filters.accountId && row.fromAccountId?._id === filters.accountId) debit = row.amount;
      else debit = row.amount; 
    }

    totalCredit += credit;
    totalDebit += debit;

    let participant = "—";
    let description = row.note || "";

    const personName = row.customerName || row.supplierName || row.mazdoorName;

    if (personName) {
      participant = personName;
      if (row.type === 'sale') description = `Sale: ${row.itemName || ""}`;
      else if (row.type === 'purchase') description = `Purchase: ${row.itemName || ""}`;
      else if (row.mazdoorName) description = "Labor Payment / Advance";
      else description = row.note || (row.type === 'deposit' ? "Received Funds" : "Payment Made");
    } else if (row.type === 'transfer') {
      participant = `${row.fromAccountId?.name || "—"} ➔ ${row.toAccountId?.name || "—"}`;
      description = "Internal Transfer";
    } else {
       participant = row.fromAccountId?.name || row.toAccountId?.name || "Manual";
    }

    const descriptionFinal = personName 
      ? `${personName} ${description ? `(${description})` : ""} ${row.category ? `[${row.category}]` : ""}`
      : `${description} ${row.category ? `[${row.category}]` : ""}`;

    return [
      formatDate(row.date),
      descriptionFinal.slice(0, 80) || "—",
      credit > 0 ? formatMoney(credit) : "—",
      debit > 0 ? formatMoney(debit) : "—",
      "", // Individual row balance is empty
    ];
  });

  const netBalance = totalCredit - totalDebit;
  const balanceStr = `${formatMoney(Math.abs(netBalance))} ${netBalance >= 0 ? "CR" : "DR"}`;

  autoTable(doc, {
    startY,
    head: [["Date", "Description", "Credit (Aya)", "Debit (Gaya)", "Balance"]],
    body: formattedRows,
    foot: [[
      { content: "TOTAL ACCOUNT MOVEMENTS", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
      { content: formatMoney(totalCredit), styles: { halign: "right", fontStyle: "bold" } },
      { content: formatMoney(totalDebit), styles: { halign: "right", fontStyle: "bold" } },
      { content: balanceStr, styles: { halign: "right", fontStyle: "bold", textColor: [0, 80, 0] } },
    ]],
    ...tableTheme,
    theme: "grid",
    styles: { ...tableTheme.styles, fontSize: 8.5, lineWidth: 0.1 },
    headStyles: { ...tableTheme.headStyles, fontSize: 9 },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 9, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 85 },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 25, halign: "right" },
    },
  });

  addPageNumbers(doc);
  doc.save(`ledger-${accountName.replace(/\s+/g, "_")}.pdf`);
}

/**
 * Current Stock PDF.
 */
export function downloadCurrentStockPdf(stockList) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const subtitleLines = [`Total items: ${stockList.length}`];
  let startY = addReportHeader(doc, "Current Stock Report", subtitleLines);

  if (!stockList.length) {
    doc.setFontSize(10);
    doc.text("No stock data.", MARGIN, startY);
    doc.save("current-stock-report.pdf");
    return;
  }

  autoTable(doc, {
    startY,
    head: [["#", "Item", "Category", "Bags", "Qty (kg)", "Rem. Mill", "Rem. Sup", "Quality"]],
    body: stockList.map((row, i) => [
      i + 1,
      row.itemName || "—",
      row.category || "—",
      row.kattay != null ? row.kattay : "—",
      row.quantity != null ? row.quantity : "—",
      row.millWeight != null ? Number(row.millWeight).toFixed(2) : "—",
      row.supplierWeight != null ? Number(row.supplierWeight).toFixed(2) : "—",
      row.quality || "—",
    ]),
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 40 },
      2: { cellWidth: 35 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 25 },
      7: { cellWidth: 30 },
    },
  });

  addPageNumbers(doc);
  doc.save("current-stock-report.pdf");
}

/**
 * Accounts summary PDF (name, type, balance).
 */
export function downloadAccountsPdf(accounts) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const totalBalance = accounts.reduce(
    (sum, a) => sum + (Number(a.currentBalance ?? a.openingBalance) || 0),
    0
  );
  const subtitleLines = [
    `Total accounts: ${accounts.length}`,
    `Combined balance: ${formatMoney(totalBalance)}`,
  ];
  let startY = addReportHeader(doc, "Accounts Summary (Hisaab)", subtitleLines);

  if (!accounts.length) {
    doc.setFontSize(10);
    doc.text("No accounts.", MARGIN, startY);
    doc.save("accounts-report.pdf");
    return;
  }

  autoTable(doc, {
    startY,
    head: [["#", "Name", "Type", "Account #", "Current Balance", "Notes"]],
    body: accounts.map((a, i) => [
      i + 1,
      a.name || "—",
      a.type || "Cash",
      (a.accountNumber || "—").slice(0, 18),
      formatMoney(a.currentBalance ?? a.openingBalance),
      (a.notes || "—").slice(0, 30),
    ]),
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 45 },
      2: { cellWidth: 22 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35 },
      5: { cellWidth: 45 },
    },
  });

  addPageNumbers(doc);
  doc.save("accounts-report.pdf");
}

/**
 * Professional Single Sale Invoice PDF
 * Imitates the physical format provided by the user.
 */
export function downloadSaleInvoicePdf(sale) {
  // A5 format often works best for half-page invoices, but we can do A4 portrait and scale it.
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // --- HEADER SECTION ---
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("MUSLIM", 15, 25);

  doc.setFontSize(16);
  doc.text("TRADING COMPANY", 75, 20);
  doc.setFontSize(14);
  doc.text("DALL MILL", 75, 26);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Opposite Begam Saeeda House Near", 15, 32);
  doc.text("Shell Pump Quetta Road Jaccobabad", 15, 36);
  doc.text("Haji Saleh M : 03023392243", 15, 40);
  doc.text("Haji Saleh M : 03362320267", 15, 44);

  doc.text("Channa Dall Jawar Taramera Till ETC", 75, 32);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SALE INVOICE", 75, 42);

  doc.setFontSize(10);
  doc.text("Invoice No.", 145, 42);
  const invoiceNo = `SI${new Date(sale.date).toISOString().slice(5, 7)}${new Date(sale.date).toISOString().slice(2, 4)}/${sale._id.slice(-6).toUpperCase()}`;
  doc.text(invoiceNo, 168, 42);

  // Line under header
  doc.setLineWidth(0.5);
  doc.line(15, 48, 195, 48);

  // --- CUSTOMER & DETAILS SECTION ---
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Customer", 15, 56);
  doc.text("Detail", 150, 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  // Left Column (Customer)
  doc.text("Name:", 15, 64);
  doc.text((sale.customerId?.name || ""), 35, 64);
  doc.line(35, 65, 120, 65); // underline

  doc.text("Address:", 15, 72);
  doc.text((sale.customerId?.address || ""), 35, 72);
  doc.line(35, 73, 120, 73);

  doc.text("Phone:", 15, 80);
  doc.text((sale.customerId?.phone || ""), 35, 80);
  doc.line(35, 81, 120, 81);

  // Right Column (Details)
  doc.text("Date:", 135, 64);
  doc.text(formatDate(sale.date), 155, 64);
  doc.line(155, 65, 195, 65);

  doc.text("Truck No:", 135, 72);
  doc.text(sale.truckNumber || "—", 155, 72);
  doc.line(155, 73, 195, 73);

  doc.text("Account:", 135, 80);
  doc.text(sale.accountId?.name || "—", 155, 80);
  doc.line(155, 81, 195, 81);

  doc.text("Due Date:", 135, 88);
  doc.text(formatDate(sale.dueDate), 155, 88);
  doc.line(155, 89, 195, 89);

  // --- ITEM TABLE ---
  let yPos = 95;

  doc.setFillColor(235, 235, 235);
  doc.rect(15, yPos, 180, 8, "F");
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.line(15, yPos, 195, yPos);
  doc.line(15, yPos + 8, 195, yPos + 8);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("NAME OF PRODUCT", 18, yPos + 5.5);
  doc.text("BAGS", 95, yPos + 5.5);
  doc.text("MUN", 120, yPos + 5.5);
  doc.text("K.G", 140, yPos + 5.5);
  doc.text("RATE", 155, yPos + 5.5);
  doc.text("NET AMOUNT", 175, yPos + 5.5);

  yPos += 14;
  doc.setFont("helvetica", "normal");

  const itemName = sale.itemName || sale.itemId?.name || "—";
  doc.text(itemName, 18, yPos);

  const bags = sale.kattay ? String(sale.kattay) : "—";
  doc.text(bags, 95, yPos);

  const totalKg = sale.quantity ? Number(sale.quantity) : 0;
  const mun = totalKg > 0 ? (totalKg / 40).toFixed(3) : "—";
  doc.text(String(mun), 120, yPos);

  const kgPerMun = "40"; // standard
  doc.text(kgPerMun, 140, yPos);

  const rateStr = sale.rate ? formatMoney(sale.rate) : "—";
  doc.text(rateStr, 155, yPos);

  // The base product amount without bardana/mazdori
  // We use (Quantity / 40) × rate
  let baseTotal = 0;
  if (totalKg > 0 && sale.rate > 0) {
    baseTotal = Math.round((totalKg / 40) * sale.rate);
  } else {
    // fallback if no rates found, try to derive from stored totalAmount
    baseTotal = (sale.totalAmount || 0) - (sale.bardanaAmount || 0) - (sale.mazdori || 0);
  }
  doc.text(formatMoney(baseTotal), 175, yPos);

  // Bottom line for table box
  yPos = 200; // increased from 175 to give more professional space
  doc.line(15, yPos, 195, yPos);

  // --- SUMMARY SECTION ---
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  // Left calculations
  doc.text("Total Weight", 15, yPos);
  const grossWeight = totalKg + (sale.shCut || 0);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(grossWeight), 45, yPos);

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Total SH.CUT", 15, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(String(sale.shCut || 0), 45, yPos);

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Net Weight", 15, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(totalKg), 45, yPos);

  // Right calculations
  let rightY = 200 + 8;
  doc.setFont("helvetica", "bold");
  doc.text("GROSS AMOUNT:", 130, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(baseTotal), 195, rightY, { align: "right" });

  rightY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("BARDANA TOTAL:", 130, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(sale.bardanaAmount || 0), 195, rightY, { align: "right" });

  rightY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("MAZDOORI TOTAL:", 130, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(sale.mazdori || 0), 195, rightY, { align: "right" });

  // Optional: separator line before Net
  doc.setLineWidth(0.1);
  doc.line(130, rightY + 2, 195, rightY + 2);

  rightY += 9;
  doc.setFont("helvetica", "bold");
  doc.text("NET AMOUNT:", 130, rightY);
  doc.setFontSize(11); // make net amount slightly bigger
  doc.text(formatMoney(sale.totalAmount), 195, rightY, { align: "right" });
  doc.setFontSize(9);

  // --- MEMO SECTION ---
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Memo:", 15, yPos);

  yPos += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  let memoText = "";
  if (sale.kattay > 0 && sale.bardanaRate > 0) {
    memoText += `${sale.kattay} * ${sale.bardanaRate} Bardana `;
  } else if (sale.bardanaAmount > 0) {
    memoText += `${sale.bardanaAmount} Bardana `;
  }

  if (sale.mazdori > 0) {
    memoText += `${sale.mazdori} Mazdori `;
  }

  if (!memoText) {
    memoText = sale.notes || "—";
  }

  doc.text(memoText, 15, yPos);

  // Signature line
  doc.line(140, yPos + 35, 195, yPos + 35);
  doc.setFont("helvetica", "bold");
  doc.text("Signature", 158, yPos + 40);

  doc.save(`invoice-${invoiceNo.replace(/\//g, "-")}.pdf`);
}

/**
 * Professional Single Purchase Invoice PDF
 * Mimics the style of the sales invoice but for supplier purchases.
 */
export function downloadPurchaseInvoicePdf(entry) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // --- HEADER SECTION ---
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("MUSLIM", 15, 25);

  doc.setFontSize(16);
  doc.text("TRADING COMPANY", 75, 20);
  doc.setFontSize(14);
  doc.text("DALL MILL", 75, 26);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Opposite Begam Saeeda House Near", 15, 32);
  doc.text("Shell Pump Quetta Road Jaccobabad", 15, 36);
  doc.text("Haji Saleh M : 03023392243", 15, 40);
  doc.text("Haji Saleh M : 03362320267", 15, 44);

  doc.text("Channa Dall Jawar Taramera Till ETC", 75, 32);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PURCHASE INVOICE", 75, 42);

  doc.setFontSize(10);
  doc.text("Purchase No.", 145, 42);
  const entryNo = `PI${new Date(entry.date).toISOString().slice(5, 7)}${new Date(entry.date).toISOString().slice(2, 4)}/${entry._id.slice(-6).toUpperCase()}`;
  doc.text(entryNo, 170, 42);

  // Line under header
  doc.setLineWidth(0.5);
  doc.line(15, 48, 195, 48);

  // --- SUPPLIER & DETAILS SECTION ---
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Supplier", 15, 56);
  doc.text("Detail", 150, 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  // Left Column (Supplier)
  doc.text("Name:", 15, 64);
  doc.text((entry.supplierId?.name || ""), 35, 64);
  doc.line(35, 65, 120, 65);

  doc.text("Address:", 15, 72);
  doc.line(35, 73, 120, 73);

  doc.text("Phone:", 15, 80);
  doc.line(35, 81, 120, 81);

  // Right Column (Details)
  doc.text("Date:", 135, 64);
  doc.text(formatDate(entry.date), 155, 64);
  doc.line(155, 65, 195, 65);

  doc.text("Truck No:", 135, 72);
  doc.text(entry.truckNumber || "—", 155, 72);
  doc.line(155, 73, 195, 73);

  doc.text("Account:", 135, 80);
  doc.text(entry.accountId?.name || "—", 155, 80);
  doc.line(155, 81, 195, 81);

  doc.text("Due Date:", 135, 88);
  doc.text(entry.dueDate ? formatDate(entry.dueDate) : "—", 155, 88);
  doc.line(155, 89, 195, 89);

  // --- ITEM TABLE ---
  let yPos = 95;

  doc.setFillColor(235, 235, 235);
  doc.rect(15, yPos, 180, 8, "F");
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.line(15, yPos, 195, yPos);
  doc.line(15, yPos + 8, 195, yPos + 8);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("NAME OF PRODUCT", 18, yPos + 5.5);
  doc.text("BAGS", 95, yPos + 5.5);
  doc.text("MUN", 120, yPos + 5.5);
  doc.text("K.G", 140, yPos + 5.5);
  doc.text("RATE (MUN)", 155, yPos + 5.5);
  doc.text("NET AMOUNT", 175, yPos + 5.5);

  yPos += 14;
  doc.setFont("helvetica", "normal");

  const itemName = entry.itemId?.name || "—";
  doc.text(itemName, 18, yPos);

  const bags = entry.kattay ? String(entry.kattay) : "—";
  doc.text(bags, 95, yPos);

  const netKg = entry.receivedWeight ? Number(entry.receivedWeight) : 0;
  const mun = netKg > 0 ? (netKg / 40).toFixed(3) : "—";
  doc.text(String(mun), 120, yPos);

  doc.text("40", 140, yPos);

  const rateStr = entry.rate ? formatMoney(entry.rate) : "—";
  doc.text(rateStr, 155, yPos);

  const baseTotal = netKg > 0 && entry.rate ? Math.round((netKg / 40) * entry.rate) : 0;
  doc.text(formatMoney(baseTotal), 175, yPos);

  yPos = 200; // increased from 175 to give more professional space
  doc.line(15, yPos, 195, yPos);

  // --- SUMMARY SECTION ---
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  doc.text("Total Weight (Gross)", 15, yPos);
  const grossWeight = netKg + (entry.shCut || 0);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(grossWeight), 50, yPos);

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("S.H Cut (250g/Mun)", 15, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(String(entry.shCut || 0), 50, yPos);

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Net Weight", 15, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(netKg), 50, yPos);

  // Right calculations
  let rightY = 200 + 8;
  doc.setFont("helvetica", "bold");
  doc.text("GROSS AMOUNT:", 130, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(baseTotal), 195, rightY, { align: "right" });

  rightY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("BARDANA TOTAL:", 130, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(entry.bardanaAmount || 0), 195, rightY, { align: "right" });

  doc.setLineWidth(0.1);
  doc.line(130, rightY + 2, 195, rightY + 2);

  rightY += 9;
  doc.setFont("helvetica", "bold");
  doc.text("NET AMOUNT:", 130, rightY);
  doc.setFontSize(11);
  doc.text(formatMoney(entry.amount), 195, rightY, { align: "right" });
  doc.setFontSize(9);

  // --- MEMO SECTION ---
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Memo:", 15, yPos);

  yPos += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(entry.notes || "—", 15, yPos);

  doc.line(140, yPos + 35, 195, yPos + 35);
  doc.setFont("helvetica", "bold");
  doc.text("Verified By", 158, yPos + 40);

  doc.save(`purchase-invoice-${entryNo.replace(/\//g, "-")}.pdf`);
}
