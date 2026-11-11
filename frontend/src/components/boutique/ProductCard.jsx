// frontend/src/components/boutique/ProductCard.jsx
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { apiFetch } from "../../utils/api";

const ETAT_LABELS = {
  neuf: "Neuf avec étiquette",
  excellent: "Excellent état",
  bon: "Bon état",
};

const ETAT_BADGE = {
  // Fonds assez foncés pour un texte blanc lisible (contraste AA)
  neuf: "bg-green-700",
  excellent: "bg-teal-dark",
  bon: "bg-clay-dark",
};

function formatFCFA(value) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("fr-FR") + " FCFA";
}

function formatDatePublication(iso) {
  if (!iso) return null;
  const jours = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (jours <= 0) return "Publié aujourd'hui";
  if (jours === 1) return "Publié hier";
  if (jours < 30) return `Publié il y a ${jours} j`;
  const mois = Math.floor(jours / 30);
  return `Publié il y a ${mois} mois`;
}

function EyeIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function VerifiedIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function ProductCard({ produit, index = 0 }) {
  const ref = useRef(null);
  const { addItem } = useCart();
  const [ajoute, setAjoute] = useState(false);
  const [favori, setFavori] = useState(Boolean(produit.est_favori));
  const [favoriEnCours, setFavoriEnCours] = useState(false);
  const isLocation = produit.type_offre === "location";
  const image = produit.image_principale;
  const estOccasionSpeciale = Boolean(produit.categorie_tags_occasion);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    // Pas d'effet 3D si l'utilisatrice a demandé moins d'animations
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = (y / r.height - 0.5) * -6;
    const ry = (x / r.width - 0.5) * 6;
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
  };
  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  const handleCta = (e) => {
    if (isLocation) return;
    e.preventDefault();
    e.stopPropagation();
    addItem(produit);
    setAjoute(true);
    setTimeout(() => setAjoute(false), 1400);
  };

  const toggleFavori = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavoriEnCours(true);
    const res = await apiFetch(`/produits/${produit.id}/favori/`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setFavori(data.est_favori);
    } else if (res.status === 401 || res.status === 403) {
      window.location.href = "/connexion";
    }
    setFavoriEnCours(false);
  };

  return (
    <Link
      to={`/produit/${produit.id}`}
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms`, height: "100%" }}
      className="group flex flex-col h-full rounded-[20px] bg-cream overflow-hidden shadow-[0_4px_14px_-6px_rgba(27,36,48,0.18)] transition-[transform,box-shadow] duration-200 ease-out hover:shadow-[0_18px_36px_-14px_rgba(27,36,48,0.32)] animate-card-in"
    >
      <div className="relative aspect-square overflow-hidden bg-line/40 shrink-0">
        {image ? (
          <img loading="lazy" decoding="async"
            src={image}
            alt={produit.titre}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-soft/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              className="h-12 w-12"
            >
              <rect x="3" y="5" width="18" height="14" rx="1" />
              <path d="M3 15l5-5 4 4 3-3 6 6" />
              <circle cx="8.5" cy="9" r="1.3" />
            </svg>
          </div>
        )}

        {/* Haut-gauche : état du produit, puis bonnes affaires / occasion spéciale */}
        <div className="absolute top-2 left-2 right-12 flex flex-col items-start gap-1.5">
          <span
            className={`px-1.5 py-0.5 max-w-full leading-tight rounded-[10px] text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ${ETAT_BADGE[produit.etat] || "bg-clay-dark"}`}
          >
            {ETAT_LABELS[produit.etat] || "Bon état"}
          </span>
          {produit.bonne_affaire && (
            <span className="max-w-full leading-tight px-1.5 py-0.5 rounded-[10px] text-[10px] font-bold uppercase tracking-wide text-white bg-clay-dark shadow-sm">
              Bonne affaire
            </span>
          )}
          {estOccasionSpeciale && (
            <span className="max-w-full leading-tight px-1.5 py-0.5 rounded-[10px] text-[10px] font-bold uppercase tracking-wide text-ink bg-orange shadow-sm">
              Occasion spéciale
            </span>
          )}
        </div>

        {/* Haut-droite : favoris uniquement */}
        <div className="absolute top-2 right-2">
          <button
            type="button"
            onClick={toggleFavori}
            disabled={favoriEnCours}
            aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
            className="h-9 w-9 rounded-full bg-white/95 shadow-sm flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill={favori ? "#C4602F" : "none"}
              stroke={favori ? "#C4602F" : "currentColor"}
              strokeWidth="1.8"
              className="h-4 w-4 text-ink"
            >
              <path d="M12 21s-6.7-4.35-9.3-8.1C1 10.3 1.6 6.9 4.4 5.4 6.5 4.3 9 5 12 8c3-3 5.5-3.7 7.6-2.6 2.8 1.5 3.4 4.9 1.7 7.5C18.7 16.65 12 21 12 21z" />
            </svg>
          </button>
        </div>

        {/* Bas-gauche : uniquement le nombre de vues */}
        <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-ink/70 text-white text-[10.5px] font-semibold px-2 py-1 rounded-full">
          <EyeIcon className="h-3 w-3" aria-hidden="true" />
          {produit.nb_vues ?? 0}
          <span className="sr-only"> vues</span>
        </span>
        {produit.taille && (
          <span className="absolute bottom-2.5 right-2.5 bg-white/95 text-ink text-[10.5px] font-bold px-2 py-1 rounded-full shadow-sm">
            {produit.taille}
          </span>
        )}
      </div>

      <div className="px-3.5 pt-3 pb-3.5 flex flex-col flex-1">
        <span className="self-start text-[10px] font-bold uppercase tracking-wide text-teal-dark bg-teal/10 px-2 py-0.5 rounded-full mb-1.5 max-w-full truncate">
          {produit.categorie_racine_nom || produit.categorie_nom || "Yaay Vidé"}
        </span>

        <h3 className="font-serif font-semibold text-[15px] sm:text-[16px] leading-snug text-ink line-clamp-2 mb-1">
          {produit.titre}
        </h3>

        <p className="font-sans font-bold text-clay-dark text-[15px] sm:text-[17px] mb-2">
          {formatFCFA(produit.prix_final_public)}
          {isLocation && (
            <span className="text-ink-soft/75 font-medium text-[11px]">
              {" "}
              /jour
            </span>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mb-2">
          {produit.boutique_zone_nom && (
            <span className="flex items-center gap-1 text-[11px] text-ink-soft/75">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3 w-3 shrink-0"
              >
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 01-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0116 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {produit.boutique_zone_nom}
            </span>
          )}
          {produit.date_ajout && (
            <span className="flex items-center gap-1 text-[11px] text-ink-soft/75">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3 w-3 shrink-0"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5l3 2" />
              </svg>
              {formatDatePublication(produit.date_ajout)}
            </span>
          )}
        </div>

        {produit.boutique_verifiee && (
          <span className="inline-flex self-start items-center gap-1 text-[10px] font-bold text-teal-dark bg-teal/10 px-2 py-0.5 rounded-full mb-2">
            <VerifiedIcon className="h-3 w-3" />
            Produit vérifié
          </span>
        )}

        <button
          type="button"
          onClick={handleCta}
          className={`mt-auto w-full min-h-[38px] rounded-full py-2 text-[11.5px] font-bold uppercase tracking-wide transition-colors ${
            ajoute
              ? "bg-teal-dark text-white"
              : isLocation
                ? "bg-ink text-cream group-hover:bg-teal-dark"
                : "bg-clay-dark text-white group-hover:bg-ink"
          }`}
        >
          {ajoute
            ? "Ajouté au panier"
            : isLocation
              ? "Louer le produit"
              : "Ajouter au panier"}
        </button>
      </div>
    </Link>
  );
}
