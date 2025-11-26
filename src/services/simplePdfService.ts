import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export class SimplePdfService {
  /**
   * Generate a PDF from the entire content container
   * Automatically divides content into multiple A4 pages
   * @param fileName - Name of the PDF file to download
   */
  static async generatePdf(fileName: string = 'documento.pdf'): Promise<void> {
    try {
      console.log('🔄 Iniciando generación de PDF...');
      
      // Get all page containers
      const pageContainers = document.querySelectorAll('.page-container');
      
      if (!pageContainers || pageContainers.length === 0) {
        throw new Error('No se encontraron páginas del documento');
      }

      console.log(`📄 Generando PDF con ${pageContainers.length} páginas...`);

      // Create PDF in A4 portrait format
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pdfWidth = 210;  // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      
      // Capture each page individually
      for (let i = 0; i < pageContainers.length; i++) {
        console.log(`📸 Capturando página ${i + 1}/${pageContainers.length}...`);
        
        const pageElement = pageContainers[i] as HTMLElement;
        
        // Capture this page with html2canvas
        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        // Add new page if not the first one
        if (i > 0) {
          pdf.addPage();
        }
        
        // Add image to PDF (full page)
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        console.log(`✅ Página ${i + 1} agregada al PDF`);
      }

      console.log('💾 Descargando PDF...');
      pdf.save(fileName);
      console.log('✅ PDF generado exitosamente');
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      throw error;
    }
  }
}
