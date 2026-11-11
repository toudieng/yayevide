import AnnouncementBar from './AnnouncementBar';
import Header from './Header';
import Footer from './Footer';

/**
 * <Layout> — habillage commun des pages publiques (accueil, catégories,
 * fiche produit, blog, pages statiques...). Les pages d'auth et le
 * tableau de bord vendeuse restent en plein écran sans ce layout,
 * conformément aux maquettes validées.
 */
export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
