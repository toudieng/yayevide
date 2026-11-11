// frontend/src/pages/Ebook.jsx
import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Reveal from '../components/ui/Reveal';
import { apiFetch, API_BASE } from '../utils/api';
import spreadChapitre0 from '../assets/ebook/spread_chapitre0.jpg';
import spreadChapitre5 from '../assets/ebook/spread_chapitre5.jpg';
import spreadChapitre11 from '../assets/ebook/spread_chapitre11.jpg';

function formatFCFA(value) {
  return Math.round(Number(value || 0)).toLocaleString('fr-FR') + ' FCFA';
}

const MODES_PAIEMENT = [
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'free_money', label: 'Free Money' },
  { value: 'carte', label: 'Carte bancaire' },
];

const CHAPITRES = [
  { n: '00', titre: "Préparer l'arrivée de bébé", desc: 'Valise de maternité, maison et mbottu dans la vraie vie dakaroise.', icone: 'maison' },
  { n: '01', titre: 'Les premiers jours avec bébé', desc: "Retour à la maison, sommeil, change à l'eau et cordon ombilical.", icone: 'visage' },
  { n: '02', titre: "L'allaitement maternel", desc: 'Lactation, tire-lait, conservation du lait et sevrage progressif.', icone: 'coeur' },
  { n: '03', titre: 'La diversification alimentaire', desc: 'Premiers aliments, céréales locales, DME et refus alimentaires.', icone: 'repas' },
  { n: '04', titre: 'La santé de bébé', desc: 'Coliques, poussées dentaires, petits maux et signes qui invitent à consulter.', icone: 'stethoscope' },
  { n: '05', titre: "Le corps de maman après l'accouchement", desc: 'Périnée, baby blues, sport, couple et récupération post-partum.', icone: 'activite' },
  { n: '06', titre: 'La vie pratique à Dakar', desc: 'Nounou, crèche, couches et repères utiles pour le quotidien.', icone: 'pin' },
  { n: '07', titre: 'Remèdes de nos grand-mères', desc: 'Traditions, moringa, bouye, massages et précautions importantes.', icone: 'feuille' },
  { n: '08', titre: 'Prendre soin de toi aussi, maman', desc: 'Émotions, culpabilité, soin de soi et recours à un professionnel.', icone: 'mains' },
  { n: '09', titre: 'La maman active', desc: 'Retour au travail, allaitement au bureau, voyage et entrepreneuriat.', icone: 'sacoche' },
  { n: '10', titre: 'Offrir utile', desc: 'Des cadeaux concrets pour une future ou une nouvelle maman.', icone: 'cadeau' },
  { n: '11', titre: 'Nos rituels sénégalais', desc: 'Dëkk, damp, safara, thiouraye, nguenté et transmission familiale.', icone: 'etincelles' },
  { n: '12', titre: 'Le rôle du papa', desc: 'Présence, tâches concrètes, visites, famille et soutien émotionnel.', icone: 'groupe' },
  { n: '13', titre: "Ce qu'on n'ose pas toujours demander", desc: 'Pression familiale, jumeaux, cheveux, poids et retour de couches.', icone: 'bulle' },
];

const ICONES = {
  maison: 'M15 21v-8a1 1 0 00-1-1h-4a1 1 0 00-1 1v8M3 10a2 2 0 01.709-1.528l7-6a2 2 0 012.582 0l7 6A2 2 0 0121 10v9a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  visage: 'M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5M15 12h.01M19.38 6.813A9 9 0 0120.8 10.2a2 2 0 010 3.6 9 9 0 01-17.6 0 2 2 0 010-3.6A9 9 0 0112 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1M9 12h.01',
  coeur: 'M2 9.5a5.5 5.5 0 019.591-3.676.56.56 0 00.818 0A5.49 5.49 0 0122 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 01-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5',
  repas: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3v7',
  stethoscope: 'M11 2v2M5 2v2M5 3H4a2 2 0 00-2 2v4a6 6 0 0012 0V5a2 2 0 00-2-2h-1M8 15a6 6 0 0012 0v-3M20 10a2 2 0 100-4 2 2 0 000 4z',
  activite: 'M22 12h-2.48a2 2 0 00-1.93 1.46l-2.35 8.36a.25.25 0 01-.48 0L9.24 2.18a.25.25 0 00-.48 0l-2.35 8.36A2 2 0 014.49 12H2',
  pin: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 01-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0116 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  feuille: 'M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
  mains: 'M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 00-9.591-3.676.6.6 0 01-.818.001A5.5 5.5 0 002 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 002.879.052 2.12 2.12 0 00-.004-3 2.124 2.124 0 103-3',
  sacoche: 'M16 20V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v16M2 6h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2z',
  cadeau: 'M12 7v14M20 11v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8M7.5 7a1 1 0 010-5A4.8 8 0 0112 7a4.8 8 0 014.5-5 1 1 0 010 5M3 7h18v4H3z',
  etincelles: 'M11.017 2.814a1 1 0 011.966 0l1.051 5.558a2 2 0 001.594 1.594l5.558 1.051a1 1 0 010 1.966l-5.558 1.051a2 2 0 00-1.594 1.594l-1.051 5.558a1 1 0 01-1.966 0l-1.051-5.558a2 2 0 00-1.594-1.594l-5.558-1.051a1 1 0 010-1.966l5.558-1.051a2 2 0 001.594-1.594z',
  groupe: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M16 3.128a4 4 0 010 7.744M22 21v-2a4 4 0 00-3-3.87M9 11a4 4 0 100-8 4 4 0 000 8z',
  bulle: 'M2.992 16.342a2 2 0 01.094 1.167l-1.065 3.29a1 1 0 001.236 1.168l3.413-.998a2 2 0 011.099.092 10 10 0 1 0-4.777-4.719',
};

