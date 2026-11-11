// frontend/src/pages/Boutique.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import BoutiqueBanner from "../components/boutique/BoutiqueBanner";
import FilterSidebar from "../components/boutique/FilterSidebar";
import ProductCard from "../components/boutique/ProductCard";
import Decouverte from "../components/boutique/Decouverte";
import Reveal from "../components/ui/Reveal";
import EtatVide from "../components/ui/EtatVide";
import { apiFetch } from "../utils/api";
import { useHistoriqueRecherches } from "../hooks/useHistoriqueRecherches";
import { findCategoryBySlug } from "../data/categories";
import { trouverRayon } from "../data/rayons";

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récents" },
  { value: "prix_asc", label: "Prix croissant" },
  { value: "prix_desc", label: "Prix décroissant" },
];

const PAR_PAGE = 12;

export default function Boutique() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { recentes, frequentes, enregistrer, effacer } =
    useHistoriqueRecherches();

  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtresOuverts, setFiltresOuverts] = useState(false);

  const [filters, setFilters] = useState({
    categorie: searchParams.get("categorie") || "",
    typeOffre: "",
    etats: [],
    prixMin: "",
    prixMax: "",
  });
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [tri, setTri] = useState("recent");
  const [idsDejaAffiches, setIdsDejaAffiches] = useState(new Set());

  const [page, setPage] = useState(1);

  // Récupère le catalogue une seule fois ; le filtrage se fait ensuite côté client
  useEffect(() => {
    apiFetch("/produits/")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur serveur");
        return res.json();
      })
      .then((data) => setProduits(data))
      .catch(() =>
        setErreur(
          "Impossible de charger les articles. Vérifiez que Django est lancé.",
        ),
      )
      .finally(() => setChargement(false));
  }, []);

  // Si on arrive avec ?categorie=xxx dans l'URL (depuis l'accueil), on synchronise le filtre
  useEffect(() => {
    const urlCat = searchParams.get("categorie") || "";
    if (urlCat !== filters.categorie) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation avec l'URL (source externe), pas un miroir de props
      setFilters((f) => ({ ...f, categorie: urlCat }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Note dans l'historique local une recherche texte significative, avec un
  // léger délai pour ne pas enregistrer chaque frappe au clavier.
  useEffect(() => {
    const terme = search.trim();
    if (terme.length < 2) return;
    const t = setTimeout(
      () => enregistrer(terme, filters.categorie || null),
      900,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const updateFilters = (next) => {
    // Une nouvelle catégorie choisie manuellement (pas la synchro d'URL au
    // montage) vaut la peine d'être retenue pour les suggestions.
    if (next.categorie && next.categorie !== filters.categorie) {
      // Nom lisible pour l'historique : sous-catégorie, catégorie principale
      // ou liste du site (sinon la pastille « récente » restait vide)
      const produitSous = produits.find((p) => p.categorie_slug === next.categorie);
      const produitRacine = produits.find((p) => p.categorie_racine_slug === next.categorie);
      const nomCategorie =
        produitSous?.categorie_nom ||
        produitRacine?.categorie_racine_nom ||
        findCategoryBySlug(next.categorie)?.name;
      enregistrer("", next.categorie, nomCategorie);
    }
    setFilters(next);
    const params = {};
    if (next.categorie) params.categorie = next.categorie;
    if (search) params.q = search;
    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    setFilters({
      categorie: "",
      typeOffre: "",
      etats: [],
      prixMin: "",
      prixMax: "",
    });
    setSearch("");
    setSearchParams({});
  };

  const selectionnerRecherche = (entree) => {
    setSearch(entree.terme || "");
    updateFilters({ ...filters, categorie: entree.categorieSlug || "" });
  };

  // Comptes par catégorie pour le panneau de filtres
  const counts = useMemo(() => {
    const c = { total: produits.length };
    produits.forEach((p) => {
      if (p.categorie_racine_slug)
        c[p.categorie_racine_slug] = (c[p.categorie_racine_slug] || 0) + 1;
    });
    return c;
  }, [produits]);

  // Mode "découverte" : on ne montre récentes/suggestions/tendances que
  // quand la personne n'a pas déjà lancé une recherche ou un filtre actif,
  // pour ne pas polluer des résultats qu'elle a explicitement demandés.
  const modeDecouverte =
    !search.trim() &&
    !filters.categorie &&
    !filters.typeOffre &&
    filters.etats.length === 0 &&
    !searchParams.get("occasion") &&
    !searchParams.get("rayon") &&
    searchParams.get("bonne_affaire") !== "true";

  // Rayon choisi depuis la section « Bonnes affaires » de l'accueil
  const rayon = trouverRayon(searchParams.get("rayon"));

  const produitsFiltres = useMemo(() => {
    let list = [...produits];

    if (filters.categorie) {
      list = list.filter(
        (p) =>
          p.categorie_racine_slug === filters.categorie ||
          p.categorie_slug === filters.categorie,
      );
    }
    const occasion = searchParams.get("occasion");
    if (occasion) {
      list =
        occasion === "toutes"
          ? list.filter((p) => p.categorie_tags_occasion)
          : list.filter((p) =>
              (p.categorie_tags_occasion || "").split(",").includes(occasion),
            );
    }
    if (searchParams.get("bonne_affaire") === "true") {
      list = list.filter((p) => p.bonne_affaire);
    }
    if (rayon) {
      list = list.filter((p) => rayon.sousCategories.includes(p.categorie_nom));
    }
    if (filters.typeOffre) {
      list = list.filter((p) => p.type_offre === filters.typeOffre);
    }
    if (filters.etats.length > 0) {
      list = list.filter((p) => filters.etats.includes(p.etat));
    }
    if (filters.prixMin) {
      list = list.filter(
        (p) => Number(p.prix_final_public) >= Number(filters.prixMin),
      );
    }
    if (filters.prixMax) {
      list = list.filter(
        (p) => Number(p.prix_final_public) <= Number(filters.prixMax),
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.titre.toLowerCase().includes(q));
    }

    if (tri === "prix_asc")
      list.sort((a, b) => a.prix_final_public - b.prix_final_public);
    else if (tri === "prix_desc")
      list.sort((a, b) => b.prix_final_public - a.prix_final_public);
    else list.sort((a, b) => b.id - a.id); // plus récents = id décroissant

    // En mode découverte, on ne réaffiche jamais dans "Tout le catalogue"
    // un article déjà montré juste au-dessus (tendances / suggestions).
    if (modeDecouverte && idsDejaAffiches.size > 0) {
      list = list.filter((p) => !idsDejaAffiches.has(p.id));
    }

    return list;
  }, [
    produits,
    filters,
    search,
    tri,
    modeDecouverte,
    idsDejaAffiches,
    searchParams,
    rayon,
  ]);

  // Retour à la page 1 dès que les filtres, la recherche ou le tri changent
  useEffect(() => {
    setPage(1);
  }, [filters, search, tri, searchParams]);

  const totalPages = Math.max(1, Math.ceil(produitsFiltres.length / PAR_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const produitsPage = produitsFiltres.slice(
    (pageCourante - 1) * PAR_PAGE,
    pageCourante * PAR_PAGE,
  );
  const nbArticlesAffiche = modeDecouverte ? produits.length : produitsFiltres.length;

  const changerPage = (n) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Layout>
      <BoutiqueBanner categorieSlug={filters.categorie} />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* FILTRES — colonne fixe sur desktop, panneau dépliable sur mobile */}
          <div className="lg:w-64 shrink-0">
            <button
              type="button"
              onClick={() => setFiltresOuverts((o) => !o)}
              className="lg:hidden w-full flex items-center justify-between px-4 py-3 border border-line rounded-btn text-sm font-semibold mb-4 transition-colors hover:border-teal"
            >
              Filtres
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`h-4 w-4 transition-transform duration-300 ${filtresOuverts ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div className={`${filtresOuverts ? "block" : "hidden"} lg:block`}>
              <FilterSidebar
                filters={filters}
                onChange={updateFilters}
                counts={counts}
                onReset={resetFilters}
              />
            </div>
          </div>

          {/* GRILLE PRODUITS */}
          <div className="flex-1 min-w-0">
            {/* Barre recherche + tri */}
            <Reveal className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-7">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un article..."
                className="w-full sm:max-w-xs px-4 py-2.5 bg-cream border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors"
              />
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-ink-soft/75 whitespace-nowrap">
                  {nbArticlesAffiche} article
                  {nbArticlesAffiche !== 1 ? "s" : ""}
                </span>
                <select
                  value={tri}
                  onChange={(e) => setTri(e.target.value)}
                  className="px-3 py-2.5 bg-cream border border-line rounded-btn text-[13px] focus:outline-none focus:border-teal transition-colors"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </Reveal>

            {/* Filtre actif venant de l'accueil (bonnes affaires, rayon, occasion) */}
            {(rayon || searchParams.get("bonne_affaire") === "true" || searchParams.get("occasion")) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink text-white text-[12.5px] font-semibold px-3.5 py-1.5">
                  {[
                    searchParams.get("bonne_affaire") === "true" && "Bonnes affaires",
                    searchParams.get("occasion") && "Occasions spéciales",
                    rayon?.nom,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[12.5px] font-semibold text-ink underline underline-offset-2 hover:text-clay-dark py-1"
                >
                  Voir tous les articles
                </button>
              </div>
            )}

            {erreur && (
              <div className="p-4 mb-6 text-sm bg-red-50 text-red-600 rounded-btn border border-red-100">
                {erreur}
              </div>
            )}

            {!chargement && modeDecouverte && (
              <Decouverte
                produits={produits}
                recentes={recentes}
                frequentes={frequentes}
                onEffacerHistorique={effacer}
                onSelectionnerRecherche={selectionnerRecherche}
                onIdsAffiches={setIdsDejaAffiches}
              />
            )}

            {chargement ? (
              <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-[20px] bg-line/40 animate-pulse"
                    aria-hidden="true"
                  />
                ))}
              </div>
            ) : produitsFiltres.length === 0 && modeDecouverte && produits.length > 0 ? (
              // Tout le catalogue est déjà montré dans les rangées découverte
              // au-dessus (petit catalogue) — pas besoin de répéter un état
              // vide trompeur ici.
              null
            ) : produitsFiltres.length === 0 ? (
              <Reveal>
                <EtatVide
                  icone="recherche"
                  titre="Aucun article pour le moment"
                  texte="Rien ici pour l'instant… Soyez la première à publier dans cette catégorie, ou revenez bientôt !"
                  action={
                    <a
                      href="/vendeuse/ajouter-produit"
                      className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 bg-clay-dark text-white rounded-full text-sm font-bold hover:bg-ink transition-colors"
                    >
                      Publier un article
                    </a>
                  }
                />
              </Reveal>
            ) : (
              <div>
                {modeDecouverte &&
                  (recentes.length > 0 || frequentes.length > 0) && (
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/75 mb-3.5">
                      Tout le catalogue
                    </h3>
                  )}
                <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                  {produitsPage.map((produit, i) => (
                    <ProductCard key={produit.id} produit={produit} index={i} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav
                    className="flex flex-wrap items-center justify-center gap-1.5 mt-10"
                    aria-label="Pagination"
                  >
                    <button
                      type="button"
                      onClick={() => changerPage(Math.max(1, pageCourante - 1))}
                      disabled={pageCourante === 1}
                      className="min-h-[40px] px-4 py-2 rounded-full text-[13px] font-semibold border border-line text-ink-soft disabled:opacity-40 enabled:hover:border-teal enabled:hover:text-teal-dark transition-colors"
                    >
                      Précédent
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => changerPage(n)}
                        aria-current={n === pageCourante ? "page" : undefined}
                        className={`h-10 w-10 rounded-full text-[13px] font-bold transition-colors ${
                          n === pageCourante
                            ? "bg-ink text-white"
                            : "text-ink-soft hover:bg-line/40"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => changerPage(Math.min(totalPages, pageCourante + 1))}
                      disabled={pageCourante === totalPages}
                      className="min-h-[40px] px-4 py-2 rounded-full text-[13px] font-semibold border border-line text-ink-soft disabled:opacity-40 enabled:hover:border-teal enabled:hover:text-teal-dark transition-colors"
                    >
                      Suivant
                    </button>
                  </nav>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}