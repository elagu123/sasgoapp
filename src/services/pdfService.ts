import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { PackingList, Trip } from '../types';

export class PDFService {
  private static formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  static async generatePackingListPDF(packingList: PackingList, trip: Trip): Promise<void> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SAS Go - Lista de Equipaje', pageWidth / 2, 25, { align: 'center' });
    
    // Trip info
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Viaje: ${trip.title}`, 20, 45);
    pdf.text(`Destino: ${Array.isArray(trip.destination) ? trip.destination.join(', ') : trip.destination}`, 20, 55);
    pdf.text(`Fechas: ${this.formatDate(trip.dates.start)} - ${this.formatDate(trip.dates.end)}`, 20, 65);
    
    if (trip.travelers && trip.travelers > 1) {
      pdf.text(`Viajeros: ${trip.travelers}`, 20, 75);
    }
    
    // Packing list title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(packingList.title, 20, 90);
    
    // Group items by category
    const itemsByCategory = packingList.items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof packingList.items>);
    
    let yPosition = 105;
    
    // Generate content for each category
    Object.entries(itemsByCategory).forEach(([category, items]) => {
      // Category header
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(category.toUpperCase(), 20, yPosition);
      yPosition += 10;
      
      // Items
      pdf.setFont('helvetica', 'normal');
      items.forEach(item => {
        const checkbox = item.packed ? '☑' : '☐';
        let text = `${checkbox} ${item.name}`;
        
        if (item.qty > 1) {
          text += ` (x${item.qty})`;
        }
        
        if (item.notes) {
          text += ` - ${item.notes}`;
        }
        
        pdf.text(text, 25, yPosition);
        yPosition += 7;
        
        // Check if we need a new page
        if (yPosition > 280) {
          pdf.addPage();
          yPosition = 20;
        }
      });
      
      yPosition += 5; // Space between categories
    });
    
    // Summary
    const totalItems = packingList.items.reduce((sum, item) => sum + item.qty, 0);
    const packedItems = packingList.items.filter(item => item.packed).reduce((sum, item) => sum + item.qty, 0);
    const packedPercentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Total de items: ${totalItems} | Empacados: ${packedItems} (${packedPercentage}%)`, 20, yPosition + 10);
    
    // Footer
    pdf.setFontSize(8);
    pdf.text(`Generado por SAS Go - ${new Date().toLocaleDateString('es-ES')}`, 20, pdf.internal.pageSize.getHeight() - 10);
    
    // Save the PDF
    const fileName = `${trip.title.replace(/[^a-z0-9]/gi, '_')}_packing_list.pdf`;
    pdf.save(fileName);
  }

  static async generateItineraryPDF(trip: Trip): Promise<void> {
    if (!trip.itinerary) {
      throw new Error('No hay itinerario disponible para este viaje');
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SAS Go - Itinerario de Viaje', pageWidth / 2, 25, { align: 'center' });
    
    // Trip info
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${trip.title}`, pageWidth / 2, 40, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`Destino: ${Array.isArray(trip.destination) ? trip.destination.join(', ') : trip.destination}`, 20, 55);
    pdf.text(`Fechas: ${this.formatDate(trip.dates.start)} - ${this.formatDate(trip.dates.end)}`, 20, 65);
    
    if (trip.travelers && trip.travelers > 1) {
      pdf.text(`Viajeros: ${trip.travelers}`, 20, 75);
    }
    
    if (trip.budget) {
      pdf.text(`Presupuesto: $${trip.budget.toLocaleString()}`, 20, 85);
    }
    
    let yPosition = 100;
    
    try {
      // Handle both string and already parsed itinerary data
      const itinerary = typeof trip.itinerary === 'string' 
        ? JSON.parse(trip.itinerary)
        : trip.itinerary;
      
      if (Array.isArray(itinerary)) {
        itinerary.forEach((day, dayIndex) => {
          // Day header
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Día ${dayIndex + 1}${day.date ? ` - ${day.date}` : ''}`, 20, yPosition);
          yPosition += 15;
          
          // Activities
          if (day.blocks && Array.isArray(day.blocks)) {
            day.blocks.forEach((activity: any) => {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              
              // Time
              if (activity.startTime) {
                pdf.text(`${activity.startTime}`, 25, yPosition);
              }
              
              // Activity title
              pdf.setFont('helvetica', 'normal');
              const titleX = activity.startTime ? 50 : 25;
              pdf.text(activity.title || 'Actividad sin título', titleX, yPosition);
              yPosition += 7;
              
              // Activity description
              if (activity.description) {
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'italic');
                const lines = pdf.splitTextToSize(activity.description, pageWidth - 40);
                pdf.text(lines, titleX, yPosition);
                yPosition += lines.length * 4;
              }
              
              yPosition += 3;
              
              // Check if we need a new page
              if (yPosition > 270) {
                pdf.addPage();
                yPosition = 20;
              }
            });
          }
          
          yPosition += 10; // Space between days
          
          // Check if we need a new page
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
        });
      }
    } catch (error) {
      // If itinerary parsing fails, show raw content
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(trip.itinerary, pageWidth - 40);
      pdf.text(lines, 20, yPosition);
    }
    
    // Footer
    pdf.setFontSize(8);
    pdf.text(`Generado por SAS Go - ${new Date().toLocaleDateString('es-ES')}`, 20, pdf.internal.pageSize.getHeight() - 10);
    
    // Save the PDF
    const fileName = `${trip.title.replace(/[^a-z0-9]/gi, '_')}_itinerary.pdf`;
    pdf.save(fileName);
  }

  static async generateTripSummaryPDF(trip: Trip, packingList?: PackingList): Promise<void> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SAS Go', pageWidth / 2, 25, { align: 'center' });
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Resumen Completo de Viaje', pageWidth / 2, 35, { align: 'center' });
    
    // Trip info
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(trip.title, pageWidth / 2, 50, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Destino: ${Array.isArray(trip.destination) ? trip.destination.join(', ') : trip.destination}`, 20, 65);
    pdf.text(`Fechas: ${this.formatDate(trip.dates.start)} - ${this.formatDate(trip.dates.end)}`, 20, 75);
    
    let yPosition = 85;
    
    if (trip.travelers && trip.travelers > 1) {
      pdf.text(`Viajeros: ${trip.travelers}`, 20, yPosition);
      yPosition += 10;
    }
    
    if (trip.budget) {
      pdf.text(`Presupuesto: $${trip.budget.toLocaleString()}`, 20, yPosition);
      yPosition += 10;
    }
    
    if (trip.pace) {
      const paceText = trip.pace === 'relaxed' ? 'Relajado' : 
                      trip.pace === 'moderate' ? 'Moderado' : 'Intenso';
      pdf.text(`Ritmo: ${paceText}`, 20, yPosition);
      yPosition += 10;
    }
    
    yPosition += 10;
    
    // Include packing list summary if available
    if (packingList) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Lista de Equipaje', 20, yPosition);
      yPosition += 15;
      
      const totalItems = packingList.items.reduce((sum, item) => sum + item.qty, 0);
      const packedItems = packingList.items.filter(item => item.packed).reduce((sum, item) => sum + item.qty, 0);
      const packedPercentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total de items: ${totalItems} | Empacados: ${packedItems} (${packedPercentage}%)`, 20, yPosition);
      yPosition += 20;
    }
    
    // Include itinerary summary if available
    if (trip.itinerary) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Itinerario', 20, yPosition);
      yPosition += 15;
      
      try {
        // Handle both string and already parsed itinerary data
        const itinerary = typeof trip.itinerary === 'string' 
          ? JSON.parse(trip.itinerary)
          : trip.itinerary;
        if (Array.isArray(itinerary)) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`${itinerary.length} días de actividades planificadas`, 20, yPosition);
          yPosition += 10;
          
          itinerary.slice(0, 3).forEach((day, index) => {
            pdf.text(`Día ${index + 1}: ${day.blocks?.length || 0} actividades`, 25, yPosition);
            yPosition += 7;
          });
          
          if (itinerary.length > 3) {
            pdf.text(`... y ${itinerary.length - 3} días más`, 25, yPosition);
            yPosition += 10;
          }
        }
      } catch (error) {
        pdf.setFontSize(10);
        pdf.text('Itinerario disponible (ver PDF completo)', 20, yPosition);
        yPosition += 10;
      }
    }
    
    // Footer
    pdf.setFontSize(8);
    pdf.text(`Generado por SAS Go - ${new Date().toLocaleDateString('es-ES')}`, 20, pdf.internal.pageSize.getHeight() - 10);
    
    // Save the PDF
    const fileName = `${trip.title.replace(/[^a-z0-9]/gi, '_')}_summary.pdf`;
    pdf.save(fileName);
  }
}