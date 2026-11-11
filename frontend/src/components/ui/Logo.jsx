import logoUrl from '../../assets/logo.png';

/**
 * <Logo /> — le vrai logo Yaay Vidé (icône + wordmark inclus dans le PNG).
 * Utilisé sur fond clair (header). Pour le footer (fond encre), on
 * utilise un wordmark texte clair dédié — voir Footer.jsx — car le PNG
 * a un texte sombre illisible sur fond foncé.
 */
export default function Logo({ className = 'h-11', ...rest }) {
  return <img src={logoUrl} alt="Yaay Vidé" className={className} {...rest} />;
}
