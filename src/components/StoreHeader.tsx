import { ShoppingCart, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/full-logo.png";
import logoMobile from "@/assets/logo-branco.png";
import { useCart } from "@/contexts/CartContext";
import SearchBar from "@/components/SearchBar";
import freteBanner from "@/assets/frete-gratis-banner.webp";


interface StoreHeaderProps {
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

const StoreHeader = ({ onToggleMobileMenu, mobileMenuOpen }: StoreHeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const { totalItems, setIsOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  return (
    <>
      {/* Mobile: frete grátis banner */}
      <Link to="/" className="block md:hidden w-full">
        <img
          src={freteBanner}
          alt="Frete grátis para todo Brasil"
          width={750}
          height={120}
          fetchPriority="high"
          decoding="async"
          className="w-full h-auto block"
         loading="lazy"/>
      </Link>

      {/* Mobile: full header (logo row + search) — non-sticky */}
      <div className="w-full bg-[#29ABE2] pt-4 pb-3 md:hidden">

        <div className="container-page relative flex items-center justify-center">
          <button
            onClick={onToggleMobileMenu}
            className="absolute left-4 text-white"
            aria-label="Menu"
          >
            <Menu className="h-7 w-7" />
          </button>
          <Link to="/" className="no-underline">
            <img src={logoMobile} alt="Tendencia Cosmeticos" className="h-[44px] w-auto"  loading="lazy"/>
          </Link>
          <button
            onClick={() => setIsOpen(true)}
            className="absolute right-4 flex items-center text-white transition-opacity hover:opacity-80"
            aria-label="Carrinho"
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white leading-none">
                {totalItems}
              </span>
            </div>
          </button>
        </div>
        <div className="container-page mt-3">
          <SearchBar />
        </div>
      </div>


      {/* Mobile: compact sticky bar — appears only when scrolled */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 block w-full md:hidden transition-transform duration-200 ${
          scrolled ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <img src={freteBanner} alt="Frete grátis para todo Brasil" className="w-full h-auto block"  loading="lazy"/>
        <div className="bg-[#29ABE2] px-3 py-2">

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMobileMenu}
            className="flex-shrink-0 text-white"
            aria-label="Menu"
          >
            <Menu className="h-7 w-7" />
          </button>
          <div className="flex-1">
            <SearchBar />
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="flex-shrink-0 flex items-center text-white transition-opacity hover:opacity-80"
            aria-label="Carrinho"
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white leading-none">
                {totalItems}
              </span>
            </div>
          </button>
        </div>
        </div>
      </div>





      {/* Desktop header */}
      <header className="hidden md:block w-full bg-header sticky top-0 z-50 border-b border-border py-4">
        <div className="container-page">
          <div className="relative flex items-center justify-between">
            <Link to="/" className="no-underline flex-shrink-0">
              <img src={logo} alt="Gago Suplementos" className="h-[52px] w-auto"  loading="lazy"/>
            </Link>

            <div className="mx-8 max-w-xl flex-1">
              <SearchBar />
            </div>


            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center text-header-foreground transition-opacity hover:opacity-80"
              aria-label="Carrinho"
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white leading-none">
                  {totalItems}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default StoreHeader;