const OUTILS = [
  { titre: 'La vraie liste de maternité', desc: 'Pour maman et pour bébé.' },
  { titre: 'Les essentiels souvent oubliés', desc: 'Les objets qui peuvent réellement aider.' },
  { titre: 'Des tableaux et repères rapides', desc: 'À retrouver sans relire tout le chapitre.' },
  { titre: 'Les services Yaay Vidé mentionnés', desc: 'Présentés dans la section finale du guide.' },
];

const PHASES = [
  { n: 1, eyebrow: 'Avant bébé', titre: "Préparer sans s'éparpiller", desc: "Composer la valise, organiser la maison et comprendre ce qui est vraiment utile." },
  { n: 2, eyebrow: 'Premiers jours', titre: 'Trouver ses repères', desc: "Aborder le retour, le sommeil, le change, l'allaitement et les premiers doutes." },
  { n: 3, eyebrow: 'Au fil des mois', titre: 'Accompagner bébé', desc: 'Diversification, santé, habitudes locales et vie pratique à Dakar.' },
  { n: 4, eyebrow: 'Pour maman', titre: 'Prendre soin de soi aussi', desc: "Post-partum, émotions, couple, travail, voyages et droit de demander de l'aide." },
];

const AUDIENCES = [
  { titre: 'Future maman', desc: "Pour préparer l'arrivée de bébé avec une liste réaliste et moins de charge mentale.", icone: 'etincelles' },
  { titre: 'Jeune maman', desc: 'Pour retrouver rapidement un repère au milieu des premières semaines intenses.', icone: 'mains' },
  { titre: 'Papa impliqué', desc: "Pour comprendre comment aider concrètement, sans attendre qu'on vous le demande.", icone: 'groupe' },
  { titre: 'Famille proche', desc: 'Pour offrir du soutien utile et respecter les besoins de la maman et du bébé.', icone: 'cadeau' },
];

const CITATIONS = [
  { texte: 'Ce guide est une boîte à outils — pas un manuel de perfection.', source: 'Extrait éditorial du guide' },
  { texte: "Ton bébé n'a pas besoin d'une maman parfaite. Il a besoin d'une maman présente, aimante, et qui prend soin d'elle.", source: 'Extrait éditorial du guide' },
  { texte: "Parce qu'on est meilleures ensemble.", source: 'Conclusion du guide' },
];

const COMPARAISON = {
  generaliste: {
    titre: 'Des repères parfois éloignés du quotidien',
    points: ["Listes pensées pour d'autres contextes", 'Peu de place pour la famille élargie', 'Rituels et aliments locaux souvent absents', 'Ton parfois froid ou culpabilisant'],
  },
  yaay: {
    titre: 'Une maternité racontée depuis Dakar',
    points: ['Valise de maternité adaptée à Dakar', 'Moringa, rouye, mbottu et rituels expliqués', 'Place du papa et de la famille abordée', 'Soutien émotionnel sans recherche de perfection'],
  },
};

