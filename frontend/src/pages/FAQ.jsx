// frontend/src/pages/FAQ.jsx
import { useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import PageBanner from '../components/ui/PageBanner';
import Reveal from '../components/ui/Reveal';

const FAQ_DATA = [
  {
    categorie: 'À propos de Yaay Vidé',
    questions: [
      { q: "Qu'est-ce que Yaay Vidé ?", r: "Yaay Vidé est une plateforme numérique (site web + application mobile) dédiée à la vente et à la location d'articles de seconde main et neufs, principalement liés à l'enfance, la maternité, la parentalité et certaines catégories féminines. Elle garantit un processus sécurisé, une logistique centralisée et une vérification des produits avant livraison." },
    ],
  },
  {
    categorie: 'Fonctionnement de la plateforme',
    questions: [
      { q: 'Comment acheter un article sur Yaay Vidé ?', r: "Parcourez le catalogue, ajoutez l'article souhaité au panier et payez directement via Intouch (Wave, Orange Money, Free Money, carte bancaire). L'article est collecté, vérifié, puis livré sous 24h à 48h." },
      { q: 'Comment vendre un article ?', r: "Créez un compte vendeur, publiez vos articles avec photos et description honnête (poids et taille du colis précisés). Une fois l'article vendu, un livreur Yaay Vidé le récupère et le vérifie avant de le livrer à l'acheteuse et de libérer votre paiement." },
      { q: 'Puis-je louer un article sur Yaay Vidé ?', r: "Oui, via le bouton « Louer ». Cette option est soumise à des conditions de location et de vérification strictes. Les colis sont systématiquement inspectés à l'aller comme au retour." },
    ],
  },
  {
    categorie: 'Paiements et sécurité',
    questions: [
      { q: 'Quels moyens de paiement acceptez-vous ?', r: 'Wave, Orange Money, Free Money et carte bancaire, via notre partenaire sécurisé Intouch.' },
      { q: 'Comment et quand suis-je payée pour mes ventes ?', r: "Vos paiements sont sécurisés par Intouch. Vous choisissez : récupérer immédiatement le montant de votre vente, ou cumuler vos gains et programmer des retraits à la fréquence de votre choix (journalière, hebdomadaire ou mensuelle)." },
    ],
  },
  {
    categorie: 'Livraison',
    questions: [
      { q: 'Qui paie la livraison et comment est-elle calculée ?', r: "Les frais de livraison sont entièrement à la charge de l'acheteuse, calculés selon le poids et la taille du colis, quelle que soit la zone dans la région de Dakar. Tarifs : 1500 FCFA pour un colis S-M (jusqu'à 2kg), 2000 FCFA pour un colis L-XL (entre 2 et 3kg), et une tarification spécifique à partir de XXL. Ils sont payés directement au livreur (Orange Money, Wave, Free Money ou espèces)." },
      { q: "Comment s'organisent les livraisons ?", r: "Deux rotations par jour, le matin et l'après-midi. Un service de livraison express est également disponible en cas d'urgence, avec une tarification individuelle selon le colis." },
    ],
  },
  {
    categorie: 'Commissions et frais',
    questions: [
      { q: 'Quels sont les frais appliqués ?', r: "10% de commission fixe (Yaay Vidé + Intouch), répartis ainsi : commission Yaay Vidé (environ 8% du prix de vente), collecte gratuite pour la vendeuse, livraison à la charge de l'acheteuse, et frais de transaction Intouch (1,5% à 3% selon le mode de paiement). À la récupération de vos gains, 1% supplémentaire s'applique selon les normes propres à Wave et Orange Money." },
    ],
  },
  {
    categorie: 'Qualité et litiges',
    questions: [
      { q: 'Comment garantissez-vous la qualité des articles ?', r: "Chaque article est vérifié pour s'assurer de sa conformité avec l'annonce, de son état général et de sa propreté." },
      { q: 'Que faire en cas de litige ?', r: "Les ventes étant fermes et définitives, Yaay Vidé n'organise pas de retour ni de remboursement. En cas de problème avéré avec une commande, déposez une plainte via le Centre de plainte accessible depuis votre compte — notre équipe examine chaque cas individuellement." },
    ],
  },
  {
    categorie: 'Publicité et partenariats',
    questions: [
      { q: 'Puis-je faire de la publicité sur Yaay Vidé ?', r: 'Oui — contactez notre service client pour connaître les tarifs de nos supports : site web, application mobile (bientôt disponible) et posts sponsorisés.' },
      { q: 'Des partenariats sont-ils possibles ?', r: 'Oui, nous sommes ouverts aux collaborations, notamment avec des ONG, des marques locales, des structures éducatives, des bambineries et autres.' },
    ],
  },
  {
    categorie: 'Contact et assistance',
    questions: [
      { q: 'Comment vous contacter ?', r: 'Téléphone : 71 018 91 91 / 76 931 99 11 — Email : contact@yaayvide.com — Adresse : Dakar, Sénégal — Réseaux sociaux : Facebook, Instagram, TikTok (@yaayvide).' },
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
          className={`h-4 w-4 shrink-0 text-ink-soft/60 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-[13.5px] text-ink-soft leading-relaxed">{r}</p>
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
          <p className="text-center text-ink-soft/60 text-sm">Aucune question ne correspond à votre recherche.</p>
        ) : (
          <div className="space-y-10">
            {filtered.map((cat) => (
              <Reveal key={cat.categorie}>
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-teal mb-4">{cat.categorie}</h2>
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
