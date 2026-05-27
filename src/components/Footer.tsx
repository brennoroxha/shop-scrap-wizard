import { useState } from "react";
import { ChevronDown, Phone, MessageCircle, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import reclameAqui from "@/assets/reclame-aqui.webp";
import sslSeguro from "@/assets/ssl-seguro.png";
import logo from "@/assets/full-logo.png";
import LogoSelector from "@/components/LogoSelector";
import googleTransparency from "@/assets/google-transparency.png";
import googleReviews from "@/assets/google-reviews.png";

const Footer = () => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const infoLinks: { label: string; to: string }[] = [
    { label: "Sobre Nós", to: "/paginas/about" },
    { label: "Política de Trocas e Devoluções", to: "/paginas/returns" },
    { label: "Termos e Condições de Uso", to: "/paginas/terms" },
    { label: "Política de Envio", to: "/paginas/shipping" },
    { label: "Política de Privacidade", to: "/paginas/privacy" },
    { label: "Política de Reembolso", to: "/paginas/refund" },
    
    { label: "Perguntas Frequentes", to: "/paginas/faq" },
    { label: "Segurança e Qualidade", to: "/paginas/quality" },
  ];

  const paymentIcons = ["VISA", "Master", "AMEX", "Elo", "Boleto", "Pix"];

  return (
    <footer className="bg-white border-t border-gray-200 text-black">

      {/* Newsletter band - acima do rodapé */}
      <div className="bg-[#29ABE2]">
        <div className="container-page py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-white">
              <h3 className="font-bold text-xl md:text-2xl tracking-wide uppercase">
                Cadastre-se e receba novidades exclusivas
              </h3>
              <p className="text-xs md:text-sm mt-1 tracking-wider uppercase opacity-90">
                Seja o primeiro a receber nossos lançamentos e ofertas em primeira mão.
              </p>
            </div>
            <form className="relative w-full md:w-[460px] shrink-0">
              <input
                type="email"
                placeholder="Digite seu e-mail"
                className="w-full rounded-full bg-white pl-6 pr-20 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground font-bold text-sm px-4 py-2 hover:opacity-70 transition-opacity"
              >
                OK ›
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block container-page py-12">
        <div className="grid grid-cols-3 gap-8">
          {/* Sobre */}
          <div>
            <LogoSelector src={logo} alt="Tendência Cosméticos" className="h-10 w-auto mb-4" />
            <h3 className="font-bold text-foreground text-sm mb-4">INFORMAÇÕES DA EMPRESA</h3>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
              <p>Tendência Cosméticos</p>
              <p>CNPJ: 22.556.253/0002-60</p>
              <p>Telefone: (11) 99839-7447</p>
              <p>E-mail: contato@lojas-epoca.store</p>
              <p>Endereço: Rua Madre Maria Vilac, 1271, Loja Amalia, Canasvieiras, Florianópolis - SC, 88054-000</p>
              <p>Segunda a Sexta das 09h às 18h</p>
            </div>
          </div>

          {/* Informações */}
          <div>
            <h3 className="font-bold text-foreground text-sm mb-4">INSTITUCIONAL E AJUDA</h3>
            <ul className="space-y-2">
              {infoLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div className="flex flex-col gap-3">
            <a href="tel:+5511998397447" className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">Central de Atendimento</p>
                <p className="text-base font-bold text-black mt-1">(11) 99839-7447</p>
              </div>
              <Phone className="w-7 h-7 text-black" strokeWidth={2} />
            </a>
            <a href="https://wa.me/5511998397447" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">Atendimento via WhatsApp</p>
                <p className="text-base font-bold text-black mt-1">Inicie uma conversa</p>
              </div>
              <MessageCircle className="w-7 h-7 text-black" strokeWidth={2} />
            </a>
            <Link to="/fale-conosco" className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">Entre em Contato</p>
                <p className="text-base font-bold text-black mt-1">Envie sua mensagem</p>
              </div>
              <Mail className="w-7 h-7 text-black" strokeWidth={2} />
            </Link>

          </div>
        </div>

        {/* Formas de Pagamento + Compre com Segurança */}
        <div className="mt-12 pt-8 border-t border-border flex justify-between items-start gap-8">
          <div>
            <p className="text-sm font-bold text-foreground mb-3 uppercase">Formas de Pagamento</p>
            <div className="flex flex-wrap gap-2">
              <img src="/products/mastercard_c0511ecb.svg" alt="Mastercard" className="h-6 w-auto" loading="lazy" />
              <img src="/products/visa_eaa737d4.svg" alt="Visa" className="h-6 w-auto" loading="lazy" />
              <img src="/products/american_14ea82d3.svg" alt="American Express" className="h-6 w-auto" loading="lazy" />
              <img src="/products/diners_51bb3e44.svg" alt="Diners" className="h-6 w-auto" loading="lazy" />
              <img src="/products/elo_d5a53e07.svg" alt="Elo" className="h-6 w-auto" loading="lazy" />
              <img src="/products/hiper_1ce5ac20.svg" alt="Hipercard" className="h-6 w-auto" loading="lazy" />
              <img src="/products/pix_7665d642.svg" alt="Pix" className="h-6 w-auto" loading="lazy" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground mb-3 uppercase">Compre com Segurança</p>
            <div className="flex items-center gap-6">
              <a href="https://transparencyreport.google.com/safe-browsing/search?url=https:%2F%2Flojas-epoca.store" target="_blank" rel="noopener noreferrer">
                <img src={googleTransparency} alt="Google Transparency Report" className="h-10 object-contain" loading="lazy" />
              </a>
              <a href="https://www.google.com/search?q=lojas-epoca.store+avalia%C3%A7%C3%B5es" target="_blank" rel="noopener noreferrer">
                <img src={googleReviews} alt="Avaliações Google 5 estrelas" className="h-10 object-contain" loading="lazy" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden container-page py-6">
        <div className="flex justify-start pb-4">
          <LogoSelector src={logo} alt="Tendência Cosméticos" className="h-8 w-auto" />
        </div>

        {/* Sobre */}
        <div className="border-b border-border py-4 text-left">
          <h3 className="font-bold text-foreground text-sm mb-3">INFORMAÇÕES DA EMPRESA</h3>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
            <p>Tendência Cosméticos</p>
            <p>CNPJ: 22.556.253/0002-60</p>
            <p>Telefone: (11) 99839-7447</p>
            <p>E-mail: contato@lojas-epoca.store</p>
            <p>Endereço: Rua Madre Maria Vilac, 1271, Loja Amalia, Canasvieiras, Florianópolis - SC, 88054-000</p>
            <p>Segunda a Sexta das 09h às 18h</p>
          </div>
        </div>

        {/* Informações */}
        <div className="border-b border-border py-4">
          <h3 className="font-bold text-foreground text-sm mb-3">INSTITUCIONAL E AJUDA</h3>
          <ul className="space-y-2">
            {infoLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-muted-foreground">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contato */}
        <div className="flex flex-col gap-2 py-4 border-b border-border">
          <a href="tel:+5511998397447" className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Central de Atendimento</p>
              <p className="text-base font-bold text-black mt-1">(11) 99839-7447</p>
            </div>
            <Phone className="w-7 h-7 text-black" strokeWidth={2} />
          </a>
          <a href="https://wa.me/5511998397447" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Atendimento via WhatsApp</p>
              <p className="text-base font-bold text-black mt-1">Inicie uma conversa</p>
            </div>
            <MessageCircle className="w-7 h-7 text-black" strokeWidth={2} />
          </a>
          <Link to="/fale-conosco" className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Entre em Contato</p>
              <p className="text-base font-bold text-black mt-1">Envie sua mensagem</p>
            </div>
            <Mail className="w-7 h-7 text-black" strokeWidth={2} />
          </Link>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Formas de Pagamento</p>
            <div className="flex flex-wrap gap-2">
              <img src="/products/mastercard_c0511ecb.svg" alt="Mastercard" className="h-6 w-auto" loading="lazy" />
              <img src="/products/visa_eaa737d4.svg" alt="Visa" className="h-6 w-auto" loading="lazy" />
              <img src="/products/american_14ea82d3.svg" alt="American Express" className="h-6 w-auto" loading="lazy" />
              <img src="/products/diners_51bb3e44.svg" alt="Diners" className="h-6 w-auto" loading="lazy" />
              <img src="/products/elo_d5a53e07.svg" alt="Elo" className="h-6 w-auto" loading="lazy" />
              <img src="/products/hiper_1ce5ac20.svg" alt="Hipercard" className="h-6 w-auto" loading="lazy" />
              <img src="/products/pix_7665d642.svg" alt="Pix" className="h-6 w-auto" loading="lazy" />
            </div>
          </div>
        </div>

        {/* Compre com Segurança */}
        <div className="text-left py-4">
          <p className="text-sm font-bold text-foreground mb-3 uppercase">COMPRE COM SEGURANÇA</p>
          <div className="flex flex-col items-start gap-4">
            <a href="https://transparencyreport.google.com/safe-browsing/search?url=https:%2F%2Flojas-epoca.store" target="_blank" rel="noopener noreferrer">
              <img src={googleTransparency} alt="Google Transparency Report" className="h-14 object-contain" loading="lazy" />
            </a>
            <a href="https://www.google.com/search?q=lojas-epoca.store+avalia%C3%A7%C3%B5es" target="_blank" rel="noopener noreferrer">
              <img src={googleReviews} alt="Avaliações Google 5 estrelas" className="h-14 object-contain" loading="lazy" />
            </a>
          </div>
        </div>

      </div>

      {/* Copyright bar */}
      <div className="bg-white py-8 text-left border-t border-gray-200">
        <div className="container-page text-left">
          <div className="text-sm text-gray-600 uppercase tracking-wider space-y-2">
            <p>TENDÊNCIA COSMÉTICOS © 2026 — CNPJ: 22.556.253/0002-60</p>
            <p>Endereço: Rua Madre Maria Vilac, 1271, Loja Amalia, Canasvieiras, Florianópolis - SC, 88054-000</p>
            <p>Preços e condições de pagamento válidos exclusivamente para compras efetuadas no site.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
