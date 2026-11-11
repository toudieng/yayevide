// frontend/src/components/ui/PageBanner.jsx
import Reveal from './Reveal';

/**
 * Bannière de page statique — fond image avec voile sombre + Ken Burns,
 * ou fond uni encre si aucune image n'est fournie (pages plus formelles
 * comme les CGV). Cohérent avec BoutiqueBanner / Hero de l'accueil.
 */
export default function PageBanner({ eyebrow, title, subtitle, image, compact = false }) {
  return (
    <div className={`relative overflow-hidden ${compact ? 'h-[160px] sm:h-[190px]' : 'h-[230px] sm:h-[300px]'} ${image ? '' : 'bg-ink'}`}>
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover animate-kenburns" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/88 via-ink/40 to-ink/15" />
        </>
      )}
      {!image && (
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 25%, var(--color-teal) 0%, transparent 40%), radial-gradient(circle at 85% 75%, var(--color-clay) 0%, transparent 40%)',
          }}
        />
      )}
      <Reveal className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-clay mb-3">{eyebrow}</p>
        )}
        <h1 className="font-serif text-[28px] sm:text-[40px] text-cream leading-tight max-w-2xl">{title}</h1>
        {subtitle && <p className="text-cream/75 text-[14.5px] mt-3 max-w-lg">{subtitle}</p>}
      </Reveal>
    </div>
  );
}
