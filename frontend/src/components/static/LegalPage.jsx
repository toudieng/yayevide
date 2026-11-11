// frontend/src/components/static/LegalPage.jsx
import Layout from '../layout/Layout';
import PageBanner from '../ui/PageBanner';
import Reveal from '../ui/Reveal';

export default function LegalPage({ title, updatedAt, sections }) {
  return (
    <Layout>
      <PageBanner title={title} subtitle={`Dernière mise à jour : ${updatedAt}`} compact />

      <Reveal className="max-w-[760px] mx-auto px-6 py-16 space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="font-serif text-xl text-ink mb-3">{section.title}</h2>
            <p className="text-[14.5px] text-ink-soft leading-relaxed whitespace-pre-line">{section.content}</p>
          </div>
        ))}
      </Reveal>
    </Layout>
  );
}
