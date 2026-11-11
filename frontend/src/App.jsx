// frontend/src/App.jsx
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/layout/CartDrawer';
import Home from './pages/Home';
import Boutique from './pages/Boutique';
import Ebook from './pages/Ebook';
import ProduitDetail from './pages/ProduitDetail';
import BoutiqueVendeuse from './pages/BoutiqueVendeuse';
import Panier from './pages/Panier';
import MonCompte from './pages/MonCompte';
import Checkout from './pages/Checkout';
import Blog from './pages/Blog';
import BlogArticle from './pages/BlogArticle';
import APropos from './pages/APropos';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import CommentAcheter from './pages/guides/CommentAcheter';
import CommentVendre from './pages/guides/CommentVendre';
import CommentLouer from './pages/guides/CommentLouer';
import CommentMettreEnLocation from './pages/guides/CommentMettreEnLocation';
import CGV from './pages/legal/CGV';
import PolitiqueConfidentialite from './pages/legal/PolitiqueConfidentialite';
import PolitiqueRetour from './pages/legal/PolitiqueRetour';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerificationCompte from './pages/auth/VerificationCompte';
import VerifierEmail from './pages/auth/VerifierEmail';
import MotDePasseOublie from './pages/auth/MotDePasseOublie';
import ReinitialiserMotDePasse from './pages/auth/ReinitialiserMotDePasse';
import DashboardVendeuse from './pages/vendeuse/DashboardVendeuse';
import AjouterProduitPage from './pages/vendeuse/AjouterProduit';
import MesArticles from './pages/vendeuse/MesArticles';
import ModifierProduit from './pages/vendeuse/ModifierProduit';
import CommandesVendeuse from './pages/vendeuse/CommandesVendeuse';
import LocationsVendeuse from './pages/vendeuse/LocationsVendeuse';
import CommentairesVendeuse from './pages/vendeuse/CommentairesVendeuse';
import MaBoutique from './pages/vendeuse/MaBoutique';
import Ventes from './pages/vendeuse/Ventes';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPerformance from './pages/admin/AdminPerformance';
import AdminCommandes from './pages/admin/AdminCommandes';
import AdminProduits from './pages/admin/AdminProduits';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPlaintes from './pages/admin/AdminPlaintes';
import AdminEbook from './pages/admin/AdminEbook';
import AdminUtilisateurs from './pages/admin/AdminUtilisateurs';
import LivreurTableauDeBord from './pages/livreur/LivreurTableauDeBord';
import LivreurMesLivraisons from './pages/livreur/LivreurMesLivraisons';
import LivreurHistorique from './pages/livreur/LivreurHistorique';
import LivreurRevenus from './pages/livreur/LivreurRevenus';
import LivreurNotifications from './pages/livreur/LivreurNotifications';
import LivreurProfil from './pages/livreur/LivreurProfil';

function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  return (
    <CartProvider>
      <Router>
        <CartDrawer />
        <Routes>
          {/* Page d'accueil */}
          <Route path="/" element={<Home />} />

          {/* Connexion / Inscription / Vérification */}
          <Route path="/connexion" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/verification-compte" element={<VerificationCompte />} />
          <Route path="/verifier-email/:username/:token" element={<VerifierEmail />} />
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
          <Route path="/reinitialiser-mot-de-passe/:uid/:token" element={<ReinitialiserMotDePasse />} />

          {/* Boutique / catalogue */}
          <Route path="/boutique" element={<Boutique />} />
          <Route path="/ebook" element={<Ebook />} />
          <Route path="/produit/:id" element={<ProduitDetail />} />
          <Route path="/boutique/:slug" element={<BoutiqueVendeuse />} />

          {/* Panier & commande */}
          <Route path="/panier" element={<Panier />} />
          <Route path="/mon-compte" element={<MonCompte />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* Blog */}
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />

          {/* Pages d'information */}
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/faq-centre-daide" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/comment-acheter" element={<CommentAcheter />} />
          <Route path="/comment-vendre" element={<CommentVendre />} />
          <Route path="/comment-louer" element={<CommentLouer />} />
          <Route path="/comment-mettre-en-location" element={<CommentMettreEnLocation />} />

          {/* Pages légales */}
          <Route path="/conditions-generales-de-vente" element={<CGV />} />
          <Route path="/politique-de-confidentialite" element={<PolitiqueConfidentialite />} />
          <Route path="/politique-de-retour-et-remboursement" element={<PolitiqueRetour />} />

          {/* Espace vendeuse */}
          <Route path="/dashboard" element={<DashboardVendeuse user={user} />} />
          <Route path="/vendeuse/ajouter-produit" element={<AjouterProduitPage />} />
          <Route path="/vendeuse/mes-articles" element={<MesArticles />} />
          <Route path="/vendeuse/produit/:id/modifier" element={<ModifierProduit />} />
          <Route path="/vendeuse/commandes" element={<CommandesVendeuse />} />
          <Route path="/vendeuse/locations" element={<LocationsVendeuse />} />
          <Route path="/vendeuse/commentaires" element={<CommentairesVendeuse />} />
          <Route path="/vendeuse/boutique" element={<MaBoutique />} />
          <Route path="/vendeuse/ventes" element={<Ventes />} />

          {/* Espace admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/performance" element={<AdminPerformance />} />
          <Route path="/admin/commandes" element={<AdminCommandes />} />
          <Route path="/admin/produits" element={<AdminProduits />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/plaintes" element={<AdminPlaintes />} />
          <Route path="/admin/ebook" element={<AdminEbook />} />
          <Route path="/admin/utilisateurs" element={<AdminUtilisateurs />} />

          {/* Espace livreur */}
          <Route path="/livreur" element={<LivreurTableauDeBord />} />
          <Route path="/livreur/mes-livraisons" element={<LivreurMesLivraisons />} />
          <Route path="/livreur/historique" element={<LivreurHistorique />} />
          <Route path="/livreur/revenus" element={<LivreurRevenus />} />
          <Route path="/livreur/notifications" element={<LivreurNotifications />} />
          <Route path="/livreur/profil" element={<LivreurProfil />} />

          {/* Tout le reste retombe sur l'accueil */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
