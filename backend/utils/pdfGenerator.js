const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Créer le dossier documents s'il n'existe pas
const documentsDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Fonction utilitaire pour formater une date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Fonction utilitaire pour formater un prix
const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

// Générer une facture
const generateInvoice = (reservationData, invoiceNumber) => {
  return new Promise((resolve, reject) => {
    try {
      const filename = `invoice_${invoiceNumber}.pdf`;
      const filepath = path.join(documentsDir, filename);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).text('FACTURE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Numéro: ${invoiceNumber}`, { align: 'right' });
      doc.text(`Date: ${formatDate(new Date())}`, { align: 'right' });
      doc.moveDown(2);

      // Informations agence
      doc.fontSize(14).text('Agence:', { underline: true });
      doc.fontSize(10);
      doc.text(reservationData.agency.name);
      doc.text(reservationData.agency.email);
      if (reservationData.agency.phone) doc.text(reservationData.agency.phone);
      if (reservationData.agency.address) doc.text(reservationData.agency.address);
      doc.moveDown();

      // Informations client
      doc.fontSize(14).text('Client:', { underline: true });
      doc.fontSize(10);
      doc.text(`${reservationData.client.first_name} ${reservationData.client.last_name}`);
      doc.text(reservationData.client.email);
      if (reservationData.client.phone) doc.text(reservationData.client.phone);
      doc.moveDown(2);

      // Détails de la réservation
      doc.fontSize(14).text('Détails de la location:', { underline: true });
      doc.moveDown(0.5);
      
      const tableTop = doc.y;
      doc.fontSize(10);
      
      // En-têtes du tableau
      doc.text('Description', 50, tableTop, { width: 200 });
      doc.text('Période', 250, tableTop, { width: 150 });
      doc.text('Montant', 450, tableTop, { width: 100, align: 'right' });
      doc.moveDown();
      
      // Ligne de séparation
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // Ligne du véhicule
      const itemY = doc.y;
      doc.text(`${reservationData.vehicle.brand} ${reservationData.vehicle.model}`, 50, itemY, { width: 200 });
      doc.text(
        `${formatDate(reservationData.start_date)} au ${formatDate(reservationData.end_date)}`,
        250,
        itemY,
        { width: 150 }
      );
      doc.text(formatPrice(reservationData.total_price), 450, itemY, { width: 100, align: 'right' });
      doc.moveDown(2);

      // Ligne de séparation
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Total
      doc.fontSize(12);
      doc.text('Total TTC:', 350, doc.y);
      doc.text(formatPrice(reservationData.total_price), 450, doc.y, { width: 100, align: 'right' });
      doc.moveDown(2);

      // Pied de page
      doc.fontSize(8).text(
        'TVA non applicable, article 293 B du CGI',
        50,
        doc.page.height - 100,
        { align: 'center' }
      );
      doc.text(
        'Merci de votre confiance',
        50,
        doc.page.height - 80,
        { align: 'center' }
      );

      doc.end();

      stream.on('finish', () => {
        resolve(`/uploads/documents/${filename}`);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Générer un reçu
const generateReceipt = (reservationData, receiptNumber) => {
  return new Promise((resolve, reject) => {
    try {
      const filename = `receipt_${receiptNumber}.pdf`;
      const filepath = path.join(documentsDir, filename);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).text('REÇU DE PAIEMENT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Numéro: ${receiptNumber}`, { align: 'right' });
      doc.text(`Date: ${formatDate(new Date())}`, { align: 'right' });
      doc.moveDown(2);

      // Informations
      doc.fontSize(14).text('Agence:', { underline: true });
      doc.fontSize(10);
      doc.text(reservationData.agency.name);
      doc.moveDown();

      doc.fontSize(14).text('Reçu de:', { underline: true });
      doc.fontSize(10);
      doc.text(`${reservationData.client.first_name} ${reservationData.client.last_name}`);
      doc.moveDown(2);

      // Montant
      doc.fontSize(16);
      doc.text('Montant reçu:', { underline: true });
      doc.fontSize(20);
      doc.text(formatPrice(reservationData.total_price), { align: 'center' });
      doc.moveDown(2);

      // Détails
      doc.fontSize(10);
      doc.text(`Pour la location de: ${reservationData.vehicle.brand} ${reservationData.vehicle.model}`);
      doc.text(`Période: du ${formatDate(reservationData.start_date)} au ${formatDate(reservationData.end_date)}`);
      doc.text(`Statut du paiement: ${reservationData.payment_status === 'paid' ? 'Payé' : 'En attente'}`);
      doc.moveDown(3);

      // Signature
      doc.fontSize(10).text('Signature de l\'agence:', 50, doc.page.height - 150);
      doc.moveTo(50, doc.page.height - 120).lineTo(250, doc.page.height - 120).stroke();

      doc.end();

      stream.on('finish', () => {
        resolve(`/uploads/documents/${filename}`);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Générer un contrat de location
const generateContract = (reservationData, contractNumber) => {
  return new Promise((resolve, reject) => {
    try {
      const filename = `contract_${contractNumber}.pdf`;
      const filepath = path.join(documentsDir, filename);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // En-tête
      doc.fontSize(18).text('CONTRAT DE LOCATION DE VÉHICULE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Contrat n° ${contractNumber}`, { align: 'right' });
      doc.text(`Date: ${formatDate(new Date())}`, { align: 'right' });
      doc.moveDown(2);

      // Parties
      doc.fontSize(12).text('ENTRE LES SOUSSIGNÉS:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text('Le loueur:', { bold: true });
      doc.text(reservationData.agency.name);
      doc.text(reservationData.agency.email);
      if (reservationData.agency.address) doc.text(reservationData.agency.address);
      doc.text('Ci-après dénommé "le Loueur"');
      doc.moveDown();

      doc.text('Et:', { bold: true });
      doc.text(`${reservationData.client.first_name} ${reservationData.client.last_name}`);
      doc.text(reservationData.client.email);
      doc.text('Ci-après dénommé "le Locataire"');
      doc.moveDown(2);

      // Objet du contrat
      doc.fontSize(12).text('OBJET DU CONTRAT:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(
        `Le Loueur met à disposition du Locataire le véhicule suivant : ${reservationData.vehicle.brand} ${reservationData.vehicle.model}.`
      );
      doc.moveDown();

      // Durée
      doc.fontSize(12).text('DURÉE:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Début de location: ${formatDate(reservationData.start_date)}`);
      doc.text(`Fin de location: ${formatDate(reservationData.end_date)}`);
      doc.moveDown();

      // Prix
      doc.fontSize(12).text('PRIX:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Montant total de la location: ${formatPrice(reservationData.total_price)}`);
      doc.moveDown();

      // Conditions
      if (reservationData.agency.rental_conditions) {
        doc.fontSize(12).text('CONDITIONS PARTICULIÈRES:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9);
        const conditions = reservationData.agency.rental_conditions.split('\n');
        conditions.forEach((condition, index) => {
          if (condition.trim()) {
            doc.text(`${index + 1}. ${condition.trim()}`);
          }
        });
        doc.moveDown();
      }

      // Adresses de récupération et retour
      doc.fontSize(12).text('LIEUX:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Récupération: ${reservationData.vehicle.pickup_address || reservationData.vehicle.location}`);
      doc.text(`Retour: ${reservationData.vehicle.return_address || reservationData.vehicle.location}`);
      doc.moveDown(2);

      // Engagement
      doc.fontSize(10);
      doc.text(
        'Le Locataire reconnaît avoir pris connaissance et accepté sans réserve les conditions générales de location.',
        { align: 'justify' }
      );
      doc.moveDown(3);

      // Signatures
      doc.fontSize(10);
      doc.text('Signature du Loueur:', 50, doc.page.height - 150);
      doc.text('Signature du Locataire:', 350, doc.page.height - 150);
      
      doc.moveTo(50, doc.page.height - 120).lineTo(200, doc.page.height - 120).stroke();
      doc.moveTo(350, doc.page.height - 120).lineTo(500, doc.page.height - 120).stroke();

      doc.end();

      stream.on('finish', () => {
        resolve(`/uploads/documents/${filename}`);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoice,
  generateReceipt,
  generateContract
};
