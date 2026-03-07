import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const MARGIN = 14;
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatMoney = (n) =>
  n != null && n !== "" ? Number(n).toLocaleString("en-PK") : "—";

const tableTheme = {
  headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold", fontSize: 9 },
  alternateRowColors: true,
  margin: { left: MARGIN, right: MARGIN },
  styles: { fontSize: 8, cellPadding: 3 },
};

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

function addGeneratedLine(doc, y) {
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-PK", { dateStyle: "medium" })} ${new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}`,
    MARGIN,
    y
  );
  doc.setTextColor(0, 0, 0);
  return y + 6;
}

/**
 * Generate PDF for customer history (sales + stock entries).
 */
export function downloadCustomerHistoryPdf(name, sales, stockEntries, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(`Customer History — ${name}`, MARGIN, y);
  y += 8;
  doc.setFont(undefined, "normal");
  y = addGeneratedLine(doc, y);
  if (filters.dateFrom || filters.dateTo || filters.type) {
    doc.setFontSize(9);
    const filterStr = [
      filters.dateFrom && `From: ${filters.dateFrom}`,
      filters.dateTo && `To: ${filters.dateTo}`,
      filters.type && filters.type !== "all" && `Type: ${filters.type}`,
    ]
      .filter(Boolean)
      .join(" | ");
    doc.text(filterStr, MARGIN, y);
    y += 8;
  }

  if (sales && sales.length > 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Sales (Jab isne khareeda)", MARGIN, y);
    y += 6;
    doc.setFont(undefined, "normal");
    autoTable(doc, {
      startY: y,
      head: [["#", "Date", "Item", "Category", "Qty", "Received"]],
      body: sales.map((s, i) => [
        i + 1,
        formatDate(s.date),
        s.itemName || (s.itemId && s.itemId.name) || "—",
        s.category || "—",
        `${s.quantity || ""} ${s.quality || ""}`.trim(),
        formatMoney(s.amountReceived),
      ]),
      ...tableTheme,
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (stockEntries && stockEntries.length > 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Stock Entry (Jab humne inse khareeda)", MARGIN, y);
    y += 6;
    doc.setFont(undefined, "normal");
    autoTable(doc, {
      startY: y,
      head: [["#", "Date", "Item", "Weight", "Paid"]],
      body: stockEntries.map((e, i) => [
        i + 1,
        formatDate(e.date),
        (e.itemId && e.itemId.name) || "—",
        e.receivedWeight ?? "—",
        formatMoney(e.amountPaid),
      ]),
      ...tableTheme,
    });
  }

  addPageNumbers(doc);
  doc.save(`customer-history-${(name || "customer").replace(/\s+/g, "-")}.pdf`);
}

/**
 * Generate PDF for supplier history (stock entries + sales).
 */
export function downloadSupplierHistoryPdf(name, stockEntries, sales, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(`Supplier History — ${name}`, MARGIN, y);
  y += 8;
  doc.setFont(undefined, "normal");
  y = addGeneratedLine(doc, y);
  if (filters.dateFrom || filters.dateTo || filters.type) {
    doc.setFontSize(9);
    const filterStr = [
      filters.dateFrom && `From: ${filters.dateFrom}`,
      filters.dateTo && `To: ${filters.dateTo}`,
      filters.type && filters.type !== "all" && `Type: ${filters.type}`,
    ]
      .filter(Boolean)
      .join(" | ");
    doc.text(filterStr, MARGIN, y);
    y += 8;
  }

  if (stockEntries && stockEntries.length > 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Stock Entry (Jab humne inse khareeda)", MARGIN, y);
    y += 6;
    doc.setFont(undefined, "normal");
    autoTable(doc, {
      startY: y,
      head: [["#", "Date", "Item", "Weight", "Total", "Paid", "Balance", "Status"]],
      body: stockEntries.map((e, i) => [
        i + 1,
        formatDate(e.date),
        (e.itemId && (e.itemId.name || e.itemId)) || "—",
        e.receivedWeight ?? "—",
        formatMoney(e.amount),
        formatMoney(e.amountPaid),
        formatMoney((e.amount || 0) - (e.amountPaid || 0)),
        (e.paymentStatus || 'pending').toUpperCase() + (e.dueDate && e.paymentStatus !== 'paid' ? `\n(Due: ${formatDate(e.dueDate)})` : ""),
      ]),
      ...tableTheme,
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (sales && sales.length > 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Sales (Jab inko becha)", MARGIN, y);
    y += 6;
    doc.setFont(undefined, "normal");
    autoTable(doc, {
      startY: y,
      head: [["#", "Date", "Item", "Category", "Qty", "Received"]],
      body: sales.map((s, i) => [
        i + 1,
        formatDate(s.date),
        s.itemName || (s.itemId && s.itemId.name) || "—",
        s.category || "—",
        `${s.quantity || ""} ${s.quality || ""}`.trim(),
        formatMoney(s.amountReceived),
      ]),
      ...tableTheme,
    });
  }

  addPageNumbers(doc);
  doc.save(`supplier-history-${(name || "supplier").replace(/\s+/g, "-")}.pdf`);
}

/**
 * Mazdoor history: transactions (salary/udhaar paid + udhaar received).
 */
export function downloadMazdoorHistoryPdf(name, transactions, totalPaid, totalReceived, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(`Mazdoor History — ${name}`, MARGIN, y);
  y += 8;
  doc.setFont(undefined, "normal");
  y = addGeneratedLine(doc, y);
  if (filters.dateFrom || filters.dateTo) {
    doc.setFontSize(9);
    doc.text(
      [filters.dateFrom && `From: ${filters.dateFrom}`, filters.dateTo && `To: ${filters.dateTo}`]
        .filter(Boolean)
        .join(" | "),
      MARGIN,
      y
    );
    y += 6;
  }
  doc.setFontSize(10);
  doc.text(
    `Total diya: ${formatMoney(totalPaid)}  |  Total wapas liya: ${formatMoney(totalReceived)}  |  Net: ${formatMoney((totalPaid ?? 0) - (totalReceived ?? 0))}`,
    MARGIN,
    y
  );
  y += 10;

  const getRowType = (t) => {
    if (t.type === "deposit" && t.category === "udhaar_received") return "Udhaar received";
    if (t.type === "withdraw") return t.category === "udhaar" ? "Udhaar" : "Salary";
    return t.category || "—";
  };
  const getRowAccount = (t) => {
    if (t.type === "deposit" && t.toAccountId) return t.toAccountId.name || "—";
    return (t.fromAccountId && t.fromAccountId.name) || "—";
  };

  if (transactions && transactions.length > 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Transactions (salary / udhaar diya + udhaar wapas liya)", MARGIN, y);
    y += 6;
    doc.setFont(undefined, "normal");
    autoTable(doc, {
      startY: y,
      head: [["#", "Date", "Account", "Type", "Amount", "Note"]],
      body: transactions.map((t, i) => [
        i + 1,
        formatDate(t.date),
        getRowAccount(t),
        getRowType(t),
        formatMoney(t.amount),
        (t.note || "—").slice(0, 40),
      ]),
      ...tableTheme,
    });
  }

  addPageNumbers(doc);
  doc.save(`mazdoor-history-${(name || "mazdoor").replace(/\s+/g, "-")}.pdf`);
}

/**
 * Item Khata: purchases + sales + total cost, revenue, profit.
 */
export function downloadKhataPdf(name, purchases, sales, totalCost, totalRevenue, profit, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(`${name} Khata`, MARGIN, y);
  y += 8;
  doc.setFont(undefined, "normal");
  y = addGeneratedLine(doc, y);
  if (filters.dateFrom || filters.dateTo) {
    doc.setFontSize(9);
    doc.text(
      [filters.dateFrom && `From: ${filters.dateFrom}`, filters.dateTo && `To: ${filters.dateTo}`]
        .filter(Boolean)
        .join(" | "),
      MARGIN,
      y
    );
    y += 6;
  }
  doc.setFontSize(10);
  doc.text(
    `Total daala (cost): ${formatMoney(totalCost)}  |  Total becha (revenue): ${formatMoney(totalRevenue)}  |  Profit: ${formatMoney(profit)}`,
    MARGIN,
    y
  );
  y += 10;

  if (purchases && purchases.length > 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Jitna daala (Purchase)", MARGIN, y);
    y += 6;
    doc.setFont(undefined, "normal");
    autoTable(doc, {
      startY: y,
      head: [["#", "Date", "Supplier", "Weight", "Total", "Paid", "Balance"]],
      body: purchases.map((p, i) => [
        i + 1,
        formatDate(p.date),
        (p.supplierId && (p.supplierId.name || p.supplierId)) || "—",
        p.receivedWeight ?? "—",
        formatMoney(p.amount),
        formatMoney(p.amountPaid),
        formatMoney((p.amount || 0) - (p.amountPaid || 0)),
      ]),
      ...tableTheme,
    });
    y = doc.lastAutoTable.finalY + 10;
  }
  if (sales && sales.length > 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Kis ko kitna becha (Sales)", MARGIN, y);
    y += 6;
    doc.setFont(undefined, "normal");
    autoTable(doc, {
      startY: y,
      head: [["#", "Date", "Customer", "Item", "Qty", "Received"]],
      body: sales.map((s, i) => [
        i + 1,
        formatDate(s.date),
        (s.customerId && s.customerId.name) || "—",
        s.itemName || (s.itemId && s.itemId.name) || "—",
        `${s.quantity || ""} ${s.quality || ""}`.trim(),
        formatMoney(s.amountReceived),
      ]),
      ...tableTheme,
    });
  }

  addPageNumbers(doc);
  doc.save(`${(name || "item").replace(/\s+/g, "-")}-khata.pdf`);
}
