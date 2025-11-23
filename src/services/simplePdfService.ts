import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export class SimplePdfService {
  /**
   * Generate a PDF from an HTML container element
   * @param containerId - ID of the HTML element to convert
   * @param fileName - Name of the PDF file to download
   */
  static async generatePdf(containerId: string, fileName: string = 'documento.pdf'): Promise<void> {
    const element = document.getElementById(containerId);
    
    if (!element) {
      throw new Error(`Element with ID '${containerId}' not found`);
    }

    try {
      // Generate canvas from HTML element
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 800,
        windowHeight: element.scrollHeight
      });

      // Calculate dimensions for A4 portrait
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download PDF
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}
