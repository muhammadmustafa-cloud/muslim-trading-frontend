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
 * Generate PDF for customer history (Unified Ledger).
 */
export function downloadCustomerHistoryPdf(name, ledger, summary, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(`Customer Ledger (Khatta) — ${name}`, MARGIN, y);
  y += 8;
  doc.setFont(undefined, "normal");
  y = addGeneratedLine(doc, y);
  if (filters.dateFrom || filters.dateTo) {
    doc.setFontSize(9);
    const filterStr = [
      filters.dateFrom && `From: ${filters.dateFrom}`,
      filters.dateTo && `To: ${filters.dateTo}`,
    ]
      .filter(Boolean)
      .join(" | ");
    doc.text(filterStr, MARGIN, y);
    y += 8;
  }

  autoTable(doc, {
    startY: y,
    head: [["Date", "Description", "Bags", "Debit (Dr)", "Credit (Cr)", "Balance"]],
    body: ledger.map((item) => [
      formatDate(item.date),
      item.description,
      item.bags > 0 ? item.bags : "—",
      item.debit > 0 ? formatMoney(item.debit) : "—",
      item.credit > 0 ? formatMoney(item.credit) : "—",
      formatMoney(Math.abs(item.balance)) + (item.balance >= 0 ? " Dr" : " Cr"),
    ]),
    foot: [
      [
        "",
        "TOTALS",
        "",
        formatMoney(summary.totalDebit),
        formatMoney(summary.totalCredit),
        formatMoney(Math.abs(summary.finalBalance)) + (summary.finalBalance >= 0 ? " Dr" : " Cr"),
      ],
    ],
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 15 },
      3: { halign: "right", cellWidth: 25 },
      4: { halign: "right", cellWidth: 25 },
      5: { halign: "right", cellWidth: 25 },
    },
    ...tableTheme,
  });

  addPageNumbers(doc);
  doc.save(`customer-ledger-${(name || "customer").replace(/\s+/g, "-")}.pdf`);
}

/**
 * Generate PDF for supplier history (Unified Ledger).
 */
export function downloadSupplierHistoryPdf(name, ledger, summary, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(`Supplier Ledger (Khatta) — ${name}`, MARGIN, y);
  y += 8;
  doc.setFont(undefined, "normal");
  y = addGeneratedLine(doc, y);
  if (filters.dateFrom || filters.dateTo) {
    doc.setFontSize(9);
    const filterStr = [
      filters.dateFrom && `From: ${filters.dateFrom}`,
      filters.dateTo && `To: ${filters.dateTo}`,
    ]
      .filter(Boolean)
      .join(" | ");
    doc.text(filterStr, MARGIN, y);
    y += 8;
  }

  autoTable(doc, {
    startY: y,
    head: [["Date", "Description", "Bags", "Debit (Dr)", "Credit (Cr)", "Balance"]],
    body: ledger.map((item) => [
      formatDate(item.date),
      item.description,
      item.bags > 0 ? item.bags : "—",
      item.debit > 0 ? formatMoney(item.debit) : "—",
      item.credit > 0 ? formatMoney(item.credit) : "—",
      formatMoney(Math.abs(item.balance)) + (item.balance >= 0 ? " Dr" : " Cr"),
    ]),
    foot: [
      [
        "",
        "TOTALS",
        "",
        formatMoney(summary.totalDebit),
        formatMoney(summary.totalCredit),
        formatMoney(Math.abs(summary.finalBalance)) + (summary.finalBalance >= 0 ? " Dr" : " Cr"),
      ],
    ],
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 15 },
      3: { halign: "right", cellWidth: 25 },
      4: { halign: "right", cellWidth: 25 },
      5: { halign: "right", cellWidth: 25 },
    },
    ...tableTheme,
  });

  addPageNumbers(doc);
  doc.save(`supplier-ledger-${(name || "supplier").replace(/\s+/g, "-")}.pdf`);
}

/**
 * Mazdoor history: transactions (salary/udhaar paid + udhaar received).
 */
