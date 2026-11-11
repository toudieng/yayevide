import { Link } from 'react-router-dom';
import Reveal from '../ui/Reveal';
import Button from '../ui/Button';
import SectionHeader from '../ui/SectionHeader';
import EbookBanner from './EbookBanner';
import { ARTICLES } from '../../data/articles';

const [FEATURED, ...REST] = ARTICLES;
const SIDE_POSTS = REST.slice(0, 3);

export default function BlogPreview() {
  return (
    <section id="blog" className="py-12 bg-cream">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12">
        <SectionHeader eyebrow="Le journal" title="Conseils, guides et bons plans parents" />

        <EbookBanner />

        <Reveal as="div" className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <Link to={`/blog/${FEATURED.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-m border border-line">
            <img loading="lazy" decoding="async"
              src={FEATURED.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/88 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6.5">
              <span className="inline-block rounded-full bg-clay-dark px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
                {FEATURED.tag}
              </span>
              <h3 className="font-serif text-cream text-[23px] leading-snug mt-3.5 mb-2.5 max-w-[90%]">
                {FEATURED.title}
              </h3>
              <div className="text-cream/70 text-xs">Yaay Vidé · Lecture {FEATURED.readTime}</div>
            </div>
          </Link>

          <div className="flex flex-col">
            {SIDE_POSTS.map((p, i) => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className={`flex gap-4 py-5 ${i !== SIDE_POSTS.length - 1 ? 'border-b border-line' : ''} ${
                  i === 0 ? 'pt-0' : ''
                }`}
              >
                <img loading="lazy" decoding="async" src={p.image} alt="" className="h-21 w-21 shrink-0 rounded-btn border border-line object-cover" />
                <div>
                  <span className={`text-[10.5px] font-semibold uppercase tracking-wide ${p.tagColor}`}>
                    {p.tag}
                  </span>
                  <h4 className="font-serif text-[15.5px] leading-snug font-semibold my-1.5">{p.title}</h4>
                  <div className="text-[11.5px] text-ink-soft">Lecture {p.readTime}</div>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

        <Button to="/blog" variant="outline-ink" className="mt-10">
          Voir tous les articles →
        </Button>
      </div>
    </section>
  );
}
