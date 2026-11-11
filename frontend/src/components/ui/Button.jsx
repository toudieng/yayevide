import { Link } from 'react-router-dom';

const VARIANTS = {
  primary:
    // clay-dark : texte clair lisible (5.7:1) ; le survol se lit par l'élévation
    'bg-clay-dark text-cream hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-10px_rgba(196,96,47,0.55)]',
  'outline-light':
    'border border-cream/55 text-cream hover:bg-white/10 hover:border-white hover:-translate-y-0.5',
  'outline-ink':
    'border border-ink text-ink hover:bg-ink hover:text-cream',
  // bleu de la marque (teal-dark : texte blanc lisible, 5.8:1)
  teal:
    'bg-teal-dark text-white hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-10px_rgba(23,111,132,0.55)]',
  orange:
    // orange du logo : texte foncé (blanc illisible sur cet orange, 2.5:1)
    'bg-orange text-ink hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-10px_rgba(251,133,2,0.6)]',
};

/**
 * <Button> — bouton/lien partagé. Passe `to="/route"` pour un <Link>
 * React Router, `href` pour un <a>, sinon rend un <button>.
 *   <Button variant="primary" to="/categories" shine pulse>Découvrir</Button>
 */
export default function Button({
  variant = 'primary',
  to,
  href,
  shine = false,
  pulse = false,
  className = '',
  children,
  ...rest
}) {
  const classes = `relative inline-flex items-center gap-2.5 rounded-btn border border-transparent
    px-7 py-3.5 text-sm font-bold tracking-wide whitespace-nowrap
    transition-all duration-200 overflow-hidden disabled:opacity-60 disabled:pointer-events-none
    ${VARIANTS[variant] || VARIANTS.primary}
    ${shine ? 'btn-shine' : ''}
    ${pulse ? (variant === 'teal' ? 'animate-pulse-glow-teal' : 'animate-pulse-glow') : ''}
    ${className}`;

  const fontStyle = { fontFamily: 'var(--font-rounded)' };

  if (to) {
    return (
      <Link to={to} className={classes} style={fontStyle} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} style={fontStyle} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} style={fontStyle} {...rest}>
      {children}
    </button>
  );
}
