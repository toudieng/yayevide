// frontend/src/pages/BlogArticle.jsx
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Reveal from '../components/ui/Reveal';
import { ARTICLES, findArticleBySlug } from '../data/articles';

export default function BlogArticle() {
  const { slug } = useParams();
  const article = findArticleBySlug(slug);

  if (!article) {
    return (
      <Layout>
        <div className="max-w-[600px] mx-auto px-6 py-24 text-center">
          <p className="font-serif text-2xl text-ink mb-3">Article introuvable</p>
          <Link to="/blog" className="text-teal font-semibold hover:underline">Retour au blog</Link>
        </div>
      </Layout>
    );
  }

  const autres = ARTICLES.filter((a) => a.slug !== slug).slice(0, 3);

  return (
    <Layout>
      <div className="relative h-[260px] sm:h-[340px] overflow-hidden">
        <img src={article.image} alt="" className="absolute inset-0 h-full w-full object-cover animate-kenburns" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/15" />
        <Reveal className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <span className={`inline-block rounded-full bg-clay px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white mb-4`}>
            {article.tag}
          </span>
          <h1 className="font-serif text-[26px] sm:text-[36px] text-cream leading-tight max-w-2xl">{article.title}</h1>
          <p className="text-cream/70 text-[13px] mt-3">{article.date} · Lecture {article.readTime}</p>
        </Reveal>
      </div>

      <Reveal className="max-w-[680px] mx-auto px-6 py-14 space-y-5">
        {article.content.map((paragraph, i) => (
          <p key={i} className="text-[15.5px] text-ink-soft leading-[1.8]">{paragraph}</p>
        ))}
      </Reveal>

      {autres.length > 0 && (
        <div className="bg-cream border-t border-line py-14">
          <div className="max-w-[1000px] mx-auto px-6 md:px-12">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-ink mb-6">À lire aussi</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {autres.map((a) => (
                <Link key={a.slug} to={`/blog/${a.slug}`} className="group block rounded-m border border-line bg-sable overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={a.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${a.tagColor}`}>{a.tag}</span>
                    <h3 className="font-serif text-[14.5px] leading-snug mt-1.5">{a.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
