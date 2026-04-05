import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { downloadCsv } from './exportCsv';

export type ExportFormat = 'csv' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  fields: string[];
  data: Record<string, any>[];
  filename: string;
  title?: string;
}

export function exportData({ format, fields, data, filename, title }: ExportOptions) {
  if (data.length === 0) return;

  // Filter data to selected fields
  const filteredData = data.map(row => {
    const filtered: Record<string, any> = {};
    fields.forEach(f => { filtered[f] = row[f]; });
    return filtered;
  });

  switch (format) {
    case 'csv':
      downloadCsv(filteredData, `${filename}.csv`);
      break;
    case 'pdf':
      exportPdf(filteredData, fields, `${filename}.pdf`, title);
      break;
  }
}

function exportPdf(data: Record<string, any>[], fields: string[], filename: string, title?: string) {
  const doc = new jsPDF({ orientation: fields.length > 6 ? 'landscape' : 'portrait' });
  
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
  }

  const tableData = data.map(row => fields.map(f => String(row[f] ?? '—')));

  autoTable(doc, {
    head: [fields],
    body: tableData,
    startY: title ? 34 : 14,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 10, left: 10, right: 10 },
  });

  doc.save(filename);
}

// Price list specific export
export interface PriceListOptions {
  data: Record<string, any>[];
  profitPercent: number;
  profitFlat: number;
  format: ExportFormat;
  fields: string[];
  shopName?: string;
}

export function exportPriceList({ data, profitPercent, profitFlat, format, fields, shopName }: PriceListOptions) {
  const priceData = data.map(row => {
    const purchasePrice = Number(row['Purchase Price'] || 0);
    const markup = Math.round(purchasePrice * (profitPercent / 100)) + profitFlat;
    const sellingPrice = purchasePrice + markup;
    const result: Record<string, any> = {};
    fields.forEach(f => {
      if (f === 'Selling Price') result[f] = `₹${sellingPrice.toLocaleString('en-IN')}`;
      else if (f === 'Profit') result[f] = `₹${markup.toLocaleString('en-IN')}`;
      else if (f === 'Purchase Price') result[f] = `₹${purchasePrice.toLocaleString('en-IN')}`;
      else result[f] = row[f];
    });
    return result;
  });

  const title = shopName ? `${shopName} — Price List` : 'Price List';
  exportData({ format, fields, data: priceData, filename: `price_list_${new Date().toISOString().slice(0, 10)}`, title });
}
