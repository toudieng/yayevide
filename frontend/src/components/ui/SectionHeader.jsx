// frontend/src/components/ui/SectionHeader.jsx
import Reveal from './Reveal';

/**
 * En-tête de section centré et cohérent, utilisé par toutes les sections de
 * l'accueil (Engagements, Catégories, Bonnes affaires, Blog, Témoignages) :
 * eyebrow + petit soulignement centré dessous + titre + description.
 */
export default function SectionHeader({ eyebrow, title, description, accent = 'clay', className = '' }) {
  const accentColor = accent === 'teal' ? 'bg-teal text-teal-dark' : 'bg-clay text-clay';
  const [bgClass, textClass] = accentColor.split(' ');

  return (
    <Reveal className={`max-w-xl mx-auto text-center mb-7 ${className}`}>
      <div className={`text-[13px] font-bold uppercase tracking-[0.18em] ${textClass}`}>
        {eyebrow}
      </div>
      <span className={`block mx-auto mt-2.5 mb-5 h-[3px] w-10 rounded-full ${bgClass}`} />
      <h2 className="font-impact font-extrabold text-ink text-[28px] sm:text-[36px] leading-tight">{title}</h2>
      {description && (
        <p className="mt-4 text-ink-soft text-[15px] leading-relaxed">{description}</p>
      )}
    </Reveal>
  );
}
