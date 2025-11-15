import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/StaticPages.css';

const PartnerPage = () => {
  return (
    <div className="static-page">
      <Header />
      
      <div className="page-content">
        <div className="page-hero">
          <h1>Devenez Partenaire Rentflow</h1>
          <p>Développez votre activité de location avec notre plateforme</p>
        </div>

        <section className="content-section">
          <h2>Pourquoi choisir Rentflow ?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>Visibilité accrue</h3>
              <p>
                Accédez à une large base de clients actifs à la recherche de véhicules. 
                Augmentez votre taux d'occupation et maximisez vos revenus.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Gestion simplifiée</h3>
              <p>
                Dashboard intuitif pour gérer vos véhicules, réservations et clients. 
                Tout ce dont vous avez besoin en un seul endroit.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Zéro commission</h3>
              <p>
                Pas de frais cachés, pas de commission sur vos locations. 
                Vous gardez 100% de vos revenus.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Support dédié</h3>
              <p>
                Une équipe à votre écoute pour vous accompagner dans votre développement. 
                Support technique et commercial disponible.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Outils marketing</h3>
              <p>
                Profitez de nos campagnes marketing pour augmenter votre visibilité. 
                Photos professionnelles, référencement optimisé.
              </p>
            </div>
            <div className="benefit-card">
              <h3>Statistiques détaillées</h3>
              <p>
                Suivez vos performances en temps réel. Analysez vos données 
                pour optimiser votre stratégie commerciale.
              </p>
            </div>
          </div>
        </section>

        <section className="content-section highlight-section">
          <h2>Comment devenir partenaire ?</h2>
          <div className="partner-steps">
            <div className="partner-step">
              <div className="step-icon">1</div>
              <div className="step-content">
                <h3>Inscription</h3>
                <p>
                  Créez votre compte agence en remplissant le formulaire d'inscription. 
                  Fournissez les informations de votre entreprise (SIRET, assurance, etc.).
                </p>
              </div>
            </div>

            <div className="partner-step">
              <div className="step-icon">2</div>
              <div className="step-content">
                <h3>Vérification</h3>
                <p>
                  Notre équipe vérifie vos documents et valide votre compte. 
                  Ce processus prend généralement 24 à 48 heures.
                </p>
              </div>
            </div>

            <div className="partner-step">
              <div className="step-icon">3</div>
              <div className="step-content">
                <h3>Configuration</h3>
                <p>
                  Ajoutez vos véhicules, configurez vos tarifs et disponibilités. 
                  Personnalisez votre profil d'agence.
                </p>
              </div>
            </div>

            <div className="partner-step">
              <div className="step-icon">4</div>
              <div className="step-content">
                <h3>Lancement</h3>
                <p>
                  Votre agence est en ligne ! Commencez à recevoir des réservations 
                  et développez votre activité.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="content-section">
          <h2>Nos Critères de Sélection</h2>
          <div className="criteria-list">
            <div className="criteria-item">
              <h3>✓ Entreprise légale</h3>
              <p>SIRET valide et en règle avec les obligations légales</p>
            </div>
            <div className="criteria-item">
              <h3>✓ Assurance professionnelle</h3>
              <p>Couverture adaptée pour la location de véhicules</p>
            </div>
            <div className="criteria-item">
              <h3>✓ Flotte entretenue</h3>
              <p>Véhicules en bon état, contrôlés et entretenus régulièrement</p>
            </div>
            <div className="criteria-item">
              <h3>✓ Service client</h3>
              <p>Engagement à fournir un service de qualité à nos utilisateurs</p>
            </div>
          </div>
        </section>

        <section className="content-section stats-section">
          <h2>Nos Partenaires Réussissent</h2>
          <div className="success-stats">
            <div className="success-stat">
              <div className="stat-value">+35%</div>
              <p>Augmentation moyenne du chiffre d'affaires</p>
            </div>
            <div className="success-stat">
              <div className="stat-value">+50%</div>
              <p>Taux d'occupation amélioré</p>
            </div>
            <div className="success-stat">
              <div className="stat-value">4.8/5</div>
              <p>Note moyenne de satisfaction</p>
            </div>
          </div>
        </section>

        <section className="content-section cta-section">
          <h2>Prêt à rejoindre Rentflow ?</h2>
          <p>Inscrivez-vous dès maintenant et commencez à développer votre activité</p>
          <div className="cta-buttons">
            <a href="/auth" className="cta-btn primary">S'inscrire comme agence</a>
            <a href="/how-it-works" className="cta-btn secondary">En savoir plus</a>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default PartnerPage;
