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
  headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold", fontSize: 9 },
  alternateRowColors: true,
  rowStartY: undefined,
  margin: { left: MARGIN, right: MARGIN },
  styles: { fontSize: 8, cellPadding: 3 },
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
      5: { cellWidth: 12 },
      6: { cellWidth: 16 },
      7: { cellWidth: 18 },
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
 * Stock Entries report PDF.
 */
export function downloadStockEntriesPdf(entries, filters = {}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const subtitleLines = [];
  if (filters.dateFrom || filters.dateTo)
    subtitleLines.push(`Date: ${filters.dateFrom || "—"} to ${filters.dateTo || "—"}`);
  if (filters.itemId) subtitleLines.push("Filter: Item selected");
  if (filters.supplierId) subtitleLines.push("Filter: Supplier selected");
  subtitleLines.push(`Total records: ${entries.length}`);

  let startY = addReportHeader(doc, "Stock Entries Report", subtitleLines);

  if (!entries.length) {
    doc.setFontSize(10);
    doc.text("No stock entries in this period.", MARGIN, startY);
    doc.save("stock-entries-report.pdf");
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
  doc.save("stock-entries-report.pdf");
}

/**
 * Transactions report PDF.
 */
export function downloadTransactionsPdf(transactions, filters = {}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const subtitleLines = [];
  if (filters.dateFrom || filters.dateTo)
    subtitleLines.push(`Date: ${filters.dateFrom || "—"} to ${filters.dateTo || "—"}`);
  if (filters.accountId) subtitleLines.push("Filter: Account selected");
  subtitleLines.push(`Total records: ${transactions.length}`);

  let startY = addReportHeader(doc, "Transactions Report (Lena-dena)", subtitleLines);

  if (!transactions.length) {
    doc.setFontSize(10);
    doc.text("No transactions in this period.", MARGIN, startY);
    doc.save("transactions-report.pdf");
    return;
  }

  const typeLabel = (t) => (t === "deposit" ? "Deposit" : t === "withdraw" ? "Withdraw" : t === "transfer" ? "Transfer" : t);

  autoTable(doc, {
    startY,
    head: [["#", "Date", "Type", "From Account", "To Account", "Amount", "Category", "Supplier", "Mazdoor", "Note"]],
    body: transactions.map((row, i) => [
      i + 1,
      formatDate(row.date),
      typeLabel(row.type),
      (row.fromAccountId && row.fromAccountId.name) || "—",
      (row.toAccountId && row.toAccountId.name) || "—",
      formatMoney(row.amount),
      (row.category || "—").slice(0, 12),
      (row.supplierId && row.supplierId.name) || "—",
      (row.mazdoorId && row.mazdoorId.name) || "—",
      (row.note || "—").slice(0, 25),
    ]),
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { cellWidth: 20 },
      3: { cellWidth: 28 },
      4: { cellWidth: 28 },
      5: { cellWidth: 22 },
      6: { cellWidth: 22 },
      7: { cellWidth: 25 },
      8: { cellWidth: 25 },
      9: { cellWidth: 38 },
    },
  });

  addPageNumbers(doc);
  doc.save("transactions-report.pdf");
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
    head: [["#", "Item", "Category", "Quantity (kg)", "Quality"]],
    body: stockList.map((row, i) => [
      i + 1,
      row.itemName || "—",
      row.category || "—",
      row.quantity != null ? row.quantity : "—",
      row.quality || "—",
    ]),
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 55 },
      2: { cellWidth: 55 },
      3: { cellWidth: 35 },
      4: { cellWidth: 25 },
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
