// frontend/src/pages/APropos.jsx
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PageBanner from '../components/ui/PageBanner';
import Reveal from '../components/ui/Reveal';

const HERO_IMG = 'https://images.unsplash.com/photo-1542385151-efd9000785a0?fm=jpg&q=80&w=2000&auto=format&fit=crop';
const IMG_TATA = 'https://images.unsplash.com/photo-1560707854-fb9a10eeaace?fm=jpg&q=75&w=900&auto=format&fit=crop';
const IMG_BALKIS = 'https://images.unsplash.com/photo-1622290319146-7b63df48a635?fm=jpg&q=75&w=900&auto=format&fit=crop';

export default function APropos() {
  return (
    <Layout>
      <PageBanner eyebrow="Yoonu Yaye" title="À propos de Yaay Vidé" subtitle="L'histoire d'un amour qui circule." image={HERO_IMG} />

      <div className="max-w-[1000px] mx-auto px-6 md:px-12 py-16 space-y-20">

        {/* RÉCIT PERSONNEL */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <Reveal>
            <p className="text-[15px] text-ink-soft leading-relaxed mb-4">
              Je suis <span className="text-clay-dark font-semibold">la tata</span>. Celle qu'on appelle à chaque naissance.
              Celle qui cherche les plus jolis habits, les objets pratiques mais doux, les petites attentions choisies
              avec soin.
            </p>
            <p className="text-[15px] text-ink-soft leading-relaxed">
              Celle qui, à chaque arrivée d'un bébé, ressent cette joie pure mêlée d'un devoir d'amour : celui de{' '}
              <span className="text-clay-dark font-semibold">transmettre, protéger, célébrer la vie</span>.
            </p>
          </Reveal>
          <Reveal className="rounded-m overflow-hidden border border-line aspect-[4/5]">
            <img loading="lazy" decoding="async" src={IMG_TATA} alt="" className="h-full w-full object-cover" />
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <Reveal className="rounded-m overflow-hidden border border-line aspect-[4/5] md:order-1">
            <img loading="lazy" decoding="async" src={IMG_BALKIS} alt="" className="h-full w-full object-cover" />
          </Reveal>
          <Reveal>
            <h2 className="font-serif text-2xl text-ink mb-4">L'histoire de Balkis</h2>
            <p className="text-[15px] text-ink-soft leading-relaxed mb-4">
              Depuis Paris, j'ai rassemblé vêtements, accessoires, coups de cœur. Un mois plus tard, une valise
              franchissait l'océan, pleine de tendresse pour une petite fille à venir : Balkis.
            </p>
            <p className="text-[15px] text-ink-soft leading-relaxed">
              Chez nous, au sein de notre famille, on ne transige pas avec l'essentiel : « Chaque enfant mérite
              d'être accueilli avec dignité, entouré de beau et de bon. »
            </p>
          </Reveal>
        </div>

        {/* ÉTYMOLOGIE DU NOM */}
        <Reveal className="text-center">
          <h2 className="font-serif text-2xl sm:text-3xl text-ink mb-6">Notre vision : une marketplace du cœur</h2>
          <p className="text-[15px] text-ink-soft leading-relaxed max-w-2xl mx-auto mb-8">
            Yaay-Vidé n'est pas juste un site de seconde main. C'est un espace où l'économie circulaire rencontre la
            sororité. Où chaque article vendu raconte une histoire d'amour maternel.
          </p>
          <div className="bg-ink text-cream rounded-m p-8 max-w-xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.18em] text-clay-dark font-bold mb-3">Pourquoi le nom « Yaay Vidé » ?</p>
            <p className="text-[14.5px] text-cream/80 leading-relaxed">
              Inspirée du mot wolof <span className="italic text-cream">« Yaay »</span> (maman) et de l'expression
              <span className="italic text-cream"> « vidé »</span> (vendre ou liquider en seconde main), Yaay Vidé est
              une communauté digitale qui fait circuler l'amour et les objets avec bienveillance.
            </p>
          </div>
        </Reveal>
      </div>

      {/* CTA FINAL */}
      <div className="bg-gradient-to-br from-teal to-teal-dark text-cream py-16 px-6 text-center">
        <Reveal>
          <h2 className="font-serif text-2xl sm:text-3xl mb-4">Et maintenant ?</h2>
          <p className="text-cream/85 text-[15px] max-w-lg mx-auto mb-8 leading-relaxed">
            Je vous tends ce projet comme on tend les bras à une sœur. Rejoignez-nous. Faites partie de ce mouvement
            doux et puissant, où l'on élève les enfants ensemble, avec du beau, du bon, du sens.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/inscription" className="px-7 py-3.5 bg-clay-dark text-white rounded-btn text-sm font-bold uppercase tracking-wide hover:bg-ink transition-colors">
              Rejoindre la communauté
            </Link>
            <Link to="/boutique" className="px-7 py-3.5 border border-cream/50 text-cream rounded-btn text-sm font-bold uppercase tracking-wide hover:bg-cream/10 transition-colors">
              Découvrir les articles
            </Link>
          </div>
          <p className="text-cream/60 text-[13px] italic mt-8">Avec tendresse et détermination ♥</p>
        </Reveal>
      </div>
    </Layout>
  );
}
