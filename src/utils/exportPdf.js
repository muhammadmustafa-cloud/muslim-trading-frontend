import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const MARGIN = 14;
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "—";
const formatMoney = (n) =>
  n != null && n !== "" ? Math.abs(Number(n)).toLocaleString("en-PK") : "—";

function addReportHeader(doc, title, subtitleLines = []) {
  let y = 15;
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(title, MARGIN, y);
  y += 8;
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  const generated = `Generated: ${new Date().toLocaleDateString("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" })} ${new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" })}`;
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
    head: [["#", "Date", "Customer", "Items Count", "Net Wt", "Total Bill", "Received", "Truck", "Account", "Notes"]],
    body: sales.map((row, i) => [
      i + 1,
      formatDate(row.date),
      (row.customerId && row.customerId.name) || "—",
      row.items?.length || 1,
      formatMoney(row.netWeight || (row.totalGrossWeight - row.totalSHCut)),
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
    head: [["#", "Date", "Supplier", "Items Count", "Net Wt", "Total Bill", "Paid", "Balance", "Status"]],
    body: entries.map((row, i) => [
      i + 1,
      formatDate(row.date),
      (row.supplierId && row.supplierId.name) || "—",
      row.items?.length || 1,
      formatMoney(row.netWeight || row.receivedWeight),
      formatMoney(row.totalAmount || row.amount),
      formatMoney(row.amountPaid),
      formatMoney((row.totalAmount || row.amount || 0) - (row.amountPaid || 0)),
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
    ? (() => {
        const firstTx = transactions.find(t =>
          (t.fromAccountId?._id === filters.accountId || t.toAccountId?._id === filters.accountId)
        );
        if (!firstTx) return "Account";
        // Check which side matches the accountId and return that account's name
        if (firstTx.fromAccountId?._id === filters.accountId) {
          return firstTx.fromAccountId?.name || "Account";
        } else {
          return firstTx.toAccountId?.name || "Account";
        }
      })()
    : "All Accounts";

  const rawMaterialName = transactions.length > 0 && filters.rawMaterialHeadId
    ? (transactions.find(t => t.rawMaterialHeadId === filters.rawMaterialHeadId || t.rawMaterialHeadId?._id === filters.rawMaterialHeadId)?.rawMaterialHeadName || "Raw Material")
    : null;

  const reportTitle = rawMaterialName ? `${rawMaterialName} Ledger` : `${accountName} Ledger`;

  subtitleLines.push(`Total records: ${transactions.length}`);

  let startY = addReportHeader(doc, reportTitle, subtitleLines);

  if (!transactions.length) {
    doc.setFontSize(10);
    doc.text("No transactions in this period.", MARGIN, startY);
    doc.save(`${reportTitle.replace(/\s+/g, "_")}.pdf`);
    return;
  }

  // Calculate Totals
  let totalCredit = 0;
  let totalDebit = 0;

  const formattedRows = transactions.map((row, i) => {
    let credit = 0;
    let debit = 0;

    const isMillNature = !filters?.accountId || filters?.isTraditional;

    if (row.type === "transfer") {
      const fromId = (row.fromAccountId?._id || row.fromAccountId)?.toString();
      const toId = (row.toAccountId?._id || row.toAccountId)?.toString();
      const filterId = filters?.accountId?.toString();

      if (filterId) {
        // Outflow Priority Logic: if it's both, count as Credit (Aamad)
        if (fromId === filterId) credit = row.amount;
        else if (toId === filterId) debit = row.amount;
      } else {
        // Global view: From = Credit, To = Debit
        credit = row.amount;
        debit = row.amount;
      }
    } else {
      const isInflow = row.type === "deposit" || row.type === "sale" || row.type === "income";
      if (isMillNature) {
        if (isInflow) credit = row.amount; // Mill Credit
        else debit = row.amount; // Mill Debit
      } else {
        if (isInflow) debit = row.amount; // Bank Debit
        else credit = row.amount; // Bank Credit
      }
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
      else description = row.note || (row.type === 'deposit' ? "Funds Received" : "Payment Made");
    } else if (row.type === 'transfer') {
      participant = `${row.fromAccountId?.name || "—"} ➔ ${row.toAccountId?.name || "—"}`;
      description = "Internal Transfer";
    } else if (row.rawMaterialHeadName) {
      participant = row.rawMaterialHeadName;
      description = row.note || (row.type === "deposit" || row.type === "sale" ? "Material Received" : "Material Outflow");
    } else if (row.taxTypeName) {
      participant = row.taxTypeName;
      description = "Tax Payment";
    } else if (row.expenseTypeName) {
      participant = row.expenseTypeName;
      description = "General Expense";
    } else {
       participant = row.fromAccountId?.name || row.toAccountId?.name || "Manual";
    }

    const descriptionFinal = participant 
      ? `${participant} ${description ? `(${description})` : ""} ${row.category ? `[${row.category}]` : ""}`
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
    head: [["Date", "Description", "Credit (Aamad)", "Debit (Kharch)", "Balance"]],
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
  doc.save(`${reportTitle.replace(/\s+/g, "_")}.pdf`);
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
export function drawSaleInvoice(doc, sale) {

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
  const invDate = new Date(sale.date);
  const mm = invDate.toLocaleString("en-PK", { month: "2-digit", timeZone: "Asia/Karachi" });
  const yy = invDate.toLocaleString("en-PK", { year: "2-digit", timeZone: "Asia/Karachi" });
  const invoiceNo = `SI${mm}${yy}/${sale._id.toString().slice(-6).toUpperCase()}`;
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

  doc.text("Gate Pass:", 135, 80);
  doc.text(sale.gatePassNo || "—", 155, 80);
  doc.line(155, 81, 195, 81);

  doc.text("Goods:", 135, 88);
  doc.text(sale.goods || "—", 155, 88);
  doc.line(155, 89, 195, 89);

  doc.text("Account:", 135, 96);
  doc.text(sale.accountId?.name || "—", 155, 96);
  doc.line(155, 97, 195, 97);

  doc.text("Due Date:", 135, 104);
  doc.text(formatDate(sale.dueDate), 155, 104);
  doc.line(155, 105, 195, 105);

  // --- ITEM TABLE ---
  let yPos = 115;

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

  yPos += 15;
  doc.setFont("helvetica", "normal");

  if (sale.items && sale.items.length > 0) {
    sale.items.forEach((it, idx) => {
      const itName = it.itemId?.name || "Product";
      doc.text(itName, 18, yPos);
      doc.text(String(it.kattay || 0), 95, yPos);
      
      const itMun = it.quantity ? (it.quantity / 40).toFixed(3) : "0.000";
      doc.text(String(itMun), 120, yPos);
      doc.text(String(it.kgPerKata || 0), 140, yPos);
      doc.text(formatMoney(it.rate), 155, yPos);
      
      // Show Real Amount: (quantity / 40) * rate - base calculation without adjustments
      const itBaseAmount = Math.round((it.quantity / 40) * (it.rate || 0));
      doc.text(formatMoney(itBaseAmount), 175, yPos);
      
      yPos += 7;
      if (yPos > 190) { 
        doc.addPage(); 
        yPos = 20; 
      }
    });
  } else {
    doc.text(sale.itemName || "Product", 18, yPos);
    doc.text(String(sale.kattay || 0), 95, yPos);
    doc.text((sale.quantity / 40).toFixed(3), 120, yPos);
    doc.text("40", 140, yPos);
    doc.text(formatMoney(sale.rate), 155, yPos);
    
    // For single item fallback, calculate base amount
    const itBaseFallback = Math.round((Number(sale.quantity || 0) / 40) * Number(sale.rate || 0));
    doc.text(formatMoney(itBaseFallback), 175, yPos);
  }

  // Summary logic: Calculate real items total from base formula (quantity/40 * rate)
  const baseItemsTotal = sale.items?.reduce((sum, i) => {
    const itemBaseAmount = Math.round((i.quantity / 40) * (i.rate || 0));
    return sum + itemBaseAmount;
  }, 0) || 0;
  
  // The final total amount from backend (includes everything)
  const finalTotalAmount = sale.totalAmount || 0;
  const bardanaTotal = sale.totalBardanaAmount || 0;
  const mazdoriTotal = sale.totalMazdori || 0;
  const extrasTotal = sale.extras || 0;

  yPos = 200; 

  // --- SUMMARY SECTION ---
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  // Left side weights
  doc.text("Total Weight", 15, yPos);
  const grossWeight = sale.totalGrossWeight || 0;
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(grossWeight), 45, yPos);

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Total SH.CUT", 15, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(String(sale.totalSHCut || 0), 45, yPos);

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Net Weight", 15, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(sale.netWeight || (grossWeight - (sale.totalSHCut || 0))), 45, yPos);

  // Right side amounts
  let rightY = 200 + 8;
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE TOTAL:", 130, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(baseItemsTotal), 195, rightY, { align: "right" });

  rightY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("BARDANA TOTAL:", 130, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(bardanaTotal), 195, rightY, { align: "right" });

  rightY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("MAZDOORI TOTAL:", 130, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(mazdoriTotal), 195, rightY, { align: "right" });

  if (Number(extrasTotal) > 0) {
    rightY += 7;
    doc.setFont("helvetica", "bold");
    doc.text("DISCOUNT (DIST):", 130, rightY);
    doc.setFont("helvetica", "normal");
    doc.text(`- ${formatMoney(extrasTotal)}`, 195, rightY, { align: "right" });
  }

  doc.setLineWidth(0.1);
  doc.line(130, rightY + 2, 195, rightY + 2);

  rightY += 9;
  doc.setFont("helvetica", "bold");
  doc.text("NET PAYABLE:", 130, rightY);
  doc.setFontSize(11);
  doc.text(formatMoney(finalTotalAmount), 195, rightY, { align: "right" });
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

  // Unified bottom line (moved here from yPos=200)
  doc.line(15, yPos + 4, 195, yPos + 4);

  // Signature line
  doc.line(140, yPos + 35, 195, yPos + 35);
  doc.setFont("helvetica", "bold");
  doc.text("Signature", 158, yPos + 40);
}

export function downloadSaleInvoicePdf(sale) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawSaleInvoice(doc, sale);
  const invoiceNo = `SI${new Date(sale.date).toISOString().slice(5, 7)}${new Date(sale.date).toISOString().slice(2, 4)}/${sale._id.slice(-6).toUpperCase()}`;
  doc.save(`invoice-${invoiceNo.replace(/\//g, "-")}.pdf`);
}

/**
 * Professional Single Purchase Invoice PDF
 * Mimics the style of the sales invoice but for supplier purchases.
 */
export function drawPurchaseInvoice(doc, entry) {

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

  doc.text("Gate Pass:", 135, 80);
  doc.text(entry.gatePassNo || "—", 155, 80);
  doc.line(155, 81, 195, 81);

  doc.text("Goods:", 135, 88);
  doc.text(entry.goods || "—", 155, 88);
  doc.line(155, 89, 195, 89);

  doc.text("Account:", 135, 96);
  doc.text(entry.accountId?.name || "—", 155, 96);
  doc.line(155, 97, 195, 97);

  doc.text("Due Date:", 135, 104);
  doc.text(entry.dueDate ? formatDate(entry.dueDate) : "—", 155, 104);
  doc.line(155, 105, 195, 105);

  // --- ITEM TABLE ---
  let yPos = 115;

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

  yPos += 15;
  doc.setFont("helvetica", "normal");

  if (entry.items && entry.items.length > 0) {
    entry.items.forEach((it, idx) => {
      const itName = it.itemId?.name || "Product";
      doc.text(itName, 18, yPos);
      doc.text(String(it.kattay || 0), 95, yPos);
      
      const itMun = it.itemNetWeight ? (it.itemNetWeight / 40).toFixed(3) : "0";
      doc.text(String(itMun), 120, yPos);
      doc.text("40", 140, yPos); // Standard KG per MUN
      doc.text(formatMoney(it.rate), 155, yPos);
      
      // Show base amount (Rate × MUN) in Net Amount column
      const baseAmount = Math.round((it.itemNetWeight / 40) * (it.rate || 0));
      doc.text(formatMoney(baseAmount), 175, yPos);
      
      yPos += 7;
      if (yPos > 190) { doc.addPage(); yPos = 20; }
    });
  } else {
    // Fallback old data
    doc.text(entry.itemId?.name || "Product", 18, yPos);
    doc.text(String(entry.kattay || 0), 95, yPos);
    doc.text((entry.receivedWeight / 40).toFixed(3), 120, yPos);
    doc.text("40", 140, yPos);
    doc.text(formatMoney(entry.rate), 155, yPos);
    const baseAmount = Math.round((entry.receivedWeight / 40) * (entry.rate || 0));
    doc.text(formatMoney(baseAmount), 175, yPos);
  }

  // Calculate base total (Rate × MUN for all items)
  const baseTotal = entry.items?.reduce((sum, i) => {
    const itemBase = Math.round((i.itemNetWeight / 40) * (i.rate || 0));
    return sum + itemBase;
  }, 0) || Math.round((entry.netWeight / 40) * (entry.rate || 0)) || 0;

  yPos = 200; // base y for summary

  // --- SUMMARY SECTION ---
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  doc.text("Total Weight (Gross)", 15, yPos);
  const grossWeight = entry.totalGrossWeight || 0;
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(grossWeight), 50, yPos);

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("S.H Cut (250g/Mun)", 15, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(String(entry.totalSHCut || 0), 50, yPos);

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Net Weight", 15, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(entry.netWeight || (grossWeight - (entry.totalSHCut || 0))), 50, yPos);

  // Right calculations
  let rightY = 200 + 8;
  doc.setFont("helvetica", "bold");
  doc.text("BASE AMOUNT:", 130, rightY);
  doc.setFont("helvetica", "normal");
  doc.text(formatMoney(baseTotal), 195, rightY, { align: "right" });

  rightY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("BARDANA TOTAL:", 130, rightY);
  doc.setFont("helvetica", "normal");
  const bardanaTotal = entry.totalBardanaAmount || 0;
  doc.text(`+ ${formatMoney(bardanaTotal)}`, 195, rightY, { align: "right" });

  rightY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("MAZDOORI TOTAL:", 130, rightY);
  doc.setFont("helvetica", "normal");
  const mazdoriTotal = entry.totalMazdori || 0;
  doc.text(`+ ${formatMoney(mazdoriTotal)}`, 195, rightY, { align: "right" });

  if (Number(entry.extras) > 0) {
    rightY += 7;
    doc.setFont("helvetica", "bold");
    doc.text("EXTRAS (LESS):", 130, rightY);
    doc.setFont("helvetica", "normal");
    doc.text(`- ${formatMoney(entry.extras)}`, 195, rightY, { align: "right" });
  }

  doc.setLineWidth(0.1);
  doc.line(130, rightY + 2, 195, rightY + 2);

  rightY += 9;
  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL:", 130, rightY);
  doc.setFontSize(11);
  const grandTotal = baseTotal + bardanaTotal + mazdoriTotal - (Number(entry.extras) || 0);
  doc.text(formatMoney(grandTotal), 195, rightY, { align: "right" });
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

  // Unified bottom line (moved here from yPos=200)
  doc.line(15, yPos + 4, 195, yPos + 4);

  doc.line(140, yPos + 35, 195, yPos + 35);
  doc.setFont("helvetica", "bold");
  doc.text("Verified By", 158, yPos + 40);
}

export function downloadPurchaseInvoicePdf(entry) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawPurchaseInvoice(doc, entry);
  const entryNo = `PI${new Date(entry.date).toISOString().slice(5, 7)}${new Date(entry.date).toISOString().slice(2, 4)}/${entry._id.slice(-6).toUpperCase()}`;
  doc.save(`purchase-invoice-${entryNo.replace(/\//g, "-")}.pdf`);
}

/**
 * Machinery Items Registry PDF.
 */
export function downloadMachineryItemsPdf(items) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const subtitleLines = [`Total items: ${items.length}`];
  let startY = addReportHeader(doc, "Machinery Items Registry", subtitleLines);

  if (!items.length) {
    doc.setFontSize(10);
    doc.text("No machinery items.", MARGIN, startY);
    doc.save("machinery-items.pdf");
    return;
  }

  autoTable(doc, {
    startY,
    head: [["#", "Item Name", "Model/Quality", "Description"]],
    body: items.map((row, i) => [
      i + 1,
      row.name || "—",
      row.quality || "—",
      row.description || "—",
    ]),
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 40 },
      3: { cellWidth: 80 },
    },
  });

  addPageNumbers(doc);
  doc.save("machinery-items.pdf");
}

/**
 * Machinery Purchases Report PDF.
 */
export function downloadMachineryPurchasesPdf(entries, filters = {}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const subtitleLines = [];
  if (filters.dateFrom || filters.dateTo)
    subtitleLines.push(`Date: ${filters.dateFrom || "—"} to ${filters.dateTo || "—"}`);
  subtitleLines.push(`Total records: ${entries.length}`);

  let startY = addReportHeader(doc, "Machinery Purchase Report", subtitleLines);

  if (!entries.length) {
    doc.setFontSize(10);
    doc.text("No entries.", MARGIN, startY);
    doc.save("machinery-purchases.pdf");
    return;
  }

  autoTable(doc, {
    startY,
    head: [["#", "Date", "Item", "Supplier", "Account", "Qty", "Amount", "Note"]],
    body: entries.map((row, i) => [
      i + 1,
      formatDate(row.date),
      row.machineryItemId?.name || "—",
      row.supplierId?.name || "—",
      row.accountId?.name || "—",
      row.quantity || 1,
      formatMoney(row.amount),
      row.note || "—",
    ]),
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      2: { cellWidth: 40 },
      3: { cellWidth: 40 },
      4: { cellWidth: 35 },
      5: { cellWidth: 15 },
      6: { cellWidth: 30, halign: "right" },
      7: { cellWidth: 70 },
    },
  });

  addPageNumbers(doc);
  doc.save(`machinery-purchases-${new Date().getTime()}.pdf`);
}

