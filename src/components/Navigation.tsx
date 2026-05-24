import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, X } from "lucide-react";

type SubItem = {
  label: string;
  path: string;
  children?: { label: string; path: string }[];
};

type NavItem = {
  label: string;
  path: string;
  children?: SubItem[];
};

const supplementSubcategories: SubItem[] = [
  { label: "Queima de Estoque", path: "/collections/queima-de-estoque" },
  { label: "Whey Protein", path: "/collections/whey-protein" },
  { label: "Creatina", path: "/collections/creatina" },
  { label: "Pre Treino", path: "/collections/pre-treino" },
  { label: "Pasta de Amendoim", path: "/collections/pasta-de-amendoim" },
  { label: "Vitaminas", path: "/collections/vitaminas" },
  { label: "Vestuario", path: "/collections/vestuario" },
  { label: "Comestiveis", path: "/collections/comestiveis" },
  { label: "Kits", path: "/collections/kits" },
  { label: "Barrinhas", path: "/collections/barrinhas" },
];

const cosmeticosSubcategories: SubItem[] = [
  {
    label: "Cabelos",
    path: "/collections/cosmeticos-cabelos",
    children: [
      { label: "Ativador de cachos", path: "/collections/cosmeticos-cabelos-ativador-de-cachos" },
      { label: "Bálsamo e Creme", path: "/collections/cosmeticos-cabelos-balsamo-e-creme" },
      { label: "Cacheado e crespo", path: "/collections/cosmeticos-cabelos-cacheado-e-crespo" },
      { label: "Coloridos e com mechas", path: "/collections/cosmeticos-cabelos-coloridos-e-com-mechas" },
      { label: "Danificados", path: "/collections/cosmeticos-cabelos-danificados" },
      { label: "Fino", path: "/collections/cosmeticos-cabelos-fino" },
      { label: "Kits para Cabelos", path: "/collections/cosmeticos-cabelos-kits-para-cabelos" },
      { label: "Loiros e descoloridos", path: "/collections/cosmeticos-cabelos-loiros-e-descoloridos" },
      { label: "Normal ou todos os tipos", path: "/collections/cosmeticos-cabelos-normal-ou-todos-os-tipos" },
      { label: "Óleo", path: "/collections/cosmeticos-cabelos-oleo" },
      { label: "Protetor Térmico", path: "/collections/cosmeticos-cabelos-protetor-termico" },
      { label: "Seco e ressecados", path: "/collections/cosmeticos-cabelos-seco-e-ressecados" },
      { label: "Tratamentos e Máscaras", path: "/collections/cosmeticos-cabelos-tratamentos-e-mascaras" },
    ],
  },
  {
    label: "Cuidados Pessoais",
    path: "/collections/cosmeticos-cuidados-pessoais",
    children: [
      { label: "Sabonetes", path: "/collections/cosmeticos-cuidados-pessoais-sabonetes" },
    ],
  },
  {
    label: "Dermocosméticos",
    path: "/collections/cosmeticos-dermocosmeticos",
    children: [
      { label: "Água Micelar", path: "/collections/cosmeticos-dermocosmeticos-agua-micelar" },
      { label: "Anti-Marcas", path: "/collections/cosmeticos-dermocosmeticos-anti-marcas" },
      { label: "Cuidados Corporais Específicos", path: "/collections/cosmeticos-dermocosmeticos-cuidados-corporais-especificos" },
      { label: "Cuidados Faciais Específicos", path: "/collections/cosmeticos-dermocosmeticos-cuidados-faciais-especificos" },
      { label: "Face", path: "/collections/cosmeticos-dermocosmeticos-face" },
      { label: "Gel de Limpeza", path: "/collections/cosmeticos-dermocosmeticos-gel-de-limpeza" },
      { label: "Hidratantes", path: "/collections/cosmeticos-dermocosmeticos-hidratantes" },
      { label: "Hidratantes Corporais", path: "/collections/cosmeticos-dermocosmeticos-hidratantes-corporais" },
      { label: "Kits", path: "/collections/cosmeticos-dermocosmeticos-kits" },
      { label: "Limpadores", path: "/collections/cosmeticos-dermocosmeticos-limpadores" },
      { label: "Protetor Solar", path: "/collections/cosmeticos-dermocosmeticos-protetor-solar" },
      { label: "Protetor Solar Com Cor", path: "/collections/cosmeticos-dermocosmeticos-protetor-solar-com-cor" },
      { label: "Rejuvenescedores", path: "/collections/cosmeticos-dermocosmeticos-rejuvenescedores" },
      { label: "Shampoo", path: "/collections/cosmeticos-dermocosmeticos-shampoo" },
      { label: "Tônicos", path: "/collections/cosmeticos-dermocosmeticos-tonicos" },
      { label: "Tratamentos", path: "/collections/cosmeticos-dermocosmeticos-tratamentos" },
    ],
  },
  {
    label: "Maquiagem",
    path: "/collections/cosmeticos-maquiagem",
    children: [
      { label: "Acessórios de Remoção da Maquiagem", path: "/collections/cosmeticos-maquiagem-acessorios-de-remocao-da-maquiagem" },
      { label: "Base", path: "/collections/cosmeticos-maquiagem-base" },
      { label: "Batom", path: "/collections/cosmeticos-maquiagem-batom" },
      { label: "Blush", path: "/collections/cosmeticos-maquiagem-blush" },
      { label: "Contorno", path: "/collections/cosmeticos-maquiagem-contorno" },
      { label: "Contorno Labial", path: "/collections/cosmeticos-maquiagem-contorno-labial" },
      { label: "Corretivo", path: "/collections/cosmeticos-maquiagem-corretivo" },
      { label: "Demaquilante", path: "/collections/cosmeticos-maquiagem-demaquilante" },
      { label: "Esponja", path: "/collections/cosmeticos-maquiagem-esponja" },
      { label: "Estojo Completo ou Kit de Maquiagem", path: "/collections/cosmeticos-maquiagem-estojo-completo-ou-kit-de-maquiagem" },
      { label: "Fixador da Maquiagem", path: "/collections/cosmeticos-maquiagem-fixador-da-maquiagem" },
      { label: "Gloss", path: "/collections/cosmeticos-maquiagem-gloss" },
      { label: "Lápis e Kajal", path: "/collections/cosmeticos-maquiagem-lapis-e-kajal" },
      { label: "Máscara para Cílios", path: "/collections/cosmeticos-maquiagem-mascara-para-cilios" },
      { label: "Máscara para Sobrancelhas", path: "/collections/cosmeticos-maquiagem-mascara-para-sobrancelhas" },
      { label: "Pó Compacto", path: "/collections/cosmeticos-maquiagem-po-compacto" },
      { label: "Pó Facial", path: "/collections/cosmeticos-maquiagem-po-facial" },
      { label: "Sombra", path: "/collections/cosmeticos-maquiagem-sombra" },
    ],
  },
  {
    label: "Mundo Época",
    path: "/collections/cosmeticos-mundo-epoca",
    children: [
      { label: "Mundo Época", path: "/collections/cosmeticos-mundo-epoca-mundo-epoca" },
    ],
  },
  {
    label: "Perfumes",
    path: "/collections/cosmeticos-perfumes",
    children: [
      { label: "Perfume Feminino", path: "/collections/cosmeticos-perfumes-perfume-feminino" },
      { label: "Perfume Masculino", path: "/collections/cosmeticos-perfumes-perfume-masculino" },
      { label: "Perfume para o Corpo", path: "/collections/cosmeticos-perfumes-perfume-para-o-corpo" },
    ],
  },
  {
    label: "Tratamentos",
    path: "/collections/cosmeticos-tratamentos",
    children: [
      { label: "Água Micelar", path: "/collections/cosmeticos-tratamentos-agua-micelar" },
      { label: "Cuidados Faciais Específicos", path: "/collections/cosmeticos-tratamentos-cuidados-faciais-especificos" },
      { label: "Hidratantes Faciais", path: "/collections/cosmeticos-tratamentos-hidratantes-faciais" },
      { label: "Limpadores Faciais", path: "/collections/cosmeticos-tratamentos-limpadores-faciais" },
      { label: "Protetor Solar", path: "/collections/cosmeticos-tratamentos-protetor-solar" },
      { label: "Protetor Solar com Cor", path: "/collections/cosmeticos-tratamentos-protetor-solar-com-cor" },
    ],
  },
];

