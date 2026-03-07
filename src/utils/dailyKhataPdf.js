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
 * Download Daily Khata PDF — universal daily ledger report.
 */
export function downloadDailyKhataPdf(rows, summary, filters = {}) {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    // Header
    let y = 15;
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text("Daily Khata — Roz Ka Hisaab", MARGIN, y);
    y += 8;
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    const generated = `Generated: ${new Date().toLocaleDateString("en-PK", { dateStyle: "medium" })} ${new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}`;
    doc.text(generated, MARGIN, y);
    y += 5;
    if (filters.dateFrom || filters.dateTo) {
        doc.text(`Date Range: ${filters.dateFrom || "—"} to ${filters.dateTo || "—"}`, MARGIN, y);
        y += 5;
    }
    doc.text(`Total records: ${rows.length}`, MARGIN, y);
    y += 5;

    // Summary line
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    const summaryText = `Total In: ${Number(summary.totalIn || 0).toLocaleString("en-PK")}  |  Total Out: ${Number(summary.totalOut || 0).toLocaleString("en-PK")}  |  Net: ${Number(summary.net || 0).toLocaleString("en-PK")}`;
    doc.text(summaryText, MARGIN, y);
    y += 8;

    if (!rows.length) {
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.text("No records in this period.", MARGIN, y);
        doc.save("daily-khata-report.pdf");
        return;
    }

    autoTable(doc, {
        startY: y,
        head: [["#", "Date", "Type", "Description", "Credit (In)", "Debit (Out)"]],
        body: rows.map((row, i) => [
            i + 1,
            formatDate(row.date),
            TYPE_LABELS[row.type] || row.type,
            (row.description || "—").slice(0, 50),
            row.amountType === "in" ? formatMoney(row.amount) : "",
            row.amountType === "out" ? formatMoney(row.amount) : "",
        ]),
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold", fontSize: 9 },
        margin: { left: MARGIN, right: MARGIN },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 24 },
            2: { cellWidth: 28 },
            3: { cellWidth: 100 },
            4: { cellWidth: 30, halign: "right" },
            5: { cellWidth: 30, halign: "right" },
        },
    });

    // Page numbers
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

    doc.save("daily-khata-report.pdf");
}
