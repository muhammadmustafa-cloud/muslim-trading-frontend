import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const MARGIN = 14;
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "—";
const formatMoney = (n) =>
  n != null && n !== "" ? Number(n).toLocaleString("en-PK") : "—";
const formatDay = (d) =>
  d ? new Date(d).toLocaleDateString("en-PK", { weekday: "short", timeZone: "Asia/Karachi" }) : "—";

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
    `Generated: ${new Date().toLocaleDateString("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" })} ${new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" })}`,
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

  let lastDrawnRowIndex = -1;

  autoTable(doc, {
    startY: y,
    head: [["Date", "Day", "Description", "Bag", "Rate", "Payment Due Date", "Credit (Aamad)", "Debit (Kharch)", "Balance"]],
    body: ledger.map((item) => [
      formatDate(item.date),
      formatDay(item.date),
      item.description,
      item.bags > 0 ? item.bags : "—",
      item.rate || "—",
      formatDate(item.dueDate),
      item.credit > 0 ? formatMoney(item.credit) : "—",
      item.debit > 0 ? formatMoney(item.debit) : "—",
      formatMoney(Math.abs(item.balance)) + (item.balance >= 0 ? " Dr" : " Cr"),
    ]),
    foot: [
      [
        "", "",
        "RUNNING TOTALS",
        "", "", "",
        "",
        "",
        "",
      ],
    ],
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 12 },
      2: { cellWidth: "auto" },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "center", cellWidth: 15 },
      5: { halign: "center", cellWidth: 22 },
      6: { halign: "right", cellWidth: 20, fontStyle: "bold" },
      7: { halign: "right", cellWidth: 20, fontStyle: "bold" },
      8: { halign: "right", cellWidth: 22, fontStyle: "bold" },
    },
    ...tableTheme,
    theme: "grid",
    styles: { ...tableTheme.styles, lineWidth: 0.1, lineColor: [200, 200, 200] },
    willDrawCell: (data) => {
      if (data.row.section === 'body') {
        lastDrawnRowIndex = Math.max(lastDrawnRowIndex, data.row.index);
      }

      if (data.row.section === 'foot') {
        const isLastPage = (lastDrawnRowIndex === ledger.length - 1);
        
        let runningBags = 0;
        let runningCredit = 0;
        let runningDebit = 0;
        let runningBalance = 0;

        // Calculate deterministic running totals up to the current row
        for (let i = 0; i <= lastDrawnRowIndex; i++) {
          const item = ledger[i];
          if (item) {
            runningBags += Number(item.bags) || 0;
            runningCredit += Number(item.credit) || 0;
            runningDebit += Number(item.debit) || 0;
            runningBalance = item.balance !== undefined ? item.balance : (runningDebit - runningCredit);
          }
        }
        
        let displayCredit = runningCredit;
        let displayDebit = runningDebit;
        let displayBalance = runningBalance;

        // On the final page, prefer the backend summary object if provided
        if (isLastPage && summary) {
          displayCredit = summary.totalCredit !== undefined ? summary.totalCredit : runningCredit;
          displayDebit = summary.totalDebit !== undefined ? summary.totalDebit : runningDebit;
          displayBalance = summary.finalBalance !== undefined ? summary.finalBalance : runningBalance;
        }

        const balSign = displayBalance >= 0 ? " Dr" : " Cr";
        const formattedBalance = formatMoney(Math.abs(displayBalance)) + balSign;

        if (data.column.index === 0) {
          data.cell.text = [""];
        } else if (data.column.index === 1) {
          data.cell.text = [""];
        } else if (data.column.index === 2) {
          data.cell.text = [isLastPage ? "GRAND TOTALS" : "RUNNING TOTALS"];
        } else if (data.column.index === 3) {
          data.cell.text = [runningBags > 0 ? formatMoney(runningBags) : "—"];
        } else if (data.column.index === 6) {
          data.cell.text = [formatMoney(displayCredit)];
        } else if (data.column.index === 7) {
          data.cell.text = [formatMoney(displayDebit)];
        } else if (data.column.index === 8) {
          data.cell.text = [formattedBalance];
        }
      }
    }
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

  let lastDrawnRowIndex = -1;

  autoTable(doc, {
    startY: y,
    head: [["Date", "Day", "Description", "Bag", "Rate", "Payment Due Date", "Credit (Aamad)", "Debit (Kharch)", "Balance"]],
    body: ledger.map((item) => [
      formatDate(item.date),
      formatDay(item.date),
      item.description,
      item.bags > 0 ? item.bags : "—",
      item.rate || "—",
      formatDate(item.dueDate),
      item.credit > 0 ? formatMoney(item.credit) : "—",
      item.debit > 0 ? formatMoney(item.debit) : "—",
      formatMoney(Math.abs(item.balance)) + (item.balance <= 0 ? " Cr" : " Dr"),
    ]),
    foot: [
      [
        "", "",
        "RUNNING TOTALS",
        "", "", "",
        "",
        "",
        "",
      ],
    ],
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 12 },
      2: { cellWidth: "auto" },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "center", cellWidth: 15 },
      5: { halign: "center", cellWidth: 22 },
      6: { halign: "right", cellWidth: 20, fontStyle: "bold" },
      7: { halign: "right", cellWidth: 20, fontStyle: "bold" },
      8: { halign: "right", cellWidth: 22, fontStyle: "bold" },
    },
    ...tableTheme,
    theme: "grid",
    styles: { ...tableTheme.styles, lineWidth: 0.1, lineColor: [200, 200, 200] },
    willDrawCell: (data) => {
      if (data.row.section === 'body') {
        lastDrawnRowIndex = Math.max(lastDrawnRowIndex, data.row.index);
      }

      if (data.row.section === 'foot') {
        const isLastPage = (lastDrawnRowIndex === ledger.length - 1);
        
        let runningBags = 0;
        let runningCredit = 0;
        let runningDebit = 0;
        let runningBalance = 0;

        // Calculate deterministic running totals up to the current row
        for (let i = 0; i <= lastDrawnRowIndex; i++) {
          const item = ledger[i];
          if (item) {
            runningBags += Number(item.bags) || 0;
            runningCredit += Number(item.credit) || 0;
            runningDebit += Number(item.debit) || 0;
            runningBalance = item.balance !== undefined ? item.balance : (runningDebit - runningCredit);
          }
        }
        
        let displayCredit = runningCredit;
        let displayDebit = runningDebit;
        let displayBalance = runningBalance;

        // On the final page, prefer the backend summary object if provided
        if (isLastPage && summary) {
          displayCredit = summary.totalCredit !== undefined ? summary.totalCredit : runningCredit;
          displayDebit = summary.totalDebit !== undefined ? summary.totalDebit : runningDebit;
          displayBalance = summary.finalBalance !== undefined ? summary.finalBalance : runningBalance;
        }

        const balSign = displayBalance <= 0 ? " Cr" : " Dr";
        const formattedBalance = formatMoney(Math.abs(displayBalance)) + balSign;

        if (data.column.index === 0) {
          data.cell.text = [""];
        } else if (data.column.index === 1) {
          data.cell.text = [""];
        } else if (data.column.index === 2) {
          data.cell.text = [isLastPage ? "GRAND TOTALS" : "RUNNING TOTALS"];
        } else if (data.column.index === 3) {
          data.cell.text = [runningBags > 0 ? formatMoney(runningBags) : "—"];
        } else if (data.column.index === 6) {
          data.cell.text = [formatMoney(displayCredit)];
        } else if (data.column.index === 7) {
          data.cell.text = [formatMoney(displayDebit)];
        } else if (data.column.index === 8) {
          data.cell.text = [formattedBalance];
        }
      }
    },
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
    if (t.type === "deposit") return "Deposit / Wapas Aya";
    if (t.type === "withdraw") {
      if (t.category === "udhaar") return "Udhaar (Advance)";
      if (t.category === "salary") return "Salary (Advance)";
      return t.category || "Payment";
    }
    if (t.type === "transfer") return "Transfer / Paid via Third Party";
    return t.category || "—";
  };

  const getRowAccount = (t) => {
    if (t.type === "deposit" && t.toAccountId) return t.toAccountId.name || "—";
    return (t.fromAccountId && t.fromAccountId.name) || "—";
  };

  const getDrCr = (t) => {
    const isReceive = t.type === "deposit";
    const cr = (t.type === "accrual" || t.category === "mazdoor_expense" || isReceive) ? (Number(t.amount) || 0) : 0;
    const dr = (t.type === "salary" || t.type === "withdraw" || t.type === "transfer") ? (Number(t.amount) || 0) : 0;
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
      head: [["Date", "Description / Account", "Credit (Aamad)", "Debit (Kharch)", "Balance"]],
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
  doc.text(`Total Bags In: ${data.totalBagsPurchased || 0}  |  Total Bags Out: ${data.totalBagsSold || 0}  |  Stock Balance: ${data.stockBalanceBags || 0}`, MARGIN, y);
  y += 6;
  doc.text(
    `Total Cost: ${formatMoney(totalCost)}  |  Total Revenue: ${formatMoney(totalRevenue)}  |  Profit: ${formatMoney(profit)}`,
    MARGIN,
    y
  );
  y += 6;
  const pDharo = data.totalMunPurchased > 0 ? (totalCost / data.totalMunPurchased).toFixed(2) : "—";
  const sDharo = data.totalMunSold > 0 ? (totalRevenue / data.totalMunSold).toFixed(2) : "—";
  doc.text(
    `Purchase Dharo: ${pDharo}  |  Sale Dharo (Avg): ${sDharo}`,
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
    const mun = weight > 0 ? (weight / 40).toFixed(3) : 0;

    const dateObj = new Date(row.date);
    const day = isNaN(dateObj) ? "—" : dateObj.toLocaleDateString("en-PK", { weekday: 'short' });

    return [
      formatDate(row.date),
      day,
      `${participant}${row.note ? `\nNote: ${row.note}` : ""}`,
      !isSale && bags > 0 ? bags : "—",
      isSale && bags > 0 ? bags : "—",
      !isSale && mun > 0 ? mun : "—",
      isSale && mun > 0 ? mun : "—",
      !isSale ? formatMoney(amount) : "—",
      isSale ? formatMoney(amount) : "—",
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Date", "Day", "Customer/Supplier", "Pur Bag", "Sale Bag", "Pur Mun", "Sale Mun", "Pur Amt (Dr)", "Sale Amt (Cr)"]],
    body: formattedRows,
    foot: [
      [
        { content: "GRAND TOTALS", colSpan: 3, styles: { halign: "right", fontStyle: "bold", fillColor: [30, 41, 59] } },
        { content: String(data.totalBagsPurchased || 0), styles: { halign: "center", fontStyle: "bold", fillColor: [30, 41, 59] } },
        { content: String(data.totalBagsSold || 0), styles: { halign: "center", fontStyle: "bold", fillColor: [30, 41, 59] } },
        { content: (data.totalMunPurchased || 0).toFixed(3), styles: { halign: "center", fontStyle: "bold", fillColor: [30, 41, 59] } },
        { content: (data.totalMunSold || 0).toFixed(3), styles: { halign: "center", fontStyle: "bold", fillColor: [30, 41, 59] } },
        { content: formatMoney(totalCost), styles: { halign: "right", fontStyle: "bold", fillColor: [30, 41, 59] } },
        { content: formatMoney(totalRevenue), styles: { halign: "right", fontStyle: "bold", fillColor: [30, 41, 59] } },
      ],
    ],
    ...tableTheme,
    theme: "grid",
    styles: { ...tableTheme.styles, fontSize: 7, lineWidth: 0.1 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 12 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 15, halign: "center" },
      6: { cellWidth: 18, halign: "center" },
      7: { cellWidth: 22, halign: "right" },
      8: { cellWidth: 22, halign: "right" },
    },
  });

  // Final Net Result
  const finalY = doc.lastAutoTable.finalY + 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  const finalSaleDharo = data.totalMunSold > 0 ? (totalRevenue / data.totalMunSold).toFixed(2) : "—";
  const remainingBags = Math.abs((data.totalBagsPurchased || 0) - (data.totalBagsSold || 0));
  const remainingMun = Math.abs((data.totalMunPurchased || 0) - (data.totalMunSold || 0)).toFixed(3);
  const balanceAmount = totalCost - totalRevenue;

  const lines = [
    `Remaining Bags: ${data.totalBagsPurchased || 0} - ${data.totalBagsSold || 0} = ${remainingBags}`,
    `Remaining Mun: ${(data.totalMunPurchased || 0).toFixed(3)} - ${(data.totalMunSold || 0).toFixed(3)} = ${remainingMun}`,
    `Balance Amount: ${formatMoney(totalCost)} - ${formatMoney(totalRevenue)} = ${formatMoney(Math.abs(balanceAmount))}`,
    `Sale Dharo: ${finalSaleDharo}`
  ];
  doc.text(lines, pageWidth - MARGIN, finalY, { align: "right" });

  addPageNumbers(doc);
  doc.save(`${(data.name || "item").replace(/\s+/g, "-")}-khata.pdf`);
}