/**
 * Individual Tax Ledger PDF.
 */
export function downloadTaxLedgerPdf(taxType, sessions, totalPaid, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const subtitleLines = [];
  if (filters.dateFrom || filters.dateTo) {
    subtitleLines.push(`Period: ${filters.dateFrom || "Start"} to ${filters.dateTo || "Today"}`);
  }
  subtitleLines.push(`Total Payments recorded: ${sessions.length}`);
  subtitleLines.push(`Total Paid Amount: Rs. ${formatMoney(totalPaid)}`);

  let startY = addReportHeader(doc, `Tax Ledger — ${taxType.name.toUpperCase()}`, subtitleLines);

  if (!sessions.length) {
    doc.setFontSize(10);
    doc.text("No payments found for this tax type in the selected range.", MARGIN, startY);
    doc.save(`tax-ledger-${taxType.name.replace(/\s+/g, "_")}.pdf`);
    return;
  }

  let runningBalance = 0;
  autoTable(doc, {
    startY,
    head: [["Date", "Description / Account", "Credit (Aamad)", "Debit (Kharch)", "Balance"]],
    body: sessions.map((row) => {
      const debit = row.amount || 0;
      const credit = 0;
      runningBalance += debit - credit;
      return [
        formatDate(row.date),
        `${row.fromAccountId?.name || "Manual"}\n${row.note || ""}`,
        "—",
        formatMoney(debit),
        { content: formatMoney(runningBalance), styles: { halign: "right", fontStyle: "bold" } },
      ];
    }),
    foot: [[
      { content: "GRAND TOTALS", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
      "—",
      { content: formatMoney(totalPaid), styles: { halign: "right", fontStyle: "bold" } },
      { content: formatMoney(totalPaid), styles: { halign: "right", fontStyle: "bold" } },
    ]],
    ...tableTheme,
    headStyles: { ...tableTheme.headStyles, fillColor: [211, 84, 0] }, // orange color for tax theme
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 9, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 70 },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
  });

  addPageNumbers(doc);
  doc.save(`tax-ledger-${taxType.name.replace(/\s+/g, "_")}.pdf`);
}

