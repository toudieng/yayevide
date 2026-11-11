import useReveal from '../../hooks/useReveal';

/**
 * <Reveal> — enveloppe un bloc pour qu'il apparaisse en fondu + léger
 * glissement quand il entre dans le viewport. Usage :
 *   <Reveal><h2>Titre</h2></Reveal>
 *   <Reveal as="div" className="grid ...">...</Reveal>
 */
export default function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
