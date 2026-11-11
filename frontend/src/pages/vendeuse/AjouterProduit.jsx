// frontend/src/pages/vendeuse/AjouterProduit.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ShellVendeuse from "../../components/vendeuse/ShellVendeuse";
import { useVendeuseSession } from "../../hooks/useVendeuseSession";
import { apiFetch } from "../../utils/api";
import { SHADOW_CARD } from '../../utils/gradientCards';
import SqueletteTableau from '../../components/ui/SqueletteTableau';

const STEPS = ["Informations", "Photos", "Tarifs et disponibilités"];

const TAILLES_PAR_CATEGORIE = {
  "Maman & Maternité": [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "35",
    "36",
    "37",
    "38",
    "39",
    "40",
    "41",
    "42",
  ],
  "Bébé (0-3 ans)": [
    "Prématuré",
    "Naissance",
    "0-1 mois",
    "1-3 mois",
    "3-6 mois",
    "6-9 mois",
    "9-12 mois",
    "12-18 mois",
    "18-24 mois",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
  ],
  "Enfant (3-9 ans)": [
    "3 ans",
    "4 ans",
    "5 ans",
    "6 ans",
    "7 ans",
    "8 ans",
    "9 ans",
    "26",
    "27",
    "28",
    "29",
    "30",
    "31",
    "32",
  ],
  "Junior (10-15 ans)": [
    "10 ans",
    "11 ans",
    "12 ans",
    "13 ans",
    "14 ans",
    "15 ans",
    "16 ans",
    "33",
    "34",
    "35",
    "36",
    "37",
    "38",
  ],
};
const TAILLES_GENERIQUES = ["XS", "S", "M", "L", "XL", "XXL"];

const TAILLE_COLIS_LABELS = {
  s_m: "S / M — jusqu'à 2kg (1 500 FCFA)",
  l_xl: "L / XL — 2 à 3kg (2 000 FCFA)",
  xxl: "XXL — plus de 3kg (~3 000 FCFA)",
};

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString("fr-FR") + " FCFA";
}

