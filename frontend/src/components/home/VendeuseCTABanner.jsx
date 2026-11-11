// frontend/src/components/home/VendeuseCTABanner.jsx
import { Link } from "react-router-dom";
import bannerBg from "../../assets/cta-banner-bg.webp";

const POINTS = [
  {
    title: "Zéro frais d'inscription et de mise en ligne",
    tone: "bg-[#2563eb]/10 text-[#2563eb]",
    path: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
  {
    title: "Paiement sécurisé et garanti",
    tone: "bg-orange/10 text-clay-dark",
    path: "M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z M3 9h18 M15 15h2",
  },
  {
    title: "Gestion simplifiée de la livraison",
    tone: "bg-[#2563eb]/10 text-[#2563eb]",
    path: "M3 18v-6a2 2 0 012-2h9v8M14 10h4l3 3v5h-7v-8zM7 20a2 2 0 100-4 2 2 0 000 4zM17 20a2 2 0 100-4 2 2 0 000 4z",
  },
];

export default function VendeuseCTABanner() {
  return (
    <section className="py-6">
      <div className="relative overflow-hidden bg-[#eef4fb]">
        <img loading="lazy" decoding="async"
          src={bannerBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, #eef4fb 34%, rgba(238,244,251,0.85) 48%, rgba(238,244,251,0) 68%)",
          }}
        />

        {/* doodles décoratifs */}
        <div className="absolute top-6 left-6 grid grid-cols-4 gap-1.5 opacity-40">
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-teal" />
          ))}
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fb8502"
          strokeWidth="1.5"
          className="absolute top-16 right-[38%] h-8 w-8 opacity-50 hidden md:block"
        >
          <path d="M12 21s-6.7-4.35-9.3-8.1C1 10.3 1.6 6.9 4.4 5.4 6.5 4.3 9 5 12 8c3-3 5.5-3.7 7.6-2.6 2.8 1.5 3.4 4.9 1.7 7.5C18.7 16.65 12 21 12 21z" />
        </svg>
        <svg
          viewBox="0 0 60 90"
          fill="none"
          stroke="#2E8B8B"
          strokeWidth="1"
          className="absolute bottom-4 left-4 h-20 w-14 opacity-25 hidden md:block"
        >
          <path d="M30 5v80M30 20c10-8 20-6 22 2-8 6-16 4-22-2zM30 45c-10-8-20-6-22 2 8 6 16 4 22-2zM30 70c10-6 18-4 20 2-7 5-14 3-20-2z" />
        </svg>

        <div className="relative px-6 py-12 sm:px-12 sm:py-16 max-w-[640px]">
          <span className="inline-flex items-center gap-1.5 bg-orange/10 text-clay-dark text-[12px] font-bold px-4 py-2 rounded-full mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7M7.5 8a2.5 2.5 0 010-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 010 5" /></svg>
            Transformez votre activité !
          </span>
          <h2 className="font-impact font-extrabold text-[28px] sm:text-[38px] leading-[1.15] text-ink mb-5 text-balance">
            Vendez ou louez ce que vous n'utilisez plus et{" "}
            <span className="text-orange-dark">gagnez</span> en toute simplicité.
          </h2>
          <p className="text-ink-soft text-[15px] sm:text-[16px] leading-relaxed mb-8">
            Rejoignez des centaines de mamans qui font confiance à Yaay Vidé.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
            {POINTS.map((p) => (
              <div
                key={p.title}
                className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] px-4 py-5 text-center"
              >
                <span
                  className={`mx-auto h-10 w-10 rounded-full flex items-center justify-center mb-3 ${p.tone}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4.5 w-4.5"
                  >
                    <path d={p.path} />
                  </svg>
                </span>
                <p className="text-[12.5px] font-bold text-ink leading-snug">
                  {p.title}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <Link
              to="/vendeuse/ajouter-produit"
              className="flex items-center justify-center gap-2 h-[52px] bg-clay-dark hover:bg-ink text-white font-bold text-sm px-7 rounded-full w-full sm:w-auto transition-colors whitespace-nowrap"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              Commencer à vendre/louer
            </Link>
            <a
              href="tel:+221710189191"
              className="flex items-center justify-center gap-2 h-[52px] bg-white text-ink shadow-[0_6px_18px_-8px_rgba(27,36,48,0.22)] font-bold text-sm px-7 rounded-full w-full sm:w-auto hover:bg-[#2563eb]/5 transition-colors whitespace-nowrap"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="M3 5a2 2 0 012-2h3l2 5-2.5 1.5a11 11 0 005 5L14 12l5 2v3a2 2 0 01-2 2A16 16 0 013 5z" />
              </svg>
              Contactez-nous
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
