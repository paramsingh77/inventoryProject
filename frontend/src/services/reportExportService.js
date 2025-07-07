import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

class ReportExportService {
  // Export to Excel
  exportToExcel(data, options = {}) {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Create summary sheet
      if (options.includeSummary && data.summary) {
        const summaryData = this.prepareSummaryData(data.summary);
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      }
      
      // Create detailed data sheet
      if (options.includeDetails && data.details) {
        const detailsSheet = XLSX.utils.json_to_sheet(data.details);
        XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Details');
      }
      
      // Create charts sheet (if charts data available)
      if (options.includeCharts && data.charts) {
        const chartsData = this.prepareChartsData(data.charts);
        const chartsSheet = XLSX.utils.json_to_sheet(chartsData);
        XLSX.utils.book_append_sheet(workbook, chartsSheet, 'Charts');
      }
      
      // Generate and download file
      const fileName = options.fileName || `Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('Excel export error:', error);
      throw new Error('Failed to export to Excel');
    }
  }
  
  // Export to PDF
  exportToPdf(data, options = {}) {
    try {
      const doc = new jsPDF();
      let yPosition = 20;
      
      // Add header
      doc.setFontSize(20);
      doc.text('Purchase Order Report', 20, yPosition);
      yPosition += 20;
      
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 15;
      
      // Add summary section
      if (options.includeSummary && data.summary) {
        yPosition = this.addSummaryToPdf(doc, data.summary, yPosition);
      }
      
      // Add detailed data
      if (options.includeDetails && data.details) {
        yPosition = this.addDetailsToPdf(doc, data.details, yPosition);
      }
      
      // Generate and download file
      const fileName = options.fileName || `Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error('Failed to export to PDF');
    }
  }
  
  // Export to CSV
  exportToCsv(data, options = {}) {
    try {
      let csvContent = '';
      
      // Add headers
      if (data.headers) {
        csvContent += data.headers.join(',') + '\n';
      }
      
      // Add data rows
      if (data.rows) {
        data.rows.forEach(row => {
          csvContent += row.join(',') + '\n';
        });
      }
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const fileName = options.fileName || `Report_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      return { success: true, fileName };
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error('Failed to export to CSV');
    }
  }
  
  // Prepare summary data for Excel
  prepareSummaryData(summary) {
    return [
      { Metric: 'Total Orders', Value: summary.totalOrders },
      { Metric: 'Total Amount', Value: `$${summary.totalAmount.toLocaleString()}` },
      { Metric: 'Average Order Value', Value: `$${summary.avgOrderValue.toLocaleString()}` },
      { Metric: 'Unique Vendors', Value: Object.keys(summary.vendorCounts || {}).length },
      { Metric: 'Report Date', Value: new Date().toLocaleDateString() }
    ];
  }
  
  // Prepare charts data for Excel
  prepareChartsData(charts) {
    const data = [];
    
    if (charts.statusDistribution) {
      data.push({ Category: 'Status Distribution' });
      Object.entries(charts.statusDistribution).forEach(([status, count]) => {
        data.push({ Status: status, Count: count });
      });
      data.push({}); // Empty row
    }
    
    if (charts.vendorDistribution) {
      data.push({ Category: 'Vendor Distribution' });
      Object.entries(charts.vendorDistribution).forEach(([vendor, count]) => {
        data.push({ Vendor: vendor, Count: count });
      });
    }
    
    return data;
  }
  
  // Add summary to PDF
  addSummaryToPdf(doc, summary, yPosition) {
    doc.setFontSize(16);
    doc.text('Summary', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.text(`Total Orders: ${summary.totalOrders}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Total Amount: $${summary.totalAmount.toLocaleString()}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Average Order Value: $${summary.avgOrderValue.toLocaleString()}`, 20, yPosition);
    yPosition += 15;
    
    return yPosition;
  }
  
  // Add details to PDF
  addDetailsToPdf(doc, details, yPosition) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(16);
    doc.text('Detailed Data', 20, yPosition);
    yPosition += 10;
    
    // Create table
    const tableData = details.map(item => [
      item.poNumber || '',
      item.vendor || '',
      item.status || '',
      `$${(item.amount || 0).toLocaleString()}`,
      item.date || ''
    ]);
    
    doc.autoTable({
      startY: yPosition,
      head: [['PO Number', 'Vendor', 'Status', 'Amount', 'Date']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    return doc.lastAutoTable.finalY + 10;
  }
  
  // Process report data for export
  processReportDataForExport(reportData, options = {}) {
    const processed = {
      summary: null,
      details: [],
      charts: null,
      headers: [],
      rows: []
    };
    
    switch (reportData.type) {
      case 'summary':
        processed.summary = {
          totalOrders: reportData.totalOrders,
          totalAmount: reportData.totalAmount,
          avgOrderValue: reportData.avgOrderValue,
          vendorCounts: reportData.vendorCounts
        };
        processed.details = reportData.recentOrders || [];
        processed.charts = {
          statusDistribution: reportData.statusCounts,
          vendorDistribution: reportData.vendorCounts
        };
        break;
        
      case 'vendor-analysis':
        processed.details = reportData.vendors.map(vendor => ({
          vendor: vendor.name,
          totalOrders: vendor.totalOrders,
          totalAmount: vendor.totalAmount,
          avgOrderValue: vendor.avgOrderValue
        }));
        break;
        
      case 'financial-summary':
        processed.summary = {
          totalAmount: reportData.totalAmount,
          totalOrders: reportData.totalOrders
        };
        processed.details = reportData.monthlyData.map(month => ({
          month: month.month,
          orders: month.orders,
          amount: month.amount
        }));
        break;
        
      case 'status-report':
        processed.details = Object.entries(reportData.statusGroups).flatMap(([status, orders]) =>
          orders.map(order => ({
            poNumber: order.poNumber,
            vendor: order.vendor?.name || order.vendor_name,
            status: status,
            amount: order.totalAmount || order.total || 0,
            date: new Date(order.createdAt).toLocaleDateString()
          }))
        );
        break;
        
      case 'detailed-list':
        processed.details = reportData.orders;
        break;
    }
    
    return processed;
  }
}

export default new ReportExportService(); 