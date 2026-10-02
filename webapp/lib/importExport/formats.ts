import { downloadBlob } from "./csv";

export interface ExportRow {
  date: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  status: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function toXml(rows: ExportRow[]): string {
  const items = rows
    .map(
      (r) => `  <transaction>
    <date>${escapeXml(r.date)}</date>
    <description>${escapeXml(r.description)}</description>
    <category>${escapeXml(r.category)}</category>
    <amount>${r.amount}</amount>
    <currency>${escapeXml(r.currency)}</currency>
    <status>${escapeXml(r.status)}</status>
  </transaction>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<transactions>\n${items}\n</transactions>\n`;
}

export function toTxt(rows: ExportRow[]): string {
  return rows
    .map(
      (r) =>
        `${r.date}  ${r.description.padEnd(32)}  ${r.category.padEnd(18)}  ${String(r.amount).padStart(14)} ${r.currency}  ${r.status}`
    )
    .join("\n");
}

/** XLSX and ODS both go through SheetJS — same worksheet, different container format. */
export async function downloadSpreadsheet(rows: ExportRow[], filename: string, bookType: "xlsx" | "ods") {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
  const buffer = XLSX.write(workbook, { bookType, type: "array" });
  const mime =
    bookType === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/vnd.oasis.opendocument.spreadsheet";
  downloadBlob(filename, new Blob([buffer], { type: mime }));
}

export async function downloadPdf(rows: ExportRow[], filename: string, title: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  let y = 50;

  doc.setFontSize(14);
  doc.text(title, marginX, y);
  y += 24;

  doc.setFontSize(9);
  const headers = ["Date", "Description", "Category", "Amount", "Currency", "Status"];
  const colX = [marginX, marginX + 70, marginX + 230, marginX + 330, marginX + 400, marginX + 450];
  headers.forEach((h, i) => doc.text(h, colX[i]!, y));
  y += 6;
  doc.line(marginX, y, 555, y);
  y += 14;

  const pageHeight = doc.internal.pageSize.getHeight();

  for (const row of rows) {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 50;
    }
    doc.text(String(row.date).slice(0, 10), colX[0]!, y);
    doc.text(row.description.slice(0, 30), colX[1]!, y);
    doc.text(row.category.slice(0, 20), colX[2]!, y);
    doc.text(String(row.amount), colX[3]!, y);
    doc.text(row.currency, colX[4]!, y);
    doc.text(row.status, colX[5]!, y);
    y += 16;
  }

  downloadBlob(filename, doc.output("blob"));
}

/** ZIP bundles every other format together — a single download with everything. */
export async function downloadZip(rows: ExportRow[], filenameBase: string, currency: string) {
  const JSZip = (await import("jszip")).default;
  const XLSX = await import("xlsx");
  const zip = new JSZip();

  const csvRows = rows
    .map((r) => [r.date, r.description, r.category, r.amount, r.currency, r.status].join(","))
    .join("\n");
  zip.file(`${filenameBase}.csv`, `date,description,category,amount,currency,status\n${csvRows}`);
  zip.file(`${filenameBase}.json`, JSON.stringify(rows, null, 2));
  zip.file(`${filenameBase}.xml`, toXml(rows));
  zip.file(`${filenameBase}.txt`, toTxt(rows));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
  const xlsxBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  zip.file(`${filenameBase}.xlsx`, xlsxBuffer);

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(`${filenameBase}.zip`, blob);
  void currency;
}