const navItems: NavItem[] = [
  { label: "Início", path: "/" },
  { label: "Cosméticos", path: "/collections/cosmeticos", children: cosmeticosSubcategories },
  { label: "Blog", path: "/blog" },
];

interface NavigationProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const Navigation = ({ mobileOpen, onClose }: NavigationProps) => {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <nav className="border-b border-nav-border bg-nav">
      {/* Desktop */}
      <div className="container-page hidden items-center justify-center gap-1 py-3 md:flex">
        {navItems.map((item) =>
          item.children ? (
            <div key={item.path} className="relative group">
              <Link
                to={item.path}
                className={`flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary ${
                  location.pathname === item.path ? "text-primary font-bold" : "text-nav-foreground"
                }`}
              >
                {item.label}
                <ChevronDown className="h-3.5 w-3.5" />
              </Link>
              <div className="absolute left-0 top-full z-50 hidden min-w-[220px] rounded-md border border-border bg-card shadow-lg group-hover:block">
                {item.children.map((child) => (
                  <div key={child.path} className="relative group/sub">
                    <Link
                      to={child.path}
                      className={`flex items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-secondary ${
                        location.pathname === child.path
                          ? "text-primary font-bold"
                          : "text-foreground"
                      }`}
                    >
                      <span>{child.label}</span>
                      {child.children && <ChevronRight className="h-3.5 w-3.5" />}
                    </Link>
                    {child.children && (
                      <div className="absolute left-full top-0 z-50 hidden min-w-[200px] rounded-md border border-border bg-card shadow-lg group-hover/sub:block">
                        {child.children.map((leaf) => (
                          <Link
                            key={leaf.path}
                            to={leaf.path}
                            className={`block px-4 py-2 text-sm transition-colors hover:bg-secondary ${
                              location.pathname === leaf.path
                                ? "text-primary font-bold"
                                : "text-foreground"
                            }`}
                          >
                            {leaf.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary ${
                location.pathname === item.path
                  ? "text-primary font-bold"
                  : "text-nav-foreground"
              }`}
            >
              {item.label}
            </Link>
          )
        )}
      </div>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-background shadow-xl md:hidden">
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="text-sm font-bold text-foreground">Menu</span>
              <button onClick={onClose} className="text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="py-2">
              {navItems.map((item) =>
                item.children ? (
                  <div key={item.path}>
                    <button
                      onClick={() => setOpenMenu((v) => (v === item.path ? null : item.path))}
                      className={`flex w-full items-center justify-between px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary ${
                        location.pathname === item.path
                          ? "text-primary font-bold"
                          : "text-foreground"
                      }`}
                    >
                      {item.label}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${openMenu === item.path ? "rotate-180" : ""}`}
                      />
                    </button>
                    {openMenu === item.path && (
                      <div className="bg-secondary/40">
                        {item.children.map((child) => (
                          <div key={child.path}>
                            <Link
                              to={child.path}
                              className={`block px-10 py-2.5 text-sm transition-colors hover:bg-secondary ${
                                location.pathname === child.path
                                  ? "text-primary font-bold"
                                  : "text-foreground"
                              }`}
                              onClick={onClose}
                            >
                              {child.label}
                            </Link>
                            {child.children?.map((leaf) => (
                              <Link
                                key={leaf.path}
                                to={leaf.path}
                                className={`block px-14 py-2 text-xs transition-colors hover:bg-secondary ${
                                  location.pathname === leaf.path
                                    ? "text-primary font-bold"
                                    : "text-muted-foreground"
                                }`}
                                onClick={onClose}
                              >
                                › {leaf.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary ${
                      location.pathname === item.path
                        ? "text-primary font-bold"
                        : "text-foreground"
                    }`}
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navigation;
