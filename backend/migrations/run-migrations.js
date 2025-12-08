const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runMigrations() {
  let connection;
  
  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Connexion à la base de données réussie');

    // Migration 1: terms_pdf pour vehicles
    console.log('\n📄 Migration 1: Ajout de terms_pdf à la table vehicles...');
    
    try {
      await connection.query(`
        ALTER TABLE vehicles 
        ADD COLUMN terms_pdf VARCHAR(500) NULL 
        AFTER description;
      `);
      console.log('✅ Migration 1 terminée avec succès');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  La colonne terms_pdf existe déjà');
      } else {
        throw error;
      }
    }

    // Migration 2: profil complet pour agencies
    console.log('\n🏢 Migration 2: Ajout des champs de profil à la table agencies...');
    
    const agencyColumns = [
      { name: 'logo', sql: 'ADD COLUMN logo VARCHAR(500) NULL AFTER name' },
      { name: 'description', sql: 'ADD COLUMN description TEXT NULL AFTER address' },
      { name: 'payment_link_paypal', sql: 'ADD COLUMN payment_link_paypal VARCHAR(500) NULL AFTER description' },
      { name: 'payment_link_stripe', sql: 'ADD COLUMN payment_link_stripe VARCHAR(500) NULL AFTER payment_link_paypal' },
      { name: 'payment_link_other', sql: 'ADD COLUMN payment_link_other VARCHAR(500) NULL AFTER payment_link_stripe' },
      { name: 'rental_conditions_pdf', sql: 'ADD COLUMN rental_conditions_pdf VARCHAR(500) NULL AFTER payment_link_other' },
      { name: 'website', sql: 'ADD COLUMN website VARCHAR(255) NULL AFTER rental_conditions_pdf' }
    ];

    for (const column of agencyColumns) {
      try {
        await connection.query(`ALTER TABLE agencies ${column.sql};`);
        console.log(`  ✅ Colonne ${column.name} ajoutée`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ⚠️  La colonne ${column.name} existe déjà`);
        } else {
          throw error;
        }
      }
    }

    // Créer l'index
    console.log('\n🔍 Création de l\'index sur agencies.name...');
    try {
      await connection.query('CREATE INDEX idx_agency_name ON agencies(name);');
      console.log('✅ Index créé');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  L\'index existe déjà');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Toutes les migrations ont été exécutées avec succès !');
    
    // Vérification
    console.log('\n📊 Vérification des colonnes ajoutées...');
    
    const [vehicleColumns] = await connection.query('DESCRIBE vehicles;');
    const hasTermsPdf = vehicleColumns.some(col => col.Field === 'terms_pdf');
    console.log(`  vehicles.terms_pdf: ${hasTermsPdf ? '✅' : '❌'}`);
    
    const [agencyColumnsResult] = await connection.query('DESCRIBE agencies;');
    const agencyFields = ['logo', 'description', 'payment_link_paypal', 'payment_link_stripe', 'payment_link_other', 'rental_conditions_pdf', 'website'];
    
    for (const field of agencyFields) {
      const exists = agencyColumnsResult.some(col => col.Field === field);
      console.log(`  agencies.${field}: ${exists ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution des migrations:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

runMigrations();
