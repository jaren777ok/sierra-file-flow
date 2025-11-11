import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class PdfGenerationService {
  /**
   * Generate PDF from INFORME template (A4 Portrait)
   */
  static async generateInformePdf(fileName: string = 'informe.pdf'): Promise<void> {
    try {
      const container = document.getElementById('informe-container');
      if (!container) {
        throw new Error('Contenedor de informe no encontrado');
      }

      const pages = container.querySelectorAll('.informe-page');
      if (pages.length === 0) {
        throw new Error('No hay páginas para generar PDF');
      }

      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: page.scrollWidth,
          windowHeight: page.scrollHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Error generando PDF de informe:', error);
      throw error;
    }
  }

  /**
   * Generate PDF from PPT template (A4 Landscape)
   */
  static async generatePptPdf(fileName: string = 'presentacion.pdf'): Promise<void> {
    try {
      const container = document.getElementById('ppt-container');
      if (!container) {
        throw new Error('Contenedor de PPT no encontrado');
      }

      const slides = container.querySelectorAll('.ppt-slide');
      if (slides.length === 0) {
        throw new Error('No hay slides para generar PDF');
      }

      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = 297; // A4 landscape width in mm
      const pdfHeight = 210; // A4 landscape height in mm

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        
        const canvas = await html2canvas(slide, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: slide.scrollWidth,
          windowHeight: slide.scrollHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Error generando PDF de presentación:', error);
      throw error;
    }
  }

  /**
   * Download blob as file
   */
  static downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
