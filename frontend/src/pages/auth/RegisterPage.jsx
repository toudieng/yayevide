// frontend/src/pages/auth/RegisterPage.jsx
// Mise en page deux-colonnes (formulaire + visuel), exactement comme LoginPage.jsx
// avec Connexion.jsx. Le rôle est géré ici car le panneau de droite en dépend.
import { useState } from "react";
import Logo from "../../components/ui/Logo";
import Inscription from "./Inscription";
import vendeuseImg from "../../assets/vendeuse.webp";

const PANELS = {
  acheteuse: {
    badge: "Des pépites certifiées pour vos trésors",
    title: "Le meilleur de la seconde main pour bébé.",
    subtitle: "Rejoignez des milliers de familles qui achètent et économisent en toute confiance sur Yaay Vidé.",
    points: [
      { titre: "Accès aux ventes flash", detail: "Des trouvailles à petit prix, souvent à -70%, avant tout le monde." },
      { titre: "Paiement sécurisé", detail: "Wave, Orange Money ou carte bancaire, protégé de bout en bout." },
      { titre: "Suivi de commande", detail: "Vous savez toujours où en est votre colis, en temps réel." },
    ],
    tint: "from-teal/55 via-ink/55 to-ink/70",
  },
  vendeuse: {
    badge: "Déjà 15 000 pépites vendues sur Yaay Vidé",
    title: "Donnez une seconde vie aux trésors de vos enfants.",
    subtitle: "Rejoignez la communauté de vendeuses et loueuses Yaay Vidé et transformez vos articles en opportunités pour d'autres familles.",
    points: [
      { titre: "Vente simplifiée", detail: "Listez vos articles en quelques clics, directement depuis votre mobile." },
      { titre: "Paiement garanti", detail: "Recevez vos gains directement sur votre portefeuille mobile, sans attendre." },
      { titre: "Logistique gérée", detail: "Nous nous occupons de la récupération et de la livraison chez l'acheteuse." },
    ],
    tint: "from-orange/55 via-ink/55 to-ink/70",
  },
};

export default function RegisterPage() {
  const [role, setRole] = useState("acheteuse");
  const panel = PANELS[role];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-sable">

      {/* CÔTÉ GAUCHE : FORMULAIRE D'INSCRIPTION */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center flex flex-col items-center">
            <Logo className="h-14 w-auto mb-6" />
            <h2 className="text-2xl font-serif italic font-bold text-ink tracking-tight">Créer un compte</h2>
            <p className="text-xs text-ink-soft/75 mt-1.5">Rejoignez la communauté Yaay Vidé dès aujourd'hui.</p>
          </div>

          <Inscription role={role} onRoleChange={setRole} />
        </div>
      </div>

      {/* CÔTÉ DROIT : VISUEL DE MARQUE — change selon le rôle sélectionné */}
      <div className="hidden lg:block relative overflow-hidden">
        <img
          src={vendeuseImg}
          alt="Yaay Vidé"
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-b ${panel.tint} transition-colors duration-500`} />

        {/* Trois blocs répartis sur toute la hauteur via justify-between —
            même logique que la page de connexion : le badge se retrouve à
            mi-chemin entre le wordmark et le bloc de texte, qui remonte de
            lui-même quand son contenu est haut (cas vendeuse, avec les
            puces). */}
        <div className="absolute inset-0 flex flex-col justify-between p-14 text-cream">

          {/* Wordmark — cœur plein en avant, texte après */}
          <div className="flex items-center gap-2.5 drop-shadow-sm">
            <span className="h-9 w-9 rounded-btn bg-orange flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="white" className="h-4.5 w-4.5">
                <path d="M12 21s-6.7-4.35-9.3-8.1C1 10.3 1.6 6.9 4.4 5.4 6.5 4.3 9 5 12 8c3-3 5.5-3.7 7.6-2.6 2.8 1.5 3.4 4.9 1.7 7.5C18.7 16.65 12 21 12 21z" />
              </svg>
            </span>
            <span className="font-serif text-2xl font-bold">Yaay Vidé</span>
          </div>

          {/* Badge transparent, positionné par le flex */}
          <div>
            <span key={`badge-${role}`} className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 text-cream text-[12px] font-bold px-3.5 py-1.5 rounded-full w-fit shadow-sm animate-fade-in">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3 w-3">
                <path d="M5 12l4.5 4.5L19 7" />
              </svg>
              {panel.badge}
            </span>
          </div>

          {/* Titre, sous-titre, puces et repères de confiance */}
          <div key={role} className="space-y-6 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-impact font-extrabold leading-tight drop-shadow-sm">
                {panel.title}
              </h1>
              <p className="text-[15px] text-cream/90 max-w-md leading-relaxed drop-shadow-sm">
                {panel.subtitle}
              </p>
            </div>

            <ul className="space-y-4">
              {panel.points.map((point) => (
                <li key={point.titre} className="flex items-start gap-3">
                  <span className="h-5.5 w-5.5 rounded-full bg-orange flex items-center justify-center shrink-0 mt-0.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="h-3 w-3 text-white">
                      <path d="M5 12l4.5 4.5L19 7" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-cream">{point.titre}</p>
                    <p className="text-[13.5px] text-cream/75 leading-snug">{point.detail}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-5 pt-5 border-t border-cream/20 text-cream/90">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-orange">
                  <path d="M12 2l2.6 6.9L22 9.3l-5.6 4.7L18.2 22 12 17.8 5.8 22l1.8-8-5.6-4.7 7.4-.4z" />
                </svg>
                4,9/5 sur 2 300+ avis
              </span>
              <span className="h-1 w-1 rounded-full bg-cream/50" />
              <span className="text-[13px] font-semibold">100% Sénégal 🇸🇳</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