const FAQ = [
  { q: 'Le guide est-il numérique ?', r: "Oui. Il s'agit d'un PDF numérique téléchargeable après votre achat." },
  { q: 'Puis-je le lire sur mon téléphone ?', r: 'Oui. Le PDF peut être lu sur téléphone, tablette ou ordinateur avec une application de lecture PDF habituelle.' },
  { q: 'Combien de pages contient-il ?', r: 'Le Guide Yaay to Yaay contient 14 chapitres numérotés de 0 à 13, plus une section finale dédiée aux services Yaay Vidé.' },
  { q: 'Est-il adapté aux futures mamans ?', r: 'Oui. Le premier chapitre accompagne la préparation de la maternité et de la maison, puis le guide suit les premières étapes après la naissance.' },
  { q: 'Y aura-t-il des mises à jour ?', r: "Aucune mise à jour future n'est promise pour le moment — l'achat concerne la version actuelle du guide." },
];

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}><path d="M5 12l4.5 4.5L19 7" /></svg>
  );
}

const FLOAT_ICONES = {
  biberon: 'M9 2h6M10 4h4c.5 1 .5 2-.5 3v1.5c2 .8 3.5 2.8 3.5 5.2C16.5 17.5 14.5 20 12 20s-4.5-2.5-4.5-6.3c0-2.4 1.5-4.4 3.5-5.2V7c-1-1-1-2-.5-3z',
  coeur: 'M2 9.5a5.5 5.5 0 019.591-3.676.56.56 0 00.818 0A5.49 5.49 0 0122 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 01-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5',
  feuille: 'M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
};

function FloatingBadge({ label, icone, tone = 'cream', className = '' }) {
  const toneStyles = {
    cream: 'bg-white text-ink',
    rose: 'bg-[#fdeceb] text-[#c9584f]',
    teal: 'bg-teal/10 text-teal-dark',
  };
  return (
    <div className={`absolute z-10 flex items-center gap-2 rounded-full pl-2 pr-4 py-2 shadow-lg ${toneStyles[tone] || toneStyles.cream} ${className}`}>
      {icone && (
        <span className="h-6 w-6 rounded-full bg-white/70 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
            <path d={FLOAT_ICONES[icone]} />
          </svg>
        </span>
      )}
      <span className="text-[13px] font-semibold whitespace-nowrap">{label}</span>
    </div>
  );
}