/**
 * Machinery Ledger (Investment) PDF.
 */
export function downloadMachineryLedgerPdf(items) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const totalInvestment = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const subtitleLines = [
    `Total items: ${items.length}`,
    `Total Investment: ${formatMoney(totalInvestment)}`,
  ];
  let startY = addReportHeader(doc, "Machinery Ledger Summary", subtitleLines);

  autoTable(doc, {
    startY,
    head: [["#", "Machinery Item", "Model/Quality", "Total Investment (DR)"]],
    body: items.map((row, i) => [
      i + 1,
      row.name || "—",
      row.quality || "—",
      formatMoney(row.totalCost),
    ]),
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 80 },
      2: { cellWidth: 45 },
      3: { cellWidth: 40, halign: "right" },
    },
  });

  addPageNumbers(doc);
  doc.save("machinery-ledger.pdf");
}

/**
 * Machinery Item Khata (Audit/History) PDF.
 */
export function downloadMachineryItemKhataPdf(itemData, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const subtitleLines = [];
  if (filters.dateFrom || filters.dateTo)
    subtitleLines.push(`Date: ${filters.dateFrom || "—"} to ${filters.dateTo || "—"}`);
  subtitleLines.push(`Current Valuation/Total Cost: ${formatMoney(itemData.totalCost)}`);

  let startY = addReportHeader(doc, `${itemData.name} - Professional Audit Ledger`, subtitleLines);

  autoTable(doc, {
    startY,
    head: [["Date", "Description", "Credit (Aamad)", "Debit (Kharch)"]],
    body: itemData.purchases.map((row) => [
      formatDate(row.date),
      `${row.supplierId?.name || "Supplier"} [VIA: ${row.accountId?.name || "Cash"}]${row.note ? `\nNote: ${row.note}` : ""}`,
      "—",
      formatMoney(row.amount),
    ]),
    foot: [[
      { content: "GRAND TOTAL EXPENSE", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
      { content: "—", styles: { halign: "right", fontStyle: "bold" } },
      { content: formatMoney(itemData.totalCost), styles: { halign: "right", fontStyle: "bold" } },
    ]],
    ...tableTheme,
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 90 },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
    },
  });

  addPageNumbers(doc);
  doc.save(`machinery-khata-${itemData.name.replace(/\s+/g, "_")}.pdf`);
}

