// frontend/src/pages/Panier.jsx
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Reveal from '../components/ui/Reveal';
import EtatVide from '../components/ui/EtatVide';
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
        <div className="max-w-[700px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <h1 className="sr-only">Mon panier</h1>
          <EtatVide
            icone="panier"
            titre="Votre panier est vide"
            texte="Découvrez des trésors pour bébés, enfants et mamans dans notre boutique."
            action={
              <Link to="/boutique" className="inline-flex items-center gap-2 min-h-[44px] px-7 py-3.5 bg-ink text-cream rounded-full text-sm font-bold uppercase tracking-wide hover:bg-clay-dark transition-colors">
                Découvrir la boutique
              </Link>
            }
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Reveal className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-12">
        <h1 className="font-impact font-extrabold text-[28px] sm:text-[32px] leading-tight text-ink mb-6">
          Mon panier <span className="text-ink-soft/75 font-sans text-base font-normal">({items.length} article{items.length > 1 ? 's' : ''})</span>
        </h1>

        <div className="flex items-center gap-3 bg-teal/8 border border-teal/25 rounded-btn px-4 py-3.5 mb-7">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-teal-dark shrink-0" aria-hidden="true">
            <path d="M5 12l4.5 4.5L19 7" />
          </svg>
          <p className="text-[13.5px] text-ink">
            <span className="font-bold">C'est presque fini !</span> La livraison est disponible partout à Dakar à partir de 1 000 FCFA.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 lg:gap-10">

          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] font-semibold text-ink-soft/75 mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 3l-4 4-4-4" />
              </svg>
              Envoyé par Yaay Vidé
              <span className="text-ink-soft/75 font-normal">· Livraison estimée {periodeLivraisonEstimee()}</span>
            </div>

            <div className="divide-y divide-line border-t border-b border-line">
              {items.map((item) => (
                <div key={item.cleId} className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 sm:gap-x-5 gap-y-3 py-5">
                  <Link to={`/produit/${item.id}`} className="h-16 w-16 sm:h-20 sm:w-20 rounded-btn overflow-hidden bg-line/40 shrink-0">
                    {item.image && <img loading="lazy" decoding="async" src={item.image} alt={item.titre} className="h-full w-full object-cover" />}
                  </Link>

                  <div className="flex-1 min-w-0 basis-[calc(100%-5rem)] sm:basis-auto">
                    <Link to={`/produit/${item.id}`} className="font-serif font-semibold text-[15px] text-ink hover:text-teal-dark transition-colors line-clamp-1">
                      {item.titre}
                    </Link>
                    {item.typeOffre === 'location' ? (
                      <p className="text-[12px] text-ink font-semibold mt-1">
                        Location · {item.dateDebut} → {item.dateFin} ({item.nbJours} jour{item.nbJours > 1 ? 's' : ''}) · Caution {formatFCFA(item.caution)}
                      </p>
                    ) : (
                      <p className="text-[12px] text-ink-soft/75 mt-1">{item.categorieNom || 'Yaay Vidé'}</p>
                    )}
                    {/* rappel de la taille, pour repérer une erreur avant de commander */}
                    {item.taille && (
                      <p className="text-[12px] text-ink mt-0.5">
                        Taille : <span className="font-semibold">{item.taille}</span>
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(item.cleId)}
                      className="text-[12px] text-ink font-semibold mt-1.5 py-1 underline underline-offset-2 hover:text-clay-dark"
                    >
                      Retirer
                    </button>
                  </div>

                  {item.typeOffre === 'location' ? (
                    <span className="ml-20 sm:ml-0 text-[12.5px] font-semibold text-ink-soft/75 whitespace-nowrap">1 article</span>
                  ) : (
                    <div className="ml-20 sm:ml-0 flex items-center border border-line rounded-btn">
                      <button
                        type="button"
                        onClick={() => updateQuantite(item.cleId, item.quantite - 1)}
                        aria-label="Diminuer la quantité"
                        className="h-10 w-10 flex items-center justify-center text-ink-soft/75 hover:text-ink"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{item.quantite}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantite(item.cleId, item.quantite + 1)}
                        aria-label="Augmenter la quantité"
                        className="h-10 w-10 flex items-center justify-center text-ink-soft/75 hover:text-ink"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <p className="ml-auto sm:ml-0 sm:w-28 text-right font-bold text-ink text-[15px]">
                    {formatFCFA(sousTotalArticle(item))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-cream border border-line rounded-m p-5 sm:p-6 h-fit space-y-5 shadow-[0_10px_30px_-18px_rgba(27,36,48,0.25)] lg:sticky lg:top-24">
            <h2 className="font-impact font-extrabold text-lg text-ink">Récapitulatif</h2>
            <div className="space-y-2.5 text-[13.5px]">
              <div className="flex justify-between text-ink-soft/75">
                <span>Sous-total</span>
                <span>{formatFCFA(subtotal)}</span>
              </div>
              {totalCaution > 0 && (
                <div className="flex justify-between text-ink-soft/75">
                  <span>Caution (remboursable)</span>
                  <span className="text-teal-dark font-medium">{formatFCFA(totalCaution)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-soft/75">
                <span>Livraison</span>
                <span className="text-teal-dark font-medium">Calculée à l'étape suivante</span>
              </div>
            </div>
            <div className="flex justify-between text-[16px] font-bold text-ink pt-3 border-t border-line">
              <span>Total</span>
              <span>{formatFCFA(subtotal + totalCaution)}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full min-h-[48px] bg-ink text-cream rounded-full py-3.5 text-sm font-bold uppercase tracking-wide hover:bg-clay-dark hover:-translate-y-0.5 transition-all"
            >
              Commander
            </button>
            <Link to="/boutique" className="block text-center py-1 text-[12.5px] font-semibold text-ink-soft/75 hover:text-ink">
              Continuer mes achats
            </Link>

            <div className="pt-3 border-t border-line">
              <p className="text-[11px] text-ink-soft/75 uppercase tracking-wide mb-2.5">Nous acceptons</p>
              <div className="flex flex-wrap gap-2">
                {['Wave', 'Orange Money', 'Free Money', 'Espèces'].map((mode) => (
                  <span key={mode} className="text-[11px] font-semibold text-ink-soft/75 bg-sable border border-line rounded-full px-2.5 py-1">
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
