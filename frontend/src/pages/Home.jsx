import Layout from '../components/layout/Layout';
import TrustStrip from '../components/layout/TrustStrip';
import Hero from '../components/home/Hero';
import MeilleursProduits from '../components/home/MeilleursProduits';
import Engagements from '../components/home/Engagements';
import VendeuseCTABanner from '../components/home/VendeuseCTABanner';
import Categories from '../components/home/Categories';
import BonnesAffaires from '../components/home/BonnesAffaires';
import Testimonials from '../components/home/Testimonials';
import BlogPreview from '../components/home/BlogPreview';

export default function Home() {
  return (
    <Layout>
      <Hero />
      <TrustStrip />
      <MeilleursProduits />
      <Engagements />
      <VendeuseCTABanner />
      <Categories />
      <BonnesAffaires />
      <Testimonials />
      <BlogPreview />
    </Layout>
  );
}
