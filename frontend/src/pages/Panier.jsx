// frontend/src/pages/Panier.jsx
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Reveal from '../components/ui/Reveal';
import { useCart } from '../context/CartContext';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function formatDateCourte(date) {
  return `${JOURS[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function periodeLivraisonEstimee() {
  const debut = new Date();
  const fin = new Date();
  fin.setDate(fin.getDate() + 3);
  return `${formatDateCourte(debut)} - ${formatDateCourte(fin)}`;
}

export default function Panier() {
  const { items, removeItem, updateQuantite, subtotal, totalCaution, sousTotalArticle } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="max-w-[700px] mx-auto px-6 py-24 text-center">
          <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-line/40 flex items-center justify-center text-ink-soft/40">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7">
              <path d="M3 4h2l2.4 12.2A2 2 0 0 0 9.4 18H18a2 2 0 0 0 2-1.6L21.5 8H6" />
              <circle cx="9.5" cy="21" r="1.2" />
              <circle cx="17.5" cy="21" r="1.2" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-ink mb-2">Votre panier est vide</h1>
          <p className="text-sm text-ink-soft/60 mb-8">
            Découvrez des trésors pour bébés, enfants et mamans dans notre boutique.
          </p>
          <Link to="/boutique" className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-cream rounded-btn text-sm font-bold uppercase tracking-wide hover:bg-clay transition-colors">
            Découvrir la boutique
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Reveal className="max-w-[1100px] mx-auto px-6 md:px-12 py-12">
        <h1 className="font-serif text-[28px] text-ink mb-6">
          Mon panier <span className="text-ink-soft/50 font-sans text-base font-normal">({items.length} article{items.length > 1 ? 's' : ''})</span>
        </h1>

        <div className="flex items-center gap-3 bg-teal/8 border border-teal/25 rounded-btn px-4 py-3.5 mb-7">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-teal shrink-0">
            <path d="M5 12l4.5 4.5L19 7" />
          </svg>
          <p className="text-[13.5px] text-ink">
            <span className="font-bold">C'est presque fini !</span> La livraison est disponible partout à Dakar à partir de 1 000 FCFA.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-10">

          <div>
            <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-soft/70 mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 3l-4 4-4-4" />
              </svg>
              Envoyé par Yaay Vidé
              <span className="text-ink-soft/50 font-normal">· Livraison estimée {periodeLivraisonEstimee()}</span>
            </div>

            <div className="divide-y divide-line border-t border-b border-line">
              {items.map((item) => (
                <div key={item.cleId} className="flex items-center gap-5 py-5">
                  <Link to={`/produit/${item.id}`} className="h-20 w-20 rounded-btn overflow-hidden bg-line/40 shrink-0">
                    {item.image && <img src={item.image} alt={item.titre} className="h-full w-full object-cover" />}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/produit/${item.id}`} className="font-serif text-[15px] text-ink hover:text-teal transition-colors line-clamp-1">
                      {item.titre}
                    </Link>
                    {item.typeOffre === 'location' ? (
                      <p className="text-[12px] text-teal font-semibold mt-1">
                        Location · {item.dateDebut} → {item.dateFin} ({item.nbJours} jour{item.nbJours > 1 ? 's' : ''}) · Caution {formatFCFA(item.caution)}
                      </p>
                    ) : (
                      <p className="text-[12px] text-ink-soft/55 mt-1">{item.categorieNom || 'Yaay Vidé'}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.cleId)}
                      className="text-[12px] text-clay font-semibold mt-2 hover:underline"
                    >
                      Retirer
                    </button>
                  </div>

                  {item.typeOffre === 'location' ? (
                    <span className="text-[12.5px] font-semibold text-ink-soft/60 whitespace-nowrap">1 article</span>
                  ) : (
                    <div className="flex items-center border border-line rounded-btn">
                      <button
                        type="button"
                        onClick={() => updateQuantite(item.cleId, item.quantite - 1)}
                        className="h-8 w-8 flex items-center justify-center text-ink-soft/70 hover:text-ink"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantite}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantite(item.cleId, item.quantite + 1)}
                        className="h-8 w-8 flex items-center justify-center text-ink-soft/70 hover:text-ink"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <p className="w-28 text-right font-semibold text-ink text-[15px]">
                    {formatFCFA(sousTotalArticle(item))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-cream border border-line rounded-m p-6 h-fit space-y-5">
            <h3 className="font-serif text-lg text-ink">Récapitulatif</h3>
            <div className="space-y-2.5 text-[13.5px]">
              <div className="flex justify-between text-ink-soft/70">
                <span>Sous-total</span>
                <span>{formatFCFA(subtotal)}</span>
              </div>
              {totalCaution > 0 && (
                <div className="flex justify-between text-ink-soft/70">
                  <span>Caution (remboursable)</span>
                  <span className="text-teal font-medium">{formatFCFA(totalCaution)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-soft/70">
                <span>Livraison</span>
                <span className="text-teal font-medium">Calculée à l'étape suivante</span>
              </div>
            </div>
            <div className="flex justify-between text-[16px] font-bold text-ink pt-3 border-t border-line">
              <span>Total</span>
              <span>{formatFCFA(subtotal + totalCaution)}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full bg-ink text-cream rounded-full py-3.5 text-sm font-bold uppercase tracking-wide hover:bg-clay hover:-translate-y-0.5 transition-all"
            >
              Commander
            </button>
            <Link to="/boutique" className="block text-center text-[12.5px] font-semibold text-ink-soft/60 hover:text-ink">
              Continuer mes achats
            </Link>

            <div className="pt-3 border-t border-line">
              <p className="text-[11px] text-ink-soft/50 uppercase tracking-wide mb-2.5">Nous acceptons</p>
              <div className="flex flex-wrap gap-2">
                {['Wave', 'Orange Money', 'Free Money', 'Espèces'].map((mode) => (
                  <span key={mode} className="text-[11px] font-semibold text-ink-soft/70 bg-sable border border-line rounded-full px-2.5 py-1">
                    {mode}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Layout>
  );
}
