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
      
      // Get the entire content container
      const container = document.getElementById('pdf-content');
      
      if (!container) {
        throw new Error('No se encontró el contenedor del documento');
      }

      console.log(`📸 Capturando contenedor completo (altura: ${container.scrollHeight}px)...`);
      
      // Capture the entire container with html2canvas
      const canvas = await html2canvas(container, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        height: container.scrollHeight, // Capture full height
        windowHeight: container.scrollHeight,
      });

      console.log(`✅ Contenedor capturado: ${canvas.width}x${canvas.height}px`);

      // Create PDF in A4 portrait format
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pdfWidth = 210;  // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      
      // Calculate how many pages we need based on captured height
      const pageHeightInPixels = 1123 * 2; // A4 height in pixels at scale 2
      const totalPages = Math.ceil(canvas.height / pageHeightInPixels);
      
      console.log(`📄 Dividiendo en ${totalPages} páginas...`);

      // Extract and add each page
      for (let i = 0; i < totalPages; i++) {
        console.log(`📝 Procesando página ${i + 1}/${totalPages}...`);
        
        // Create a temporary canvas for this page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        
        // Calculate the height for this page (last page might be shorter)
        const remainingHeight = canvas.height - (i * pageHeightInPixels);
        pageCanvas.height = Math.min(pageHeightInPixels, remainingHeight);
        
        // Draw the section of the main canvas onto this page canvas
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, i * pageHeightInPixels, // Source X, Y
            canvas.width, pageCanvas.height, // Source width, height
            0, 0, // Destination X, Y
            canvas.width, pageCanvas.height // Destination width, height
          );
        }
        
        // Convert this page to image
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        
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