export default function Ebook() {
  const [ebook, setEbook] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [form, setForm] = useState({ email: '', telephone: '', mode_paiement: 'wave' });
  const [etape, setEtape] = useState('form');
  const [achat, setAchat] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [confirmationEnCours, setConfirmationEnCours] = useState(false);
  const [apercuIndex, setApercuIndex] = useState(0);
  const [faqOuvert, setFaqOuvert] = useState(0);

  const APERCUS = [
    { image: spreadChapitre0, titre: 'La vraie liste de maternité', legende: 'Deux pages consacrées aux indispensables pour maman et bébé à Dakar.' },
    { image: spreadChapitre5, titre: "Le corps de maman après l'accouchement", legende: 'Un chapitre entier consacré à la récupération physique et émotionnelle.' },
    { image: spreadChapitre11, titre: 'La maternité à la sénégalaise', legende: 'Les rituels transmis de génération en génération, expliqués avec leur contexte.' },
  ];

  useEffect(() => {
    apiFetch('/ebook/')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setEbook(await res.json());
      })
      .catch(() => setErreur("Aucun e-book n'est disponible pour le moment."))
      .finally(() => setChargement(false));
  }, []);

  const soumettre = async (e) => {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur(null);

    const res = await apiFetch('/ebook/acheter/', {
      method: 'POST',
      body: { ebook_id: ebook.id, ...form },
    });
    const data = await res.json();

    if (res.ok) {
      setAchat(data.achat);
      setEtape('paiement');
    } else {
      setErreur(data.email?.[0] || data.general || 'Une erreur est survenue.');
    }
    setEnvoiEnCours(false);
  };

  const confirmerPaiementSimule = async () => {
    setConfirmationEnCours(true);
    const res = await apiFetch('/ebook/paiement/simuler-confirmation/', {
      method: 'POST',
      body: { reference_paiement: achat.reference_paiement },
    });
    if (res.ok) {
      setAchat(await res.json());
      setEtape('succes');
    } else {
      setErreur('Impossible de confirmer le paiement.');
    }
    setConfirmationEnCours(false);
  };

  if (chargement) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="h-9 w-9 rounded-full border-2 border-line border-t-teal animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!ebook) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <p className="font-serif text-xl text-ink mb-2">Aucun e-book disponible</p>
          <p className="text-sm text-ink-soft/75">Reviens bientôt, un guide est en préparation !</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-to-br from-sable to-cream">
        <div className="pointer-events-none absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-teal/25 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-[360px] w-[360px] rounded-full bg-gradient-to-tr from-orange/25 to-transparent blur-3xl" />
        <div className="relative max-w-[1180px] mx-auto px-6 md:px-12 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-teal/10 text-teal-dark text-[12px] font-bold uppercase tracking-wide px-4 py-2 rounded-full mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8z" /></svg>
              {ebook.nb_pages ? `${ebook.nb_pages} pages pensées à Dakar` : 'Pensé à Dakar'}
            </span>
            <h1 className="font-serif italic text-[#3D1B36] text-[52px] sm:text-[68px] leading-[0.95] mb-6">
              {ebook.titre}
            </h1>
            <p className="text-orange font-bold text-[22px] mb-6">De maman à maman, à la dakaroise.</p>
            <p className="text-ink-soft text-[16px] leading-relaxed max-w-md mb-9">{ebook.description}</p>
            <div className="flex flex-wrap gap-3.5 mb-9">
              <a href="#acheter" className="inline-flex items-center gap-2 bg-[#3D1B36] hover:bg-[#2c1327] text-white px-7 py-3.5 rounded-full text-sm font-bold transition-colors">
                Acheter le guide
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
              <a href="#sommaire" className="inline-flex items-center gap-2 border border-line px-7 py-3.5 rounded-full text-sm font-bold text-ink hover:border-ink transition-colors">
                Découvrir le contenu
              </a>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-semibold text-ink-soft/75">
              {ebook.nb_pages && (
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M6 22a2 2 0 01-2-2V4a2 2 0 012-2h8a2.4 2.4 0 011.7.706l3.6 3.588A2.4 2.4 0 0120 8v12a2 2 0 01-2 2z" /><path d="M14 2v5a1 1 0 001 1h5" /></svg>
                  PDF · {ebook.nb_pages} pages
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 7v14" /><path d="M3 18a1 1 0 01-1-1V4a1 1 0 011-1h5a4 4 0 014 4 4 4 0 014-4h5a1 1 0 011 1v13a1 1 0 01-1 1h-6a3 3 0 00-3 3 3 3 0 00-3-3z" /></svg>
                14 chapitres
              </span>
            </div>
          </div>

          <div className="relative flex justify-center">
            {ebook.couverture ? (
              <img src={ebook.couverture} alt={ebook.titre} className="w-full max-w-[340px] rounded-m shadow-2xl rotate-1" />
            ) : (
              <div className="w-full max-w-[340px] aspect-[3/4] rounded-m bg-cream shadow-[0_16px_40px_-16px_rgba(27,36,48,0.28)] flex items-center justify-center text-ink-soft/40 text-sm">
                Couverture à venir
              </div>
            )}
            <FloatingBadge label="Biberon" icone="biberon" tone="teal" className="top-4 right-2 sm:right-0" />
            <FloatingBadge label="Mbottu" icone="coeur" tone="rose" className="top-[38%] -right-2 sm:-right-6" />
            <FloatingBadge label="Douceur" icone="coeur" tone="teal" className="bottom-6 -left-2 sm:-left-8" />
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className="max-w-[1180px] mx-auto px-6 md:px-12">
          <Reveal className="max-w-2xl mb-14">
            <div className="flex gap-0.5 text-orange mb-5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M11.525 2.295a.53.53 0 01.95 0l2.31 4.679a2.123 2.123 0 001.595 1.16l5.166.756a.53.53 0 01.294.904l-3.736 3.638a2.123 2.123 0 00-.611 1.878l.882 5.14a.53.53 0 01-.771.56l-4.618-2.428a2.122 2.122 0 00-1.973 0L6.396 21.01a.53.53 0 01-.77-.56l.881-5.139a2.122 2.122 0 00-.611-1.879L2.16 9.795a.53.53 0 01.294-.906l5.165-.755a2.122 2.122 0 001.597-1.16z" /></svg>
              ))}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-dark mb-4">Une parole proche des mamans</p>
            <h2 className="font-serif text-[28px] sm:text-[36px] leading-[1.15] text-ink mb-4">Né de conversations vraies, pas d'un discours médical froid.</h2>
            <p className="text-ink-soft text-[15px] leading-relaxed">Le guide se présente comme une boîte à outils éditoriale. Il ne remplace jamais l'avis d'un professionnel de santé.</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { titre: 'Conseils pratiques', desc: 'Des listes, repères et gestes conçus pour être consultés au moment où vous en avez besoin.', icone: 'coche' },
              { titre: 'Traditions expliquées', desc: 'Les remèdes et rituels sénégalais sont présentés avec leur contexte et leurs précautions.', icone: 'feuille' },
              { titre: 'Repères santé responsables', desc: "Le guide indique quand demander l'avis d'un médecin, d'une sage-femme ou d'un pédiatre.", icone: 'bouclier' },
              { titre: 'Pensé depuis Dakar', desc: 'Les réalités locales, la famille et le quotidien dakarois ne sont pas laissés de côté.', icone: 'pin' },
            ].map((c) => (
              <Reveal key={c.titre} className="bg-white rounded-2xl shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6">
                <span className="h-10 w-10 rounded-full bg-teal/15 text-teal-dark flex items-center justify-center mb-4">
                  {c.icone === 'coche' && <CheckIcon className="h-5 w-5" />}
                  {c.icone === 'bouclier' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z" /><path d="m9 12 2 2 4-4" /></svg>}
                  {(c.icone === 'feuille' || c.icone === 'pin') && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d={ICONES[c.icone === 'feuille' ? 'feuille' : 'pin']} /></svg>}
                </span>
                <p className="text-[15px] font-bold text-ink mb-1.5">{c.titre}</p>
                <p className="text-[13px] text-ink-soft/75 leading-relaxed">{c.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="sommaire" className="bg-sable py-20 md:py-28">
        <div className="max-w-[1180px] mx-auto px-6 md:px-12">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-dark mb-4">Au sommaire</p>
            <h2 className="font-serif text-[32px] sm:text-[42px] leading-[1.1] text-ink mb-5 max-w-2xl">
              14 chapitres pour traverser la maternité avec plus de repères
            </h2>
            <p className="text-ink-soft text-[15.5px] leading-relaxed max-w-xl mb-12">
              Le sommaire ci-dessous reprend le contenu du PDF, de la préparation de la valise aux questions que l'on n'ose pas toujours poser.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CHAPITRES.map((c) => (
              <Reveal key={c.n} className="bg-white rounded-2xl shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6">
                <div className="flex items-start justify-between mb-8">
                  <span className="font-serif text-2xl font-bold text-orange">{c.n}</span>
                  <span className="h-8 w-8 rounded-full bg-teal/15 text-teal-dark flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <path d={ICONES[c.icone]} />
                    </svg>
                  </span>
                </div>
                <p className="text-[15px] font-bold text-ink leading-snug mb-1.5">{c.titre}</p>
                <p className="text-[12.5px] text-ink-soft/75 leading-snug">{c.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-[#3D1B36] py-20 md:py-24 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="relative max-w-[1180px] mx-auto px-6 md:px-12">
          <div className="flex items-start justify-between gap-6 flex-wrap mb-10">
            <Reveal className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal mb-4">Feuilletez avant de choisir</p>
              <h2 className="font-serif text-cream text-[32px] sm:text-[42px] leading-[1.1] mb-5">Un aperçu du vrai guide</h2>
              <p className="text-cream/70 text-[15.5px] leading-relaxed">
                Trois doubles pages du PDF original, affichées en taille réduite pour vous donner une idée du ton, de la structure et du niveau de détail.
              </p>
            </Reveal>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setApercuIndex((i) => (i - 1 + APERCUS.length) % APERCUS.length)}
                aria-label="Aperçu précédent"
                className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-cream flex items-center justify-center transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <span className="text-cream/70 text-sm font-semibold">{apercuIndex + 1} / {APERCUS.length}</span>
              <button
                type="button"
                onClick={() => setApercuIndex((i) => (i + 1) % APERCUS.length)}
                aria-label="Aperçu suivant"
                className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-cream flex items-center justify-center transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
          </div>

          <Reveal className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <img loading="lazy" decoding="async" key={apercuIndex} src={APERCUS[apercuIndex].image} alt={APERCUS[apercuIndex].titre} className="w-full" />
          </Reveal>
          <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-teal">Extrait {apercuIndex + 1}</p>
              <p className="font-serif text-lg text-cream">{APERCUS[apercuIndex].titre}</p>
              <p className="text-cream/60 text-[13px] mt-1">{APERCUS[apercuIndex].legende}</p>
            </div>
            <div className="flex gap-2">
              {APERCUS.map((a, i) => (
                <button
                  key={a.titre}
                  type="button"
                  onClick={() => setApercuIndex(i)}
                  aria-label={`Afficher l'aperçu : ${a.titre}`}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${i === apercuIndex ? 'bg-orange' : 'bg-white/25'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className="max-w-[1180px] mx-auto px-6 md:px-12">
          <Reveal className="max-w-2xl mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-dark mb-4">Pourquoi ce guide ?</p>
            <h2 className="font-serif text-[32px] sm:text-[42px] leading-[1.1] text-ink">Des conseils qui parlent aussi de votre réalité</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Reveal className="bg-white rounded-2xl shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-8">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft/75 mb-3">Guides généralistes</p>
              <h3 className="font-serif text-xl text-ink mb-5">{COMPARAISON.generaliste.titre}</h3>
              <ul className="space-y-3">
                {COMPARAISON.generaliste.points.map((p) => (
                  <li key={p} className="text-[14px] text-ink-soft/75">{p}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="bg-[#3D1B36] rounded-2xl shadow-[0_16px_40px_-16px_rgba(27,36,48,0.28)] p-8">
              <p className="text-[11px] font-bold uppercase tracking-wide text-orange mb-3">Guide Yaay to Yaay</p>
              <h3 className="font-serif text-xl text-cream mb-5">{COMPARAISON.yaay.titre}</h3>
              <ul className="space-y-3">
                {COMPARAISON.yaay.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[14px] text-cream/90">
                    <CheckIcon className="h-4 w-4 text-orange shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-sable py-20 md:py-24">
        <div className="max-w-[1180px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <Reveal className="relative">
            {ebook.couverture ? (
              <img loading="lazy" decoding="async" src={ebook.couverture} alt="" className="w-full rounded-2xl shadow-xl" />
            ) : (
              <div className="w-full aspect-[4/3] rounded-2xl bg-cream shadow-xl flex items-center justify-center text-ink-soft/30 text-sm">
                Photo à venir
              </div>
            )}
            <FloatingBadge label="Une lecture douce, à votre rythme" tone="cream" className="bottom-5 left-5 right-5 sm:right-auto" />
          </Reveal>
          <div>
            <Reveal className="mb-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-dark mb-4">La voix du guide</p>
              <h2 className="font-serif text-[28px] sm:text-[34px] leading-[1.15] text-ink">Comme une grande sœur qui vous parle franchement</h2>
            </Reveal>
            <div className="space-y-6">
              {CITATIONS.map((c) => (
                <Reveal key={c.texte} className="border-l-4 border-orange pl-5">
                  <p className="font-serif text-[17px] text-ink italic leading-relaxed mb-2">« {c.texte} »</p>
                  <p className="text-[12px] text-ink-soft/75 uppercase tracking-wide font-bold">{c.source}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className="max-w-[1180px] mx-auto px-6 md:px-12">
          <Reveal className="max-w-2xl mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-dark mb-4">Votre chemin de lecture</p>
            <h2 className="font-serif text-[32px] sm:text-[42px] leading-[1.1] text-ink mb-5">Ouvrez le guide là où vous en êtes</h2>
            <p className="text-ink-soft text-[15.5px] leading-relaxed">
              Il n'est pas nécessaire de tout lire d'un coup : chaque chapitre peut devenir un repère au bon moment.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {PHASES.map((p, i) => (
              <Reveal key={p.n} className="relative">
                <div className="flex items-center mb-5">
                  <span className="h-14 w-14 rounded-full bg-[#3D1B36] text-white font-serif text-lg font-bold flex items-center justify-center shrink-0">
                    {p.n}
                  </span>
                  {i < PHASES.length - 1 && <div className="hidden lg:block h-px flex-1 bg-line ml-4" />}
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-teal-dark mb-2">{p.eyebrow}</p>
                <p className="font-serif text-xl text-ink mb-2 leading-snug">{p.titre}</p>
                <p className="text-[13.5px] text-ink-soft/75 leading-relaxed">{p.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sable py-20 md:py-24">
        <div className="max-w-[1180px] mx-auto px-6 md:px-12">
          <Reveal className="max-w-2xl mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-dark mb-4">Pour qui ?</p>
            <h2 className="font-serif text-[32px] sm:text-[42px] leading-[1.1] text-ink">Un guide pour toute la bulle qui entoure bébé</h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AUDIENCES.map((a) => (
              <Reveal key={a.titre} className="bg-white rounded-2xl shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6">
                <span className="h-11 w-11 rounded-full bg-orange/15 text-orange flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d={ICONES[a.icone]} /></svg>
                </span>
                <p className="text-[15px] font-bold text-ink mb-1.5">{a.titre}</p>
                <p className="text-[13px] text-ink-soft/75 leading-relaxed">{a.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className="max-w-[1180px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-dark mb-4">
              Inclus dans les {ebook.nb_pages || 'toutes les'} pages
            </p>
            <h2 className="font-serif text-[32px] sm:text-[42px] leading-[1.1] text-ink mb-5">
              Des outils concrets, sans bonus artificiels
            </h2>
            <p className="text-ink-soft text-[15.5px] leading-relaxed max-w-md">
              Le guide contient directement ses listes et tableaux pratiques. Aucun fichier bonus séparé ni mise à jour future ne sont promis.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OUTILS.map((o) => (
              <Reveal key={o.titre} className="bg-white rounded-2xl shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-5">
                <div className="flex items-start gap-2.5">
                  <span className="h-6 w-6 rounded-full bg-teal/15 text-teal-dark flex items-center justify-center shrink-0 mt-0.5">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-ink leading-snug mb-1">{o.titre}</p>
                    <p className="text-[12.5px] text-ink-soft/75 leading-snug">{o.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="acheter" className="relative overflow-hidden bg-sable py-20 md:py-24">
        <div className="pointer-events-none absolute -top-20 -left-16 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-teal/20 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-[320px] w-[320px] rounded-full bg-gradient-to-tr from-orange/20 to-transparent blur-3xl" />
        <div className="relative max-w-[1180px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-14 items-start">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-dark mb-4">Un compagnon à garder près de soi</p>
            <h2 className="font-serif text-[28px] sm:text-[36px] leading-[1.15] text-ink mb-4">
              {ebook.nb_pages ? `${ebook.nb_pages} pages de repères` : 'Des repères concrets'} pour {formatFCFA(ebook.prix)}
            </h2>
            <p className="text-ink-soft text-[15px] leading-relaxed mb-8">Un prix unique pour la version PDF actuelle du Guide Yaay to Yaay.</p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-semibold text-ink-soft/75 mb-8">
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
                Téléphone
              </span>
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><line x1="12" x2="12.01" y1="18" y2="18" /></svg>
                Tablette
              </span>
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 5a2 2 0 012 2v8.526a2 2 0 00.212.897l1.068 2.127a1 1 0 01-.9 1.45H3.62a1 1 0 01-.9-1.45l1.068-2.127A2 2 0 004 15.526V7a2 2 0 012-2z" /><path d="M20.054 15.987H3.946" /></svg>
                Ordinateur
              </span>
            </div>

            <div className="flex items-start gap-3 bg-white rounded-2xl shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6 text-teal shrink-0"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z" /><path d="m9 12 2 2 4-4" /></svg>
              <div>
                <p className="text-[13.5px] font-bold text-ink">Achat sécurisé</p>
                <p className="text-[12.5px] text-ink-soft/75">Le lien de téléchargement vous est envoyé par email dès le paiement confirmé.</p>
              </div>
            </div>
          </Reveal>

          <Reveal className="bg-white rounded-2xl p-7 shadow-[0_16px_40px_-16px_rgba(27,36,48,0.28)]">
            {ebook.couverture ? (
              <img loading="lazy" decoding="async" src={ebook.couverture} alt="" className="w-full aspect-[3/2] object-cover rounded-xl mb-5" />
            ) : (
              <div className="w-full aspect-[3/2] rounded-xl bg-cream mb-5 flex items-center justify-center text-ink-soft/30 text-sm">
                Couverture à venir
              </div>
            )}
            <p className="text-[11px] font-bold uppercase tracking-wide text-teal-dark mb-1">Guide numérique</p>
            <h3 className="font-serif text-xl text-ink mb-1">{ebook.titre}</h3>
            <p className="text-[13px] text-ink-soft/75 mb-4">De maman à maman, à la dakaroise</p>
            <p className="font-serif text-3xl font-bold text-[#3D1B36] mb-5">{formatFCFA(ebook.prix)}</p>
            <ul className="space-y-2 mb-6">
              {[`PDF${ebook.nb_pages ? ` de ${ebook.nb_pages} pages` : ''}`, '14 chapitres réels', 'Téléchargement après paiement confirmé'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[13.5px] text-ink-soft">
                  <CheckIcon className="h-4 w-4 text-teal-dark shrink-0" /> {f}
                </li>
              ))}
            </ul>

            {erreur && (
              <div className="mb-4 p-3.5 text-[13px] bg-red-50 text-red-600 rounded-btn border border-red-100">{erreur}</div>
            )}

            {etape === 'form' && (
              <form onSubmit={soumettre} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">
                    Email (pour recevoir le lien) *
                  </label>
                  <input
                    type="email" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
                    placeholder="vous@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">
                    Téléphone (optionnel)
                  </label>
                  <input
                    type="text" value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
                    placeholder="77XXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink mb-1.5">
                    Moyen de paiement
                  </label>
                  <select
                    value={form.mode_paiement}
                    onChange={(e) => setForm({ ...form, mode_paiement: e.target.value })}
                    className="w-full px-4 py-2.5 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal"
                  >
                    {MODES_PAIEMENT.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <button
                  type="submit" disabled={envoiEnCours}
                  className="w-full bg-[#3D1B36] hover:bg-[#2c1327] text-white font-bold py-3.5 rounded-btn text-sm transition-colors disabled:opacity-50"
                >
                  {envoiEnCours ? 'Un instant...' : `Acheter — ${formatFCFA(ebook.prix)}`}
                </button>
              </form>
            )}

            {etape === 'paiement' && achat && (
              <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6 text-center space-y-3">
                <div className="h-12 w-12 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
                  </svg>
                </div>
                <p className="font-serif text-base text-ink">Paiement en attente</p>
                <p className="text-[13px] text-ink-soft/75">Montant : <strong>{formatFCFA(achat.prix_paye)}</strong></p>
                <p className="text-[11px] text-ink-soft/75">
                  L'intégration InTouch n'est pas encore branchée — ce bouton simule une confirmation de paiement réussie, uniquement disponible en développement.
                </p>
                <button
                  onClick={confirmerPaiementSimule} disabled={confirmationEnCours}
                  className="bg-teal hover:bg-teal-dark text-white font-bold px-5 py-2.5 rounded-btn text-[13px] transition-colors disabled:opacity-50"
                >
                  {confirmationEnCours ? '...' : 'Simuler le paiement réussi'}
                </button>
              </div>
            )}

            {etape === 'succes' && achat && (
              <div className="bg-white rounded-m shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] p-6 text-center space-y-3">
                <div className="h-12 w-12 mx-auto rounded-full bg-teal/10 flex items-center justify-center text-teal-dark">
                  <CheckIcon className="h-5 w-5" />
                </div>
                <p className="font-serif text-base text-ink">Paiement confirmé !</p>
                <p className="text-[13px] text-ink-soft/75">Votre e-book vous attend juste ici :</p>
                <a
                  href={`${API_BASE}/ebook/telecharger/${achat.token_telechargement}/`}
                  className="inline-flex items-center gap-2 bg-[#3D1B36] hover:bg-[#2c1327] text-white font-bold px-5 py-2.5 rounded-btn text-[13px] transition-colors"
                >
                  Télécharger mon e-book
                </a>
                <p className="text-[11px] text-ink-soft/75">Gardez ce lien, il reste valable pour retélécharger votre e-book.</p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className="max-w-[820px] mx-auto px-6">
          <Reveal className="mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-dark mb-4">Questions fréquentes</p>
            <h2 className="font-serif text-[28px] sm:text-[36px] leading-[1.15] text-ink mb-4">Tout savoir avant de télécharger</h2>
            <p className="text-ink-soft text-[14.5px] leading-relaxed">Des réponses simples sur le format, la lecture et la version proposée.</p>
          </Reveal>

          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} className="bg-white rounded-2xl shadow-[0_10px_30px_-14px_rgba(27,36,48,0.22)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFaqOuvert(faqOuvert === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4.5 text-left"
                >
                  <span className="font-semibold text-[14.5px] text-ink">{f.q}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 shrink-0 text-ink-soft/75 transition-transform ${faqOuvert === i ? 'rotate-180' : ''}`}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {faqOuvert === i && (
                  <div className="px-6 pb-4.5">
                    <p className="text-[13.5px] text-ink-soft leading-relaxed">{f.r}</p>
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#3D1B36] py-16 md:py-20">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal mb-4">De Yaay à Yaay</p>
            <h2 className="font-serif text-cream text-[26px] sm:text-[32px] leading-[1.2] mb-8">
              Offrez-vous l'expérience qu'une maman aurait aimé avoir avant son premier bébé.
            </h2>
            <a href="#acheter" className="inline-flex items-center gap-2 bg-white text-[#3D1B36] px-7 py-3.5 rounded-full text-sm font-bold hover:bg-cream transition-colors">
              Je télécharge mon guide
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
