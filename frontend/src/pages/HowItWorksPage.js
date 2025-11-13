import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/StaticPages.css';

const HowItWorksPage = () => {
  return (
    <div className="static-page">
      <Header />
      
      <div className="page-content">
        <div className="page-hero">
          <h1>Comment ça marche ?</h1>
          <p>Louer un véhicule n'a jamais été aussi simple</p>
        </div>

        <section className="content-section">
          <h2>Pour les Clients</h2>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Recherchez</h3>
              <p>
                Parcourez notre catalogue de véhicules disponibles. 
                Utilisez nos filtres pour trouver le véhicule parfait selon 
                vos besoins : type de carburant, nombre de places, localisation, prix.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Réservez</h3>
              <p>
                Sélectionnez vos dates et heures de location. 
                Consultez les détails du véhicule, les avis des clients précédents, 
                et validez votre réservation en quelques clics.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Confirmez</h3>
              <p>
                L'agence examine votre demande et vous confirme la disponibilité. 
                Vous recevez toutes les informations nécessaires par email 
                et pouvez échanger avec l'agence via notre messagerie.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Profitez</h3>
              <p>
                Récupérez votre véhicule au lieu convenu, 
                profitez de votre trajet, puis restituez-le. 
                N'oubliez pas de laisser un avis pour aider la communauté !
              </p>
            </div>
          </div>
        </section>

        <section className="content-section highlight-section">
          <h2>Pour les Agences</h2>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Inscrivez-vous</h3>
              <p>
                Créez votre compte agence en quelques minutes. 
                Renseignez les informations de votre entreprise 
                et commencez à gérer votre flotte.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Ajoutez vos véhicules</h3>
              <p>
                Publiez vos véhicules avec photos, descriptions détaillées 
                et tarifs. Notre interface intuitive rend la gestion 
                de votre flotte simple et rapide.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Gérez les réservations</h3>
              <p>
                Recevez et gérez les demandes de location via votre dashboard. 
                Acceptez ou refusez les réservations, communiquez avec vos clients 
                via la messagerie intégrée.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Développez votre activité</h3>
              <p>
                Accédez à une large base de clients, 
                consultez vos statistiques de performance, 
                et développez votre chiffre d'affaires avec RentFlow.
              </p>
            </div>
          </div>
        </section>

        <section className="content-section">
          <h2>Questions Fréquentes</h2>
          <div className="faq-container">
            <div className="faq-item">
              <h3>Quels documents sont nécessaires pour louer ?</h3>
              <p>
                Vous aurez besoin d'une pièce d'identité valide et d'un permis de conduire. 
                Certaines agences peuvent demander des documents supplémentaires.
              </p>
            </div>

            <div className="faq-item">
              <h3>Puis-je modifier ou annuler ma réservation ?</h3>
              <p>
                Oui, vous pouvez modifier ou annuler votre réservation selon les conditions 
                définies par chaque agence. Consultez les conditions avant de réserver.
              </p>
            </div>

            <div className="faq-item">
              <h3>Comment fonctionne le paiement ?</h3>
              <p>
                Le paiement se fait directement avec l'agence de location. 
                Les modalités de paiement sont précisées lors de la réservation.
              </p>
            </div>

            <div className="faq-item">
              <h3>Que faire en cas de problème avec le véhicule ?</h3>
              <p>
                Contactez immédiatement l'agence via notre messagerie ou par téléphone. 
                Notre support client est également disponible pour vous assister.
              </p>
            </div>
          </div>
        </section>

        <section className="content-section cta-section">
          <h2>Prêt à commencer ?</h2>
          <p>Rejoignez des milliers d'utilisateurs qui font confiance à RentFlow</p>
          <div className="cta-buttons">
            <a href="/" className="cta-btn primary">Trouver un véhicule</a>
            <a href="/auth" className="cta-btn secondary">Devenir partenaire</a>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default HowItWorksPage;