/**
 * Mazdoor Expenses Report PDF.
 */
export function downloadMazdoorExpensesPdf(entries, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const totalAmount = entries.reduce((sum, row) => sum + (Number(row.totalAmount) || 0), 0);
  const totalBags = entries.reduce((sum, row) => sum + (Number(row.bags) || 0), 0);

  const subtitleLines = [];
  if (filters.dateFrom || filters.dateTo)
    subtitleLines.push(`Date: ${filters.dateFrom || "—"} to ${filters.dateTo || "—"}`);
  if (filters.mazdoorId) {
    const name = entries[0]?.mazdoorId?.name || "Selected Mazdoor";
    subtitleLines.push(`Mazdoor: ${name}`);
  }
  subtitleLines.push(`Total Bags: ${totalBags} | Total Expense: ${formatMoney(totalAmount)}`);

  let startY = addReportHeader(doc, "Mazdoor Expenses Report", subtitleLines);

  autoTable(doc, {
    startY,
    head: [["#", "Date", "Mazdoor", "Item", "Bags", "Rate", "Total", "Account"]],
    body: entries.map((row, i) => [
      i + 1,
      formatDate(row.date),
      row.mazdoorId?.name || "—",
      row.mazdoorItemId?.name || "—",
      row.bags != null ? row.bags : "—",
      formatMoney(row.mazdoorItemId?.rate),
      formatMoney(row.totalAmount),
      row.accountId?.name || "—",
    ]),
    foot: [[
      { content: "AUDIT TOTALS", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
      { content: totalBags, styles: { halign: "center", fontStyle: "bold" } },
      { content: "—", styles: { halign: "center", fontStyle: "bold" } },
      { content: formatMoney(totalAmount), styles: { halign: "right", fontStyle: "bold" } },
      { content: "—", styles: { halign: "center", fontStyle: "bold" } },
    ]],
    ...tableTheme,
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8 },
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 22 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 15, halign: "center" },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 25, halign: "right" },
      7: { cellWidth: 22 },
    },
  });

  addPageNumbers(doc);
  doc.save("mazdoor-expenses.pdf");
}

