import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/StaticPages.css';

const TermsPage = () => {
  return (
    <div className="static-page">
      <Header />
      
      <div className="page-content legal-page">
        <div className="page-hero">
          <h1>Conditions Générales d'Utilisation</h1>
          <p>Dernière mise à jour : 13 novembre 2025</p>
        </div>

        <section className="content-section">
          <h2>1. Objet</h2>
          <p>
            Les présentes Conditions Générales d'Utilisation (CGU) définissent les règles 
            d'utilisation de la plateforme RentFlow accessible à l'adresse www.rentflow.com. 
            En utilisant notre plateforme, vous acceptez sans réserve les présentes CGU.
          </p>
        </section>

        <section className="content-section">
          <h2>2. Définitions</h2>
          <ul>
            <li><strong>Plateforme :</strong> le site web et l'application RentFlow</li>
            <li><strong>Utilisateur :</strong> toute personne utilisant la plateforme</li>
            <li><strong>Client :</strong> utilisateur cherchant à louer un véhicule</li>
            <li><strong>Agence :</strong> professionnel proposant des véhicules à la location</li>
            <li><strong>Réservation :</strong> demande de location d'un véhicule</li>
          </ul>
        </section>

        <section className="content-section">
          <h2>3. Inscription</h2>
          <h3>3.1 Conditions d'inscription</h3>
          <p>
            Pour utiliser notre plateforme, vous devez :
          </p>
          <ul>
            <li>Être âgé d'au moins 18 ans</li>
            <li>Fournir des informations exactes et à jour</li>
            <li>Créer un mot de passe sécurisé</li>
            <li>Accepter les présentes CGU</li>
          </ul>

          <h3>3.2 Compte utilisateur</h3>
          <p>
            Vous êtes responsable de la confidentialité de vos identifiants. 
            Toute activité sur votre compte est de votre responsabilité.
          </p>
        </section>

        <section className="content-section">
          <h2>4. Services Proposés</h2>
          <h3>4.1 Pour les clients</h3>
          <ul>
            <li>Recherche et consultation de véhicules disponibles</li>
            <li>Réservation de véhicules</li>
            <li>Communication avec les agences</li>
            <li>Gestion des réservations</li>
            <li>Publication d'avis</li>
          </ul>

          <h3>4.2 Pour les agences</h3>
          <ul>
            <li>Gestion de la flotte de véhicules</li>
            <li>Réception et traitement des réservations</li>
            <li>Communication avec les clients</li>
            <li>Accès aux statistiques</li>
          </ul>
        </section>

        <section className="content-section">
          <h2>5. Réservations</h2>
          <h3>5.1 Processus de réservation</h3>
          <p>
            La réservation d'un véhicule se fait en plusieurs étapes :
          </p>
          <ol>
            <li>Sélection du véhicule et des dates</li>
            <li>Envoi de la demande de réservation</li>
            <li>Validation par l'agence</li>
            <li>Confirmation et paiement</li>
          </ol>

          <h3>5.2 Modification et annulation</h3>
          <p>
            Les conditions de modification et d'annulation sont définies par chaque agence. 
            Consultez-les avant de réserver.
          </p>
        </section>

        <section className="content-section">
          <h2>6. Obligations des Utilisateurs</h2>
          <h3>6.1 Obligations générales</h3>
          <ul>
            <li>Fournir des informations exactes et à jour</li>
            <li>Respecter les lois et réglementations en vigueur</li>
            <li>Ne pas porter atteinte aux droits de tiers</li>
            <li>Ne pas perturber le fonctionnement de la plateforme</li>
          </ul>

          <h3>6.2 Obligations des clients</h3>
          <ul>
            <li>Respecter les conditions de location de l'agence</li>
            <li>Restituer le véhicule dans l'état où il a été reçu</li>
            <li>Signaler tout problème ou dommage</li>
          </ul>

          <h3>6.3 Obligations des agences</h3>
          <ul>
            <li>Fournir des véhicules en bon état</li>
            <li>Respecter les réservations confirmées</li>
            <li>Répondre aux demandes des clients</li>
            <li>Maintenir une assurance professionnelle valide</li>
          </ul>
        </section>

        <section className="content-section">
          <h2>7. Paiement</h2>
          <p>
            Les paiements se font directement entre le client et l'agence. 
            RentFlow n'intervient pas dans les transactions financières.
          </p>
        </section>

        <section className="content-section">
          <h2>8. Avis et Notations</h2>
          <p>
            Les utilisateurs peuvent publier des avis sur les véhicules et agences. 
            Les avis doivent être :
          </p>
          <ul>
            <li>Honnêtes et basés sur une expérience réelle</li>
            <li>Respectueux et non diffamatoires</li>
            <li>Conformes aux lois en vigueur</li>
          </ul>
          <p>
            RentFlow se réserve le droit de modérer ou supprimer tout avis inapproprié.
          </p>
        </section>

        <section className="content-section">
          <h2>9. Propriété Intellectuelle</h2>
          <p>
            Tous les éléments de la plateforme (design, textes, images, logos) sont protégés 
            par le droit d'auteur. Toute reproduction sans autorisation est interdite.
          </p>
        </section>

        <section className="content-section">
          <h2>10. Responsabilité</h2>
          <h3>10.1 Responsabilité de RentFlow</h3>
          <p>
            RentFlow est un intermédiaire entre clients et agences. Nous ne sommes pas responsables :
          </p>
          <ul>
            <li>De la qualité des véhicules proposés</li>
            <li>Des litiges entre clients et agences</li>
            <li>Des dommages causés pendant la location</li>
          </ul>

          <h3>10.2 Limitation de responsabilité</h3>
          <p>
            Nous mettons tout en œuvre pour assurer la disponibilité de la plateforme, 
            mais ne garantissons pas un accès ininterrompu.
          </p>
        </section>

        <section className="content-section">
          <h2>11. Suspension et Résiliation</h2>
          <p>
            RentFlow se réserve le droit de suspendre ou fermer un compte en cas de :
          </p>
          <ul>
            <li>Non-respect des présentes CGU</li>
            <li>Fraude ou tentative de fraude</li>
            <li>Comportement inapproprié</li>
            <li>Inactivité prolongée</li>
          </ul>
        </section>

        <section className="content-section">
          <h2>12. Modifications des CGU</h2>
          <p>
            RentFlow peut modifier les présentes CGU à tout moment. 
            Les nouvelles conditions prennent effet dès leur publication. 
            L'utilisation continue de la plateforme vaut acceptation des nouvelles CGU.
          </p>
        </section>

        <section className="content-section">
          <h2>13. Loi Applicable et Juridiction</h2>
          <p>
            Les présentes CGU sont soumises au droit français. 
            En cas de litige, les tribunaux français seront seuls compétents.
          </p>
        </section>

        <section className="content-section">
          <h2>14. Contact</h2>
          <p>
            Pour toute question concernant ces conditions d'utilisation :
          </p>
          <ul>
            <li>Email : <strong>legal@rentflow.com</strong></li>
            <li>Téléphone : <strong>+33 1 23 45 67 89</strong></li>
            <li>Adresse : <strong>RentFlow, Paris, France</strong></li>
          </ul>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default TermsPage;
