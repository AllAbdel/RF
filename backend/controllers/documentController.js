const db = require('../config/database');
const { generateInvoice, generateReceipt, generateContract } = require('../utils/pdfGenerator');

// Générer un numéro de document unique
const generateDocumentNumber = (type, id) => {
  const year = new Date().getFullYear();
  const typePrefix = {
    invoice: 'FAC',
    receipt: 'REC',
    contract: 'CTR'
  };
  return `${typePrefix[type]}-${year}-${String(id).padStart(6, '0')}`;
};

// Générer une facture pour une réservation
const createInvoice = async (req, res) => {
  try {
    const { reservation_id } = req.params;

    // Vérifier que la réservation appartient à l'agence
    const [reservations] = await db.query(
      `SELECT r.*, v.brand, v.model, v.pickup_address, v.return_address, v.location,
              u.first_name as client_first_name, u.last_name as client_last_name, 
              u.email as client_email, u.phone as client_phone,
              a.name as agency_name, a.email as agency_email, 
              a.phone as agency_phone, a.address as agency_address, a.rental_conditions
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       JOIN users u ON r.client_id = u.id
       JOIN agencies a ON v.agency_id = a.id
       WHERE r.id = ? AND v.agency_id = ?`,
      [reservation_id, req.user.agency_id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    const reservation = reservations[0];

    // Vérifier si une facture existe déjà
    const [existing] = await db.query(
      'SELECT * FROM documents WHERE reservation_id = ? AND document_type = ?',
      [reservation_id, 'invoice']
    );

    if (existing.length > 0) {
      return res.json({ document: existing[0], message: 'Facture déjà générée' });
    }

    // Préparer les données
    const reservationData = {
      vehicle: {
        brand: reservation.brand,
        model: reservation.model,
        pickup_address: reservation.pickup_address,
        return_address: reservation.return_address,
        location: reservation.location
      },
      client: {
        first_name: reservation.client_first_name,
        last_name: reservation.client_last_name,
        email: reservation.client_email,
        phone: reservation.client_phone
      },
      agency: {
        name: reservation.agency_name,
        email: reservation.agency_email,
        phone: reservation.agency_phone,
        address: reservation.agency_address,
        rental_conditions: reservation.rental_conditions
      },
      start_date: reservation.start_date,
      end_date: reservation.end_date,
      total_price: reservation.total_price,
      payment_status: reservation.payment_status
    };

    // Générer le numéro de document
    const documentNumber = generateDocumentNumber('invoice', Date.now());

    // Générer le PDF
    const filePath = await generateInvoice(reservationData, documentNumber);

    // Enregistrer dans la base de données
    const [result] = await db.query(
      'INSERT INTO documents (reservation_id, document_type, document_number, file_path) VALUES (?, ?, ?, ?)',
      [reservation_id, 'invoice', documentNumber, filePath]
    );

    res.json({
      message: 'Facture générée avec succès',
      document: {
        id: result.insertId,
        document_number: documentNumber,
        file_path: filePath,
        document_type: 'invoice'
      }
    });
  } catch (error) {
    console.error('Erreur génération facture:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de la facture' });
  }
};

// Générer un reçu
const createReceipt = async (req, res) => {
  try {
    const { reservation_id } = req.params;

    const [reservations] = await db.query(
      `SELECT r.*, v.brand, v.model,
              u.first_name as client_first_name, u.last_name as client_last_name, 
              u.email as client_email,
              a.name as agency_name
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       JOIN users u ON r.client_id = u.id
       JOIN agencies a ON v.agency_id = a.id
       WHERE r.id = ? AND v.agency_id = ?`,
      [reservation_id, req.user.agency_id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    const reservation = reservations[0];

    const [existing] = await db.query(
      'SELECT * FROM documents WHERE reservation_id = ? AND document_type = ?',
      [reservation_id, 'receipt']
    );

    if (existing.length > 0) {
      return res.json({ document: existing[0], message: 'Reçu déjà généré' });
    }

    const reservationData = {
      vehicle: {
        brand: reservation.brand,
        model: reservation.model
      },
      client: {
        first_name: reservation.client_first_name,
        last_name: reservation.client_last_name,
        email: reservation.client_email
      },
      agency: {
        name: reservation.agency_name
      },
      start_date: reservation.start_date,
      end_date: reservation.end_date,
      total_price: reservation.total_price,
      payment_status: reservation.payment_status
    };

    const documentNumber = generateDocumentNumber('receipt', Date.now());
    const filePath = await generateReceipt(reservationData, documentNumber);

    const [result] = await db.query(
      'INSERT INTO documents (reservation_id, document_type, document_number, file_path) VALUES (?, ?, ?, ?)',
      [reservation_id, 'receipt', documentNumber, filePath]
    );

    res.json({
      message: 'Reçu généré avec succès',
      document: {
        id: result.insertId,
        document_number: documentNumber,
        file_path: filePath,
        document_type: 'receipt'
      }
    });
  } catch (error) {
    console.error('Erreur génération reçu:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du reçu' });
  }
};

// Générer un contrat
const createContract = async (req, res) => {
  try {
    const { reservation_id } = req.params;

    const [reservations] = await db.query(
      `SELECT r.*, v.brand, v.model, v.pickup_address, v.return_address, v.location,
              u.first_name as client_first_name, u.last_name as client_last_name, 
              u.email as client_email,
              a.name as agency_name, a.email as agency_email, 
              a.address as agency_address, a.rental_conditions
       FROM reservations r
       JOIN vehicles v ON r.vehicle_id = v.id
       JOIN users u ON r.client_id = u.id
       JOIN agencies a ON v.agency_id = a.id
       WHERE r.id = ? AND v.agency_id = ?`,
      [reservation_id, req.user.agency_id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    const reservation = reservations[0];

    const [existing] = await db.query(
      'SELECT * FROM documents WHERE reservation_id = ? AND document_type = ?',
      [reservation_id, 'contract']
    );

    if (existing.length > 0) {
      return res.json({ document: existing[0], message: 'Contrat déjà généré' });
    }

    const reservationData = {
      vehicle: {
        brand: reservation.brand,
        model: reservation.model,
        pickup_address: reservation.pickup_address,
        return_address: reservation.return_address,
        location: reservation.location
      },
      client: {
        first_name: reservation.client_first_name,
        last_name: reservation.client_last_name,
        email: reservation.client_email
      },
      agency: {
        name: reservation.agency_name,
        email: reservation.agency_email,
        address: reservation.agency_address,
        rental_conditions: reservation.rental_conditions
      },
      start_date: reservation.start_date,
      end_date: reservation.end_date,
      total_price: reservation.total_price
    };

    const documentNumber = generateDocumentNumber('contract', Date.now());
    const filePath = await generateContract(reservationData, documentNumber);

    const [result] = await db.query(
      'INSERT INTO documents (reservation_id, document_type, document_number, file_path) VALUES (?, ?, ?, ?)',
      [reservation_id, 'contract', documentNumber, filePath]
    );

    res.json({
      message: 'Contrat généré avec succès',
      document: {
        id: result.insertId,
        document_number: documentNumber,
        file_path: filePath,
        document_type: 'contract'
      }
    });
  } catch (error) {
    console.error('Erreur génération contrat:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du contrat' });
  }
};

// Signer un contrat
const signContract = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { signature_data } = req.body;
    const user_id = req.user.id;

    // Vérifier que le document existe et est un contrat
    const [documents] = await db.query(
      `SELECT d.*, r.client_id 
       FROM documents d
       JOIN reservations r ON d.reservation_id = r.id
       WHERE d.id = ? AND d.document_type = 'contract'`,
      [document_id]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Contrat non trouvé' });
    }

    const document = documents[0];

    // Vérifier que l'utilisateur est le client de la réservation
    if (document.client_id !== user_id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier si le contrat n'est pas déjà signé
    const [existing] = await db.query(
      'SELECT * FROM contract_signatures WHERE document_id = ? AND user_id = ?',
      [document_id, user_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Contrat déjà signé' });
    }

    // Enregistrer la signature
    const ip_address = req.ip || req.connection.remoteAddress;
    await db.query(
      'INSERT INTO contract_signatures (document_id, user_id, signature_data, ip_address) VALUES (?, ?, ?, ?)',
      [document_id, user_id, signature_data, ip_address]
    );

    // Marquer le contrat comme signé dans la réservation
    await db.query(
      'UPDATE reservations SET contract_signed = TRUE WHERE id = ?',
      [document.reservation_id]
    );

    res.json({ message: 'Contrat signé avec succès' });
  } catch (error) {
    console.error('Erreur signature contrat:', error);
    res.status(500).json({ error: 'Erreur lors de la signature du contrat' });
  }
};

// Obtenir les documents d'une réservation
const getDocuments = async (req, res) => {
  try {
    const { reservation_id } = req.params;

    // Vérifier l'accès (client ou agence)
    let query, params;
    if (req.user.user_type === 'client') {
      query = `SELECT d.* FROM documents d
               JOIN reservations r ON d.reservation_id = r.id
               WHERE d.reservation_id = ? AND r.client_id = ?`;
      params = [reservation_id, req.user.id];
    } else {
      query = `SELECT d.* FROM documents d
               JOIN reservations r ON d.reservation_id = r.id
               JOIN vehicles v ON r.vehicle_id = v.id
               WHERE d.reservation_id = ? AND v.agency_id = ?`;
      params = [reservation_id, req.user.agency_id];
    }

    const [documents] = await db.query(query, params);

    // Vérifier si le contrat est signé
    const [signatures] = await db.query(
      `SELECT cs.* FROM contract_signatures cs
       JOIN documents d ON cs.document_id = d.id
       WHERE d.reservation_id = ?`,
      [reservation_id]
    );

    res.json({
      documents,
      contract_signed: signatures.length > 0,
      signature: signatures[0] || null
    });
  } catch (error) {
    console.error('Erreur récupération documents:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
  }
};

module.exports = {
  createInvoice,
  createReceipt,
  createContract,
  signContract,
  getDocuments
};