/**
 * Individual Expense Ledger PDF.
 */
export function downloadExpenseLedgerPdf(expenseType, sessions, totalPaid, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const subtitleLines = [];
  if (filters.dateFrom || filters.dateTo) {
    subtitleLines.push(`Period: ${filters.dateFrom || "Start"} to ${filters.dateTo || "Today"}`);
  }
  subtitleLines.push(`Total Transactions recorded: ${sessions.length}`);
  subtitleLines.push(`Total Spent Amount: Rs. ${formatMoney(totalPaid)}`);

  let startY = addReportHeader(doc, `Expense Ledger — ${expenseType.name.toUpperCase()}`, subtitleLines);

  if (!sessions.length) {
    doc.setFontSize(10);
    doc.text("No records found for this expense category in the selected range.", MARGIN, startY);
    doc.save(`expense-ledger-${expenseType.name.replace(/\s+/g, "_")}.pdf`);
    return;
  }

  let runningBalance = 0;
  autoTable(doc, {
    startY,
    head: [["Date", "Description / Account", "Credit (Aamad)", "Debit (Kharch)", "Balance"]],
    body: sessions.map((row) => {
      const debit = row.amount || 0;
      const credit = 0;
      runningBalance += debit - credit;
      return [
        formatDate(row.date),
        `${row.fromAccountId?.name || "Manual"}\n${row.note || ""}`,
        "—",
        formatMoney(debit),
        { content: formatMoney(runningBalance), styles: { halign: "right", fontStyle: "bold" } },
      ];
    }),
    foot: [[
      { content: "GRAND TOTALS", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
      "—",
      { content: formatMoney(totalPaid), styles: { halign: "right", fontStyle: "bold" } },
      { content: formatMoney(totalPaid), styles: { halign: "right", fontStyle: "bold" } },
    ]],
    ...tableTheme,
    headStyles: { ...tableTheme.headStyles, fillColor: [225, 29, 72] }, // rose color for expense theme
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 9, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 70 },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
  });

  addPageNumbers(doc);
  doc.save(`expe  nse-ledger-${expenseType.name.replace(/\s+/g, "_")}.pdf`);
}

/**
 * Consolidated Master Trial Balance (Submail) PDF.
 * Lists all entities in a single Debit/Credit format.
 */
