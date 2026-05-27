import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Grid3X3, List, ChevronDown, ChevronUp } from "lucide-react";
import AnnouncementBar from "@/components/AnnouncementBar";
import StoreHeader from "@/components/StoreHeader";
import Navigation from "@/components/Navigation";
import BenefitsBar from "@/components/BenefitsBar";
import ProductCard from "@/components/ProductCard";
import { getProductsByCategory, products as allProducts } from "@/data/products";

const categoryMap: Record<string, { title: string; slug: string; prefix?: boolean; categories?: string[]; parents?: { slug: string; title: string }[] }> = {
  "queima-de-estoque": { title: "Queima de Estoque", slug: "queima" },
  "suplementos": { title: "Suplementos", slug: "suplementos", categories: ["whey", "creatina", "pre-treino", "vitaminas", "pasta-amendoim", "comestiveis", "kits", "barrinhas", "queima"] },
  "whey-protein": { title: "Whey Protein", slug: "whey" },
  "creatina": { title: "Creatina", slug: "creatina" },
  "pre-treino": { title: "Pre Treino", slug: "pre-treino" },
  "pasta-de-amendoim": { title: "Pasta de Amendoim", slug: "pasta-amendoim" },
  "vitaminas": { title: "Vitaminas", slug: "vitaminas" },
  "vestuario": { title: "Vestuario", slug: "vestuario" },
  "comestiveis": { title: "Comestíveis", slug: "comestiveis" },
  "kits": { title: "Kits", slug: "kits" },
  "barrinhas": { title: "Barrinhas", slug: "barrinhas" },
  "cosmeticos": { title: "Cosméticos", slug: "cosmeticos-", prefix: true },
  "cosmeticos-cabelos": { title: "Cabelos", slug: "cosmeticos-cabelos", prefix: true, parents: [{ slug: "cosmeticos", title: "Cosméticos" }] },
  "cosmeticos-cuidados-pessoais": { title: "Cuidados Pessoais", slug: "cosmeticos-cuidados-pessoais", prefix: true, parents: [{ slug: "cosmeticos", title: "Cosméticos" }] },
  "cosmeticos-dermocosmeticos": { title: "Dermocosméticos", slug: "cosmeticos-dermocosmeticos", prefix: true, parents: [{ slug: "cosmeticos", title: "Cosméticos" }] },
  
  "cosmeticos-maquiagem": { title: "Maquiagem", slug: "cosmeticos-maquiagem", prefix: true, parents: [{ slug: "cosmeticos", title: "Cosméticos" }] },
  "cosmeticos-mundo-epoca": { title: "Mundo Época", slug: "cosmeticos-mundo-epoca", prefix: true, parents: [{ slug: "cosmeticos", title: "Cosméticos" }] },
  "cosmeticos-perfumes": { title: "Perfumes", slug: "cosmeticos-perfumes", prefix: true, parents: [{ slug: "cosmeticos", title: "Cosméticos" }] },
  "cosmeticos-tratamentos": { title: "Tratamentos", slug: "cosmeticos-tratamentos", prefix: true, parents: [{ slug: "cosmeticos", title: "Cosméticos" }] },
  "cosmeticos-cabelos-ativador-de-cachos": { title: "Ativador de cachos", slug: "cosmeticos-cabelos-ativador-de-cachos", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cabelos", title: "Cabelos" }] },
  "cosmeticos-cabelos-balsamo-e-creme": { title: "Bálsamo e Creme", slug: "cosmeticos-cabelos-balsamo-e-creme", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cabelos", title: "Cabelos" }] },
  "cosmeticos-cabelos-cacheado-e-crespo": { title: "Cacheado e crespo", slug: "cosmeticos-cabelos-cacheado-e-crespo", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cabelos", title: "Cabelos" }] },
  "cosmeticos-cabelos-coloridos-e-com-mechas": { title: "Coloridos e com mechas", slug: "cosmeticos-cabelos-coloridos-e-com-mechas", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cabelos", title: "Cabelos" }] },
  "cosmeticos-cabelos-danificados": { title: "Danificados", slug: "cosmeticos-cabelos-danificados", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cabelos", title: "Cabelos" }] },
  "cosmeticos-cabelos-fino": { title: "Fino", slug: "cosmeticos-cabelos-fino", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cabelos", title: "Cabelos" }] },
  "cosmeticos-cabelos-kits-para-cabelos": { title: "Kits para Cabelos", slug: "cosmeticos-cabelos-kits-para-cabelos", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cabelos", title: "Cabelos" }] },
  "cosmeticos-cabelos-loiros-e-descoloridos": { title: "Loiros e descoloridos", slug: "cosmeticos-cabelos-loiros-e-descoloridos", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cabelos", title: "Cabelos" }] },
  "cosmeticos-cabelos-normal-ou-todos-os-tipos": { title: "Normal ou todos os tipos", slug: "cosmeticos-cabelos-normal-ou-todos-os-tipos", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cabelos", title: "Cabelos" }] },
  "cosmeticos-cabelos-oleo": { title: "Óleo", slug: "cosmeticos-cabelos-oleo", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cabelos", title: "Cabelos" }] },
  "cosmeticos-cabelos-protetor-termico": { title: "Protetor Térmico", slug: "cosmeticos-cabelos-protetor-termico", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cabelos", title: "Cabelos" }] },
  "cosmeticos-cabelos-seco-e-ressecados": { title: "Seco e ressecados", slug: "cosmeticos-cabelos-seco-e-ressecados", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cabelos", title: "Cabelos" }] },
  "cosmeticos-cabelos-tratamentos-e-mascaras": { title: "Tratamentos e Máscaras", slug: "cosmeticos-cabelos-tratamentos-e-mascaras", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cabelos", title: "Cabelos" }] },
  "cosmeticos-cuidados-pessoais-sabonetes": { title: "Sabonetes", slug: "cosmeticos-cuidados-pessoais-sabonetes", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-cuidados-pessoais", title: "Cuidados Pessoais" }] },
  "cosmeticos-dermocosmeticos-agua-micelar": { title: "Água Micelar", slug: "cosmeticos-dermocosmeticos-agua-micelar", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-anti-marcas": { title: "Anti-Marcas", slug: "cosmeticos-dermocosmeticos-anti-marcas", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-cuidados-corporais-especificos": { title: "Cuidados Corporais Específicos", slug: "cosmeticos-dermocosmeticos-cuidados-corporais-especificos", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-cuidados-faciais-especificos": { title: "Cuidados Faciais Específicos", slug: "cosmeticos-dermocosmeticos-cuidados-faciais-especificos", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-face": { title: "Face", slug: "cosmeticos-dermocosmeticos-face", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-gel-de-limpeza": { title: "Gel de Limpeza", slug: "cosmeticos-dermocosmeticos-gel-de-limpeza", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-hidratantes": { title: "Hidratantes", slug: "cosmeticos-dermocosmeticos-hidratantes", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-hidratantes-corporais": { title: "Hidratantes Corporais", slug: "cosmeticos-dermocosmeticos-hidratantes-corporais", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-kits": { title: "Kits", slug: "cosmeticos-dermocosmeticos-kits", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-limpadores": { title: "Limpadores", slug: "cosmeticos-dermocosmeticos-limpadores", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-protetor-solar": { title: "Protetor Solar", slug: "cosmeticos-dermocosmeticos-protetor-solar", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-protetor-solar-com-cor": { title: "Protetor Solar Com Cor", slug: "cosmeticos-dermocosmeticos-protetor-solar-com-cor", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-rejuvenescedores": { title: "Rejuvenescedores", slug: "cosmeticos-dermocosmeticos-rejuvenescedores", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-shampoo": { title: "Shampoo", slug: "cosmeticos-dermocosmeticos-shampoo", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-tonicos": { title: "Tônicos", slug: "cosmeticos-dermocosmeticos-tonicos", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  "cosmeticos-dermocosmeticos-tratamentos": { title: "Tratamentos", slug: "cosmeticos-dermocosmeticos-tratamentos", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-dermocosmeticos", title: "Dermocosméticos" }] },
  
  "cosmeticos-maquiagem-acessorios-de-remocao-da-maquiagem": { title: "Acessórios de Remoção da Maquiagem", slug: "cosmeticos-maquiagem-acessorios-de-remocao-da-maquiagem", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-base": { title: "Base", slug: "cosmeticos-maquiagem-base", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-batom": { title: "Batom", slug: "cosmeticos-maquiagem-batom", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-blush": { title: "Blush", slug: "cosmeticos-maquiagem-blush", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-contorno": { title: "Contorno", slug: "cosmeticos-maquiagem-contorno", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-contorno-labial": { title: "Contorno Labial", slug: "cosmeticos-maquiagem-contorno-labial", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-corretivo": { title: "Corretivo", slug: "cosmeticos-maquiagem-corretivo", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-demaquilante": { title: "Demaquilante", slug: "cosmeticos-maquiagem-demaquilante", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-esponja": { title: "Esponja", slug: "cosmeticos-maquiagem-esponja", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-estojo-completo-ou-kit-de-maquiagem": { title: "Estojo Completo ou Kit de Maquiagem", slug: "cosmeticos-maquiagem-estojo-completo-ou-kit-de-maquiagem", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-fixador-da-maquiagem": { title: "Fixador da Maquiagem", slug: "cosmeticos-maquiagem-fixador-da-maquiagem", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-gloss": { title: "Gloss", slug: "cosmeticos-maquiagem-gloss", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-lapis-e-kajal": { title: "Lápis e Kajal", slug: "cosmeticos-maquiagem-lapis-e-kajal", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-mascara-para-cilios": { title: "Máscara para Cílios", slug: "cosmeticos-maquiagem-mascara-para-cilios", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-mascara-para-sobrancelhas": { title: "Máscara para Sobrancelhas", slug: "cosmeticos-maquiagem-mascara-para-sobrancelhas", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-po-compacto": { title: "Pó Compacto", slug: "cosmeticos-maquiagem-po-compacto", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-po-facial": { title: "Pó Facial", slug: "cosmeticos-maquiagem-po-facial", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-maquiagem-sombra": { title: "Sombra", slug: "cosmeticos-maquiagem-sombra", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-maquiagem", title: "Maquiagem" }] },
  "cosmeticos-mundo-epoca-mundo-epoca": { title: "Mundo Época", slug: "cosmeticos-mundo-epoca-mundo-epoca", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-mundo-epoca", title: "Mundo Época" }] },
  "cosmeticos-perfumes-perfume-feminino": { title: "Perfume Feminino", slug: "cosmeticos-perfumes-perfume-feminino", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-perfumes", title: "Perfumes" }] },
  "cosmeticos-perfumes-perfume-masculino": { title: "Perfume Masculino", slug: "cosmeticos-perfumes-perfume-masculino", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-perfumes", title: "Perfumes" }] },
  "cosmeticos-perfumes-perfume-para-o-corpo": { title: "Perfume para o Corpo", slug: "cosmeticos-perfumes-perfume-para-o-corpo", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-perfumes", title: "Perfumes" }] },
  "cosmeticos-tratamentos-agua-micelar": { title: "Água Micelar", slug: "cosmeticos-tratamentos-agua-micelar", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-tratamentos", title: "Tratamentos" }] },
  "cosmeticos-tratamentos-cuidados-faciais-especificos": { title: "Cuidados Faciais Específicos", slug: "cosmeticos-tratamentos-cuidados-faciais-especificos", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-tratamentos", title: "Tratamentos" }] },
  "cosmeticos-tratamentos-hidratantes-faciais": { title: "Hidratantes Faciais", slug: "cosmeticos-tratamentos-hidratantes-faciais", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-tratamentos", title: "Tratamentos" }] },
  "cosmeticos-tratamentos-limpadores-faciais": { title: "Limpadores Faciais", slug: "cosmeticos-tratamentos-limpadores-faciais", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-tratamentos", title: "Tratamentos" }] },
  "cosmeticos-tratamentos-protetor-solar": { title: "Protetor Solar", slug: "cosmeticos-tratamentos-protetor-solar", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-tratamentos", title: "Tratamentos" }] },
  "cosmeticos-tratamentos-protetor-solar-com-cor": { title: "Protetor Solar com Cor", slug: "cosmeticos-tratamentos-protetor-solar-com-cor", parents: [{ slug: "cosmeticos", title: "Cosméticos" }, { slug: "cosmeticos-tratamentos", title: "Tratamentos" }] },
};

type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

const KNOWN_BRANDS = [
  "Growth Supplements",
  "Max Titanium",
  "Soldiers Nutrition",
  "Dux Human Health",
  "Dux Nutrition",
  "Dr. Peanut",
  "Giants Nutrition",
  "Giants",
  "Probiótica",
  "Probiotica",
  "Integralmedica",
  "Atlhetica Nutrition",
  "Atlhetica",
  "Black Skull",
  "BSN",
  "Optimum Nutrition",
  "Universal",
  "Nutrata",
  "New Millen",
  "Vitafor",
  "Performance Nutrition",
  "Bodyaction",
  "Body Action",
  "3W",
  "FTW",
  // Cosméticos
  "L'Oréal Professionnel",
  "L'Oréal Paris",
  "L'Oréal",
  "L'Oreal",
  "Wella Professionals",
  "Wella",
  "Eucerin",
  "Bepantol",
  "Bepantriz",
  "Bioderma",
  "La Roche-Posay",
  "La Roche Posay",
  "Vichy",
  "CeraVe",
  "Cetaphil",
  "Neutrogena",
  "Nivea",
  "Dove",
  "Garnier Skin",
  "Garnier",
  "Mantecorp Skincare",
  "Mantecorp",
  "Creamy",
  "Principia",
  "Sallve",
  "Darrow",
  "Theraskin",
  "Umbrella",
  "Cimed",
  "Farmax",
  "Lansinoh",
  "Mustela",
  "Bio-Oil",
  "Granado",
  "Medicube",
  "SKIN1004",
  "Celimax",
  "Biolab",
  "Natuflora",
  "Phytoderm",
  "O Boticário",
  "Boticário",
  "Dior",
  "Jo Malone London",
  "Jo Malone",
  "Lancôme",
  "Lancome",
  "Acnezil",
  "Corega",
  "Ollie",
  "Impala",
  "Época",
];

const getBrand = (name: string): string => {
  for (const b of KNOWN_BRANDS) {
    const re = new RegExp(`\\b${b.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i");
    if (re.test(name)) return b;
  }
  return "Outros";
};

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [showAvailability, setShowAvailability] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showBrand, setShowBrand] = useState(true);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [perPage, setPerPage] = useState(24);

  const catInfo = category ? categoryMap[category] : null;
  const products = catInfo
    ? (catInfo.categories
        ? allProducts.filter((p) => catInfo.categories!.includes(p.category))
        : catInfo.prefix
        ? allProducts.filter((p) => p.category.startsWith(catInfo.slug))
        : getProductsByCategory(catInfo.slug))
    : [];

  const brandCounts = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      const b = getBrand(p.name);
      counts.set(b, (counts.get(b) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedBrands.length === 0) return products;
    return products.filter((p) => selectedBrands.includes(getBrand(p.name)));
  }, [products, selectedBrands]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (sortBy) {
      case "price-asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sorted;
    }
  }, [filteredProducts, sortBy]);

  const displayedProducts = sortedProducts.slice(0, perPage);

  const toggleBrand = (b: string) =>
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );

  if (!catInfo) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <StoreHeader />
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Categoria não encontrada</h1>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <StoreHeader />
      <Navigation />

      {/* Breadcrumb */}
      <div className="container-page py-3">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Pagina Inicial
          </Link>
          {catInfo.parents?.map((par) => (
            <span key={par.slug} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to={`/collections/${par.slug}`} className="hover:text-foreground transition-colors">
                {par.title}
              </Link>
            </span>
          ))}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{catInfo.title}</span>
        </nav>
      </div>
 
       {/* Main content */}
       <div className="container-page pb-12">
         <div className="flex gap-6">
          {/* Sidebar filters */}
          <aside className="hidden w-[280px] flex-shrink-0 lg:block">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-4 text-lg font-bold text-card-foreground">Filtros</h3>

              {/* Availability filter */}
              <div className="border-t border-border pt-4">
                <button
                  onClick={() => setShowAvailability(!showAvailability)}
                  className="flex w-full items-center justify-between text-sm font-semibold text-card-foreground"
                >
                  Disponibilidade
                  {showAvailability ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {showAvailability && (
                  <div className="mt-3 space-y-2.5">
                    <label className="flex items-center gap-2.5 text-sm text-muted-foreground cursor-pointer">
                      <input type="checkbox" className="rounded border-border" />
                      Em estoque ({products.length})
                    </label>
                    <label className="flex items-center gap-2.5 text-sm text-muted-foreground cursor-pointer">
                      <input type="checkbox" className="rounded border-border" />
                      Fora de estoque (0)
                    </label>
                  </div>
                )}
              </div>

              {/* Price filter */}
              <div className="border-t border-border pt-4 mt-4">
                <button
                  onClick={() => setShowPrice(!showPrice)}
                  className="flex w-full items-center justify-between text-sm font-semibold text-card-foreground"
                >
                  Preço
                  {showPrice ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {showPrice && (
                  <div className="mt-3">
                    <input
                      type="range"
                      min={0}
                      max={200}
                      className="w-full accent-primary"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded border border-border px-2 py-1.5">
                        <span className="text-xs text-muted-foreground mr-1">R$</span>
                        <input
                          type="number"
                          defaultValue={0}
                          className="w-12 bg-transparent text-xs text-card-foreground outline-none"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">–</span>
                      <div className="flex items-center rounded border border-border px-2 py-1.5">
                        <span className="text-xs text-muted-foreground mr-1">R$</span>
                        <input
                          type="number"
                          defaultValue={130}
                          className="w-12 bg-transparent text-xs text-card-foreground outline-none"
                        />
                      </div>
                    </div>
                    <button className="mt-3 w-full rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                      Filtrar
                    </button>
                  </div>
                )}
              </div>

              {/* Brand filter */}
              {brandCounts.length > 0 && (
                <div className="border-t border-border pt-4 mt-4">
                  <button
                    onClick={() => setShowBrand(!showBrand)}
                    className="flex w-full items-center justify-between text-sm font-semibold text-card-foreground"
                  >
                    Marca
                    {showBrand ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {showBrand && (
                    <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {brandCounts.map(([brand, count]) => (
                        <label
                          key={brand}
                          className="flex items-center gap-2.5 text-sm text-muted-foreground cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-border"
                            checked={selectedBrands.includes(brand)}
                            onChange={() => toggleBrand(brand)}
                          />
                          {brand} ({count})
                        </label>
                      ))}
                      {selectedBrands.length > 0 && (
                        <button
                          onClick={() => setSelectedBrands([])}
                          className="mt-2 text-xs text-primary hover:underline"
                        >
                          Limpar filtro
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Products area */}
          <div className="flex-1">
            {/* Title */}
            <h1 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
              {catInfo.title}
            </h1>

            {/* Toolbar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                Mostrando 1 - {Math.min(displayedProducts.length, sortedProducts.length)} de{" "}
                {sortedProducts.length} produtos
              </span>

              <div className="flex items-center gap-4">
                {/* Per page */}
                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline">Mostrar:</span>
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="rounded border border-border bg-card px-2 py-1 text-xs text-card-foreground outline-none"
                  >
                    <option value={24}>24 por página</option>
                    <option value={36}>36 por página</option>
                    <option value={48}>48 por página</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline">Ordenar por:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="rounded border border-border bg-card px-2 py-1 text-xs text-card-foreground outline-none"
                  >
                    <option value="featured">Em destaque</option>
                    <option value="price-asc">Preço: Menor para Maior</option>
                    <option value="price-desc">Preço: Maior para Menor</option>
                    <option value="name-asc">A-Z</option>
                    <option value="name-desc">Z-A</option>
                    
                  </select>
                </div>

                {/* View mode */}
                <div className="hidden items-center gap-1 sm:flex">
                  <span className="mr-1">Visualização</span>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded p-1 transition-colors ${
                      viewMode === "grid"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded p-1 transition-colors ${
                      viewMode === "list"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product grid */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col gap-4"
              }
            >
              {displayedProducts.map((product) => (
                <div key={product.id} className={viewMode === "grid" ? "" : "max-w-full"}>
                  <ProductCardGrid product={product} listMode={viewMode === "list"} />
                </div>
              ))}
            </div>

            {displayedProducts.length === 0 && (
              <p className="py-12 text-center text-muted-foreground">
                Nenhum produto encontrado nesta categoria.
              </p>
            )}
          </div>
        </div>
      </div>

      <BenefitsBar />

      <footer className="bg-foreground py-6 text-center">
        <p className="text-xs text-background/60">
          © 2025 Growth Supplements. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
};

/* Grid-optimized product card (full width instead of fixed 200px) */
import { ArrowDown } from "lucide-react";
import type { Product } from "@/data/products";

const ProductCardGrid = ({
  product,
  listMode,
}: {
  product: Product;
  listMode?: boolean;
}) => {
  const formatPrice = (value: number) =>
    `R$ ${value.toFixed(2).replace(".", ",")}`;


  if (listMode) {
    return (
      <Link
        to={`/produtos/${product.id}`}
        className="product-card-hover flex overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 no-underline"
      >
        {/* Discount badge */}
        <div className="relative flex w-[180px] flex-shrink-0 items-center justify-center bg-white p-4">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        </div>
        <div className="flex flex-1 flex-col justify-center p-4">
          <h3 className="mb-2 text-sm font-semibold text-card-foreground">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-sale">
              {formatPrice(product.price)}
            </span>
          </div>
          <span className="mt-3 w-fit rounded-md bg-[#29ABE2] px-6 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1f8cba]">
            COMPRAR
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/produtos/${product.id}`}
      className="product-card-hover group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 no-underline"
    >
      <div className="flex aspect-square items-center justify-center overflow-hidden bg-white p-4">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="mb-2 line-clamp-2 text-xs font-semibold leading-tight text-card-foreground">
          {product.name}
        </h3>
        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-sale">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
        <span className="mt-3 block w-full rounded-md bg-[#29ABE2] py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-[#1f8cba]">
          COMPRAR
        </span>
      </div>
    </Link>
  );
};

export default CategoryPage;