/**
 * Party Ledger PDF — unified sale + purchase + payment with weight detail.
 */
export function downloadPartyLedgerPdf(name, ledger, summary, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(`Party Ledger — ${name || "Party"}`, MARGIN, y);
  y += 8;
  doc.setFont(undefined, "normal");
  y = addGeneratedLine(doc, y);

  if (filters.dateFrom || filters.dateTo) {
    doc.setFontSize(9);
    const filterStr = [
      filters.dateFrom && `From: ${filters.dateFrom}`,
      filters.dateTo && `To: ${filters.dateTo}`,
    ].filter(Boolean).join(" | ");
    doc.text(filterStr, MARGIN, y);
    y += 6;
  }

  // Summary line
  doc.setFontSize(9);
  doc.text(
    `Sales: ${formatMoney(summary.totalSaleAmount || 0)} (${summary.totalSaleBags || 0} bags, ${(summary.totalSaleMun || 0).toFixed(2)} MUN)  |  ` +
    `Purchases: ${formatMoney(summary.totalPurchaseAmount || 0)} (${summary.totalPurchaseBags || 0} bags, ${(summary.totalPurchaseMun || 0).toFixed(2)} MUN)`,
    MARGIN, y
  );
  y += 6;
  doc.setFont(undefined, "bold");
  const bal = summary.netBalance || 0;
  doc.text(
    `Net Balance: Rs. ${formatMoney(Math.abs(bal))} ${bal >= 0 ? "Receivable (Dr)" : "Payable (Cr)"}`,
    MARGIN, y
  );
  doc.setFont(undefined, "normal");
  y += 10;

  const typeLabels = { opening: "Opening", sale: "Sale", purchase: "Purchase", payment: "Payment" };

  autoTable(doc, {
    startY: y,
    head: [["Date", "Type", "Description", "Bags", "Gross", "Net", "MUN", "Rate"]],
    body: (ledger || []).map((row) => {
      const isPayment = row.type === "payment" || row.type === "opening";
      return [
        formatDate(row.date),
        typeLabels[row.type] || row.type,
        row.description + (row.truckNumber ? ` (${row.truckNumber})` : ""),
        !isPayment && row.bags > 0 ? row.bags : "—",
        !isPayment && row.grossWeight > 0 ? formatMoney(row.grossWeight) : "—",
        !isPayment && row.netWeight > 0 ? formatMoney(row.netWeight) : "—",
        !isPayment && row.mun > 0 ? Number(row.mun).toFixed(3) : "—",
        !isPayment && row.avgRate > 0 ? formatMoney(row.avgRate) : "—",
      ];
    }),
    foot: [
      [
        { content: "SALES TOTAL", colSpan: 3, styles: { halign: "right" } },
        String(summary.totalSaleBags || 0),
        "—", "—",
        (summary.totalSaleMun || 0).toFixed(3),
        "—",
      ],
      [
        { content: "PURCHASES TOTAL", colSpan: 3, styles: { halign: "right" } },
        String(summary.totalPurchaseBags || 0),
        "—", "—",
        (summary.totalPurchaseMun || 0).toFixed(3),
        "—",
      ],
    ],
    ...tableTheme,
    theme: "grid",
    styles: { ...tableTheme.styles, fontSize: 8, lineWidth: 0.1 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8 },
    footStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold", fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 20 },
      2: { cellWidth: "auto" },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 20, halign: "center" },
      7: { cellWidth: 20, halign: "right" },
    },
  });

  addPageNumbers(doc);
  doc.save(`party-ledger-${(name || "party").replace(/\s+/g, "-")}.pdf`);
}


