import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * The packing list as the sheet it always was.
 *
 * jsPDF cannot load the app's variable woff2 faces, so the print sheet uses
 * the closest pair it does carry: Helvetica for labels, Courier for every
 * measured value — the same split the screen makes between Archivo and Martian
 * Mono. Rules, title block and hierarchy are identical to the web sheet.
 */

const INK = [16, 16, 16];
const RULE = [214, 213, 208];
const CLAY = [162, 78, 43];
const FAINT = [110, 110, 104];

const MARGIN = 14;

const label = (doc, text, x, y) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...FAINT);
  doc.text(text.toUpperCase(), x, y, { charSpace: 0.5 });
};

const value = (doc, text, x, y, size = 10) => {
  doc.setFont("courier", "bold");
  doc.setFontSize(size);
  doc.setTextColor(...INK);
  doc.text(String(text), x, y);
};

/**
 * @param {object} data
 * @param {Record<string, Array>} data.itemsByCategory
 * @param {object} data.tour  tour form values, all optional
 * @param {number} data.totalWeight  grams
 * @param {number} data.totalPrice   euros
 * @returns {string} the filename written
 */
export function exportPacklistPdf({
  itemsByCategory = {},
  tour = {},
  totalWeight = 0,
  totalPrice = 0,
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const inner = pageW - MARGIN * 2;

  const rows = Object.entries(itemsByCategory).flatMap(([category, items]) =>
    (items ?? []).map((item) => [
      "",
      category,
      item.Itemname ?? "",
      item.Weight ? String(item.Weight) : "—",
      item.Price ? Number(item.Price).toFixed(2) : "—",
    ])
  );

  /* --- Title block ----------------------------------------------------- */
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, 16, pageW - MARGIN, 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...INK);
  doc.text("PACKING LIST", MARGIN, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...FAINT);
  doc.text("BIKEPACKING", pageW - MARGIN, 26, { align: "right" });

  doc.setLineWidth(0.2);
  doc.setDrawColor(...INK);
  doc.line(MARGIN, 31, pageW - MARGIN, 31);

  const fields = [
    ["Tour", tour.tourName || "Unnamed"],
    ["Dates", [tour.startDate, tour.endDate].filter(Boolean).join(" – ") || "—"],
    ["Bike", tour.bikeType || "—"],
    ["Type", [tour.rideType, tour.mode].filter(Boolean).join(" · ") || "—"],
  ];

  const colW = inner / fields.length;
  fields.forEach(([name, val], i) => {
    const x = MARGIN + colW * i;
    if (i > 0) {
      doc.setDrawColor(...RULE);
      doc.line(x - 2, 33, x - 2, 45);
    }
    label(doc, name, x, 37);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(String(val), colW - 4), x, 42);
  });

  doc.setDrawColor(...INK);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, 47, pageW - MARGIN, 47);

  /* --- Totals ---------------------------------------------------------- */
  const totals = [
    ["Items", String(rows.length)],
    ["Total weight", `${(totalWeight / 1000).toFixed(2)} kg`],
    ["Total price", `${Number(totalPrice).toFixed(2)} EUR`],
  ];

  const tColW = inner / totals.length;
  totals.forEach(([name, val], i) => {
    const x = MARGIN + tColW * i;
    label(doc, name, x, 53);
    value(doc, val, x, 60, 12);
  });

  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, 64, pageW - MARGIN, 64);

  /* --- Schedule of items ----------------------------------------------- */
  autoTable(doc, {
    startY: 70,
    margin: { left: MARGIN, right: MARGIN, bottom: 20 },
    head: [["", "Category", "Item", "g", "EUR"]],
    body: rows.length
      ? rows
      : [["", "—", "No items in this setup yet", "—", "—"]],
    theme: "plain",
    styles: {
      font: "courier",
      fontSize: 9,
      cellPadding: { top: 2.4, bottom: 2.4, left: 2, right: 2 },
      textColor: INK,
      lineColor: RULE,
      lineWidth: { bottom: 0.1 },
    },
    headStyles: {
      font: "helvetica",
      fontStyle: "bold",
      fontSize: 7,
      textColor: [255, 255, 255],
      fillColor: INK,
      cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
    },
    columnStyles: {
      0: { cellWidth: 9, halign: "center" },
      1: { cellWidth: 34, textColor: FAINT, fontSize: 8 },
      2: { cellWidth: "auto" },
      3: { cellWidth: 18, halign: "right" },
      4: { cellWidth: 22, halign: "right" },
    },
    /* The tick box is drawn, not typed — a bracket pair prints as noise. */
    didDrawCell: (d) => {
      if (d.section !== "body" || d.column.index !== 0) return;
      const s = 3.6;
      doc.setDrawColor(...INK);
      doc.setLineWidth(0.25);
      doc.rect(
        d.cell.x + (d.cell.width - s) / 2,
        d.cell.y + (d.cell.height - s) / 2,
        s,
        s
      );
    },
    didDrawPage: () => {
      const pageH = doc.internal.pageSize.getHeight();
      doc.setDrawColor(...INK);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, pageH - 14, pageW - MARGIN, pageH - 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...FAINT);
      doc.text(
        `Bikepacking · ${new Date().toLocaleDateString("en-GB")}`,
        MARGIN,
        pageH - 9
      );

      doc.setTextColor(...CLAY);
      doc.text(
        `Sheet ${doc.internal.getNumberOfPages()}`,
        pageW - MARGIN,
        pageH - 9,
        { align: "right" }
      );
    },
  });

  const slug = (tour.tourName || "setup")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const filename = `packing-list-${slug || "setup"}.pdf`;
  doc.save(filename);
  return filename;
}
