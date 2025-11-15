import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/StaticPages.css';

const AboutPage = () => {
  return (
    <div className="static-page">
      <Header />
      
      <div className="page-content">
        <div className="page-hero">
          <h1>À propos de Rentflow</h1>
          <p>Votre partenaire de confiance pour la location de véhicules</p>
        </div>

        <section className="content-section">
          <h2>Notre Mission</h2>
          <p>
            Rentflow est né d'une vision simple : rendre la location de véhicules accessible, 
            transparente et efficace pour tous. Nous connectons les propriétaires de véhicules 
            avec des clients en quête de mobilité, créant ainsi une communauté basée sur la 
            confiance et le partage.
          </p>
        </section>

        <section className="content-section">
          <h2>Nos Valeurs</h2>
          <div className="values-grid">
            <div className="value-card">
              <h3>Transparence</h3>
              <p>
                Prix clairs, conditions explicites, aucun frais caché. 
                Nous croyons en une relation de confiance avec nos utilisateurs.
              </p>
            </div>
            <div className="value-card">
              <h3>Qualité</h3>
              <p>
                Tous les véhicules sont vérifiés et entretenus régulièrement 
                pour garantir votre sécurité et votre confort.
              </p>
            </div>
            <div className="value-card">
              <h3>Innovation</h3>
              <p>
                Une plateforme moderne et intuitive qui simplifie 
                chaque étape de votre expérience de location.
              </p>
            </div>
            <div className="value-card">
              <h3>Service Client</h3>
              <p>
                Une équipe dédiée disponible pour vous accompagner 
                à chaque instant de votre parcours.
              </p>
            </div>
          </div>
        </section>

        <section className="content-section">
          <h2>Notre Histoire</h2>
          <p>
            Fondée en 2024, Rentflow est rapidement devenue une référence dans le secteur 
            de la location de véhicules en France. Notre plateforme met en relation des 
            milliers d'utilisateurs chaque mois, facilitant l'accès à une mobilité flexible 
            et économique.
          </p>
          <p>
            Nous travaillons avec des agences de location professionnelles rigoureusement 
            sélectionnées pour leur qualité de service et leur engagement envers nos valeurs.
          </p>
        </section>

        <section className="content-section stats-section">
          <h2>Rentflow en Chiffres</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">500+</div>
              <div className="stat-label">Véhicules disponibles</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Clients satisfaits</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">50+</div>
              <div className="stat-label">Agences partenaires</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support disponible</div>
            </div>
          </div>
        </section>

        <section className="content-section cta-section">
          <h2>Rejoignez l'Aventure Rentflow</h2>
          <p>
            Que vous soyez un particulier à la recherche d'un véhicule ou une agence 
            souhaitant élargir sa clientèle, Rentflow est fait pour vous.
          </p>
          <div className="cta-buttons">
            <a href="/auth" className="cta-btn primary">Commencer maintenant</a>
            <a href="/how-it-works" className="cta-btn secondary">En savoir plus</a>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default AboutPage;
