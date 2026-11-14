// frontend/src/pages/Contact.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PageBanner from '../components/ui/PageBanner';
import Reveal from '../components/ui/Reveal';
import { WHATSAPP_EQUIPE } from '../config/contact';


export default function Contact() {
  const [formData, setFormData] = useState({ nom: '', email: '', message: '' });
  const [envoye, setEnvoye] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pas de backend de messagerie pour l'instant : on relaie directement vers WhatsApp,
    // cohérent avec le reste du site qui mise sur ce canal pour les échanges directs.
    const texte = encodeURIComponent(
      `Nouveau message via le site Yaay Vidé\nNom : ${formData.nom}\nEmail : ${formData.email}\n\n${formData.message}`
    );
    window.open(`https://wa.me/${WHATSAPP_EQUIPE}?text=${texte}`, '_blank');
    setEnvoye(true);
  };

  return (
    <Layout>
      <PageBanner eyebrow="Restons en contact" title="Une question ? Nous sommes là." subtitle="Notre équipe vous répond rapidement, par WhatsApp ou par email." compact />

      <div className="max-w-[1000px] mx-auto px-6 md:px-12 py-16">
        {/* Avec un compte : discussion suivie directement sur le site */}
        <Link
          to="/aide"
          className="mb-10 flex flex-col sm:flex-row sm:items-center gap-4 rounded-m bg-peche/70 border border-orange/20 p-5 sm:p-6 hover:border-clay transition-colors"
        >
          <span className="h-12 w-12 shrink-0 rounded-full bg-teal-dark text-white flex items-center justify-center" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12zM9.5 9.5a2.5 2.5 0 114 2c-.9.5-1.5 1-1.5 2M12 16.5h.01" />
            </svg>
          </span>
          <span className="flex-1">
            <span className="block font-impact font-extrabold text-[18px] text-ink">Vous avez un compte Yaay Vidé ?</span>
            <span className="block text-[14px] text-ink-soft mt-0.5">
              Posez votre question directement depuis le site : vous gardez tout l'historique et vous pouvez joindre une commande.
            </span>
          </span>
          <span className="self-start sm:self-center inline-flex items-center min-h-[44px] px-5 rounded-full bg-clay-dark text-white text-sm font-bold">
            Écrire à l'équipe
          </span>
        </Link>

        <div className="grid md:grid-cols-[1fr_320px] gap-10">

          {/* FORMULAIRE */}
          <Reveal>
            {envoye ? (
              <div className="bg-cream border border-line rounded-m p-10 text-center h-full flex flex-col items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-teal/10 text-teal-dark flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                    <path d="M5 12l4.5 4.5L19 7" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl text-ink mb-2">Message envoyé !</h3>
                <p className="text-sm text-ink-soft/75">Nous vous répondons très vite sur WhatsApp.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-cream border border-line rounded-m shadow-xl overflow-hidden">
                <div className="h-1.5 bg-teal" />
                <div className="p-8 space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">Nom complet *</label>
                    <input
                      type="text" required value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">Email *</label>
                    <input
                      type="email" required value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-2">Message *</label>
                    <textarea
                      required rows={5} value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-sable border border-line rounded-btn text-sm focus:outline-none focus:border-teal transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-ink text-cream rounded-btn py-3.5 text-sm font-bold uppercase tracking-wide hover:bg-clay-dark hover:-translate-y-0.5 transition-all"
                  >
                    Envoyer le message
                  </button>
                </div>
              </form>
            )}
          </Reveal>

          {/* INFOS */}
          <Reveal className="bg-ink text-cream rounded-m p-8 space-y-6 h-fit">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-cream/50 mb-2.5">Une réponse rapide ?</p>
              <a
                href={`https://wa.me/${WHATSAPP_EQUIPE}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-teal hover:bg-teal-dark text-white rounded-btn py-3.5 text-sm font-bold uppercase tracking-wide transition-all hover:-translate-y-0.5"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1112 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2 1 2.4c.1.1 1.6 2.5 3.9 3.4.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1 0-.1-.2-.2-.4-.3z" />
                </svg>
                Discuter sur WhatsApp
              </a>
            </div>
            <div className="h-px bg-cream/15" />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-cream/50 mb-1.5">Email</p>
              <p className="text-sm font-semibold">support@yaayvide.com</p>
            </div>
            <div className="h-px bg-cream/15" />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-cream/50 mb-1.5">Horaires</p>
              <p className="text-sm text-cream/80">Lundi – Samedi : 9h – 21h</p>
              <p className="text-sm text-cream/80">Dimanche : 9h – 18h</p>
            </div>
          </Reveal>
        </div>
      </div>
    </Layout>
  );
}
