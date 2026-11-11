// frontend/src/components/layout/CartDrawer.jsx
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

export default function CartDrawer() {
  const { items, subtotal, totalCaution, sousTotalArticle, drawerOuvert, fermerDrawer, updateQuantite, removeItem } = useCart();

  return (
    <>
      <div
        onClick={fermerDrawer}
        className={`fixed inset-0 bg-ink/40 z-[90] transition-opacity duration-300 ${
          drawerOuvert ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-sable z-[95] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          drawerOuvert ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <h2 className="font-serif text-lg text-ink flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-teal">
              <path d="M3 4h2l2.4 12.2A2 2 0 0 0 9.4 18H18a2 2 0 0 0 2-1.6L21.5 8H6" />
              <circle cx="9.5" cy="21" r="1.2" />
              <circle cx="17.5" cy="21" r="1.2" />
            </svg>
            Ajouté au panier
          </h2>
          <button
            type="button"
            onClick={fermerDrawer}
            aria-label="Fermer"
            className="h-8 w-8 rounded-full flex items-center justify-center text-ink-soft/75 hover:bg-line/50 hover:text-ink transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <p className="text-sm text-ink-soft/75 mb-4">Votre panier est vide.</p>
            <button onClick={fermerDrawer} className="text-teal-dark font-semibold text-sm hover:underline">
              Continuer mes achats
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 divide-y divide-line">
              {items.map((item) => (
                <div key={item.cleId} className="flex gap-3.5 py-4 first:pt-0">
                  <div className="h-16 w-16 rounded-btn bg-line/40 overflow-hidden shrink-0">
                    {item.image && <img loading="lazy" decoding="async" src={item.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-ink truncate">{item.titre}</p>
                    {item.typeOffre === 'location' ? (
                      <p className="text-[11.5px] text-teal-dark font-semibold mb-2">
                        Location · {item.dateDebut} → {item.dateFin} ({item.nbJours} j)
                      </p>
                    ) : (
                      <p className="text-[11.5px] text-ink-soft/75 mb-2">{item.categorieNom}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {item.typeOffre === 'location' ? (
                        <span className="text-[11px] text-ink-soft/75">Caution {formatFCFA(item.caution)}</span>
                      ) : (
                        <div className="flex items-center border border-line rounded-full">
                          <button
                            type="button"
                            onClick={() => updateQuantite(item.cleId, item.quantite - 1)}
                            className="h-6 w-6 flex items-center justify-center text-ink-soft/75 hover:text-ink"
                          >
                            −
                          </button>
                          <span className="text-[12px] font-semibold text-ink w-5 text-center">{item.quantite}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantite(item.cleId, item.quantite + 1)}
                            className="h-6 w-6 flex items-center justify-center text-ink-soft/75 hover:text-ink"
                          >
                            +
                          </button>
                        </div>
                      )}
                      <p className="text-[13px] font-bold text-ink">{formatFCFA(sousTotalArticle(item))}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.cleId)}
                    aria-label="Retirer"
                    className="text-ink-soft/75 hover:text-red-500 transition-colors self-start"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="px-6 py-5 border-t border-line space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft/75">Sous-total</span>
                <span className="font-bold text-ink">{formatFCFA(subtotal)}</span>
              </div>
              {totalCaution > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-soft/75">Caution (remboursable)</span>
                  <span className="font-bold text-teal-dark">{formatFCFA(totalCaution)}</span>
                </div>
              )}
              <p className="text-[11.5px] text-ink-soft/75">Frais de livraison calculés à l'étape suivante.</p>
              <Link
                to="/checkout"
                onClick={fermerDrawer}
                className="block text-center bg-orange hover:bg-orange-dark text-white font-bold py-3.5 rounded-full text-sm transition-colors"
              >
                Commander
              </Link>
              <Link
                to="/panier"
                onClick={fermerDrawer}
                className="block text-center text-teal-dark font-semibold text-sm hover:underline"
              >
                Voir le panier complet
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
