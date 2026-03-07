import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export const downloadMillKhataPdf = (dateFrom, dateTo, expenses, summary) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("New Godam Mill", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Mill Khata - Daily Register", pageWidth / 2, 28, { align: "center" });

    // Date and Balances
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");

    const dateRangeText = dateFrom === dateTo ? `Date: ${formatDate(dateFrom)}` : `Period: ${formatDate(dateFrom)} to ${formatDate(dateTo)}`;
    doc.text(dateRangeText, 14, 40);

    doc.setFont("helvetica", "normal");
    doc.text(`Total Expenses: Rs. ${formatMoney(summary.total)}`, 14, 47);
    doc.text(`Current Account Balance: Rs. ${formatMoney(summary.accountBalance)}`, 14, 54);

    // Table Data
    const tableData = expenses.map((row) => [
        formatDate(row.date),
        row.category || "—",
        row.note || "—",
        formatMoney(row.amount),
    ]);

    autoTable(doc, {
        startY: 62,
        head: [["Date", "Category", "Note / Detail", "Amount (Rs.)"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [139, 92, 246] }, // Violet-500 matching Mill Khata color
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 40 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 40, halign: "right", fontStyle: "bold" },
        },
        // Add total row at the end
        foot: [
            [{ content: "Grand Total", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } }, formatMoney(summary.total)]
        ],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" }
    });

    const fileName = dateFrom === dateTo ? `Mill_Khata_${dateFrom}.pdf` : `Mill_Khata_${dateFrom}_to_${dateTo}.pdf`;
    doc.save(fileName);
};