/**
 * Sub-Item Ledger PDF: specific sales history for a warehouse/batch.
 */
export function downloadSubItemLedgerPdf(data, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(`${data.name || "Sub-Item"} History`, MARGIN, y);
  y += 8;
  doc.setFont(undefined, "normal");
  y = addGeneratedLine(doc, y);
  
  if (data.parentName) {
    doc.setFontSize(10);
    doc.text(`Parent Item: ${data.parentName}`, MARGIN, y);
    y += 6;
  }

  if (filters.dateFrom || filters.dateTo) {
    doc.setFontSize(9);
    const filterStr = [
      filters.dateFrom && `From: ${filters.dateFrom}`,
      filters.dateTo && `To: ${filters.dateTo}`,
    ].filter(Boolean).join(" | ");
    doc.text(filterStr, MARGIN, y);
    y += 6;
  }

  doc.setFontSize(9);
  doc.text(
    `Total Bags Sold: ${data.totalBagsSold || 0}  |  Weight Sold (MUN): ${(data.totalMunSold || 0).toFixed(3)}  |  Total Revenue: Rs. ${formatMoney(data.totalRevenue)}`,
    MARGIN,
    y
  );
  y += 10;

  const body = (data.sales || []).map((row) => [
    formatDate(row.date),
    `${row.customerId?.name || "Customer"}\nRef: ${row._id.slice(-6).toUpperCase()}`,
    row.kattay || 0,
    (row.quantity / 40).toFixed(3),
    formatMoney(row.rate),
    formatMoney(row.totalAmount),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Date", "Customer / Ref", "Bags", "MUN", "Rate", "Amount (Rs.)"]],
    body,
    foot: [[
      { content: "TOTALS", colSpan: 2, styles: { halign: "right" } },
      String(data.totalBagsSold || 0),
      (data.totalMunSold || 0).toFixed(3),
      "—",
      formatMoney(data.totalRevenue),
    ]],
    ...tableTheme,
    theme: "grid",
    styles: { ...tableTheme.styles, fontSize: 8.5, lineWidth: 0.1 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 30, halign: "right" },
    },
  });

  addPageNumbers(doc);
  doc.save(`${(data.name || "subitem").replace(/\s+/g, "-")}-history.pdf`);
}

