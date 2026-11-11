import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';

const TESTIMONIALS = [
  {
    initial: 'A',
    name: 'Awa D.',
    role: 'Maman de deux enfants',
    quote:
      'Je trouve des articles impeccables pour mes enfants à des prix qui respectent mon budget. Ça a changé ma façon de consommer.',
    avatarBg: 'bg-ink',
  },
  {
    initial: 'M',
    name: 'Moussa N.',
    role: 'Jeune papa',
    quote:
      "La location m'a permis d'équiper la chambre de bébé sans tout acheter neuf. Simple et rassurant du début à la fin.",
    avatarBg: 'bg-teal',
  },
  {
    initial: 'F',
    name: 'Fatou S.',
    role: 'Vendeuse',
    quote: 'Vendre sur Yaay Vidé est devenu mon petit revenu complémentaire. Le processus est clair et bien guidé.',
    avatarBg: 'bg-clay',
  },
];

export default function Testimonials() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12">
        <SectionHeader
          eyebrow="Témoignages"
          title={<>Ce que disent nos <span className="italic text-clay">mamans</span> (et papas !)</>}
          description="Rejoignez les milliers de parents au Sénégal qui ont choisi une consommation plus responsable et économique pour leurs enfants."
        />

        {/* Mobile et tablette : rangée qui défile de côté ; dès 768 px : 3 colonnes.
            La rangée est focalisable pour pouvoir la faire défiler au clavier. */}
        <Reveal
          as="div"
          role="region"
          aria-label="Témoignages"
          tabIndex={0}
          className="-mx-6 px-6 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-6 no-scrollbar pb-2 md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:grid md:grid-cols-3 md:gap-5"
        >
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="shrink-0 w-[82%] sm:w-[60%] snap-start md:w-auto flex flex-col gap-4.5 rounded-m border border-line bg-cream p-6 md:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_36px_-20px_rgba(27,36,48,0.35)]"
            >
              <div className="text-clay text-sm">★★★★★</div>
              <blockquote className="font-serif italic text-lg leading-snug">«&nbsp;{t.quote}&nbsp;»</blockquote>
              <div className="flex items-center gap-3 mt-auto">
                <div
                  className={`h-9.5 w-9.5 shrink-0 rounded-full ${t.avatarBg} text-cream flex items-center justify-center font-serif text-sm`}
                >
                  {t.initial}
                </div>
                <div>
                  <div className="text-[13.5px] font-bold">{t.name}</div>
                  <div className="text-xs text-ink-soft">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
