// frontend/src/components/boutique/ProductCard.jsx
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { apiFetch } from "../../utils/api";
import { ETAT_LABELS, formatFCFA } from "../../utils/produit";

function formatDatePublication(iso) {
  if (!iso) return null;
  const jours = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (jours <= 0) return "Publié aujourd'hui";
  if (jours === 1) return "Publié hier";
  if (jours < 30) return `Publié il y a ${jours} j`;
  const mois = Math.floor(jours / 30);
  return `Publié il y a ${mois} mois`;
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

  // Badges d'état : pastille pêche douce, texte foncé (lisible, AA)
  const badge = "max-w-full leading-tight px-2 py-1 rounded-btn text-[10.5px] font-semibold shadow-sm";

  return (
    <Link
      to={`/produit/${produit.id}`}
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms`, height: "100%" }}
      className="group @container flex flex-col h-full rounded-[18px] bg-white overflow-hidden shadow-[0_6px_18px_-8px_rgba(27,36,48,0.22)] transition-[transform,box-shadow] duration-200 ease-out hover:shadow-[0_18px_36px_-14px_rgba(27,36,48,0.32)] animate-card-in"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-line/40 shrink-0">
        {image ? (
          <img
            loading="lazy"
            decoding="async"
            src={image}
            alt={produit.titre}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-soft/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-10 w-10" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="1" />
              <path d="M3 15l5-5 4 4 3-3 6 6" />
              <circle cx="8.5" cy="9" r="1.3" />
            </svg>
          </div>
        )}

        {/* Haut-gauche : état, puis bonnes affaires / occasion spéciale */}
        <div className="absolute top-2 left-2 right-12 flex flex-col items-start gap-1">
          <span className={`${badge} bg-peche text-ink`}>
            {ETAT_LABELS[produit.etat] || "Bon état"}
          </span>
          {produit.bonne_affaire && (
            <span className={`${badge} bg-peche text-clay-dark`}>Bonne affaire</span>
          )}
          {estOccasionSpeciale && (
            <span className={`${badge} bg-peche text-clay-dark`}>Occasion spéciale</span>
          )}
        </div>

        {/* Haut-droite : favoris */}
        <button
          type="button"
          onClick={toggleFavori}
          disabled={favoriEnCours}
          aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
          className="absolute top-2 right-2 h-9 w-9 rounded-full bg-white/95 shadow-sm flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
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

        {/* Bas-droite : taille */}
        {produit.taille && (
          <span className="absolute bottom-2 right-2 bg-white/95 text-ink text-[10.5px] font-bold px-2 py-1 rounded-btn shadow-sm">
            {produit.taille}
          </span>
        )}
      </div>

      <div className="px-3 pt-2.5 pb-3 flex flex-col flex-1 gap-1">
        <span className="truncate text-[11.5px] font-medium text-teal-dark">
          {produit.categorie_racine_nom || produit.categorie_nom || "Yaay Vidé"}
        </span>

        <div className="flex items-baseline justify-between gap-2">
          <h3 className="min-w-0 truncate font-serif font-bold text-[15px] sm:text-[16px] leading-snug text-ink">
            {produit.titre}
          </h3>
          <p className="shrink-0 font-sans font-bold text-ink text-[13.5px] sm:text-[14.5px] whitespace-nowrap">
            {formatFCFA(produit.prix_final_public)}
            {isLocation && (
              <span className="text-ink-soft/75 font-medium text-[11px]">
                {/* carte étroite : « /j » pour laisser la place au titre */}
                <span className="@min-[230px]:hidden">/j</span>
                <span className="hidden @min-[230px]:inline"> / jour</span>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-ink-soft/75 min-w-0 mt-0.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 01-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0116 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="truncate">
            {[
              // affichage court : « Zone 1 - Dakar Centre » → « Dakar Centre »
              produit.boutique_zone_nom?.replace(/^zone\s*\d+\s*[-–]\s*/i, ""),
              // « Publié il y a 3 mois » → « il y a 3 mois » pour tenir sur la carte
              formatDatePublication(produit.date_ajout)?.replace(/^Publié /, ""),
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {produit.boutique_verifiee && (
            <span className="ml-auto shrink-0 text-teal-dark" title="Produit vérifié">
              <VerifiedIcon className="h-4 w-4" />
              <span className="sr-only">Produit vérifié</span>
            </span>
          )}
        </div>

        <div className="mt-auto pt-2">
        <button
          type="button"
          onClick={handleCta}
          className={`w-full min-h-[38px] rounded-btn border text-[13px] font-semibold transition-colors ${
            ajoute
              ? "bg-teal-dark border-teal-dark text-white"
              : "border-clay text-clay-dark bg-white group-hover:bg-clay-dark group-hover:border-clay-dark group-hover:text-white"
          }`}
        >
          {ajoute ? "Ajouté au panier" : isLocation ? "Louer le produit" : "Ajouter au panier"}
        </button>
        </div>
      </div>
    </Link>
  );
}
