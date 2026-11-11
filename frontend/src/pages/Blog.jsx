// frontend/src/pages/Blog.jsx
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PageBanner from '../components/ui/PageBanner';
import Reveal from '../components/ui/Reveal';
import { ARTICLES } from '../data/articles';

export default function Blog() {
  return (
    <Layout>
      <PageBanner eyebrow="Le journal" title="Conseils, guides et bons plans parents" subtitle="Tout pour acheter, vendre et louer en toute confiance." compact />

      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARTICLES.map((article, i) => (
            <Reveal
              as={Link}
              key={article.slug}
              to={`/blog/${article.slug}`}
              className="group block rounded-m border border-line bg-cream overflow-hidden hover:shadow-[0_18px_36px_-20px_rgba(27,36,48,0.3)] transition-shadow"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img loading="lazy" decoding="async"
                  src={article.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <span className={`text-[10.5px] font-bold uppercase tracking-wide ${article.tagColor}`}>{article.tag}</span>
                <h3 className="font-serif text-[16.5px] leading-snug mt-2 mb-2.5">{article.title}</h3>
                <p className="text-[13px] text-ink-soft/75 leading-relaxed line-clamp-2 mb-3">{article.excerpt}</p>
                <p className="text-[11.5px] text-ink-soft/75">{article.date} · Lecture {article.readTime}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Layout>
  );
}