/**
 * Aggregated Sub-Items Summary PDF: how much sold per warehouse for a main item.
 */
export function downloadSubItemsSummaryPdf(mainItemName, data, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text(`Sub-Items Stock Summary — ${mainItemName}`, MARGIN, y);
  y += 8;
  doc.setFont(undefined, "normal");
  y = addGeneratedLine(doc, y);

  if (filters.dateFrom || filters.dateTo) {
    doc.setFontSize(9);
    const filterStr = [
      filters.dateFrom && `From: ${filters.dateFrom}`,
      filters.dateTo && `To: ${filters.dateTo}`,
    ].filter(Boolean).join(" | ");
    doc.text(filterStr, MARGIN, y);
    y += 8;
  }

  const totals = {
    inBags: data.reduce((sum, r) => sum + (r.inBags || 0), 0),
    inWeight: data.reduce((sum, r) => sum + (r.inWeight || 0), 0),
    inMun: data.reduce((sum, r) => sum + (r.inMun || 0), 0),
    outBags: data.reduce((sum, r) => sum + (r.outBags || 0), 0),
    outWeight: data.reduce((sum, r) => sum + (r.outWeight || 0), 0),
    outMun: data.reduce((sum, r) => sum + (r.outMun || 0), 0),
    balanceBags: data.reduce((sum, r) => sum + (r.balanceBags || 0), 0),
    balanceWeight: data.reduce((sum, r) => sum + (r.balanceWeight || 0), 0),
    balanceMun: data.reduce((sum, r) => sum + (r.balanceMun || 0), 0),
  };

  const body = data.map((row) => [
    `${row.name}\n(${row.quality || "—"})`,
    row.inBags || 0,
    Number(row.inWeight || 0).toLocaleString(),
    Number(row.inMun || 0).toFixed(3),
    row.outBags || 0,
    Number(row.outWeight || 0).toLocaleString(),
    Number(row.outMun || 0).toFixed(3),
    row.balanceBags || 0,
    Number(row.balanceWeight || 0).toLocaleString(),
    Number(row.balanceMun || 0).toFixed(3),
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        { content: "Warehouse / Quality", rowSpan: 2, styles: { valign: "middle", halign: "left" } },
        { content: "Stock IN (Credit)", colSpan: 3, styles: { halign: "center", fillColor: [161, 98, 7] } },
        { content: "Stock OUT (Debit)", colSpan: 3, styles: { halign: "center", fillColor: [67, 56, 202] } },
        { content: "Balance (Baqi)", colSpan: 3, styles: { halign: "center", fillColor: [4, 120, 87] } },
      ],
      [
        { content: "Bags", styles: { halign: "center", fillColor: [217, 119, 6] } },
        { content: "Weight (Kg)", styles: { halign: "center", fillColor: [217, 119, 6] } },
        { content: "MUN", styles: { halign: "center", fillColor: [217, 119, 6] } },
        { content: "Bags", styles: { halign: "center", fillColor: [99, 102, 241] } },
        { content: "Weight (Kg)", styles: { halign: "center", fillColor: [99, 102, 241] } },
        { content: "MUN", styles: { halign: "center", fillColor: [99, 102, 241] } },
        { content: "Bags", styles: { halign: "center", fillColor: [16, 185, 129] } },
        { content: "Weight (Kg)", styles: { halign: "center", fillColor: [16, 185, 129] } },
        { content: "MUN", styles: { halign: "center", fillColor: [16, 185, 129] } },
      ],
    ],
    body,
    foot: [[
      { content: "COMBINED TOTALS", styles: { halign: "right", fontStyle: "bold" } },
      { content: totals.inBags, styles: { halign: "center" } },
      { content: totals.inWeight.toLocaleString(), styles: { halign: "right" } },
      { content: totals.inMun.toFixed(3), styles: { halign: "center", fontStyle: "bold" } },
      { content: totals.outBags, styles: { halign: "center" } },
      { content: totals.outWeight.toLocaleString(), styles: { halign: "right" } },
      { content: totals.outMun.toFixed(3), styles: { halign: "center", fontStyle: "bold" } },
      { content: totals.balanceBags, styles: { halign: "center" } },
      { content: totals.balanceWeight.toLocaleString(), styles: { halign: "right" } },
      { content: totals.balanceMun.toFixed(3), styles: { halign: "center", fontStyle: "bold" } },
    ]],
    theme: "grid",
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 7, cellPadding: 2, lineWidth: 0.1, textColor: [30, 41, 59] },
    headStyles: { textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { halign: "center", cellWidth: 14 },
      2: { halign: "right", cellWidth: 20 },
      3: { halign: "center", cellWidth: 16, fontStyle: "bold" },
      4: { halign: "center", cellWidth: 14 },
      5: { halign: "right", cellWidth: 20 },
      6: { halign: "center", cellWidth: 16, fontStyle: "bold" },
      7: { halign: "center", cellWidth: 14 },
      8: { halign: "right", cellWidth: 20 },
      9: { halign: "center", cellWidth: 16, fontStyle: "bold" },
    },
  });

  addPageNumbers(doc);
  doc.save(`${(mainItemName || "item").replace(/\s+/g, "-")}-sub-items-summary.pdf`);
}

