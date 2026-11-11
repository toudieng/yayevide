// frontend/src/components/static/GuideSteps.jsx
import { Link } from 'react-router-dom';
import Layout from '../layout/Layout';
import Reveal from '../ui/Reveal';

export default function GuideSteps({ badge, title, titleAccent, subtitle, heroImage, steps, note, trust, cta }) {
  return (
    <Layout>
      <section className="relative grid grid-cols-1 md:grid-cols-2 bg-ink overflow-hidden">
        <div className="relative z-[1] px-6 md:px-16 py-20 md:py-36 flex flex-col justify-center">
          {badge && (
            <span className="inline-flex items-center gap-2 self-start bg-white/10 text-cream text-[11.5px] font-bold uppercase tracking-[0.14em] px-4 py-2.5 rounded-full mb-7 border border-white/15">
              {badge}
            </span>
          )}
          <h1 className="font-serif font-semibold text-cream text-[38px] sm:text-[52px] leading-[1.08] mb-6">
            {title} <span className="italic text-orange">{titleAccent}</span>
          </h1>
          <p className="text-cream/70 text-[17px] leading-relaxed max-w-md mb-9">{subtitle}</p>
          <a
            href="#etapes"
            className="inline-flex items-center gap-2 self-start bg-clay-dark hover:bg-ink text-white px-7 py-4 rounded-full text-[15px] font-bold transition-colors"
          >
            Découvrir les {steps.length} étapes
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
          </a>
        </div>
        <div className="relative h-[320px] md:h-[560px]">
          <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/40 via-transparent to-transparent md:bg-gradient-to-r md:from-ink md:via-ink/10 md:to-transparent" />
        </div>
      </section>

      <div id="etapes" className="bg-white">
        <div className="max-w-[1180px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <div className="space-y-24 md:space-y-36">
            {steps.map((step, i) => {
              const impair = i % 2 === 1;
              const accent = i % 2 === 0 ? 'teal' : 'orange';
              const numero = String(i + 1).padStart(2, '0');
              return (
                <Reveal
                  key={step.title}
                  className="grid grid-cols-1 md:grid-cols-2 items-center gap-12 md:gap-16"
                >
                  {step.image && (
                    <div className={`relative ${impair ? 'md:order-2' : 'md:order-1'}`}>
                      <div className={`absolute -bottom-5 -right-5 w-full h-full rounded-[28px] ${
                        accent === 'teal' ? 'bg-teal/12' : 'bg-orange/12'
                      }`} />
                      <div className="relative rounded-[24px] overflow-hidden shadow-xl">
                        <img loading="lazy" decoding="async" src={step.image} alt={step.title} className="w-full aspect-[4/3.1] object-cover" />
                      </div>
                      <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full flex items-center justify-center text-white font-serif text-2xl font-bold shadow-lg ${
                        accent === 'teal' ? 'bg-teal' : 'bg-orange'
                      }`}>
                        {numero}
                      </div>
                    </div>
                  )}

                  <div className={impair ? 'md:order-1' : 'md:order-2'}>
                    <div className="flex items-center gap-3 mb-4 text-[12.5px] font-bold uppercase tracking-[0.1em]">
                      <span className={accent === 'teal' ? 'text-teal-dark' : 'text-orange'}>Étape {i + 1}</span>
                      {step.tag && (
                        <>
                          <span className="h-3.5 w-px bg-line" />
                          <span className="text-ink-soft/75">{step.tag}</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-serif text-[28px] sm:text-[34px] leading-[1.15] text-ink mb-5">{step.title}</h3>
                    <p className="text-[16px] text-ink-soft leading-[1.7] mb-7">{step.description}</p>

                    {step.points && step.points.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 mb-7">
                        {step.points.map((point) => (
                          <div key={point} className="flex items-start gap-2.5">
                            <span className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              accent === 'teal' ? 'bg-teal/15 text-teal-dark' : 'bg-orange/15 text-orange'
                            }`}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                                <path d="M5 12l4.5 4.5L19 7" />
                              </svg>
                            </span>
                            <span className="text-[14.5px] font-bold text-ink leading-snug">{point}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {step.tip && (
                      <div className={`rounded-m p-5 flex items-start gap-3.5 ${
                        accent === 'teal' ? 'bg-teal/8' : 'bg-orange/8'
                      }`}>
                        <span className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                          accent === 'teal' ? 'bg-teal/15 text-teal-dark' : 'bg-orange/15 text-orange'
                        }`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                            <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0012 2z" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-[14px] font-bold text-ink mb-1">{step.tip.title}</p>
                          <p className="text-[13.5px] text-ink-soft leading-relaxed">{step.tip.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>

          {note && (
            <Reveal className="mt-20 bg-sable border border-line rounded-m p-8 md:p-10">
              <h3 className="font-serif text-xl text-ink mb-3">{note.title}</h3>
              <div className="text-[15px] text-ink-soft leading-relaxed whitespace-pre-line">{note.content}</div>
            </Reveal>
          )}
        </div>
      </div>

      {trust && (
        <section className="relative bg-ink py-20 md:py-24 overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
          <div className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-white/5" />

          <Reveal className="relative z-[1] max-w-[780px] mx-auto px-6 text-center">
            <div className="h-16 w-16 mx-auto mb-7 rounded-full bg-orange flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="h-7 w-7">
                <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-teal mb-5">{trust.eyebrow}</p>
            <h2 className="font-serif text-cream text-[28px] sm:text-[36px] leading-[1.15] mb-5">{trust.title}</h2>
            <p className="text-cream/65 text-[16px] leading-relaxed mb-11 max-w-lg mx-auto">{trust.subtitle}</p>

            <div className="flex flex-wrap items-center justify-center gap-y-2">
              {trust.phases.map((phase, i) => (
                <div key={phase} className="flex items-center">
                  <span className="text-[13px] font-bold text-cream bg-white/10 border border-white/15 px-5 py-3 rounded-full whitespace-nowrap">
                    {phase}
                  </span>
                  {i < trust.phases.length - 1 && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-orange mx-2 shrink-0">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {cta && (
        <div className="bg-white">
          <div className="max-w-[1080px] mx-auto px-6 md:px-12 py-16">
            <Reveal className="text-center bg-sable border border-line rounded-m p-10 md:p-14">
              <h3 className="font-serif text-2xl text-ink mb-2">{cta.title}</h3>
              <p className="text-sm text-ink-soft/75 mb-7">{cta.subtitle}</p>
              <Link
                to={cta.to}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-clay-dark text-white rounded-btn text-sm font-bold uppercase tracking-wide hover:bg-orange-dark transition-colors"
              >
                {cta.label}
              </Link>
            </Reveal>
          </div>
        </div>
      )}
    </Layout>
  );
}
