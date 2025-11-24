import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export class SimplePdfService {
  /**
   * Generate a PDF from multiple page elements
   * @param fileName - Name of the PDF file to download
   */
  static async generatePdf(fileName: string = 'documento.pdf'): Promise<void> {
    try {
      console.log('🔄 Iniciando generación de PDF...');
      
      // Get all pages with class 'word-page'
      const pages = document.querySelectorAll('.word-page');
      console.log(`📄 Encontradas ${pages.length} páginas`);
      
      if (pages.length === 0) {
        throw new Error('No se encontraron páginas para exportar');
      }

      // Create PDF A4 portrait
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pdfWidth = 210;  // A4 width in mm
      const pdfHeight = 297; // A4 height in mm

      // Capture each page
      for (let i = 0; i < pages.length; i++) {
        console.log(`📸 Capturando página ${i + 1}/${pages.length}...`);
        const page = pages[i] as HTMLElement;
        
        // Capture the page with html2canvas
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 793,  // PAGE_WIDTH
          height: 1123, // A4 height in pixels
          windowWidth: 793,
          windowHeight: 1123
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
