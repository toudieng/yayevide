// frontend/src/pages/BoutiqueVendeuse.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Reveal from "../components/ui/Reveal";
import ProductCard from "../components/boutique/ProductCard";
import { apiFetch } from "../utils/api";

function Stars({ note }) {
  return (
    <span className="text-clay text-sm">
      {"★".repeat(Math.round(note))}
      <span className="text-line">{"★".repeat(5 - Math.round(note))}</span>
    </span>
  );
}

function AjouterAvisForm({ slug, onAjoute }) {
  const [connecte, setConnecte] = useState(null); // null = vérification en cours
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    apiFetch("/moi/")
      .then((res) => setConnecte(res.ok))
      .catch(() => setConnecte(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur(null);
    try {
      const res = await apiFetch(`/boutiques/${slug}/avis/`, {
        method: "POST",
        body: { note, commentaire },
      });
      const data = await res.json();
      if (res.ok) {
        onAjoute(data);
        setCommentaire("");
      } else {
        setErreur(Object.values(data).flat().join(" "));
      }
    } catch {
      setErreur("Impossible de joindre le serveur.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  if (connecte === null) return null;

  if (!connecte) {
    return (
      <p className="text-[13px] text-ink-soft/75 bg-cream border border-line rounded-btn px-5 py-4">
        <Link
          to="/connexion"
          className="text-teal-dark font-semibold hover:underline"
        >
          Connectez-vous
        </Link>{" "}
        pour laisser un avis sur cette boutique.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-cream border border-line rounded-m p-6 space-y-4"
    >
      <h4 className="font-serif text-base text-ink">Laisser un avis</h4>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNote(n)}
            className={`text-2xl transition-colors ${n <= note ? "text-clay" : "text-line hover:text-clay/50"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
        placeholder="Votre expérience avec cette vendeuse..."
        className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors resize-none"
      />
      {erreur && <p className="text-[12.5px] text-red-500">{erreur}</p>}
      <button
        type="submit"
        disabled={envoiEnCours}
        className="px-6 py-2.5 bg-ink text-cream rounded-btn text-[12.5px] font-bold uppercase tracking-wide hover:bg-teal transition-colors disabled:opacity-60"
      >
        {envoiEnCours ? "Envoi..." : "Publier mon avis"}
      </button>
    </form>
  );
}

const PAR_PAGE = 12;

export default function BoutiqueVendeuse() {
  const { slug } = useParams();
  const [boutique, setBoutique] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [tab, setTab] = useState("produits");
  const [page, setPage] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- se redéclenche à chaque changement de boutique (slug), pas seulement au montage
    setChargement(true);
    apiFetch(`/boutiques/${slug}/`)
      .then((res) => {
        if (!res.ok) throw new Error("Introuvable");
        return res.json();
      })
      .then(setBoutique)
      .catch(() => setErreur("Cette boutique n'existe pas ou plus."))
      .finally(() => setChargement(false));
    setPage(1);
  }, [slug]);

  if (chargement) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
        </div>
      </Layout>
    );
  }

  if (erreur || !boutique) {
    return (
      <Layout>
        <div className="max-w-[600px] mx-auto px-6 py-24 text-center">
          <p className="font-serif text-2xl text-ink mb-3">
            {erreur || "Boutique introuvable"}
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

  const anneeCreation = new Date(boutique.date_creation).getFullYear();

  const totalPages = Math.max(1, Math.ceil(boutique.produits.length / PAR_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const produitsPage = boutique.produits.slice(
    (pageCourante - 1) * PAR_PAGE,
    pageCourante * PAR_PAGE,
  );
  const changerPage = (n) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Layout>
      {/* BANNIÈRE — image de fond avec voile de marque, plus de peps qu'un simple dégradé */}
      <div className="relative h-44 sm:h-56 bg-ink overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1522771930-78848d9293e8?fm=jpg&q=80&w=1600&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "linear-gradient(120deg, var(--color-teal) 0%, transparent 55%, var(--color-clay) 100%)",
            mixBlendMode: "multiply",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
      </div>

      <Reveal className="max-w-[1100px] mx-auto px-6 md:px-12">
        {/* CARTE PROFIL — chevauche la bannière */}
        <div className="-mt-12 sm:-mt-14 bg-cream border border-line rounded-m p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end gap-5 shadow-sm">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-teal border-4 border-cream shadow-md flex items-center justify-center text-cream font-serif text-3xl font-bold shrink-0">
            {boutique.nom_boutique.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="font-serif text-2xl text-ink">
              {boutique.nom_boutique}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {boutique.nb_avis > 0 ? (
                <span className="flex items-center gap-1.5 text-[13px] text-ink-soft/75">
                  <Stars note={boutique.note_moyenne} /> {boutique.note_moyenne}{" "}
                  ({boutique.nb_avis} avis)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[13px] text-ink-soft/75">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M12 2l2.6 6.9L22 9.3l-5.6 4.7L18.2 22 12 17.8 5.8 22l1.8-8-5.6-4.7 7.4-.4z" />
                  </svg>
                  Pas encore d'avis
                </span>
              )}
              {boutique.zone_nom && (
                <>
                  <span className="text-line">•</span>
                  <span className="flex items-center gap-1.5 text-[13px] text-ink-soft/75">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-3.5 w-3.5"
                    >
                      <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {boutique.zone_nom}
                  </span>
                </>
              )}
              <span className="text-line">•</span>
              <span className="text-[13px] text-ink-soft/75">
                Membre depuis {anneeCreation}
              </span>
              <span className="text-line">•</span>
              <span className="text-[13px] text-ink-soft/75">
                {boutique.produits.length} article
                {boutique.produits.length !== 1 ? "s" : ""}
              </span>
              <span className="text-line">•</span>
              <span className="text-[13px] text-ink-soft/75">
                {boutique.nb_ventes} vente{boutique.nb_ventes !== 1 ? "s" : ""}
              </span>
            </div>
            {boutique.description && (
              <p className="text-[13.5px] text-ink-soft/75 mt-3 max-w-xl leading-relaxed">
                {boutique.description}
              </p>
            )}
          </div>
        </div>

        {/* ONGLETS */}
        <div className="mt-10 flex gap-7 border-b border-line">
          {[
            { id: "produits", label: `Produits (${boutique.produits.length})` },
            { id: "avis", label: `Avis (${boutique.nb_avis})` },
            { id: "apropos", label: "À propos" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`pb-3.5 text-[13.5px] font-semibold transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "text-teal-dark border-teal"
                  : "text-ink-soft/75 border-transparent hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "produits" && (
          <div className="mt-8 pb-16">
            {boutique.produits.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-line rounded-m">
                <p className="text-ink-soft/75 text-sm">
                  Aucun article disponible pour le moment.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(0,190px))] gap-4">
                  {produitsPage.map((p, i) => (
                    <ProductCard key={p.id} produit={p} index={i} />
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
                      className="px-3.5 py-2 rounded-full text-[13px] font-semibold border border-line text-ink-soft disabled:opacity-40 hover:border-teal hover:text-teal-dark transition-colors"
                    >
                      Précédent
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => changerPage(n)}
                        className={`h-9 w-9 rounded-full text-[13px] font-bold transition-colors ${
                          n === pageCourante
                            ? "bg-ink text-white"
                            : "text-ink-soft hover:bg-sable"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => changerPage(Math.min(totalPages, pageCourante + 1))}
                      disabled={pageCourante === totalPages}
                      className="px-3.5 py-2 rounded-full text-[13px] font-semibold border border-line text-ink-soft disabled:opacity-40 hover:border-teal hover:text-teal-dark transition-colors"
                    >
                      Suivant
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        )}

        {tab === "avis" && (
          <div className="mt-8 pb-16">
            {boutique.avis.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {boutique.avis.map((a) => (
                  <div
                    key={a.id}
                    className="bg-cream border border-line rounded-m p-5"
                  >
                    <Stars note={a.note} />
                    {a.commentaire && (
                      <p className="text-[13.5px] text-ink mt-2.5 leading-relaxed">
                        « {a.commentaire} »
                      </p>
                    )}
                    <p className="text-[12px] text-ink-soft/75 mt-3">
                      {a.auteur_nom}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <AjouterAvisForm
              slug={slug}
              onAjoute={(nouvelAvis) =>
                setBoutique((b) => ({
                  ...b,
                  avis: [
                    nouvelAvis,
                    ...b.avis.filter(
                      (a) => a.auteur_nom !== nouvelAvis.auteur_nom,
                    ),
                  ],
                  nb_avis: b.avis.some(
                    (a) => a.auteur_nom === nouvelAvis.auteur_nom,
                  )
                    ? b.nb_avis
                    : b.nb_avis + 1,
                }))
              }
            />
          </div>
        )}

        {tab === "apropos" && (
          <div className="mt-8 pb-16 max-w-2xl">
            <p className="text-[14px] text-ink-soft leading-relaxed">
              {boutique.description ||
                "Cette vendeuse n'a pas encore ajouté de description."}
            </p>
            <div className="mt-6 flex items-center gap-2 text-[13px] text-ink-soft/75">
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
              Membre depuis {anneeCreation}
            </div>
          </div>
        )}
      </Reveal>
    </Layout>
  );
}