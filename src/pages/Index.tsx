import { useEffect } from "react";
import { Link } from "react-router-dom";
import StoreLayout from "@/components/StoreLayout";
import HeroBanner from "@/components/HeroBanner";
import ProductSection from "@/components/ProductSection";
import BenefitsBar from "@/components/BenefitsBar";
import { products, getProductsByCategory } from "@/data/products";
import { trackPageView } from "@/utils/tracking";
import bannerPrincipiaDesktop from "@/assets/banner-principia-desktop.webp";
import bannerPrincipiaMobile from "@/assets/banner-principia-mobile.webp";
import MobileBannerCarousel from "@/components/MobileBannerCarousel";
import DesktopBannerCarousel from "@/components/DesktopBannerCarousel";

const Index = () => {
  useEffect(() => {
    trackPageView();
  }, []);

  const cosmeticosMaisVendidos = products
    .filter((p) => p.category.startsWith("cosmeticos"))
    .slice(0, 12);

  return (
    <StoreLayout>
      <HeroBanner />

      <MobileBannerCarousel />
      <DesktopBannerCarousel />

      <ProductSection
        title="Produtos Separados para Você"
        products={cosmeticosMaisVendidos}
        categorySlug="cosmeticos"
      />

      <section className="py-4">
        <div className="container-page">
          <Link to="/busca?q=principia" className="block overflow-hidden rounded-xl">
            <img
              src={bannerPrincipiaMobile}
              alt="Principia"
              className="block w-full h-auto md:hidden"
            />
            <img
              src={bannerPrincipiaDesktop}
              alt="Principia"
              className="hidden w-full h-auto md:block"
            />
          </Link>
        </div>
      </section>


      <BenefitsBar />
    </StoreLayout>
  );
};

export default Index;
