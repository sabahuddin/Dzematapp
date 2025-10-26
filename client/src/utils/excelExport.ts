import * as XLSX from 'xlsx';

interface ExcelExportOptions {
  title: string;           // e.g., "Spisak korisnika"
  filename: string;        // e.g., "Korisnici"
  sheetName: string;       // e.g., "Korisnici"
  headers: string[];       // Column headers
  data: any[][];          // Data rows
  summaryRow?: any[];     // Optional summary row at the bottom
}

/**
 * Exportuje podatke u Excel fajl sa profesionalnim dizajnom spremnim za štampanje.
 * 
 * Format:
 * - DžematApp (naslov)
 * - Naziv izvještaja
 * - Datum i vrijeme generisanja
 * - Tabela sa podacima
 * - Opcioni red sa zbirom
 */
export function exportToExcel(options: ExcelExportOptions): void {
  const { title, filename, sheetName, headers, data, summaryRow } = options;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Get current date and time
  const currentDate = new Date().toLocaleDateString('hr-HR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Prepare header section
  const headerData = [
    ['DžematApp'],
    [''],
    [title],
    [`Datum izvještaja: ${currentDate}`],
    [''],
    headers
  ];

  // Combine all data
  const allData = [...headerData, ...data];
  
  // Add summary row if provided
  if (summaryRow) {
    allData.push(summaryRow);
  }

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(allData);

  // Set column widths based on content
  const colWidths = headers.map((header, idx) => {
    const maxLength = Math.max(
      header.length,
      ...data.map(row => String(row[idx] || '').length),
      summaryRow ? String(summaryRow[idx] || '').length : 0
    );
    return { wch: Math.min(Math.max(maxLength + 2, 12), 50) };
  });
  worksheet['!cols'] = colWidths;

  // Set row heights
  if (!worksheet['!rows']) worksheet['!rows'] = [];
  worksheet['!rows'][0] = { hpt: 24 }; // DžematApp row height
  worksheet['!rows'][2] = { hpt: 20 }; // Title row height
  worksheet['!rows'][5] = { hpt: 20 }; // Table header height

  // Merge cells for header section
  if (!worksheet['!merges']) worksheet['!merges'] = [];
  const numCols = headers.length;
  worksheet['!merges'].push(
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }, // DžematApp
    { s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } }, // Title
    { s: { r: 3, c: 0 }, e: { r: 3, c: numCols - 1 } }  // Date
  );

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate filename with date
  const fileDate = new Date().toLocaleDateString('hr-HR').replace(/\./g, '-');
  const finalFilename = `${filename}_${fileDate}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, finalFilename);
}