export function downloadMazdoorHistoryPdf(name, transactions, totalPaid, totalReceived, totalEarned, balance, filters = {}) {
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
  doc.text(
    `Total kamaai: ${formatMoney(totalEarned)}  |  Total diya: ${formatMoney(totalPaid)}  |  Wapas mila: ${formatMoney(totalReceived)}`,
    MARGIN,
    y
  );
  y += 6;
  doc.setFont(undefined, "bold");
  doc.text(
    `Net Financial Position: ${formatMoney(Math.abs(balance))} ${balance >= 0 ? "Cr" : "Dr"} (${balance < 0 ? "Worker owes mill" : balance > 0 ? "Mill owes worker" : "Settled"})`,
    MARGIN,
    y
  );
  y += 10;
  const getRowType = (t) => {
    if (t.type === "salary" || (t.type === "withdraw" && t.category === "salary")) return "Salary Paid";
    if (t.type === "withdraw" && t.category === "udhaar") return "Udhaar (Advance)";
    if (t.type === "accrual") return "Salary Posted (Earned)";
    if (t.category === "mazdoor_expense") return "Work Earned (Wage)";
    if (t.type === "deposit" && t.category === "udhaar_received") return "Udhaar wapas liya";
    if (t.type === "withdraw") {
      if (t.category === "udhaar") return "Udhaar (Advance)";
      if (t.category === "salary") return "Salary (Advance)";
      return t.category || "Payment";
    }
    return t.category || "—";
  };

  const getRowAccount = (t) => {
    if (t.type === "deposit" && t.toAccountId) return t.toAccountId.name || "—";
    return (t.fromAccountId && t.fromAccountId.name) || "—";
  };

  const getDrCr = (t) => {
    const isReceive = t.type === "deposit" && t.category === "udhaar_received";
    const cr = (t.type === "accrual" || t.category === "mazdoor_expense" || isReceive) ? (Number(t.amount) || 0) : 0;
    const dr = (t.type === "salary" || t.type === "withdraw") ? (Number(t.amount) || 0) : 0;
    return { dr, cr };
  };

  // Pre-calculate running balances for auditing
  const sortedList = [...(transactions || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
  let curr = 0;
  const balancesMap = {};
  sortedList.forEach((t) => {
    const { dr, cr } = getDrCr(t);
    curr += (cr - dr);
    balancesMap[t._id] = curr;
  });

  if (transactions && transactions.length > 0) {
    autoTable(doc, {
      startY: y,
      theme: "grid", // Professional ledger grid lines
      head: [["Date", "Description / Account", "Credit (+)", "Debit (-)", "Balance"]],
      body: transactions.map((t) => {
        const { dr, cr } = getDrCr(t);
        const bal = balancesMap[t._id] ?? 0;
        return [
          formatDate(t.date),
          { 
            content: `${getRowType(t)}\nVia: ${getRowAccount(t)}${t.note ? `\n"${t.note.slice(0, 50)}"` : ""}`, 
            styles: { fontSize: 7, textColor: [0, 0, 0] } 
          },
          cr > 0 ? formatMoney(cr) : "—",
          dr > 0 ? formatMoney(dr) : "—",
          { 
            content: `${formatMoney(Math.abs(bal))} ${bal >= 0 ? "Cr" : "Dr"}`, 
            styles: { fontStyle: "bold", textColor: [0, 0, 0] } 
          }
        ];
      }),
      foot: [[
        { content: "TOTAL MOVEMENT", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
        { content: formatMoney(totalEarned + totalReceived), styles: { halign: "right", fontStyle: "bold", textColor: [0, 0, 0] } },
        { content: formatMoney(totalPaid), styles: { halign: "right", fontStyle: "bold", textColor: [0, 0, 0] } },
        { 
          content: `${formatMoney(Math.abs(balance))} ${balance >= 0 ? "Cr" : "Dr"}`, 
          styles: { halign: "right", fontStyle: "bold", fillColor: [230, 230, 230], textColor: [0, 0, 0] } 
        }
      ]],
      ...tableTheme,
      styles: { ...tableTheme.styles, textColor: [0, 0, 0], lineWidth: 0.1 }, 
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: "auto" },
        2: { halign: "right", cellWidth: 25 },
        3: { halign: "right", cellWidth: 25 },
        4: { halign: "right", cellWidth: 25 },
      },
    });
  }

  addPageNumbers(doc);
  doc.save(`mazdoor-history-${(name || "mazdoor").replace(/\s+/g, "-")}.pdf`);
}

/**
 * Item Khata: purchases + sales + total cost, revenue, profit.
 */
export function downloadKhataPdf(data, purchases, sales, totalCost, totalRevenue, profit, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(`${data.name || "Item"} Khata`, MARGIN, y);
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
  doc.setFontSize(9);
  doc.text(`Total Bags In: ${data.totalBagsPurchased || 0}  |  Total Bags Out: ${data.totalBagsSold || 0}  |  Stock Balance: ${(data.totalBagsPurchased || 0) - (data.totalBagsSold || 0)}`, MARGIN, y);
  y += 6;
  doc.text(
    `Total Cost: ${formatMoney(totalCost)}  |  Total Revenue: ${formatMoney(totalRevenue)}  |  Profit: ${formatMoney(profit)}`,
    MARGIN,
    y
  );
  y += 10;

  const ledger = [
    ...(purchases || []).map(p => ({ ...p, ledgerType: 'purchase' })),
    ...(sales || []).map(s => ({ ...s, ledgerType: 'sale' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const formattedRows = ledger.map((row) => {
    const isSale = row.ledgerType === 'sale';
    const amount = isSale ? (row.totalAmount || 0) : (row.amount || 0);
    const participant = isSale ? (row.customerId?.name || "Customer") : (row.supplierId?.name || "Supplier");
    const bags = Number(row.kattay) || 0;
    const weight = Number(isSale ? row.quantity : row.receivedWeight) || 0;
    const mun = (weight / 40).toFixed(2);

    return [
      formatDate(row.date),
      `${participant}${row.note ? `\nNote: ${row.note}` : ""}`,
      bags || "—",
      mun > 0 ? mun : "—",
      isSale ? formatMoney(amount) : "—",
      !isSale ? formatMoney(amount) : "—",
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Date", "Audit Detail", "Bags", "Mun", "Sale (Cr)", "Purchase (Dr)"]],
    body: formattedRows,
    foot: [[
      { content: "AUDIT TOTALS", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
      { content: (data.totalBagsPurchased || 0) - (data.totalBagsSold || 0), styles: { halign: "center", fontStyle: "bold" } },
      { content: "—", styles: { halign: "center", fontStyle: "bold" } },
      { content: formatMoney(totalRevenue), styles: { halign: "right", fontStyle: "bold" } },
      { content: formatMoney(totalCost), styles: { halign: "right", fontStyle: "bold" } },
    ]],
    ...tableTheme,
    theme: "grid",
    styles: { ...tableTheme.styles, fontSize: 8, lineWidth: 0.1 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 65 },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 28, halign: "right" },
      5: { cellWidth: 28, halign: "right" },
    },
  });

  // Final Net Result
  const finalY = doc.lastAutoTable.finalY + 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text(`Net Movement (Profit): ${formatMoney(profit)}`, pageWidth - MARGIN, finalY, { align: "right" });

  addPageNumbers(doc);
  doc.save(`${(data.name || "item").replace(/\s+/g, "-")}-khata.pdf`);
}
