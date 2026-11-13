import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';
import FlechesRangee from '../ui/FlechesRangee';
import useDefilementRangee from '../../hooks/useDefilementRangee';
import { CATEGORIES } from '../../data/categories';
import { apiFetch } from '../../utils/api';

// Les vraies catégories (photos, ordre) viennent de l'API, modifiables depuis
// le dashboard admin. On y ajoute les deux vitrines automatiques du site
// (« Occasions spéciales », « Bonnes affaires ») qui ne sont pas des
// catégories en base mais figurent dans la boutique : on retrouve ainsi les
// 8 entrées de la barre de filtres, avec les mêmes noms.
const VITRINES = CATEGORIES.filter((c) => c.href).map((c) => ({ nom: c.name, slug: c.slug, image: c.img, href: c.href }));
// La photo saisie dans l'admin passe toujours en premier (l'équipe gère son
// site). Image de secours par slug (photos du projet, assets/categories) si la
// photo de l'admin est absente ou ne se charge pas, puis fond dégradé.
const IMAGE_SECOURS = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.img]));

function CategoryCard({ cat }) {
  const ref = useRef(null);
  // 0 = photo de l'API, 1 = photo de secours, 2 = aucune (fond dégradé)
  const [essai, setEssai] = useState(cat.image ? 0 : 1);
  const source = essai === 0 ? cat.image : essai === 1 ? IMAGE_SECOURS[cat.slug] : null;

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

  return (
    <Link
      to={cat.href || `/boutique?categorie=${cat.slug}`}
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative block shrink-0 w-[44%] snap-start sm:w-auto aspect-[4/3] overflow-hidden rounded-m transition-[transform,box-shadow] duration-200 ease-out hover:shadow-[0_18px_36px_-18px_rgba(27,36,48,0.4)]"
    >
      {/* fond doux affiché si aucune photo n'est disponible */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-dark to-ink" aria-hidden="true" />
      {source && (
        <img
          loading="lazy"
          decoding="async"
          src={source}
          alt=""
          onError={() => setEssai((e) => e + 1)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(0deg, rgba(27,36,48,.82) 0%, rgba(27,36,48,.15) 60%)' }}
      />
      <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col items-center text-center gap-2.5">
        <span className="text-cream text-[14px] font-bold tracking-wide" style={{ fontFamily: 'var(--font-rounded)' }}>
          {cat.nom}
        </span>
        <span className="bg-clay-dark text-white text-[11px] font-bold uppercase tracking-wide px-4 py-2 rounded-full transition-transform duration-300 group-hover:scale-105" style={{ fontFamily: 'var(--font-rounded)' }}>
          Découvrir
        </span>
      </div>
    </Link>
  );
}

export default function Categories() {
  const { ref, bords, majBords, defiler } = useDefilementRangee();
  const [categories, setCategories] = useState(CATEGORIES.map((c) => ({ nom: c.name, slug: c.slug, image: c.img, href: c.href })));

  useEffect(() => {
    apiFetch('/categories/')
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (data.length > 0) {
          const slugs = new Set(data.map((c) => c.slug));
          setCategories([...data, ...VITRINES.filter((v) => !slugs.has(v.slug))]);
        }
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

        {/* Mobile : rangée qui défile de côté ; dès 640 px : grille de 4. */}
        <Reveal as="div">
        <div
          ref={ref}
          onScroll={majBords}
          className="-mx-6 px-6 flex gap-3.5 overflow-x-auto snap-x snap-mandatory scroll-px-6 no-scrollbar pb-2 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-4"
        >
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} cat={cat} />
          ))}
        </div>
        <FlechesRangee bords={bords} defiler={defiler} precedent="Catégories précédentes" suivant="Catégories suivantes" />
        </Reveal>
      </div>
    </section>
  );
}
