import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';
import { CATEGORIES } from '../../data/categories';
import { apiFetch } from '../../utils/api';

// Les photos et l'ordre viennent de l'API (modifiables depuis le dashboard
// admin) ; le tracé décoratif du petit fanion au coin de chaque carte reste
// une donnée purement visuelle côté code, associée par slug.
const FLAG_PATH_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.flagPath]));

function CategoryCard({ cat, index }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = ((y / r.height) - 0.5) * -8;
    const ry = ((x / r.width) - 0.5) * 8;
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
  };
  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  const isTeal = index % 2 === 1;

  return (
    <Link
      to={cat.href || `/boutique?categorie=${cat.slug}`}
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative block aspect-[4/3] overflow-hidden rounded-m border border-line transition-[transform,box-shadow] duration-200 ease-out hover:shadow-[0_18px_36px_-18px_rgba(27,36,48,0.4)]"
    >
      <span
        className="absolute top-0 left-0 z-2 h-0 w-0 border-y-[19px] border-r-[38px] border-y-transparent"
        style={{ borderRightColor: isTeal ? 'var(--color-teal)' : 'var(--color-clay)' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" className="absolute -left-7.5 top-0.5 h-3.5 w-3.5">
          <path d={FLAG_PATH_BY_SLUG[cat.slug]} />
        </svg>
      </span>
      <img loading="lazy" decoding="async"
        src={cat.image}
        alt={cat.nom}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(0deg, rgba(27,36,48,.82) 0%, rgba(27,36,48,.15) 60%)' }}
      />
      <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col items-center text-center gap-2.5">
        <span className="text-cream text-[14px] font-bold tracking-wide" style={{ fontFamily: 'var(--font-rounded)' }}>
          {cat.nom}
        </span>
        <span className="bg-orange text-white text-[11px] font-bold uppercase tracking-wide px-4 py-2 rounded-full transition-transform duration-300 group-hover:scale-105" style={{ fontFamily: 'var(--font-rounded)' }}>
          Découvrir
        </span>
      </div>
    </Link>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState(CATEGORIES.map((c) => ({ nom: c.name, slug: c.slug, image: c.img })));

  useEffect(() => {
    apiFetch('/categories/')
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (data.length > 0) setCategories(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="categories" className="py-12">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12">
        <SectionHeader
          eyebrow="Explorez"
          title="Nos catégories"
          description="Trouvez exactement ce dont vous avez besoin, du nouveau-né à l'adolescent."
          accent="teal"
        />

        <Reveal as="div" className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.slug} cat={cat} index={i} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
