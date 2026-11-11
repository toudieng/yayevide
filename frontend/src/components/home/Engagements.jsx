import { Link } from 'react-router-dom';
import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';

const ITEMS = [
  {
    title: 'Produits vérifiés',
    desc: 'Chaque article est contrôlé avant publication.',
    path: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z',
    lien: 'En savoir plus',
    to: '/comment-vendre',
  },
  {
    title: 'Paiement sécurisé',
    desc: 'Wave, Orange Money, Free Money & carte.',
    path: 'M3 10h18M5 10V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M5 10v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7',
    lien: 'Moyens de paiement',
    to: '/faq',
  },
  {
    title: 'Livraison express',
    desc: '24 à 48h partout à Dakar et en régions.',
    path: 'M2 8h13v8H2zM15 11h4l3 3v2h-7zM6.5 18.5a1.6 1.6 0 110-.1M17.5 18.5a1.6 1.6 0 110-.1',
    lien: 'Zones couvertes',
    to: '/faq',
  },
  {
    title: 'Service client',
    desc: 'Une équipe à votre écoute à chaque étape.',
    path: 'M4 15v-3a8 8 0 0 1 16 0v3M2 14h5v6H2zM17 14h5v6h-5z',
    lien: 'Nous contacter',
    to: '/contact',
  },
];

export default function Engagements() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12">
        <SectionHeader
          eyebrow="Nos engagements"
          title={<>Nos engagements chez<br /><span className="text-clay">Yaay Vidé</span> :</>}
          description="Parce que chaque parent mérite le meilleur pour ses enfants sans se ruiner, nous avons bâti une plateforme de confiance pour les familles sénégalaises."
        />

        {/* Grille centrée, icônes rondes noires */}
        <Reveal
          as="div"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12"
        >
          {ITEMS.map((item, i) => (
            <div key={item.title} className="group flex flex-col items-center text-center">
              <div
                className="h-12 w-12 rounded-full border border-ink/15 bg-ink/5 flex items-center justify-center mb-5 animate-float transition-transform duration-300 group-hover:scale-110"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" className="h-5.5 w-5.5 stroke-ink">
                  <path d={item.path} />
                </svg>
              </div>
              <h3 className="text-[14px] font-bold text-ink mb-2">{item.title}</h3>
              <p className="text-[13.5px] text-ink-soft leading-relaxed max-w-[230px]">{item.desc}</p>
              <Link to={item.to} className="mt-3 text-[12.5px] font-bold text-clay-dark hover:text-ink transition-colors">
                {item.lien} →
              </Link>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
