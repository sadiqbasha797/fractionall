import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportOptions {
  filename: string;
  title: string;
  columns: ExportColumn[];
  data: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  /**
   * Export data to PDF format
   */
  exportToPDF(options: ExportOptions): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(options.title, 14, 22);
    
    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    
    // Prepare table data
    const tableColumns = options.columns.map(col => col.header);
    const tableRows = options.data.map(item => 
      options.columns.map(col => this.formatCellValue(item[col.key]))
    );
    
    // Generate table
    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: this.getColumnStyles(options.columns),
    });
    
    // Save the PDF
    doc.save(`${options.filename}.pdf`);
  }

  /**
   * Export data to Excel format
   */
  exportToExcel(options: ExportOptions): void {
    // Prepare worksheet data
    const worksheetData = [
      // Header row
      options.columns.map(col => col.header),
      // Data rows
      ...options.data.map(item => 
        options.columns.map(col => this.formatCellValue(item[col.key]))
      )
    ];
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    const columnWidths = options.columns.map(col => ({
      wch: col.width || 15
    }));
    worksheet['!cols'] = columnWidths;
    
    // Style the header row
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2980B9" } },
        alignment: { horizontal: "center" }
      };
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, options.title);
    
    // Save the Excel file
    XLSX.writeFile(workbook, `${options.filename}.xlsx`);
  }

  /**
   * Format cell values for export
   */
  private formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'object') {
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  /**
   * Generate column styles for PDF export
   */
  private getColumnStyles(columns: ExportColumn[]): any {
    const styles: any = {};
    
    columns.forEach((col, index) => {
      if (col.width) {
        styles[index] = { cellWidth: col.width };
      }
    });
    
    return styles;
  }

  /**
   * Helper method to extract data from HTML tables
   */
  extractTableData(tableElement: HTMLTableElement, columnMappings: { [key: string]: string }): any[] {
    const data: any[] = [];
    const rows = tableElement.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const rowData: any = {};
      
      Object.keys(columnMappings).forEach((key, index) => {
        if (cells[index]) {
          const cellText = cells[index].textContent?.trim() || '';
          rowData[key] = cellText;
        }
      });
      
      data.push(rowData);
    });
    
    return data;
  }

  /**
   * Show export options dialog
   */
  showExportOptions(exportPDFCallback: () => void, exportExcelCallback: () => void): void {
    // Automatically trigger Excel export
    exportExcelCallback();
  }
}