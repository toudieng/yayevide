// frontend/src/pages/auth/Inscription.jsx
// Le formulaire pur — pas de mise en page deux-colonnes ici (cf. RegisterPage.jsx),
// exactement comme Connexion.jsx contient le formulaire utilisé par LoginPage.jsx.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

function ChampMotDePasse({ label, name, value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="block text-[11px] font-bold text-ink mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name={name}
          required
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 pr-11 bg-cream border border-line rounded-xl focus:outline-none focus:border-teal focus:ring-4 focus:ring-teal/15 focus:bg-white text-sm transition-all"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft/75 hover:text-teal-dark transition-colors"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5.5 0-9.5-4.5-10.5-7 .58-1.47 2.02-3.6 4.13-5.19M9.9 4.24A10.6 10.6 0 0 1 12 4c5.5 0 9.5 4.5 10.5 7-.4 1.02-1.1 2.24-2.14 3.4M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              <path d="M1 1l22 22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
              <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Inscription({ role, onRoleChange }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    shopName: "", // Uniquement pour la vendeuse
    zoneBoutique: "", // Uniquement pour la vendeuse — facultatif
    notificationPreference: "email", // Uniquement pour la vendeuse
  });

  const [zones, setZones] = useState([]);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    apiFetch('/zones-livraison/')
      .then(async (res) => setZones(res.ok ? await res.json() : []))
      .catch(() => setZones([]));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (erreur) setErreur(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);

    if (formData.password !== formData.confirmPassword) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    // Sécurité format international pour le serializer (+221 pour le Sénégal par défaut)
    let formattedPhone = formData.phone.trim();
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('00')) {
        formattedPhone = '+' + formattedPhone.substring(2);
      } else {
        formattedPhone = '+221' + formattedPhone;
      }
    }

    try {
      // "Nom complet ou d'utilisateur" peut être un vrai nom ("Aminata Diop")
      // ou un pseudo sans espace — dans les deux cas on en tire un
      // prénom/nom du mieux qu'on peut, ça préremplira l'adresse au
      // checkout sans lui redemander la même info deux fois.
      const morceaux = formData.username.trim().split(/\s+/);
      const prenomDeduit = morceaux[0] || "";
      const nomDeduit = morceaux.slice(1).join(" ");

      const payload = {
        username: formData.username,
        email: formData.email,
        phone_number: formattedPhone,
        password: formData.password,
        role,
        nom_boutique: role === "vendeuse" ? formData.shopName : "",
        zone_boutique: role === "vendeuse" ? formData.zoneBoutique : "",
        notification_preference: role === "vendeuse" ? formData.notificationPreference : "email",
        first_name: prenomDeduit,
        last_name: nomDeduit,
      };

      const response = await apiFetch("/inscription/", { method: "POST", body: payload });

      const data = await response.json();

      if (response.ok) {
        if (role === "vendeuse") {
          navigate("/verification-compte", {
            state: { username: formData.username, token: data.whatsapp_token },
          });
        } else {
          navigate("/connexion");
        }
      } else {
        if (data.phone_number) {
          setErreur(data.phone_number[0]);
        } else if (data.username) {
          setErreur("Ce nom d'utilisateur est déjà utilisé.");
        } else if (data.email) {
          setErreur("Cette adresse e-mail est déjà utilisée.");
        } else {
          const errorMsg = data.general || Object.values(data).flat().join(" ") || "Données invalides.";
          setErreur(errorMsg);
        }
      }
    } catch {
      setErreur("Impossible de joindre le serveur. Vérifiez votre backend.");
    }
  };

  return (
    <>
      {/* SÉLECTION DU RÔLE EN TEXTE MINIMALISTE ET INTERACTIF */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center gap-4 text-sm font-medium tracking-wide select-none">
          <button
            type="button"
            onClick={() => onRoleChange("acheteuse")}
            className={`pb-1 transition-all duration-200 uppercase text-xs font-bold tracking-widest cursor-pointer ${
              role === "acheteuse"
                ? "text-teal-dark border-b-2 border-teal"
                : "text-ink-soft/75 hover:text-teal-dark hover:border-b-2 hover:border-teal/40"
            }`}
          >
            Acheteuse
          </button>

          <span className="text-line">|</span>

          <button
            type="button"
            onClick={() => onRoleChange("vendeuse")}
            className={`pb-1 transition-all duration-200 uppercase text-xs font-bold tracking-widest cursor-pointer ${
              role === "vendeuse"
                ? "text-orange border-b-2 border-orange"
                : "text-ink-soft/75 hover:text-orange hover:border-b-2 hover:border-orange/40"
            }`}
          >
            Vendeuse
          </button>
        </div>
      </div>

      {erreur && (
        <div className="mb-4 p-3 text-xs bg-red-50 text-red-600 rounded-xl border border-red-100 text-center font-medium">
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-ink mb-1.5">
            Nom complet ou d'utilisateur *
          </label>
          <input
            type="text"
            name="username"
            required
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-cream border border-line rounded-xl focus:outline-none focus:border-teal focus:ring-4 focus:ring-teal/15 focus:bg-white text-sm transition-all"
            placeholder="Ex: Aminata Diop"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ink mb-1.5">
            Adresse courriel *
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-cream border border-line rounded-xl focus:outline-none focus:border-teal focus:ring-4 focus:ring-teal/15 focus:bg-white text-sm transition-all text-ink"
            placeholder="Ex: aminata@example.com"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-ink mb-1.5">
            Numéro de téléphone *
          </label>
          <input
            type="text"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-cream border border-line rounded-xl focus:outline-none focus:border-teal focus:ring-4 focus:ring-teal/15 focus:bg-white text-sm transition-all"
            placeholder="Ex: 77XXXXXXX"
          />
        </div>

        {role === "vendeuse" && (
          <div>
            <label className="block text-[11px] font-bold text-ink mb-1.5">
              Nom de votre boutique *
            </label>
            <input
              type="text"
              name="shopName"
              required={role === "vendeuse"}
              value={formData.shopName}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-cream border border-line rounded-xl focus:outline-none focus:border-orange focus:ring-4 focus:ring-orange/15 focus:bg-white text-sm transition-all"
              placeholder="Ex: Les Trésors de Bébé"
            />
          </div>
        )}

        {role === "vendeuse" && (
          <div>
            <label className="block text-[11px] font-bold text-ink mb-1.5">
              Zone <span className="font-normal text-ink-soft/75">(facultatif — juste pour informer les acheteuses, pas votre adresse exacte)</span>
            </label>
            <select
              name="zoneBoutique"
              value={formData.zoneBoutique}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-cream border border-line rounded-xl focus:outline-none focus:border-orange focus:ring-4 focus:ring-orange/15 focus:bg-white text-sm transition-all"
            >
              <option value="">Non précisé</option>
              {zones.map((z) => (
                <option key={z.code} value={z.code}>{z.nom}</option>
              ))}
            </select>
          </div>
        )}

        {role === "vendeuse" && (
          <div>
            <label className="block text-[11px] font-bold text-ink mb-1.5">
              Comment vous prévenir d'une nouvelle commande ?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { value: "email", label: "Par email" },
                { value: "whatsapp", label: "Par WhatsApp" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, notificationPreference: opt.value })}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                    formData.notificationPreference === opt.value
                      ? "border-orange bg-orange/5 text-ink"
                      : "border-line text-ink-soft/75 hover:border-ink/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <ChampMotDePasse
          label="Mot de passe *"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
        />

        <ChampMotDePasse
          label="Confirmer le mot de passe *"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
        />

        <button
          type="submit"
          className={`w-full text-white font-medium py-3.5 rounded-xl text-sm transition-all shadow-md tracking-wide mt-6 ${
            role === "vendeuse" ? "bg-orange hover:bg-orange-dark" : "bg-teal hover:bg-teal-dark"
          }`}
        >
          S'inscrire en tant que {role}
        </button>
      </form>

      <p className="text-xs text-center text-ink-soft/75 mt-6">
        Déjà un compte ? <a href="/connexion" className="text-teal-dark font-semibold hover:underline">Se connecter</a>
      </p>
    </>
  );
}
