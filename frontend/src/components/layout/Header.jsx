import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../ui/Logo";
import { useCart } from "../../context/CartContext";
import { apiFetch } from "../../utils/api";
import { useMessagesNonLus } from "../../hooks/useMessagesNonLus";

const NAV_LINKS = [
  { label: "Accueil", to: "/" },
  { label: "Catégories", to: "/#categories" },
  { label: "E-book", to: "/ebook" },
  { label: "Blog", to: "/blog" },
];

export default function Header() {
  const navigate = useNavigate();
  const { count: cartCount, subtotal } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [moi, setMoi] = useState(null);
  const [compteOuvert, setCompteOuvert] = useState(false);
  const compteRef = useRef(null);
  const nbMessagesNonLus = useMessagesNonLus(Boolean(moi));

  useEffect(() => {
    apiFetch("/moi/")
      .then((res) => (res.ok ? res.json() : null))
      .then(setMoi)
      .catch(() => setMoi(null));
  }, []);

  // Ferme le menu si on clique en dehors
  useEffect(() => {
    const onClickDehors = (e) => {
      if (compteRef.current && !compteRef.current.contains(e.target)) {
        setCompteOuvert(false);
      }
    };
    document.addEventListener("mousedown", onClickDehors);
    return () => document.removeEventListener("mousedown", onClickDehors);
  }, []);

  const seDeconnecter = async () => {
    setCompteOuvert(false);
    await apiFetch("/deconnexion/", { method: "POST" }).catch(() => {});
    setMoi(null);
    navigate("/");
  };

  const lienCompteRole = () => {
    if (!moi) return "/mon-compte";
    if (moi.role === "vendeur") return "/dashboard";
    if (moi.role === "admin") return "/admin";
    if (moi.role === "livreur") return "/livreur";
    return "/mon-compte";
  };

  const submitSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/boutique?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-sable border-b transition-shadow ${
        scrolled
          ? "border-line shadow-[0_6px_24px_-16px_rgba(0,0,0,0.25)]"
          : "border-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 flex h-20 items-center justify-between gap-8">
        <Link to="/" className="shrink-0 flex items-center">
          <Logo className="h-11 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-9">
          <Link
            to="/"
            className="relative py-1.5 text-sm font-bold text-ink after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-clay after:transition-all hover:after:w-full"
            style={{ fontFamily: "var(--font-rounded)" }}
          >
            Accueil
          </Link>
          <Link
            to="/#categories"
            className="relative py-1.5 text-sm font-bold text-ink after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-clay after:transition-all hover:after:w-full"
            style={{ fontFamily: "var(--font-rounded)" }}
          >
            Catégories
          </Link>
          <Link
            to="/vendeuse/ajouter-produit"
            className="bg-teal hover:bg-teal-dark text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5 shadow-sm"
            style={{ fontFamily: "var(--font-rounded)" }}
          >
            Vendre / Louer
          </Link>
          <Link
            to="/blog"
            className="relative py-1.5 text-sm font-bold text-ink after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-clay after:transition-all hover:after:w-full"
            style={{ fontFamily: "var(--font-rounded)" }}
          >
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <form
            onSubmit={submitSearch}
            className={`hidden sm:flex items-center h-9.5 rounded-full pl-1 transition-all ${
              searchOpen ? "pr-1" : ""
            }`}
          >
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Rechercher un article..."
              className={`bg-transparent text-sm outline-none transition-all ${
                searchOpen ? "w-44 px-3 py-2" : "w-0 px-0"
              }`}
            />
            <button
              type={searchOpen && searchValue ? "submit" : "button"}
              aria-label="Rechercher"
              onClick={(e) => {
                if (!searchOpen) {
                  e.preventDefault();
                  setSearchOpen(true);
                }
              }}
              className="h-8.5 w-8.5 shrink-0 flex items-center justify-center rounded-full text-ink"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.2" y2="16.2" />
              </svg>
            </button>
          </form>

          <div ref={compteRef} className="relative">
            <button
              type="button"
              onClick={() =>
                moi ? setCompteOuvert((o) => !o) : navigate("/connexion")
              }
              aria-label="Mon compte"
              className="h-9.5 w-9.5 flex items-center justify-center rounded-btn text-ink hover:text-teal-dark hover:-translate-y-0.5 transition-all"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-5 w-5"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
              </svg>
            </button>

            {compteOuvert && moi && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-line rounded-m shadow-lg py-2 z-50 animate-fade-in">
                <div className="px-4 py-2.5 border-b border-line mb-1">
                  <p className="text-sm font-bold text-ink truncate">
                    {moi.first_name || moi.username}
                  </p>
                  <p className="text-[11.5px] text-ink-soft/75 truncate">
                    {moi.username}
                  </p>
                </div>

                {moi.role === "acheteur" && (
                  <>
                    <Link
                      to="/mon-compte"
                      onClick={() => setCompteOuvert(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-ink hover:bg-sable transition-colors"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className="h-4 w-4 text-ink-soft/75"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
                      </svg>
                      Mon compte
                    </Link>
                    <Link
                      to="/mon-compte"
                      onClick={() => setCompteOuvert(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-ink hover:bg-sable transition-colors"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className="h-4 w-4 text-ink-soft/75"
                      >
                        <rect x="3" y="7" width="18" height="14" rx="2" />
                        <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                      Mes commandes
                    </Link>
                  </>
                )}

                {moi.role !== "acheteur" && (
                  <Link
                    to={lienCompteRole()}
                    onClick={() => setCompteOuvert(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-ink hover:bg-sable transition-colors"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-4 w-4 text-ink-soft/75"
                    >
                      <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z" />
                    </svg>
                    Mon tableau de bord
                  </Link>
                )}

                <div className="border-t border-line mt-1 pt-1">
                  <button
                    type="button"
                    onClick={seDeconnecter}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-4 w-4"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messagerie : entre le compte et le panier */}
          <Link
            to="/messages"
            onClick={(e) => {
              if (!moi) {
                e.preventDefault();
                navigate("/connexion", { state: { from: "/messages" } });
              }
            }}
            aria-label={nbMessagesNonLus > 0 ? `Messages, ${nbMessagesNonLus} non lu${nbMessagesNonLus > 1 ? "s" : ""}` : "Messages"}
            className="relative h-9.5 w-9.5 flex items-center justify-center rounded-btn text-ink hover:text-teal-dark hover:-translate-y-0.5 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" />
              <path d="M8.5 11h7M8.5 14h4" />
            </svg>
            {nbMessagesNonLus > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-teal-dark text-[10px] font-bold text-white flex items-center justify-center">
                {nbMessagesNonLus > 9 ? "9+" : nbMessagesNonLus}
              </span>
            )}
          </Link>

          <Link
            to="/panier"
            aria-label="Panier"
            className="relative flex items-center gap-2 text-ink hover:text-teal-dark hover:-translate-y-0.5 transition-all"
          >
            <span className="relative h-9.5 w-9.5 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-5 w-5"
              >
                <path d="M3 4h2l2.4 12.2A2 2 0 0 0 9.4 18H18a2 2 0 0 0 2-1.6L21.5 8H6" />
                <circle cx="9.5" cy="21" r="1.2" />
                <circle cx="17.5" cy="21" r="1.2" />
              </svg>
              {cartCount > 0 && (
                <span
                  key={cartCount}
                  className="absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-clay-dark text-[10px] font-bold text-white flex items-center justify-center animate-price-pop"
                >
                  {cartCount}
                </span>
              )}
            </span>
            {subtotal > 0 && (
              <span
                className="hidden sm:inline text-sm font-bold text-ink"
                style={{ fontFamily: "var(--font-rounded)" }}
              >
                {Math.round(subtotal).toLocaleString("fr-FR")} FCFA
              </span>
            )}
          </Link>

          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMobileOpen((o) => !o)}
            className="lg:hidden h-9.5 w-9.5 flex items-center justify-center rounded-btn text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-5 w-5"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-line bg-sable flex flex-col">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="px-6 py-4 border-b border-line text-[15px] font-medium"
            >
              {link.label}
            </Link>
          ))}
          <div className="px-6 py-4 border-b border-line">
            <Link
              to="/vendeuse/ajouter-produit"
              onClick={() => setMobileOpen(false)}
              className="inline-block bg-clay-dark text-white text-sm font-bold px-5 py-2.5 rounded-full"
            >
              Vendre / Louer
            </Link>
          </div>
          {moi && (
            <Link
              to="/messages"
              onClick={() => setMobileOpen(false)}
              className="px-6 py-4 text-[15px] font-medium border-b border-line flex items-center justify-between"
            >
              Messages
              {nbMessagesNonLus > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-teal-dark text-[11px] font-bold text-white flex items-center justify-center">
                  {nbMessagesNonLus}
                </span>
              )}
            </Link>
          )}
          <Link
            to={moi ? lienCompteRole() : "/connexion"}
            onClick={() => setMobileOpen(false)}
            className="px-6 py-4 text-[15px] font-medium border-b border-line"
          >
            {moi ? moi.first_name || moi.username : "Mon compte"}
          </Link>
          {moi && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                seDeconnecter();
              }}
              className="px-6 py-4 text-[15px] font-medium text-red-500 text-left"
            >
              Se déconnecter
            </button>
          )}
        </div>
      )}
    </header>
  );
}
