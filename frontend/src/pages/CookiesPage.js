import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/StaticPages.css';

const CookiesPage = () => {
  return (
    <div className="static-page">
      <Header />
      
      <div className="page-content legal-page">
        <div className="page-hero">
          <h1>Politique de Cookies</h1>
          <p>Dernière mise à jour : 13 novembre 2025</p>
        </div>

        <section className="content-section">
          <h2>1. Qu'est-ce qu'un Cookie ?</h2>
          <p>
            Un cookie est un petit fichier texte stocké sur votre appareil (ordinateur, smartphone, tablette) 
            lorsque vous visitez un site web. Les cookies permettent au site de mémoriser vos actions et 
            préférences pendant une certaine période.
          </p>
        </section>

        <section className="content-section">
          <h2>2. Comment Utilisons-nous les Cookies ?</h2>
          <p>
            Rentflow utilise des cookies pour améliorer votre expérience sur notre plateforme et 
            pour nous aider à comprendre comment nos utilisateurs interagissent avec notre site.
          </p>
        </section>

        <section className="content-section">
          <h2>3. Types de Cookies Utilisés</h2>
          
          <h3>3.1 Cookies Essentiels (Obligatoires)</h3>
          <p>
            Ces cookies sont nécessaires au fonctionnement de la plateforme. 
            Sans eux, certaines fonctionnalités ne seraient pas disponibles.
          </p>
          <div className="cookie-table">
            <table>
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Durée</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>auth_token</td>
                  <td>7 jours</td>
                  <td>Authentification et maintien de session</td>
                </tr>
                <tr>
                  <td>session_id</td>
                  <td>Session</td>
                  <td>Identification de session utilisateur</td>
                </tr>
                <tr>
                  <td>csrf_token</td>
                  <td>Session</td>
                  <td>Protection contre les attaques CSRF</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>3.2 Cookies de Préférences</h3>
          <p>
            Ces cookies permettent de mémoriser vos choix (langue, région, thème) 
            pour personnaliser votre expérience.
          </p>
          <div className="cookie-table">
            <table>
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Durée</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>theme_preference</td>
                  <td>1 an</td>
                  <td>Mémorisation du thème (clair/sombre)</td>
                </tr>
                <tr>
                  <td>language</td>
                  <td>1 an</td>
                  <td>Langue préférée</td>
                </tr>
                <tr>
                  <td>search_filters</td>
                  <td>30 jours</td>
                  <td>Sauvegarde des filtres de recherche</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>3.3 Cookies Analytiques</h3>
          <p>
            Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site, 
            quelles pages sont les plus visitées, et à améliorer nos services.
          </p>
          <div className="cookie-table">
            <table>
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Durée</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>_ga</td>
                  <td>2 ans</td>
                  <td>Google Analytics - Identifiant unique</td>
                </tr>
                <tr>
                  <td>_gid</td>
                  <td>24 heures</td>
                  <td>Google Analytics - Identifiant de session</td>
                </tr>
                <tr>
                  <td>analytics_session</td>
                  <td>30 minutes</td>
                  <td>Suivi de la session utilisateur</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="content-section">
          <h2>4. Gestion des Cookies</h2>
          <h3>4.1 Paramètres du navigateur</h3>
          <p>
            Vous pouvez contrôler et/ou supprimer les cookies comme vous le souhaitez. 
            La plupart des navigateurs permettent de :
          </p>
          <ul>
            <li>Voir quels cookies sont stockés et les supprimer individuellement</li>
            <li>Bloquer tous les cookies tiers</li>
            <li>Bloquer les cookies de sites spécifiques</li>
            <li>Bloquer tous les cookies</li>
            <li>Supprimer tous les cookies à la fermeture du navigateur</li>
          </ul>

          <h3>4.2 Instructions par navigateur</h3>
          <div className="browser-instructions">
            <div className="browser-item">
              <h4>Chrome</h4>
              <p>Paramètres - Confidentialité et sécurité - Cookies</p>
            </div>
            <div className="browser-item">
              <h4>Firefox</h4>
              <p>Options - Vie privée et sécurité - Cookies et données de sites</p>
            </div>
            <div className="browser-item">
              <h4>Safari</h4>
              <p>Préférences - Confidentialité - Cookies et données de sites web</p>
            </div>
            <div className="browser-item">
              <h4>Edge</h4>
              <p>Paramètres - Confidentialité, recherche et services - Cookies</p>
            </div>
          </div>

          <h3>4.3 Conséquences du refus des cookies</h3>
          <p>
            Si vous bloquez tous les cookies :
          </p>
          <ul>
            <li>Vous ne pourrez pas vous connecter à votre compte</li>
            <li>Certaines fonctionnalités ne seront pas disponibles</li>
            <li>Vos préférences ne seront pas sauvegardées</li>
            <li>Votre expérience utilisateur sera dégradée</li>
          </ul>
        </section>

        <section className="content-section">
          <h2>5. Cookies Tiers</h2>
          <p>
            Certains cookies peuvent être placés par des services tiers que nous utilisons :
          </p>
          <ul>
            <li><strong>Google Analytics :</strong> Pour analyser le trafic du site</li>
            <li><strong>Réseaux sociaux :</strong> Pour partager du contenu</li>
          </ul>
          <p>
            Ces services tiers ont leurs propres politiques de confidentialité et d'utilisation des cookies.
          </p>
        </section>

        <section className="content-section">
          <h2>6. Durée de Conservation</h2>
          <p>
            La durée de conservation des cookies varie selon leur type :
          </p>
          <ul>
            <li><strong>Cookies de session :</strong> Supprimés à la fermeture du navigateur</li>
            <li><strong>Cookies persistants :</strong> Conservés entre 24 heures et 2 ans selon le type</li>
          </ul>
        </section>

        <section className="content-section">
          <h2>7. Mise à jour de la Politique</h2>
          <p>
            Nous pouvons mettre à jour cette politique de cookies pour refléter les changements 
            dans nos pratiques ou pour d'autres raisons opérationnelles, légales ou réglementaires.
          </p>
          <p>
            Nous vous encourageons à consulter régulièrement cette page pour rester informé 
            de notre utilisation des cookies.
          </p>
        </section>

        <section className="content-section">
          <h2>8. Plus d'Informations</h2>
          <p>
            Pour en savoir plus sur les cookies et leur utilisation :
          </p>
          <ul>
            <li>
              <a href="https://www.cnil.fr/fr/cookies-et-autres-traceurs" target="_blank" rel="noopener noreferrer">
                CNIL - Cookies et autres traceurs
              </a>
            </li>
            <li>
              <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">
                AllAboutCookies.org
              </a>
            </li>
          </ul>
        </section>

        <section className="content-section">
          <h2>9. Contact</h2>
          <p>
            Pour toute question concernant notre utilisation des cookies :
          </p>
          <ul>
            <li>Email : <strong>privacy@Rentflow.com</strong></li>
            <li>Téléphone : <strong>+33 1 23 45 67 89</strong></li>
          </ul>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default CookiesPage;
