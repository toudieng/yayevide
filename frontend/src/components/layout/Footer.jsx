import { Link } from "react-router-dom";
import { CATEGORIES } from "../../data/categories";

const SOCIALS = [
  {
    label: "Facebook",
    path: "M14 9h3V6h-3a4 4 0 0 0-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2a1 1 0 0 1 1-1z",
  },
  { label: "Instagram", rect: true },
  { label: "WhatsApp", path: "M5 19l1.4-3.6A8 8 0 1 1 9.6 19L5 19z" },
];

// Toutes les vraies catégories du site ; les vitrines automatiques
// (« Occasions spéciales », « Bonnes affaires », repérées par leur `href`)
// ne sont pas des catégories et restent hors du pied de page.
const FOOTER_CATEGORIES = CATEGORIES.filter((c) => !c.href);

const COLUMNS = [
  {
    title: "Assistance",
    links: [
      { label: "À propos", to: "/a-propos" },
      { label: "Comment acheter ?", to: "/comment-acheter" },
      { label: "E-book", to: "/ebook" },
      { label: "Comment vendre ?", to: "/comment-vendre" },
      { label: "Comment louer ?", to: "/comment-louer" },
      {
        label: "Comment mettre en location ?",
        to: "/comment-mettre-en-location",
      },
      { label: "FAQ", to: "/faq-centre-daide" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Informations légales",
    links: [
      {
        label: "Conditions générales de vente",
        to: "/conditions-generales-de-vente",
      },
      {
        label: "Politique de confidentialité",
        to: "/politique-de-confidentialite",
      },
      {
        label: "Politique de vente & plaintes",
        to: "/politique-de-retour-et-remboursement",
      },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-night text-sable/65 pt-20">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12 pb-14">
          <div>
            <div className="flex items-center gap-2.5 mb-4.5">
              <span className="h-8 w-8 rounded-btn bg-cream text-ink flex items-center justify-center font-serif italic text-lg">
                Y
              </span>
              <span className="font-serif text-[19px] text-cream">
                Yaay <em className="italic text-clay">Vidé</em>
              </span>
            </div>
            <p className="text-[13.5px] leading-relaxed max-w-[280px] mb-5.5">
              La marketplace de confiance pour les familles sénégalaises.
              Achetez, vendez et louez en toute sécurité.
            </p>
            <div className="flex gap-2.5">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="h-8.5 w-8.5 flex items-center justify-center rounded-btn border border-white/25 hover:border-teal hover:-translate-y-0.5 transition-all"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-3.5 w-3.5"
                  >
                    {s.rect ? (
                      <>
                        <rect x="3" y="3" width="18" height="18" />
                        <circle cx="12" cy="12" r="4" />
                        <circle
                          cx="17.2"
                          cy="6.8"
                          r="0.6"
                          fill="currentColor"
                        />
                      </>
                    ) : (
                      <path d={s.path} />
                    )}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[12px] uppercase tracking-[0.08em] font-bold text-cream mb-4.5">
              Catégories
            </h4>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              {FOOTER_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  to={cat.href || `/boutique?categorie=${cat.slug}`}
                  className="hover:text-cream transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[12px] uppercase tracking-[0.08em] font-bold text-cream mb-4.5">
                {col.title}
              </h4>
              <div className="flex flex-col gap-2.5 text-[13.5px]">
                {col.links.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="hover:text-cream transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 py-5.5 flex flex-col md:flex-row md:justify-between gap-2.5 text-xs">
          <span>
            © 2026 Yaay Vidé. Tous droits réservés. Fait avec ♥ par{" "}
            <a
              href="https://myportfolio-topaz-pi-81.vercel.app/fr"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline-offset-2 hover:text-white hover:underline transition-colors"
            >
              Astou DIENG
              <span className="sr-only"> (portfolio, nouvel onglet)</span>
            </a>{" "}
            au Sénégal.
          </span>
          <span>
            Paiements : Wave · Orange Money · Mixx by Yas · Espèces
          </span>
        </div>
      </div>
    </footer>
  );
}