export default function AjouterProduit() {
  const navigate = useNavigate();
  const { moi, chargementSession } = useVendeuseSession();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [eligibleLancement, setEligibleLancement] = useState(false);

  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    categoriePrincipale: "",
    categorie: "",
    etat: "excellent",
    taille: "",
    quantite_disponible: 1,
    taille_colis: "s_m",
    prix_vendeur: "",
    caution: "",
    type_offre: "vente",
    bonne_affaire: false,
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    apiFetch("/categories/")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() =>
        setErreur(
          "Impossible de charger les catégories. Vérifiez que Django est lancé.",
        ),
      );
  }, []);

  useEffect(() => {
    apiFetch("/moi/")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEligibleLancement(Boolean(data?.eligible_lancement)))
      .catch(() => setEligibleLancement(false));
  }, []);

  const isLocation = formData.type_offre === "location";
  const categoriePrincipaleObj = categories.find(
    (c) => String(c.id) === String(formData.categoriePrincipale),
  );
  const categorieNom = categoriePrincipaleObj?.nom;
  const sousCategorieNom = categoriePrincipaleObj?.sous_categories?.find(
    (s) => String(s.id) === String(formData.categorie),
  )?.nom;
  const tauxCommission = eligibleLancement ? 1.05 : 1.1;
  const prixAffiche = formData.prix_vendeur
    ? Math.round(Number(formData.prix_vendeur) * tauxCommission)
    : null;

  const handleZoneClick = () => fileInputRef.current.click();

  const addFiles = (fileList) => {
    const files = Array.from(fileList);
    if (images.length + files.length > 5) {
      alert("Vous pouvez ajouter jusqu'à 5 photos maximum.");
      return;
    }
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handleFileChange = (e) => addFiles(e.target.files);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);

    const data = new FormData();
    data.append("titre", formData.titre);
    data.append(
      "description",
      formData.description || "Aucune description fournie.",
    );
    data.append("categorie", formData.categorie);
    data.append("type_offre", formData.type_offre);
    data.append("etat", formData.etat);
    if (formData.taille) data.append("taille", formData.taille);
    data.append("quantite_disponible", formData.quantite_disponible || 1);
    data.append("taille_colis", formData.taille_colis);
    data.append("prix_vendeur", formData.prix_vendeur);
    data.append("bonne_affaire", formData.bonne_affaire);
    if (isLocation && formData.caution)
      data.append("caution", formData.caution);
    images.forEach((image) => data.append("images", image));

    try {
      const response = await apiFetch("/ajouter-produit/", {
        method: "POST",
        body: data,
      });
      const responseData = await response.json();
      if (response.ok) {
        navigate("/dashboard");
      } else {
        const details = Object.entries(responseData)
          .map(
            ([key, val]) =>
              `${key} : ${Array.isArray(val) ? val.join(", ") : val}`,
          )
          .join("\n");
        setErreur(details || "Le serveur a refusé l'annonce.");
      }
    } catch {
      setErreur(
        "Impossible de joindre le serveur. Vérifiez que Django est lancé.",
      );
    } finally {
      setEnvoiEnCours(false);
    }
  };

  if (chargementSession) {
    return (
      <SqueletteTableau />
    );
  }

  return (
    <ShellVendeuse
      active="ajouter"
      moi={moi}
      titre={isLocation ? "Ajouter à louer" : "Ajouter un article"}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-[13px] text-ink-soft/75 max-w-md">
          {isLocation
            ? "Préparez une annonce de location claire et encadrée."
            : "Créez une annonce claire et sécurisée pour vendre plus facilement."}
        </p>
        <button
          type="button"
          onClick={() =>
            setFormData({
              ...formData,
              type_offre: isLocation ? "vente" : "location",
            })
          }
          className="text-[12.5px] font-bold px-4 py-2 rounded-full border border-line text-ink-soft/75 hover:border-teal hover:text-teal-dark transition-colors whitespace-nowrap"
        >
          {isLocation ? "Passer à la vente" : "Passer à la location"}
        </button>
      </div>

      <div className="flex items-center gap-3">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const etatEtape =
            n < step ? "fait" : n === step ? "actif" : "a_venir";
          return (
            <div key={label} className="flex items-center gap-3 flex-1">
              <button
                type="button"
                onClick={() => n < step && setStep(n)}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-[12.5px] font-bold shrink-0 transition-colors ${
                  etatEtape === "fait"
                    ? "bg-teal text-white cursor-pointer"
                    : etatEtape === "actif"
                      ? "bg-ink text-white"
                      : "bg-line text-ink-soft/75"
                }`}
              >
                {etatEtape === "fait" ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M5 12l4.5 4.5L19 7" />
                  </svg>
                ) : (
                  n
                )}
              </button>
              <span
                className={`text-[12.5px] font-semibold hidden sm:block ${etatEtape === "a_venir" ? "text-ink-soft/75" : "text-ink"}`}
              >
                {label}
              </span>
              {n < STEPS.length && (
                <div
                  className={`h-px flex-1 ${n < step ? "bg-teal" : "bg-line"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {erreur && (
        <div className="p-4 text-xs bg-red-50 text-red-600 rounded-btn border border-red-100 whitespace-pre-line">
          {erreur}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start"
      >
        <div className={`bg-white rounded-m ${SHADOW_CARD} p-6 space-y-6`}>
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="font-serif text-lg text-ink">
                Informations sur l'article
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
                  Titre de l'annonce *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titre}
                  onChange={(e) =>
                    setFormData({ ...formData, titre: e.target.value })
                  }
                  placeholder="Ex: Poussette Yoyo Babyzen — Marine"
                  className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Décrivez l'état, la matière, les dimensions..."
                  className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
                  Catégorie *
                </label>
                <select
                  required
                  value={formData.categoriePrincipale}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoriePrincipale: e.target.value,
                      categorie: "",
                    })
                  }
                  className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors"
                >
                  <option value="">
                    {categories.length === 0
                      ? "Chargement..."
                      : "Choisissez une catégorie"}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.nom}
                    </option>
                  ))}
                </select>
              </div>

              {formData.categoriePrincipale && (
                <div>
                  <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
                    Sous-catégorie *
                  </label>
                  <select
                    required
                    value={formData.categorie}
                    onChange={(e) =>
                      setFormData({ ...formData, categorie: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors"
                  >
                    <option value="">Choisissez une sous-catégorie</option>
                    {Object.entries(
                      (categoriePrincipaleObj?.sous_categories || []).reduce(
                        (acc, sc) => {
                          (acc[sc.groupe || "Autres"] ||= []).push(sc);
                          return acc;
                        },
                        {},
                      ),
                    ).map(([groupe, items]) => (
                      <optgroup key={groupe} label={groupe}>
                        {items.map((sc) => (
                          <option key={sc.id} value={sc.id}>
                            {sc.nom}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
                    État *
                  </label>
                  <select
                    value={formData.etat}
                    onChange={(e) =>
                      setFormData({ ...formData, etat: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors"
                  >
                    <option value="neuf">Neuf avec étiquette</option>
                    <option value="excellent">Excellent état</option>
                    <option value="bon">Bon état</option>
                  </select>
                </div>
                <div className="flex items-end pb-3.5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bonne_affaire}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bonne_affaire: e.target.checked,
                        })
                      }
                      className="h-4.5 w-4.5 accent-orange"
                    />
                    <span className="text-[13.5px] font-semibold text-ink">
                      Afficher dans "Bonnes affaires"
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
                  Taille / pointure / tranche d'âge
                </label>
                <select
                  value={formData.taille}
                  onChange={(e) =>
                    setFormData({ ...formData, taille: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors"
                >
                  <option value="">Non précisé</option>
                  {(
                    TAILLES_PAR_CATEGORIE[categorieNom] || TAILLES_GENERIQUES
                  ).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
                    Quantité disponible *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantite_disponible}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantite_disponible: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
                    Taille du colis *
                  </label>
                  <select
                    value={formData.taille_colis}
                    onChange={(e) =>
                      setFormData({ ...formData, taille_colis: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors"
                  >
                    {Object.entries(TAILLE_COLIS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-ink-soft/75 -mt-2 italic">
                La taille du colis sert à estimer les frais de livraison
                affichés à l'acheteuse.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h3 className="font-serif text-lg text-ink">
                Photos de l'article
              </h3>
              <p className="text-[12.5px] text-ink-soft/75 -mt-3">
                Ajoutez des photos nettes et récentes. La première deviendra la
                photo principale.
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="hidden"
              />

              <div
                onClick={handleZoneClick}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-m p-10 text-center transition-all cursor-pointer ${
                  isDragging
                    ? "border-teal bg-teal/5"
                    : "border-line hover:border-teal hover:bg-sable/60"
                }`}
              >
                <div className="h-10 w-10 mx-auto mb-3 rounded-full bg-teal/10 text-teal-dark flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-ink">
                  {isDragging
                    ? "Déposez vos photos ici"
                    : "Cliquez ou glissez-déposez vos photos ici"}
                </p>
                <p className="text-[11px] text-ink-soft/75 mt-1.5">
                  Jusqu'à 5 photos · Formats JPG ou PNG
                </p>
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                  {previews.map((previewUrl, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-btn overflow-hidden border border-line bg-line/30"
                    >
                      <img
                        src={previewUrl}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 bg-ink/80 text-cream text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded">
                          Principale
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h3 className="font-serif text-lg text-ink">
                Tarifs et disponibilités
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
                    {isLocation
                      ? "Prix par jour (FCFA) *"
                      : "Prix de vente (FCFA) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.prix_vendeur}
                    onChange={(e) =>
                      setFormData({ ...formData, prix_vendeur: e.target.value })
                    }
                    placeholder="Ex: 15000"
                    className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors"
                  />
                </div>
                {isLocation && (
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
                      Caution demandée (FCFA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.caution}
                      onChange={(e) =>
                        setFormData({ ...formData, caution: e.target.value })
                      }
                      placeholder="Ex: 25000"
                      className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-orange transition-colors"
                    />
                    <p className="text-[10.5px] text-ink-soft/75 mt-1.5 italic">
                      Rendue à la locataire à la fin de la location.
                    </p>
                  </div>
                )}
              </div>

              {prixAffiche && (
                <div className="bg-sable border border-line rounded-btn px-5 py-4 flex items-center justify-between">
                  <p className="text-xs text-ink-soft/75">
                    Prix affiché à l'acheteuse{" "}
                    <span className="italic">
                      (commission{" "}
                      {eligibleLancement ? "de lancement 5%" : "10%"} incluse)
                    </span>
                  </p>
                  <p className="font-serif text-lg font-bold text-ink animate-price-pop">
                    {formatFCFA(prixAffiche)}
                  </p>
                </div>
              )}

              <div className="bg-teal/5 border border-teal/20 rounded-btn p-4 space-y-1.5">
                <p className="text-[11px] font-bold text-teal-dark uppercase tracking-wide">
                  Avant de publier
                </p>
                <p className="text-[12.5px] text-ink-soft">
                  ✓ Vérifiez le tarif et les conditions.
                </p>
                <p className="text-[12.5px] text-ink-soft">
                  ✓ Contrôlez que la disponibilité indiquée est juste.
                </p>
                <p className="text-[12.5px] text-ink-soft">
                  ✓ Votre annonce sera relue par Yaay Vidé avant publication.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-line">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-sm font-bold text-ink-soft/75 hover:text-ink transition-colors"
              >
                ← Retour
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="bg-ink text-white px-8 py-3 rounded-btn font-bold text-sm hover:bg-teal transition-colors"
              >
                Continuer →
              </button>
            ) : (
              <button
                type="submit"
                disabled={envoiEnCours}
                className="bg-clay-dark hover:bg-ink text-white px-8 py-3 rounded-btn font-bold text-sm transition-colors disabled:opacity-60"
              >
                {envoiEnCours
                  ? "Publication..."
                  : "Soumettre à la validation Yaay Vidé"}
              </button>
            )}
          </div>
        </div>

        <div className={`bg-white rounded-m ${SHADOW_CARD} p-6 sticky top-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base text-ink">
              Résumé de l'annonce
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wide bg-sable text-ink-soft/75 px-2.5 py-1 rounded-full">
              Brouillon
            </span>
          </div>

          <div className="rounded-btn overflow-hidden border border-line mb-4">
            <div className="aspect-[4/3] bg-sable flex items-center justify-center relative">
              {previews[0] ? (
                <img
                  src={previews[0]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <span className="font-serif text-3xl text-teal/30">Y</span>
              )}
            </div>
            <div className="p-3.5">
              <p className="text-sm font-bold text-ink truncate">
                {formData.titre || "Titre de votre annonce"}
              </p>
              <p className="text-[11.5px] text-ink-soft/75 mt-0.5">
                {isLocation ? "Location" : "Vente"} ·{" "}
                {sousCategorieNom || categorieNom || "—"} ·{" "}
                {moi?.nom_boutique || "Votre boutique"}
              </p>
              <p className="font-serif text-lg font-bold text-ink mt-2">
                {prixAffiche ? formatFCFA(prixAffiche) : "— FCFA"}
                {isLocation && (
                  <span className="text-ink-soft/75 font-sans font-normal text-xs">
                    {" "}
                    /jour
                  </span>
                )}
              </p>
              {isLocation && formData.caution && (
                <p className="text-[11px] text-ink-soft/75">
                  Caution : {formatFCFA(formData.caution)}
                </p>
              )}
            </div>
          </div>

          <div className="bg-sable rounded-btn p-3.5 space-y-1.5">
            <p className="text-[11px] font-bold text-ink uppercase tracking-wide mb-1">
              Bien démarrer votre annonce
            </p>
            <p className="text-[12px] text-ink-soft/75">
              • Un titre précis facilite la recherche.
            </p>
            <p className="text-[12px] text-ink-soft/75">
              • Décrivez honnêtement l'état et les défauts.
            </p>
            <p className="text-[12px] text-ink-soft/75">
              • Choisissez la catégorie la plus pertinente.
            </p>
          </div>
        </div>
      </form>
    </ShellVendeuse>
  );
}