export function downloadAuditSummaryPdf(data, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let totalAuditCredit = 0;
  let totalAuditDebit = 0;
  const tableRows = [];

  const addAuditRow = (name, desc, credit = 0, debit = 0) => {
    const c = Number(credit) || 0;
    const d = Number(debit) || 0;
    if (c === 0 && d === 0) return; // Skip zero rows

    totalAuditCredit += c;
    totalAuditDebit += d;
    tableRows.push([
      name.toUpperCase(),
      desc.toUpperCase(),
      c > 0 ? formatMoney(c) : "—",
      d > 0 ? formatMoney(d) : "—"
    ]);
  };

  const addGroupHeader = (title) => {
    tableRows.push([{ content: title, colSpan: 4, styles: { fontStyle: "bold", fillColor: [30, 41, 59], textColor: [255, 255, 255] } }]);
  };

  const subtitleLines = [];
  if (filters.dateFrom || filters.dateTo) {
    subtitleLines.push(`Period: ${filters.dateFrom || "Start"} to ${filters.dateTo || "Today"}`);
  }
  subtitleLines.push(`Generated: ${new Date().toLocaleDateString("en-PK", { dateStyle: "medium" })}`);
  addReportHeader(doc, "PROFESSIONAL SUBMAIL AUDIT (PERIODIC)", subtitleLines);

  // 1. Previous Balance (Ground Zero)
  const opBal = Number(data.openingBalance || 0);
  if (opBal !== 0) {
    addGroupHeader("0. PREVIOUS BALANCE (OPENING)");
    addAuditRow("PREVIOUS BALANCE (BAQAYA)", opBal > 0 ? "Surplus Forward" : "Opening Deficit", opBal > 0 ? Math.abs(opBal) : 0, opBal < 0 ? Math.abs(opBal) : 0);
  }

  // 1. Bank Accounts (Net Movements for Audit)
  const bankAccs = (data.accounts || []).filter(a => !a.isMillKhata && !a.isDailyKhata);
  if (bankAccs.length > 0) {
    addGroupHeader("1. BANK & CASH ACCOUNTS (PERIODIC NET)");
    bankAccs.forEach(a => {
      const net = (Number(a.tOut) || 0) - (Number(a.tIn) || 0);
      if (net === 0) return;
      
      const isNetCredit = net > 0;
      addAuditRow(a.name, (a.type || "Ledger"), isNetCredit ? Math.abs(net) : 0, !isNetCredit ? Math.abs(net) : 0);
    });
  }

  // 2. Customers (Net Periodic Audit)
  if (data.customers && data.customers.length > 0) {
    addGroupHeader("2. CUSTOMER AUDIT (RECEIVABLES)");
    data.customers.forEach(c => {
      // Net = Money In (Cr) - Goods Out (Dr). 
      // If Positive => Net Receipt (Credit). If Negative => Net Sale/Receivable (Debit).
      const net = (Number(c.periodIn) || 0) - (Number(c.periodOut) || 0);
      if (net === 0) return;
      
      const isNetCr = net > 0;
      addAuditRow(c.name, "Customer Net", isNetCr ? Math.abs(net) : 0, !isNetCr ? Math.abs(net) : 0);
    });
  }

  // 3. Suppliers (Net Periodic Audit)
  if (data.suppliers && data.suppliers.length > 0) {
    addGroupHeader("3. SUPPLIER AUDIT (PAYABLES)");
    data.suppliers.forEach(s => {
      // Net = Goods In (Cr/Liability) - Cash Out (Dr/Asset).
      // If Positive => Net Purchase/Payable (Credit). If Negative => Net Payment/Advance (Debit).
      const net = (Number(s.periodIn) || 0) - (Number(s.periodOut) || 0);
      if (net === 0) return;
      
      const isNetCr = net > 0;
      addAuditRow(s.name, "Supplier Net", isNetCr ? Math.abs(net) : 0, !isNetCr ? Math.abs(net) : 0);
    });
  }

  // 4. Mazdoor (Net Wages Audit)
  if (data.mazdoors && data.mazdoors.length > 0) {
    addGroupHeader("4. MAZDOOR AUDIT (WAGES)");
    data.mazdoors.forEach(m => {
      // Net = Work Done (Cr/Liability) - Paid (Dr/Asset).
      // If Positive => Net Unpaid/Payable (Credit). If Negative => Net Overpaid/Advance (Debit).
      const net = (Number(m.periodEarned) || 0) - (Number(m.periodPaid) || 0);
      if (net === 0) return;

      const isNetCr = net > 0;
      addAuditRow(m.name, "Worker Net", isNetCr ? Math.abs(net) : 0, !isNetCr ? Math.abs(net) : 0);
    });
  }

  // 5. Item Trading Audit (Stock Turnover)
  if (data.items && data.items.length > 0) {
    addGroupHeader("5. ITEM TRADING AUDIT (STOCK TURNOVER)");
    tableRows.push([
      { content: "Item Name", styles: { fontStyle: "bold" } }, 
      { content: "Classification", styles: { fontStyle: "bold" } }, 
      { content: "Credit (Sale Revenue)", styles: { halign: "right", fontStyle: "bold", fillColor: [240, 253, 244] } }, 
      { content: "Debit (Purchase Spend)", styles: { halign: "right", fontStyle: "bold", fillColor: [254, 242, 242] } }
    ]);
    data.items.forEach(item => {
      const sale = Number(item.saleVolume || 0);
      const purchase = Number(item.purchaseVolume || 0);
      addAuditRow(item.name, "Stock Movement", sale, purchase);
    });
  }

  // 6. Assets & Inventory & Expenses
  addGroupHeader("6. ASSETS & EXPENDITURE AUDIT");
  const stockVal = Number(data.totalStockValue) || 0;
  addAuditRow("GODAM STOCK VALUATION", "Inventory Snapshot", 0, stockVal);

  (data.machinery || []).forEach(m => {
    addAuditRow(m.machineryItemId?.name || "Machinery", "Fixed Asset", 0, m.amount);
  });

  // Detailed Expense Heads (No aggregation)
  data.expenses.forEach(e => {
    const name = e.expenseTypeId?.name || "General Expense";
    addAuditRow(name, "Operational Expense", 0, e.amount);
  });

  // Detailed Tax Heads (No aggregation)
  data.taxes.forEach(t => {
    const name = t.taxTypeId?.name || "General Tax";
    addAuditRow(name, "Government Tax", 0, t.amount);
  });

  // 7. Raw Material Activity (Unified for Both Bank & Mill)
  if (data.rawMaterials && data.rawMaterials.length > 0) {
    addGroupHeader("7. RAW MATERIAL ACTIVITY (HEAD-WISE)");
    data.rawMaterials.forEach(rm => {
      // Periodic Activity: Credit = Aamad, Debit = Kharch
      addAuditRow(rm.name, "Unit Audit", rm.periodCredit, rm.periodDebit);
    });
  }

  // 7. Manual Deposits & Incomes
  const manualDeposits = (data.periodTransactions || []).filter(t => {
    const fromId = (t.fromAccountId?._id || t.fromAccountId)?.toString();
    const toId = (t.toAccountId?._id || t.toAccountId)?.toString();
    const accounts = data.accounts || [];
    const fromAcc = accounts.find(a => (a._id || a).toString() === fromId);
    const toAcc   = accounts.find(a => (a._id || a).toString() === toId);
    const isToMill = toAcc?.isMillKhata || toAcc?.isDailyKhata;
    const isFromMill = fromAcc?.isMillKhata || fromAcc?.isDailyKhata;
    // CRITICAL FIX: Exclude Raw Material heads here to avoid double-counting with Section 7
    return (t.type === 'income' || t.type === 'deposit') && isToMill && !isFromMill && !t.customerId && !t.supplierId && !t.mazdoorId && !t.expenseTypeId && !t.taxTypeId && !t.rawMaterialHeadId;
  });

  if (manualDeposits.length > 0) {
    addGroupHeader("6a. MANUAL MILL DEPOSITS (DIRECT AAMAD)");
    manualDeposits.forEach(t => {
      addAuditRow(t.category || "INCOME", t.note || "Direct Credit", t.amount, 0);
    });
  }

  // 7a. Direct Party Transfers (The "Perfect" Condition)
  const partyTransfers = (data.periodTransactions || []).filter(t => {
    // CRITICAL: Only include transfer types here, exclude withdraw (which are counted in categoricals)
    if (t.type !== 'transfer') return false; 
    if (!t.customerId && !t.supplierId && !t.mazdoorId) return false;
    
    const fromId = (t.fromAccountId?._id || t.fromAccountId)?.toString();
    const fromAcc = (data.accounts || []).find(a => (a._id || a).toString() === fromId);
    return fromAcc?.isMillKhata || fromAcc?.isDailyKhata;
  });

  if (partyTransfers.length > 0) {
    addGroupHeader("7a. MILL TO PARTY (DIRECT SETTLEMENT)");
    partyTransfers.forEach(t => {
      const particName = (t.customerId?.name || t.supplierId?.name || t.mazdoorId?.name || "PARTY");
      addAuditRow("DIRECT SETTLEMENT", (t.note || `Paid to ${particName}`), t.amount, 0);
    });
  }

  // 8. Closing Baqaya Balance (The Counterweight)
  const closingBaqaya = Number(data.universalBaqaya || 0);
  addGroupHeader("8. CLOSING BAQAYA BALANCE (MILL CASH)");
  const isSurplus_cl = closingBaqaya >= 0;
  // Surplus is a Debit balance (Cash in hand), Deficit is a Credit balance (Udhaar)
  addAuditRow("BAQAYA BALANCE (CLOSING)", "Mill Desk Position", isSurplus_cl ? 0 : Math.abs(closingBaqaya), isSurplus_cl ? Math.abs(closingBaqaya) : 0);

  // Summary Table
  autoTable(doc, {
    startY: 40,
    head: [["SUBMAIL CLASSIFICATION", "DETAIL / CATEGORY", "CREDIT (Aam)", "DEBIT (Khar)"]],
    body: tableRows,
    foot: [
      [
        { content: "TOTAL AUDIT MOVEMENT (T-ACCOUNT SUM)", colSpan: 2, styles: { fontStyle: "bold", halign: "right", fillColor: [240, 240, 240], textColor: [0, 0, 0] } },
        { content: "Rs. " + formatMoney(totalAuditCredit), styles: { halign: "right", fontStyle: "bold", fillColor: [240, 240, 240], textColor: [0, 0, 0] } },
        { content: "Rs. " + formatMoney(totalAuditDebit), styles: { halign: "right", fontStyle: "bold", fillColor: [240, 240, 240], textColor: [0, 0, 0] } }
      ]
    ],
    ...tableTheme,
    margin: { left: MARGIN, right: MARGIN, top: 25 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 60 },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 30, halign: "right" }
    }
  });

  addPageNumbers(doc);
  doc.save(`Professional_Audit_${new Date().toISOString().slice(0,10)}.pdf`);
}


