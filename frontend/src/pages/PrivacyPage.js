import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/StaticPages.css';

const PrivacyPage = () => {
  return (
    <div className="static-page">
      <Header />
      
      <div className="page-content legal-page">
        <div className="page-hero">
          <h1>Politique de Confidentialité</h1>
          <p>Dernière mise à jour : 13 novembre 2025</p>
        </div>

        <section className="content-section">
          <h2>1. Introduction</h2>
          <p>
            Rentflow accorde une grande importance à la protection de vos données personnelles. 
            Cette politique de confidentialité explique quelles informations nous collectons, 
            comment nous les utilisons et quels sont vos droits.
          </p>
        </section>

        <section className="content-section">
          <h2>2. Données Collectées</h2>
          <h3>2.1 Données d'identification</h3>
          <ul>
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Numéro de téléphone</li>
            <li>Adresse postale</li>
          </ul>

          <h3>2.2 Données de connexion</h3>
          <ul>
            <li>Adresse IP</li>
            <li>Type de navigateur</li>
            <li>Pages visitées</li>
            <li>Date et heure de connexion</li>
          </ul>

          <h3>2.3 Données de transaction</h3>
          <ul>
            <li>Historique des réservations</li>
            <li>Informations de paiement (traitées de manière sécurisée)</li>
            <li>Préférences de location</li>
          </ul>
        </section>

        <section className="content-section">
          <h2>3. Utilisation des Données</h2>
          <p>Nous utilisons vos données personnelles pour :</p>
          <ul>
            <li>Gérer votre compte et vos réservations</li>
            <li>Faciliter la communication entre vous et les agences</li>
            <li>Améliorer nos services et votre expérience utilisateur</li>
            <li>Vous envoyer des notifications importantes concernant votre compte</li>
            <li>Respecter nos obligations légales</li>
            <li>Prévenir la fraude et assurer la sécurité de la plateforme</li>
          </ul>
        </section>

        <section className="content-section">
          <h2>4. Partage des Données</h2>
          <p>
            Vos données personnelles ne sont partagées qu'avec les parties suivantes :
          </p>
          <ul>
            <li><strong>Agences partenaires :</strong> pour traiter vos réservations</li>
            <li><strong>Prestataires de services :</strong> hébergement, paiement sécurisé</li>
            <li><strong>Autorités légales :</strong> si requis par la loi</li>
          </ul>
          <p>
            Nous ne vendons jamais vos données personnelles à des tiers à des fins marketing.
          </p>
        </section>

        <section className="content-section">
          <h2>5. Sécurité des Données</h2>
          <p>
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
            pour protéger vos données contre tout accès non autorisé, perte ou destruction :
          </p>
          <ul>
            <li>Cryptage SSL/TLS pour toutes les communications</li>
            <li>Authentification sécurisée avec hashage des mots de passe</li>
            <li>Accès restreint aux données personnelles</li>
            <li>Sauvegardes régulières</li>
            <li>Surveillance continue de la sécurité</li>
          </ul>
        </section>

        <section className="content-section">
          <h2>6. Vos Droits</h2>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
            <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
            <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
            <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
            <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
            <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
          </ul>
          <p>
            Pour exercer vos droits, contactez-nous à : <strong>privacy@Rentflow.com</strong>
          </p>
        </section>

        <section className="content-section">
          <h2>7. Cookies</h2>
          <p>
            Nous utilisons des cookies pour améliorer votre expérience sur notre site. 
            Pour plus d'informations, consultez notre <a href="/cookies">Politique de Cookies</a>.
          </p>
        </section>

        <section className="content-section">
          <h2>8. Conservation des Données</h2>
          <p>
            Nous conservons vos données personnelles aussi longtemps que nécessaire pour :
          </p>
          <ul>
            <li>Fournir nos services</li>
            <li>Respecter nos obligations légales (factures, contrats)</li>
            <li>Résoudre les litiges</li>
          </ul>
          <p>
            En cas de suppression de votre compte, vos données sont effacées dans les 30 jours, 
            sauf obligation légale de conservation.
          </p>
        </section>

        <section className="content-section">
          <h2>9. Modifications</h2>
          <p>
            Nous pouvons modifier cette politique de confidentialité à tout moment. 
            Les modifications entrent en vigueur dès leur publication sur cette page. 
            Nous vous encourageons à consulter régulièrement cette page.
          </p>
        </section>

        <section className="content-section">
          <h2>10. Contact</h2>
          <p>
            Pour toute question concernant cette politique de confidentialité ou vos données personnelles :
          </p>
          <ul>
            <li>Email : <strong>privacy@Rentflow.com</strong></li>
            <li>Téléphone : <strong>+33 1 23 45 67 89</strong></li>
            <li>Adresse : <strong>Rentflow, Paris, France</strong></li>
          </ul>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
