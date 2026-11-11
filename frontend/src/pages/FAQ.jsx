// frontend/src/pages/FAQ.jsx
import { useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import PageBanner from '../components/ui/PageBanner';
import Reveal from '../components/ui/Reveal';

// Texte fourni par Yaay Vidé (FAQ_YAAYVIDE_final_1.docx).
const FAQ_DATA = [
  {
    categorie: "À propos de Yaay Vidé",
    questions: [
      { q: "Qu'est-ce que Yaay Vidé ?", r: "Yaay Vidé est une plateforme numérique (site web + application mobile) dédiée à la vente et à la location d'articles de seconde main et neufs, principalement liés à l'enfance, la maternité, la parentalité et à certaines catégories féminines. Elle garantit un processus sécurisé, une logistique centralisée et une vérification des produits avant livraison." },
    ],
  },
  {
    categorie: "Fonctionnement de la plateforme",
    questions: [
      { q: "Comment acheter un article sur Yaay Vidé ?", r: "1. Parcourez le catalogue sur le site ou l'application.\n2. Ajoutez au panier l'article souhaité et payez directement via Intouch (Wave, Orange Money, Mixx by Yas, carte bancaire).\n3. L'article est collecté, vérifié, puis livré sous 24h à 48h." },
      { q: "Comment vendre un article ?", r: "1. Créez un compte vendeur.\n2. Publiez vos articles avec des photos et une description honnête, en précisant le poids et la taille du colis.\n3. Lorsqu'un article est vendu, un livreur Yaay Vidé vient le récupérer et une vérification est effectuée.\n4. Après une vérification rigoureuse, il est livré à l'acheteur et le paiement est libéré." },
      { q: "Puis-je louer un article sur Yaay Vidé ?", r: "Oui, via le bouton « Louer ». Cette option est soumise à des conditions de location et de vérification de colis strictes, incluant une caution validée par la plateforme. Les colis sont systématiquement inspectés à l'aller comme au retour." },
    ],
  },
  {
    categorie: "Paiements et sécurité",
    questions: [
      { q: "Quels moyens de paiement acceptez-vous ?", r: "Nous acceptons les paiements par Wave, Orange Money, Mixx by Yas et carte bancaire via notre partenaire sécurisé Intouch." },
      { q: "Comment et quand suis-je payé pour mes ventes ?", r: "Les paiements sont sécurisés par Intouch. En tant que vendeur, vous avez le choix :\n• Récupérer immédiatement le montant de votre vente.\n• Cumuler les gains de plusieurs ventes et choisir une périodicité de retrait (journalière, hebdomadaire ou mensuelle)." },
    ],
  },
  {
    categorie: "Livraison",
    questions: [
      { q: "Qui paie la livraison et comment est-elle calculée ?", r: "Les frais de livraison sont entièrement à la charge de l'acheteur. Le tarif est calculé en fonction du poids et de la taille du colis, quelle que soit la zone de livraison dans la région de Dakar.\n\nLes frais de livraison sont payés directement au livreur Yaay Vidé après vérification du poids et de la taille réels. Les paiements possibles sont Orange Money, Wave, Mixx by Yas et espèces. Ils ne sont pas intégrés.\n\nTarifs :\n• Taille S – M (jusqu'à 2 kg) : 1 500 FCFA\n• Taille L – XL (entre 2 kg et 3 kg) : 2 000 FCFA\n• À partir de XXL : tarification spécifique en fonction du colis" },
      { q: "Comment s'organisent les livraisons ?", r: "Nous avons deux rotations de livraison par jour :\n• une le matin ;\n• une l'après-midi.\n\nUn service de livraison express est également disponible en cas d'urgence. Tarification individuelle en fonction du colis." },
    ],
  },
  {
    categorie: "Commissions et frais",
    questions: [
      { q: "Quels sont les frais appliqués ?", r: "10 % de frais de commission fixe (Yaay Vidé + Intouch), répartis comme suit :\n• Commission Yaay Vidé : variable, autour de 8 % du prix de vente.\n• Frais de collecte : gratuits pour le vendeur.\n• Frais de livraison : payés par l'acheteur (voir les tarifs dans la rubrique Livraison).\n• Frais de transaction (Intouch) : une commission variable de 1,5 % à 3 % est appliquée en fonction du mode de paiement choisi.\n\n1 % lors de la récupération des gains du vendeur, lié aux normes légales propres aux applications Wave et Orange Money." },
    ],
  },
  {
    categorie: "Qualité et litiges",
    questions: [
      { q: "Comment garantissez-vous la qualité des articles ?", r: "Chaque article est vérifié pour s'assurer de sa conformité avec l'annonce, de son état général et de sa propreté." },
      { q: "Que faire en cas de litige ?", r: "Contactez notre service client. Nous analysons le cas et proposons une résolution amiable. En cas de problème majeur, un remboursement ou un échange peut être effectué." },
    ],
  },
  {
    categorie: "Publicité et partenariats",
    questions: [
      { q: "Puis-je faire de la publicité sur Yaay Vidé ?", r: "Oui, appelez le service client pour connaître les tarifs de nos supports :\n• un site web\n• une application mobile (bientôt disponible)\n• des posts sponsorisés" },
      { q: "Des partenariats sont-ils possibles ?", r: "Oui, nous sommes ouverts à des collaborations, notamment avec des ONG, des marques locales, des structures éducatives, des bambineries et autres." },
    ],
  },
  {
    categorie: "Contact et assistance",
    questions: [
      { q: "Comment vous contacter ?", r: "• Téléphone : 71 018 91 91 / 76 931 99 11\n• Courriel : contact@yaayvide.com\n• Adresse : Dakar\n• Réseaux sociaux : Facebook, Instagram, TikTok (@yaayvide)" },
    ],
  },
];

function AccordionItem({ q, r }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-line rounded-btn overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-cream hover:bg-cream/70 transition-colors"
      >
        <span className="text-[14.5px] font-semibold text-ink">{q}</span>
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`h-4 w-4 shrink-0 text-ink-soft/75 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-[13.5px] text-ink-soft leading-relaxed whitespace-pre-line">{r}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FAQ_DATA;
    return FAQ_DATA.map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (item) => item.q.toLowerCase().includes(q) || item.r.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.questions.length > 0);
  }, [search]);

  return (
    <Layout>
      <PageBanner eyebrow="Centre d'aide" title="Foire aux questions" subtitle="Trouvez rapidement les réponses à vos questions sur Yaay Vidé." compact />

      <div className="max-w-[750px] mx-auto px-6 py-14">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une question..."
          className="w-full px-5 py-3.5 bg-cream border border-line rounded-btn text-sm mb-10 focus:outline-none focus:border-teal transition-colors"
        />

        {filtered.length === 0 ? (
          <p className="text-center text-ink-soft/75 text-sm">Aucune question ne correspond à votre recherche.</p>
        ) : (
          <div className="space-y-10">
            {filtered.map((cat) => (
              <Reveal key={cat.categorie}>
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-teal-dark mb-4">{cat.categorie}</h2>
                <div className="space-y-3">
                  {cat.questions.map((item) => (
                    <AccordionItem key={item.q} q={item.q} r={item.r} />
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