/**
 * Consolidated Ledger Book PDF (The "Daily Book")
 * Prints ALL active ledgers in one grouped document with Professional History UI Match.
 */
export function downloadConsolidatedLedgersPdf(data, filters = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const subtitleLines = [];
  if (filters.dateFrom || filters.dateTo) {
    subtitleLines.push(`Period: ${filters.dateFrom || "Start"} to ${filters.dateTo || "Today"}`);
  }
  subtitleLines.push(`Generated: ${new Date().toLocaleDateString("en-PK", { dateStyle: "medium" })} ${new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}`);

  let startY = addReportHeader(doc, "DAILY LEDGER BOOK (DAILY DIARY)", subtitleLines);

  const categories = [
    { key: 'accounts', label: 'BANK & CASH ACCOUNTS' },
    { key: 'items', label: 'STOCK ITEM TRADING' },
    { key: 'customers', label: 'CUSTOMER LEDGERS' },
    { key: 'suppliers', label: 'SUPPLIER LEDGERS' },
    { key: 'mazdoors', label: 'MAZDOOR WAGES' },
    { key: 'rawMaterials', label: 'RAW MATERIAL UNITS' },
    { key: 'expenses', label: 'GENERAL EXPENSES' },
    { key: 'taxes', label: 'TAX PAYMENTS' },
    { key: 'machinery', label: 'MACHINERY & ASSETS' },
    { key: 'millExpenses', label: 'MILL OVERHEAD' }
  ];

  let firstEntity = true;

  categories.forEach(cat => {
    const list = data[cat.key] || [];
    if (list.length === 0) return;

    list.forEach(entity => {
      if (!firstEntity) {
        doc.addPage();
        startY = addReportHeader(doc, "DAILY LEDGER BOOK (DAILY DIARY)", subtitleLines);
      }
      firstEntity = false;

      // Professional Section Header
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor(30, 41, 59); // Dark blue-slate
      doc.text(`${cat.label}: ${entity.name.toUpperCase()}`, MARGIN, startY);
      doc.setTextColor(0, 0, 0);
      startY += 7;

      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(`Opening Balance: Rs. ${formatMoney(Math.abs(entity.openingBalance))} ${entity.openingBalance >= 0 ? 'Dr' : 'Cr'}`, MARGIN, startY);
      startY += 2;

      let tableConfig = {};
      let runningBalance = 0;
      let totalDr = 0;
      let totalCr = 0;

      // CUSTOMIZE BY CATEGORY (Match historyPdf.js UI)
      if (cat.key === 'customers' || cat.key === 'suppliers') {
        const body = entity.ledger.map(row => {
          const d = Number(row.debit) || 0;
          const c = Number(row.credit) || 0;
          totalDr += d;
          totalCr += c;
          runningBalance += (d - c);
          return [
            formatDate(row.date),
            row.description || "—",
            row.bags > 0 ? row.bags : "—",
            c > 0 ? formatMoney(c) : "—",
            d > 0 ? formatMoney(d) : "—",
            formatMoney(Math.abs(runningBalance)) + (runningBalance >= 0 ? " Dr" : " Cr")
          ];
        });

        tableConfig = {
          head: [["Date", "Description", "Bags", "Credit (Aamad)", "Debit (Kharch)", "Balance"]],
          body,
          foot: [["", "GRAND TOTALS", "", formatMoney(totalCr), formatMoney(totalDr), formatMoney(Math.abs(runningBalance)) + (runningBalance >= 0 ? " Dr" : " Cr")]],
          columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: "auto" },
            2: { halign: "center", cellWidth: 15 },
            3: { halign: "right", cellWidth: 28, fontStyle: "bold" },
            4: { halign: "right", cellWidth: 28, fontStyle: "bold" },
            5: { halign: "right", cellWidth: 28, fontStyle: "bold" },
          }
        };
      } else if (cat.key === 'mazdoors') {
        const body = entity.ledger.map(row => {
          const d = Number(row.debit) || 0;
          const c = Number(row.credit) || 0;
          totalDr += d;
          totalCr += c;
          runningBalance += (c - d);
          return [
            formatDate(row.date),
            row.description || (c > 0 ? "Work Earned" : "Payment Made"),
            c > 0 ? formatMoney(c) : "—",
            d > 0 ? formatMoney(d) : "—",
            formatMoney(Math.abs(runningBalance)) + (runningBalance >= 0 ? " Cr" : " Dr")
          ];
        });
        tableConfig = {
          head: [["Date", "Work Detail / Payment", "Credit (Earned)", "Debit (Paid)", "Balance"]],
          body,
          foot: [["", "TOTAL MOVEMENT", formatMoney(totalCr), formatMoney(totalDr), formatMoney(Math.abs(runningBalance)) + (runningBalance >= 0 ? " Cr" : " Dr")]],
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: "auto" },
            2: { halign: "right", cellWidth: 30 },
            3: { halign: "right", cellWidth: 30 },
            4: { halign: "right", cellWidth: 30 },
          }
        };
      } else if (cat.key === 'items') {
        let totalBagsIn = 0;
        let totalBagsOut = 0;
        // Start with opening balance
        let itemBalance = entity.openingBalance || 0;
        // Filter out opening balance row - only show actual transactions
        const body = entity.ledger
          .filter(row => !(row.isOpeningBalance || row.status === 'opening'))
          .map(row => {
            const isSale = row.status === 'sold';
            const isPurchase = row.status === 'purchased';
            const amt = row.debit || row.credit || 0;
            const bags = row.bags || 0;
            const weight = row.weight || 0;
            const mun = weight > 0 ? (weight / 40).toFixed(3) : "—";

            if (isSale) totalBagsOut += bags;
            if (isPurchase) totalBagsIn += bags;
            if (isSale) totalDr += amt;
            if (isPurchase) totalCr += amt;
            
            // Update running balance
            // Sale (Debit) = Asset/Receivable increases
            // Purchase (Credit) = Asset/Receivable decreases
            itemBalance += row.debit || 0;
            itemBalance -= row.credit || 0;

            return [
              formatDate(row.date),
              row.description,
              bags || "—",
              mun,
              isSale ? formatMoney(amt) : "—",
              isPurchase ? formatMoney(amt) : "—",
              formatMoney(Math.abs(itemBalance)) + (itemBalance >= 0 ? " Dr" : " Cr")
            ];
          });
        tableConfig = {
          head: [["Date", "Audit Detail", "Bags", "Mun", "Sale (Cr)", "Purchase (Dr)", "Balance"]],
          body,
          foot: [
            [{ content: "SOLD (OUT)", colSpan: 2, styles: { halign: "right", fillColor: [127, 29, 29] } }, { content: String(totalBagsOut), styles: { halign: "center", fillColor: [127, 29, 29] } }, "", { content: formatMoney(totalDr), styles: { halign: "right", fillColor: [127, 29, 29] } }, "", ""],
            [{ content: "PURCHASED (IN)", colSpan: 2, styles: { halign: "right", fillColor: [6, 78, 59] } }, { content: String(totalBagsIn), styles: { halign: "center", fillColor: [6, 78, 59] } }, "", "", { content: formatMoney(totalCr), styles: { halign: "right", fillColor: [6, 78, 59] } }, ""],
            [{ content: "REMAINING BALANCE (NET)", colSpan: 2, styles: { halign: "right", fillColor: [30, 41, 59], fontStyle: "bold" } }, { content: String(totalBagsIn - totalBagsOut), styles: { halign: "center", fillColor: [30, 41, 59], fontStyle: "bold" } }, "", "", "", { content: formatMoney(Math.abs(itemBalance)) + (itemBalance >= 0 ? " Cr" : " Dr"), styles: { halign: "right", fillColor: [30, 41, 59], fontStyle: "bold" } }]
          ],
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: "auto" },
            2: { cellWidth: 12, halign: "center" },
            3: { cellWidth: 12, halign: "center" },
            4: { cellWidth: 24, halign: "right" },
            5: { cellWidth: 24, halign: "right" },
            6: { cellWidth: 24, halign: "right", fontStyle: "bold" },
          }
        };
      } else if (cat.key === 'accounts') {
        const body = entity.ledger.map(row => {
          const d = Number(row.debit) || 0;
          const c = Number(row.credit) || 0;
          totalDr += d;
          totalCr += c;
          runningBalance += (d - c); // Asset account: Debit increases, Credit decreases
          return [
            formatDate(row.date),
            row.description || (d > 0 ? "Deposit / Inflow" : "Withdraw / Outflow"),
            c > 0 ? formatMoney(c) : "—",
            d > 0 ? formatMoney(d) : "—",
            formatMoney(Math.abs(runningBalance)) + (runningBalance >= 0 ? " Dr" : " Cr")
          ];
        });
        tableConfig = {
          head: [["Date", "Description", "Credit (Outflow/Payment)", "Debit (Inflow/Receipt)", "Balance"]],
          body,
          foot: [["", "NET TOTALS", formatMoney(totalCr), formatMoney(totalDr), formatMoney(Math.abs(runningBalance)) + (runningBalance >= 0 ? " Dr" : " Cr")]],
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: "auto" },
            2: { halign: "right", cellWidth: 32 },
            3: { halign: "right", cellWidth: 32 },
            4: { halign: "right", cellWidth: 30, fontStyle: "bold" },
          }
        };
      } else {
        // Default 5-column ledger (Accounts, Raws, Expenses, Taxes)
        const body = entity.ledger.map(row => {
          const d = Number(row.debit) || 0;
          const c = Number(row.credit) || 0;
          totalDr += d;
          totalCr += c;
          runningBalance += (c - d);
          return [
            formatDate(row.date),
            row.description || "—",
            c > 0 ? formatMoney(c) : "—",
            d > 0 ? formatMoney(d) : "—",
            formatMoney(Math.abs(runningBalance)) + (runningBalance >= 0 ? " Cr" : " Dr")
          ];
        });
        tableConfig = {
          head: [["Date", "Description", "Credit (Aamad)", "Debit (Kharch)", "Balance"]],
          body,
          foot: [["", "NET TOTALS", formatMoney(totalCr), formatMoney(totalDr), formatMoney(Math.abs(runningBalance)) + (runningBalance >= 0 ? " Cr" : " Dr")]],
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: "auto" },
            2: { halign: "right", cellWidth: 28 },
            3: { halign: "right", cellWidth: 28 },
            4: { halign: "right", cellWidth: 30 },
          }
        };
      }

      autoTable(doc, {
        startY,
        ...tableConfig,
        ...tableTheme,
        theme: "grid",
        styles: { ...tableTheme.styles, fontSize: 8, lineWidth: 0.1, textColor: [0,0,0] },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
        footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
        didDrawPage: (d) => { startY = d.cursor.y; }
      });

      startY = doc.lastAutoTable.finalY + 10;
    });
  });

  // APPEND INVOICES AT THE END
  if (data.salesInvoices && data.salesInvoices.length > 0) {
    data.salesInvoices.forEach(sale => {
      doc.addPage();
      drawSaleInvoice(doc, sale);
    });
  }

  if (data.purchaseInvoices && data.purchaseInvoices.length > 0) {
    data.purchaseInvoices.forEach(purchase => {
      doc.addPage();
      drawPurchaseInvoice(doc, purchase);
    });
  }

  addPageNumbers(doc);
  doc.save(`Daily_Ledger_Book_${filters.dateFrom || 'report'}.pdf`);
}
