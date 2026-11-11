// frontend/src/pages/auth/LoginPage.jsx
import Connexion from "./Connexion";
import clientImg from "../../assets/client.webp";

export default function LoginPage({ onLoginSuccess }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-sable">

      {/* CÔTÉ GAUCHE : FORMULAIRE DE CONNEXION */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Connexion onLoginSuccess={onLoginSuccess} />
        </div>
      </div>

      {/* CÔTÉ DROIT : VISUEL DE MARQUE AVEC TEXTE SUPERPOSÉ */}
      <div className="hidden lg:block relative">
        <img
          src={clientImg}
          alt="Yaay Vidé Univers Enfant"
          className="w-full h-full object-cover"
        />
        {/* Voile sombre léger pour garantir que le texte clair reste parfaitement lisible */}
        <div className="absolute inset-0 bg-ink/25" />

        {/* Trois blocs répartis sur toute la hauteur via justify-between :
            le badge "pépites" se retrouve mathématiquement à mi-chemin
            entre le wordmark et le bloc de texte du bas (écarts égaux),
            et ce dernier remonte tout seul si son contenu est haut. */}
        <div className="absolute inset-0 flex flex-col justify-between p-14 lg:p-16 text-cream">

          {/* Wordmark — cœur plein en avant, texte après */}
          <div className="flex items-center gap-2.5 drop-shadow-sm">
            <span className="h-9 w-9 rounded-btn bg-orange flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="white" className="h-4.5 w-4.5">
                <path d="M12 21s-6.7-4.35-9.3-8.1C1 10.3 1.6 6.9 4.4 5.4 6.5 4.3 9 5 12 8c3-3 5.5-3.7 7.6-2.6 2.8 1.5 3.4 4.9 1.7 7.5C18.7 16.65 12 21 12 21z" />
              </svg>
            </span>
            <span className="font-serif text-2xl font-bold">Yaay Vidé</span>
          </div>

          {/* Badge transparent, positionné par le flex — plus de fond opaque */}
          <div>
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-cream text-[12px] font-bold px-3.5 py-1.5 rounded-full w-fit shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3 w-3">
                <path d="M5 12l4.5 4.5L19 7" />
              </svg>
              Des pépites certifiées pour vos trésors
            </span>
          </div>

          {/* Texte de la maquette validée — police Poppins extra-bold pour
              un rendu plus percutant, comme demandé */}
          <div className="space-y-5">
            <h1 className="text-5xl xl:text-6xl font-impact font-extrabold leading-tight drop-shadow-sm">
              Le meilleur de la seconde main pour bébé.
            </h1>
            <p className="text-base text-cream/90 max-w-md leading-relaxed drop-shadow-sm">
              Économisez jusqu'à 70% sur les plus grandes marques tout en offrant une seconde vie aux vêtements et jouets.
            </p>
            <div className="flex items-center gap-5 pt-2 text-cream/90">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-orange">
                  <path d="M12 2l2.6 6.9L22 9.3l-5.6 4.7L18.2 22 12 17.8 5.8 22l1.8-8-5.6-4.7 7.4-.4z" />
                </svg>
                4,9/5 sur 2 300+ avis
              </span>
              <span className="h-1 w-1 rounded-full bg-cream/50" />
              <span className="text-sm font-semibold">Livraison 24-48h à Dakar</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
