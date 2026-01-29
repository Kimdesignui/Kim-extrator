import { ExtractedItem } from '../types';

declare const XLSX: any;

export const exportToExcel = (items: ExtractedItem[], fileName: string) => {
  if (typeof XLSX === 'undefined') {
    alert("Excel library not loaded yet.");
    return;
  }

  const data = items.map(item => ({
    ID: item.id,
    Name: item.name || '',
    Link: item.href || '',
    Image: item.src || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Extraction Results");
  
  const cleanName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  XLSX.writeFile(workbook, `${cleanName}_export.xlsx`);
};

export const copyForGoogleSheets = (items: ExtractedItem[]) => {
  // Headers for the sheet
  const headers = ["ID", "Name", "Link", "Image"];
  
  // Create tab-separated rows
  const rows = items.map(item => {
    return [
      item.id,
      item.name || '',
      item.href || '',
      item.src || ''
    ].join('\t');
  });

  // Combine headers and rows
  const tsvData = [headers.join('\t'), ...rows].join('\n');

  // Write to clipboard
  navigator.clipboard.writeText(tsvData).then(() => {
    // Optional: could return a promise or callback, but handled in UI
  }).catch(err => {
    console.error('Failed to copy: ', err);
    alert("Failed to copy to clipboard");
  });
};