/**
 * Warehouse Item Ledger PDF: Detailed IN/OUT rows for warehouse.
 */
export function downloadWarehouseLedgerPdf(data, filters = {}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = 15;

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text(`Warehouse Ledger — ${data.itemName || "Item"}`, MARGIN, y);
  y += 8;
  doc.setFont(undefined, "normal");
  y = addGeneratedLine(doc, y);

  if (filters.dateFrom || filters.dateTo) {
    doc.setFontSize(9);
    const filterStr = [
      filters.dateFrom && `From: ${filters.dateFrom}`,
      filters.dateTo && `To: ${filters.dateTo}`,
    ].filter(Boolean).join(" | ");
    doc.text(filterStr, MARGIN, y);
    y += 8;
  }

  const totals = data.totals || {};

  doc.setFontSize(9);
  doc.text(
    `Total IN: ${totals.totalInBags || 0} Bags | ${(totals.totalInWeight / 40 || 0).toFixed(3)} MUN | Master: ${(totals.totalInMasterWeight || 0).toLocaleString()} kg | FSD: ${(totals.totalInFsdWeight || 0).toLocaleString()} kg   -   Total OUT: ${totals.totalOutBags || 0} Bags | ${(totals.totalOutWeight / 40 || 0).toFixed(3)} MUN | Master: ${(totals.totalOutMasterWeight || 0).toLocaleString()} kg | FSD: ${(totals.totalOutFsdWeight || 0).toLocaleString()} kg`,
    MARGIN,
    y
  );
  y += 6;
  doc.setFont(undefined, "bold");
  doc.text(
    `Current Balance: ${totals.balanceBags || 0} Bags | ${(totals.balanceWeight / 40 || 0).toFixed(3)} MUN | Master: ${(totals.balanceMasterWeight || 0).toLocaleString()} kg | FSD: ${(totals.balanceFsdWeight || 0).toLocaleString()} kg`,
    MARGIN,
    y
  );
  y += 10;

  const body = (data.ledger || []).map((row) => [
    formatDate(row.date),
    `${row.partyName}${row.truckNumber ? ` (Truck: ${row.truckNumber})` : ""}\n[${row.source}]${row.note ? ` - ${row.note}` : ""}`,
    row.itemName || "—",
    // Credit
    row.type === 'IN' && row.bagsIn > 0 ? row.bagsIn : "—",
    row.type === 'IN' && row.weightIn > 0 ? (row.weightIn / 40).toFixed(3) : "—",
    row.type === 'IN' && row.masterWeightIn > 0 ? `${row.masterWeightIn.toLocaleString()} kg` : "—",
    row.type === 'IN' && row.fsdWeightIn > 0 ? `${row.fsdWeightIn.toLocaleString()} kg` : "—",
    // Debit
    row.type === 'OUT' && row.bagsOut > 0 ? row.bagsOut : "—",
    row.type === 'OUT' && row.weightOut > 0 ? (row.weightOut / 40).toFixed(3) : "—",
    row.type === 'OUT' && row.fsdWeightOut > 0 ? `${row.fsdWeightOut.toLocaleString()} kg` : "—",
    // Balance
    row.balanceBags !== undefined ? row.balanceBags : "—",
    row.balanceWeight !== undefined ? (row.balanceWeight / 40).toFixed(3) : "—",
    row.balanceMasterWeight !== undefined ? `${row.balanceMasterWeight.toLocaleString()} kg` : "—",
    row.balanceFsdWeight !== undefined ? `${row.balanceFsdWeight.toLocaleString()} kg` : "—",
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        { content: "Date", rowSpan: 2, styles: { valign: "middle", halign: "left" } },
        { content: "Particulars", rowSpan: 2, styles: { valign: "middle", halign: "left" } },
        { content: "Item", rowSpan: 2, styles: { valign: "middle", halign: "left" } },
        { content: "Credit (Stock In)", colSpan: 4, styles: { halign: "center", fillColor: [4, 120, 87] } },
        { content: "Debit (Stock Out)", colSpan: 3, styles: { halign: "center", fillColor: [67, 56, 202] } },
        { content: "Balance", colSpan: 4, styles: { halign: "center", fillColor: [180, 83, 9] } },
      ],
      [
        { content: "Bags", styles: { halign: "center", fillColor: [16, 185, 129] } },
        { content: "MUN", styles: { halign: "center", fillColor: [16, 185, 129] } },
        { content: "JCD", styles: { halign: "center", fillColor: [5, 150, 105] } },
        { content: "FSD", styles: { halign: "center", fillColor: [4, 120, 87] } },

        { content: "Bags", styles: { halign: "center", fillColor: [99, 102, 241] } },
        { content: "MUN", styles: { halign: "center", fillColor: [99, 102, 241] } },
        { content: "FSD", styles: { halign: "center", fillColor: [67, 56, 202] } },

        { content: "Bags", styles: { halign: "center", fillColor: [217, 119, 6] } },
        { content: "MUN", styles: { halign: "center", fillColor: [217, 119, 6] } },
        { content: "JCD", styles: { halign: "center", fillColor: [180, 83, 9] } },
        { content: "FSD", styles: { halign: "center", fillColor: [146, 64, 14] } },
      ],
    ],
    body,
    foot: [[
      { content: "TOTALS", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
      // Credit
      { content: String(totals.totalInBags || 0), styles: { halign: "center" } },
      { content: (totals.totalInWeight / 40 || 0).toFixed(3), styles: { halign: "center", fontStyle: "bold" } },
      { content: `${(totals.totalInMasterWeight || 0).toLocaleString()} kg`, styles: { halign: "center" } },
      { content: `${(totals.totalInFsdWeight || 0).toLocaleString()} kg`, styles: { halign: "center" } },
      // Debit
      { content: String(totals.totalOutBags || 0), styles: { halign: "center" } },
      { content: (totals.totalOutWeight / 40 || 0).toFixed(3), styles: { halign: "center", fontStyle: "bold" } },
      { content: `${(totals.totalOutFsdWeight || 0).toLocaleString()} kg`, styles: { halign: "center" } },
      // Balance
      { content: String(totals.balanceBags || 0), styles: { halign: "center" } },
      { content: (totals.balanceWeight / 40 || 0).toFixed(3), styles: { halign: "center", fontStyle: "bold" } },
      { content: `${(totals.balanceMasterWeight || 0).toLocaleString()} kg`, styles: { halign: "center" } },
      { content: `${(totals.balanceFsdWeight || 0).toLocaleString()} kg`, styles: { halign: "center" } },
    ]],
    theme: "grid",
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 6.5, cellPadding: 1.5, lineWidth: 0.1, textColor: [30, 41, 59] },
    headStyles: { textColor: 255, fontStyle: "bold", fontSize: 7 },
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 22 },
      3: { halign: "center", cellWidth: 10 },
      4: { halign: "center", cellWidth: 15, fontStyle: "bold" },
      5: { halign: "center", cellWidth: 18 },
      6: { halign: "center", cellWidth: 18 },
      7: { halign: "center", cellWidth: 10 },
      8: { halign: "center", cellWidth: 15, fontStyle: "bold" },
      9: { halign: "center", cellWidth: 18 },
      10: { halign: "center", cellWidth: 10 },
      11: { halign: "center", cellWidth: 15, fontStyle: "bold" },
      12: { halign: "center", cellWidth: 18 },
      13: { halign: "center", cellWidth: 18 },
    },
  });

  addPageNumbers(doc);
  doc.save(`${(data.itemName || "item").replace(/\s+/g, "-")}-warehouse-ledger.pdf`);
}