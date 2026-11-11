// frontend/src/pages/ProduitDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Reveal from "../components/ui/Reveal";
import ProductCard from "../components/boutique/ProductCard";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../utils/api";

const ETAT_LABELS = {
  neuf: "Neuf avec étiquette",
  excellent: "Excellent état",
  bon: "Bon état",
};

const ETAT_BADGE = {
  neuf: "bg-green-500",
  excellent: "bg-yellow-500",
  bon: "bg-orange",
};

function formatFCFA(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Math.round(Number(value)).toLocaleString("fr-FR") + " FCFA";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function joursDepuis(dateISO) {
  if (!dateISO) return null;
  const jours = Math.floor(
    (Date.now() - new Date(dateISO).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (jours <= 0) return "Publié aujourd'hui";
  if (jours === 1) return "Publié hier";
  return `Publié il y a ${jours} jours`;
}

export default function ProduitDetail() {
  const { id } = useParams();

  const [produit, setProduit] = useState(null);
  const [autresArticles, setAutresArticles] = useState([]);
  const [produitsSimilaires, setProduitsSimilaires] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState("description");
  const [pricePulse, setPricePulse] = useState(false);
  const { addItem } = useCart();
  const [ajoute, setAjoute] = useState(false);
  const [favori, setFavori] = useState(false);
  const [favoriEnCours, setFavoriEnCours] = useState(false);
  const [lienCopie, setLienCopie] = useState(false);

  const [dateDebut, setDateDebut] = useState(todayISO());
  const [dateFin, setDateFin] = useState(todayISO());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- se redéclenche à chaque changement de produit (id), pas seulement au montage
    setChargement(true);
    apiFetch(`/produits/${id}/`)
      .then((res) => {
        if (!res.ok) throw new Error("Introuvable");
        return res.json();
      })
      .then((data) => {
        setProduit(data);
        setFavori(Boolean(data.est_favori));
        setActiveImg(0);
      })
      .catch(() => setErreur("Cet article n'existe pas ou plus."))
      .finally(() => setChargement(false));

    apiFetch(`/produits/${id}/autres-articles-boutique/`)
      .then(async (res) => setAutresArticles(res.ok ? await res.json() : []))
      .catch(() => setAutresArticles([]));
  }, [id]);

  useEffect(() => {
    if (!produit?.categorie_slug) {
      setProduitsSimilaires([]);
      return;
    }
    apiFetch(`/produits/?categorie=${produit.categorie_slug}&limit=9`)
      .then(async (res) => (res.ok ? await res.json() : []))
      .then((data) =>
        setProduitsSimilaires(
          data.filter((p) => p.id !== produit.id).slice(0, 4),
        ),
      )
      .catch(() => setProduitsSimilaires([]));
  }, [produit?.categorie_slug, produit?.id]);

  const isLocation = produit?.type_offre === "location";
  const estBonneAffaire = produit?.bonne_affaire;

  const gallery = useMemo(() => {
    if (!produit) return [];
    const list = [];
    if (produit.image_principale) list.push(produit.image_principale);
    (produit.images || []).forEach((img) => list.push(img.image));
    return list;
  }, [produit]);

  const calcul = useMemo(() => {
    if (!isLocation || !produit) return null;
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const jours = Math.max(
      1,
      Math.round((fin - debut) / (1000 * 60 * 60 * 24)) || 1,
    );
    const prixBase = Number(produit.prix_vendeur) * jours;
    const tauxCommission = produit.est_article_lancement ? 0.05 : 0.1;
    const commission = prixBase * tauxCommission;
    const total = prixBase + commission;
    const caution = Number(produit.caution) || 0;
    return { jours, prixBase, commission, tauxCommission, total, caution };
  }, [isLocation, produit, dateDebut, dateFin]);

  useEffect(() => {
    if (!calcul) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- déclenche une micro-animation visuelle, pas une synchro d'état classique
    setPricePulse(true);
    const t = setTimeout(() => setPricePulse(false), 350);
    return () => clearTimeout(t);
  }, [calcul]);

  const toggleFavori = async () => {
    setFavoriEnCours(true);
    const res = await apiFetch(`/produits/${id}/favori/`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setFavori(data.est_favori);
    } else if (res.status === 401 || res.status === 403) {
      window.location.href = "/connexion";
    }
    setFavoriEnCours(false);
  };

  const partagerLien = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLienCopie(true);
      setTimeout(() => setLienCopie(false), 2000);
    } catch {
      // navigateur sans accès presse-papier — on ignore silencieusement
    }
  };

  if (chargement) {
    return (
      <Layout>
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-16 grid md:grid-cols-2 gap-12">
          <div className="aspect-square rounded-m bg-line/40 animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-24 bg-line/40 rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-line/40 rounded animate-pulse" />
            <div className="h-6 w-32 bg-line/40 rounded animate-pulse" />
          </div>
        </div>
      </Layout>
    );
  }

  if (erreur || !produit) {
    return (
      <Layout>
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-24 text-center">
          <p className="font-serif text-2xl text-ink mb-3">
            {erreur || "Article introuvable"}
          </p>
          <Link
            to="/boutique"
            className="text-teal-dark font-semibold hover:underline"
          >
            Retour à la boutique
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 pt-7 text-[12.5px] text-ink-soft/75 flex items-center gap-2">
        <Link to="/" className="hover:text-ink transition-colors">
          Découvrir
        </Link>
        <span>/</span>
        <Link
          to={`/boutique?categorie=${produit.categorie_slug || ""}`}
          className="hover:text-ink transition-colors"
        >
          {produit.categorie_nom || "Boutique"}
        </Link>
      </div>

      <Reveal className="max-w-[1280px] mx-auto px-6 md:px-12 py-9 grid md:grid-cols-2 gap-12">
        <div>
          <div className="relative aspect-square rounded-m overflow-hidden border border-line bg-line/30 mb-4">
            {gallery.length > 0 ? (
              <img
                key={activeImg}
                src={gallery[activeImg]}
                alt={produit.titre}
                className="absolute inset-0 h-full w-full object-cover animate-fade-in"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-ink-soft/30">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  className="h-16 w-16"
                >
                  <rect x="3" y="5" width="18" height="14" rx="1" />
                  <path d="M3 15l5-5 4 4 3-3 6 6" />
                  <circle cx="8.5" cy="9" r="1.3" />
                </svg>
              </div>
            )}

            <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
              {isLocation && (
                <span className="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-teal text-white shadow-sm">
                  À louer
                </span>
              )}
              <span
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide text-white shadow-sm ${ETAT_BADGE[produit.etat] || "bg-orange"}`}
              >
                {ETAT_LABELS[produit.etat] || "Bon état"}
              </span>
              {estBonneAffaire && (
                <span className="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-red-500 text-white shadow-sm">
                  Bonne affaire
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={toggleFavori}
              disabled={favoriEnCours}
              aria-label={
                favori ? "Retirer des favoris" : "Ajouter aux favoris"
              }
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-cream/95 shadow-sm flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
            >
              <svg
                viewBox="0 0 24 24"
                fill={favori ? "#C4602F" : "none"}
                stroke={favori ? "#C4602F" : "currentColor"}
                strokeWidth="1.8"
                className="h-5 w-5 text-ink"
              >
                <path d="M12 21s-6.7-4.35-9.3-8.1C1 10.3 1.6 6.9 4.4 5.4 6.5 4.3 9 5 12 8c3-3 5.5-3.7 7.6-2.6 2.8 1.5 3.4 4.9 1.7 7.5C18.7 16.65 12 21 12 21z" />
              </svg>
            </button>
          </div>

          {gallery.length > 1 && (
            <div className="flex gap-3">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 rounded-btn overflow-hidden border-2 transition-colors ${
                    activeImg === i
                      ? "border-teal"
                      : "border-line hover:border-ink/40"
                  }`}
                >
                  <img loading="lazy" decoding="async"
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-dark mb-2">
            {produit.categorie_nom || "Yaay Vidé"}
          </p>
          <h1 className="font-serif text-[28px] sm:text-[32px] leading-tight text-ink mb-3">
            {produit.titre}
          </h1>

          {produit.boutique_note_moyenne > 0 && (
            <div className="flex items-center gap-1.5 mb-3 text-[13.5px]">
              <span className="text-orange">
                {"★".repeat(Math.round(produit.boutique_note_moyenne))}
                {"☆".repeat(5 - Math.round(produit.boutique_note_moyenne))}
              </span>
              <span className="font-bold text-ink">
                {produit.boutique_note_moyenne}
              </span>
              <span className="text-ink-soft/75">
                ({produit.boutique_nb_avis} avis)
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-ink-soft/75 mb-6 pb-6 border-b border-line">
            {produit.boutique_zone_nom && (
              <span className="flex items-center gap-1.5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-4 w-4"
                >
                  <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {produit.boutique_zone_nom}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4"
              >
                <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {produit.nb_vues} vue{produit.nb_vues > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              {joursDepuis(produit.date_ajout)}
            </span>
            <button
              type="button"
              onClick={partagerLien}
              className="flex items-center gap-1.5 text-teal-dark font-semibold hover:text-ink transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4"
              >
                <circle cx="18" cy="5" r="2.5" />
                <circle cx="6" cy="12" r="2.5" />
                <circle cx="18" cy="19" r="2.5" />
                <path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4" />
              </svg>
              {lienCopie ? "Lien copié !" : "Partager le lien"}
            </button>
          </div>

          {!isLocation ? (
            <>
              <p className="font-serif text-3xl font-bold text-ink mb-1">
                {formatFCFA(produit.prix_final_public)}
              </p>
              <p className="text-[12.5px] text-ink-soft/75 mb-6">
                Prix d'achat
              </p>

              <button
                type="button"
                onClick={() => {
                  addItem(produit);
                  setAjoute(true);
                }}
                className={`w-full flex items-center justify-center gap-2.5 rounded-btn py-4 text-sm font-bold uppercase tracking-wide transition-all hover:-translate-y-0.5 ${
                  ajoute
                    ? "bg-teal text-white"
                    : "bg-orange text-white hover:bg-orange-dark"
                }`}
              >
                {ajoute ? (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                    >
                      <path d="M5 12l4.5 4.5L19 7" />
                    </svg>
                    Ajouté au panier
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                    >
                      <path d="M3 4h2l2.4 12.2A2 2 0 0 0 9.4 18H18a2 2 0 0 0 2-1.6L21.5 8H6" />
                      <circle cx="9.5" cy="21" r="1.2" />
                      <circle cx="17.5" cy="21" r="1.2" />
                    </svg>
                    Ajouter au panier
                  </>
                )}
              </button>
              {ajoute && (
                <Link
                  to="/panier"
                  className="block text-center text-[12.5px] font-semibold text-teal-dark hover:underline mt-3 animate-fade-in"
                >
                  Voir mon panier →
                </Link>
              )}

              <div className="mt-4 flex items-start gap-3 bg-sable border border-line rounded-btn p-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-5 w-5 text-orange shrink-0 mt-0.5"
                >
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  <path d="M3.27 6.96L12 12l8.73-5.04M12 22.08V12" />
                </svg>
                <p className="text-[12.5px] text-ink-soft leading-relaxed">
                  <span className="font-bold text-ink">
                    Disponibilité à confirmer.
                  </span>{" "}
                  La vendeuse dispose de 24 heures maximum pour répondre. Aucun
                  paiement avant confirmation — vous payez à la livraison.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="font-serif text-3xl font-bold text-ink mb-1">
                {formatFCFA(produit.prix_final_public)}
                <span className="text-ink-soft/75 font-sans font-normal text-base">
                  {" "}
                  /jour
                </span>
              </p>
              <p className="text-[12.5px] text-ink-soft/75 mb-7">
                Caution de {formatFCFA(produit.caution)}, rendue à la fin de la
                location.
              </p>

              <div className="bg-sable border border-line rounded-m p-6 space-y-5">
                <h3 className="font-serif text-lg text-ink">
                  Location du produit
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">
                      Date début
                    </label>
                    <input
                      type="date"
                      value={dateDebut}
                      min={todayISO()}
                      onChange={(e) => setDateDebut(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-cream border border-line rounded-btn text-[13px] focus:outline-none focus:border-teal transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">
                      Date fin
                    </label>
                    <input
                      type="date"
                      value={dateFin}
                      min={dateDebut}
                      onChange={(e) => setDateFin(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-cream border border-line rounded-btn text-[13px] focus:outline-none focus:border-teal transition-colors"
                    />
                  </div>
                </div>

                {calcul && (
                  <div
                    className={`space-y-2 pt-2 ${pricePulse ? "animate-price-pop" : ""}`}
                  >
                    <div className="flex justify-between text-[13px] text-ink-soft/75">
                      <span>
                        Prix base ({calcul.jours} jour
                        {calcul.jours > 1 ? "s" : ""})
                      </span>
                      <span>{formatFCFA(calcul.prixBase)}</span>
                    </div>
                    <div className="flex justify-between text-[13px] text-ink-soft/75">
                      <span>
                        Commission ({Math.round(calcul.tauxCommission * 100)}%)
                      </span>
                      <span>{formatFCFA(calcul.commission)}</span>
                    </div>
                    <div className="flex justify-between text-[15px] font-bold text-ink pt-2 border-t border-line">
                      <span>Total</span>
                      <span>{formatFCFA(calcul.total)}</span>
                    </div>
                    <div className="flex justify-between text-[13px] text-teal-dark font-medium">
                      <span>Caution (remboursable)</span>
                      <span>{formatFCFA(calcul.caution)}</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    addItem(produit, {
                      dateDebut,
                      dateFin,
                      nbJours: calcul?.jours,
                    })
                  }
                  disabled={!calcul}
                  className="w-full flex items-center justify-center gap-2.5 bg-teal text-white rounded-btn py-3.5 text-sm font-bold uppercase tracking-wide hover:bg-teal-dark hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <path d="M6 6h15l-1.5 9h-12L6 6zM6 6L5 3H2M9 20a1 1 0 100-2 1 1 0 000 2zM18 20a1 1 0 100-2 1 1 0 000 2z" />
                  </svg>
                  Ajouter la location au panier
                </button>
                <p className="text-[11px] text-ink-soft/75 text-center -mt-2">
                  Paiement uniquement à la livraison — la vendeuse confirme la
                  disponibilité sous 24h.
                </p>
              </div>
            </>
          )}

          {produit.boutique_nom && (
            <Link
              to={`/boutique/${produit.boutique_slug}`}
              className="mt-6 flex items-center gap-3.5 bg-cream border border-line rounded-m p-4 hover:border-teal transition-colors group"
            >
              <div className="h-11 w-11 rounded-btn bg-ink text-cream flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-5 w-5"
                >
                  <path d="M3 10l1.5-6h15L21 10M3 10v9a1 1 0 001 1h16a1 1 0 001-1v-9M3 10h18M9 14h6v6H9z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-ink-soft/75 uppercase tracking-wide">
                  Boutique
                </p>
                <p className="text-sm font-bold text-ink truncate">
                  {produit.boutique_nom}
                </p>
                {produit.boutique_note_moyenne > 0 && (
                  <p className="text-[12.5px] text-orange mt-0.5">
                    ★ {produit.boutique_note_moyenne}{" "}
                    <span className="text-ink-soft/75">
                      ({produit.boutique_nb_avis} avis)
                    </span>
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-ink">
                  {produit.boutique_nb_ventes}
                </p>
                <p className="text-[11px] text-ink-soft/75">ventes</p>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4 text-ink-soft/40 group-hover:text-teal-dark group-hover:translate-x-0.5 transition-all"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {[
              {
                label: "Contrôle qualité",
                desc: "Avant la livraison",
                path: "M9 11l2 2 4-4 M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
              },
              {
                label: "Réclamation",
                desc: "Dans les 24h après réception",
                path: "M12 8v4l2.5 2.5 M12 22a10 10 0 100-20 10 10 0 000 20z",
              },
              {
                label: "Livraison organisée",
                desc: "Sans remise directe",
                path: "M2 8h13v8H2zM15 11h4l3 3v2h-7zM6.5 18.5a1.6 1.6 0 110-.1M17.5 18.5a1.6 1.6 0 110-.1",
              },
            ].map((b) => (
              <div
                key={b.label}
                className="border border-line rounded-btn p-3 text-center"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-5 w-5 mx-auto mb-1.5 text-teal-dark"
                >
                  <path d={b.path} />
                </svg>
                <p className="text-[11.5px] font-bold text-ink leading-snug">
                  {b.label}
                </p>
                <p className="text-[10.5px] text-ink-soft/75 leading-snug">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <div className="flex gap-6 border-b border-line">
              {[
                { id: "description", label: "Description" },
                { id: "details", label: "Détails" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`pb-3 text-[13.5px] font-semibold transition-colors border-b-2 -mb-px ${
                    tab === t.id
                      ? "text-teal-dark border-teal"
                      : "text-ink-soft/75 border-transparent hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="py-6 text-[14px] text-ink-soft leading-relaxed">
              {tab === "description" ? (
                <p className="whitespace-pre-line">{produit.description}</p>
              ) : (
                <dl className="grid grid-cols-2 gap-y-3 text-[13.5px]">
                  <dt className="text-ink-soft/75">État</dt>
                  <dd className="text-ink font-medium">
                    {ETAT_LABELS[produit.etat] || "Bon état"}
                  </dd>
                  {produit.taille && (
                    <>
                      <dt className="text-ink-soft/75">Taille / pointure</dt>
                      <dd className="text-ink font-medium">{produit.taille}</dd>
                    </>
                  )}
                  <dt className="text-ink-soft/75">Catégorie</dt>
                  <dd className="text-ink font-medium">
                    {produit.categorie_nom || "—"}
                  </dd>
                  <dt className="text-ink-soft/75">Type d'offre</dt>
                  <dd className="text-ink font-medium">
                    {isLocation ? "Location" : "Vente"}
                  </dd>
                  <dt className="text-ink-soft/75">Quantité disponible</dt>
                  <dd className="text-ink font-medium">
                    {produit.quantite_disponible}
                  </dd>
                  <dt className="text-ink-soft/75">Boutique</dt>
                  <dd className="text-ink font-medium">
                    {produit.boutique_nom}
                  </dd>
                  {produit.boutique_zone_nom && (
                    <>
                      <dt className="text-ink-soft/75">Localisation</dt>
                      <dd className="text-ink font-medium">
                        {produit.boutique_zone_nom}
                      </dd>
                    </>
                  )}
                </dl>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {autresArticles.length > 0 && (
        <div className="bg-sable py-14">
          <div className="max-w-[1280px] mx-auto px-6 md:px-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-teal-dark mb-1.5">
                  Chez {produit.boutique_nom}
                </p>
                <h2 className="font-serif text-2xl text-ink">
                  D'autres articles à découvrir
                </h2>
              </div>
              <Link
                to={`/boutique/${produit.boutique_slug}`}
                className="hidden sm:flex items-center gap-1.5 text-teal-dark font-semibold text-sm hover:underline whitespace-nowrap"
              >
                Voir la boutique
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-3.5 w-3.5"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {autresArticles.map((p, i) => (
                <div key={p.id} className="w-[160px] sm:w-[190px]">
                  <ProductCard produit={p} index={i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {produitsSimilaires.length > 0 && (
        <div className="bg-white py-14">
          <div className="max-w-[1280px] mx-auto px-6 md:px-12">
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-wide text-teal-dark mb-1.5">
                Vous pourriez aussi aimer
              </p>
              <h2 className="font-serif text-2xl text-ink">
                Produits similaires
              </h2>
            </div>
            <div className="flex flex-wrap gap-4">
              {produitsSimilaires.map((p, i) => (
                <div key={p.id} className="w-[160px] sm:w-[190px]">
                  <ProductCard produit={p} index={i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
