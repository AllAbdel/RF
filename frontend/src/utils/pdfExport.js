import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Génère un PDF pour une réservation
 * @param {Object} reservation - Les données de la réservation
 * @param {Object} user - Les données de l'utilisateur
 */
export const generateReservationPDF = (reservation, user) => {
  const doc = new jsPDF();
  
  // Couleurs
  const primaryColor = [37, 99, 235]; // #2563eb
  const textColor = [30, 41, 59]; // #1e293b
  const grayColor = [100, 116, 139]; // #64748b
  
  // En-tête
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 220, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIRMATION DE RÉSERVATION', 105, 22, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Réservation #${reservation.id}`, 105, 32, { align: 'center' });
  
  // Informations du véhicule
  let y = 55;
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('VÉHICULE', 20, y);
  
  y += 10;
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.text(`${reservation.brand} ${reservation.model}`, 20, y);
  
  y += 8;
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.text(`Carburant: ${formatFuelType(reservation.fuel_type)}`, 20, y);
  
  // Agence
  y += 20;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AGENCE', 20, y);
  
  y += 10;
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(reservation.agency_name || 'Non spécifiée', 20, y);
  
  // Dates
  y += 20;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PÉRIODE DE LOCATION', 20, y);
  
  y += 10;
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const startDate = formatDateFr(reservation.start_date);
  const endDate = formatDateFr(reservation.end_date);
  
  doc.text(`Du: ${startDate}`, 20, y);
  y += 7;
  doc.text(`Au: ${endDate}`, 20, y);
  
  // Calcul de la durée
  const start = new Date(reservation.start_date);
  const end = new Date(reservation.end_date);
  const hours = Math.ceil((end - start) / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  y += 7;
  doc.setTextColor(...grayColor);
  doc.text(`Durée: ${days > 0 ? `${days} jour${days > 1 ? 's' : ''} ` : ''}${remainingHours > 0 ? `${remainingHours}h` : ''}`, 20, y);
  
  // Client
  y += 20;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT', 20, y);
  
  y += 10;
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Non spécifié', 20, y);
  
  if (user?.email) {
    y += 7;
    doc.text(user.email, 20, y);
  }
  
  if (user?.phone) {
    y += 7;
    doc.text(user.phone, 20, y);
  }
  
  // Encadré prix total
  y += 25;
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.roundedRect(20, y, 170, 35, 3, 3, 'F');
  
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.text('MONTANT TOTAL', 30, y + 12);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${Number(reservation.total_price).toFixed(2)} €`, 30, y + 27);
  
  // Statut
  const statusText = getStatusText(reservation.status);
  doc.setFontSize(12);
  doc.setTextColor(...getStatusColor(reservation.status));
  doc.text(statusText, 160, y + 20, { align: 'right' });
  
  // Pied de page
  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Document généré le ${formatDateFr(new Date())}`, 105, 280, { align: 'center' });
  doc.text('Ce document fait office de confirmation de réservation.', 105, 285, { align: 'center' });
  
  // Télécharger le PDF
  const fileName = `reservation_${reservation.id}_${reservation.brand}_${reservation.model}.pdf`.replace(/\s+/g, '_');
  doc.save(fileName);
};

/**
 * Génère un récapitulatif PDF de toutes les réservations
 * @param {Array} reservations - Liste des réservations
 * @param {Object} user - Les données de l'utilisateur
 */
export const generateAllReservationsPDF = (reservations, user) => {
  const doc = new jsPDF();
  
  const primaryColor = [37, 99, 235];
  const textColor = [30, 41, 59];
  const grayColor = [100, 116, 139];
  
  // En-tête
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 220, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HISTORIQUE DES RÉSERVATIONS', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${user?.first_name || ''} ${user?.last_name || ''} - ${reservations.length} réservation(s)`, 105, 28, { align: 'center' });
  
  let y = 50;
  
  reservations.forEach((reservation, index) => {
    // Nouvelle page si nécessaire
    if (y > 250) {
      doc.addPage();
      y = 30;
    }
    
    // Cadre de la réservation
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, y - 5, 180, 45, 3, 3, 'FD');
    
    // Numéro et statut
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.text(`#${reservation.id}`, 20, y + 3);
    
    const statusText = getStatusText(reservation.status);
    doc.setTextColor(...getStatusColor(reservation.status));
    doc.text(statusText, 185, y + 3, { align: 'right' });
    
    // Véhicule
    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${reservation.brand} ${reservation.model}`, 20, y + 13);
    
    // Agence
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.text(reservation.agency_name || '', 20, y + 20);
    
    // Dates
    const startDate = formatDateShort(reservation.start_date);
    const endDate = formatDateShort(reservation.end_date);
    doc.text(`${startDate} → ${endDate}`, 20, y + 28);
    
    // Prix
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${Number(reservation.total_price).toFixed(2)} €`, 185, y + 28, { align: 'right' });
    
    y += 55;
  });
  
  // Total
  const total = reservations.reduce((sum, r) => sum + Number(r.total_price), 0);
  
  if (y > 250) {
    doc.addPage();
    y = 30;
  }
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, 180, 25, 3, 3, 'F');
  
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Total général:', 25, y + 15);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${total.toFixed(2)} €`, 185, y + 15, { align: 'right' });
  
  // Pied de page
  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Document généré le ${formatDateFr(new Date())}`, 105, 285, { align: 'center' });
  
  doc.save('historique_reservations.pdf');
};

// Helpers
const formatDateFr = (dateString) => {
  try {
    return format(new Date(dateString), "d MMMM yyyy 'à' HH'h'mm", { locale: fr });
  } catch {
    return dateString;
  }
};

const formatDateShort = (dateString) => {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return dateString;
  }
};

const formatFuelType = (type) => {
  const types = {
    essence: 'Essence',
    diesel: 'Diesel',
    electrique: 'Électrique',
    hybride: 'Hybride'
  };
  return types[type] || type;
};

const getStatusText = (status) => {
  const statuses = {
    pending: 'En attente',
    accepted: 'Acceptée',
    rejected: 'Refusée',
    completed: 'Terminée',
    cancelled: 'Annulée'
  };
  return statuses[status] || status;
};

const getStatusColor = (status) => {
  const colors = {
    pending: [245, 158, 11], // orange
    accepted: [34, 197, 94], // green
    rejected: [239, 68, 68], // red
    completed: [37, 99, 235], // blue
    cancelled: [107, 114, 128] // gray
  };
  return colors[status] || colors.pending;
};
