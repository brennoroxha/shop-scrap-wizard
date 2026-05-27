import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowDown, Minus, Plus, Truck, ShieldCheck, ThumbsUp, ChevronLeft, ChevronRight, RotateCcw, Award, Home, ShoppingCart } from "lucide-react";
import pixIcon from "@/assets/pix-icon-black.png";
import { useState, useRef } from "react";
import StoreLayout from "@/components/StoreLayout";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import { products, type Product } from "@/data/products";
import { getProductDescription } from "@/data/productDescriptions";
import ShippingCalculator from "@/components/ShippingCalculator";
import { ProductSEO } from "@/components/ProductSEO";
import correiosLogo from "@/assets/correios-logo.png";
import fullLogo from "@/assets/full-logo.png";
import logocard2 from "@/assets/logocard-2.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SITE_URL = "https://lojas-epoca.store";
const SITE_NAME = "Tendência Cosméticos";

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (s: string, n: number) =>
  s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";

const guessBrand = (name: string) => {
  // Common brands present in the catalog — first match wins
  const brands = [
    "Growth Supplements", "Max Titanium", "Integralmedica", "Black Skull",
    "Dux Nutrition", "Optimum Nutrition", "Probiótica", "Atlhetica",
    "La Roche-Posay", "La Roche Posay", "Carolina Herrera", "Lancôme", "Lancome",
    "Yves Saint Laurent", "Giorgio Armani", "Prada", "Maybelline", "MAC",
    "Boca Rosa", "Catharine Hill", "Oceane", "Océane", "Sebastian",
    "Wella Professionals", "Wella", "Widi Care", "Nivea", "Lattafa",
  ];
  for (const b of brands) {
    if (name.toLowerCase().includes(b.toLowerCase())) return b;
  }
  return name.split(" ")[0];
};


/**
 * Normalize loose HTML: turn blank lines into paragraphs, single newlines
 * into <br>, and group consecutive "- item" lines into <ul><li>.
 * Skips conversion when the HTML already contains block tags.
 */
function normalizeLooseHtml(html: string): string {
  if (!html) return "";
  if (/<(p|ul|ol|li|br|div|table)\b/i.test(html)) return html;
  const blocks = html.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
      const allBullets = lines.length > 1 && lines.every((l) => /^[-•]\s+/.test(l));
      if (allBullets) {
        return `<ul>${lines.map((l) => `<li>${l.replace(/^[-•]\s+/, "")}</li>`).join("")}</ul>`;
      }
      return `<p>${lines.join("<br/>")}</p>`;
    })
    .join("\n");
}

/**
 * Split description HTML into sections by <h3> headings.
 * The piece before the first <h3> (if any) becomes a "Descrição" section.
 */
function parseDescriptionSections(html: string): { title: string; html: string }[] {
  if (!html) return [];
  const parts = html.split(/<h3[^>]*>(.*?)<\/h3>/i);
  const sections: { title: string; html: string }[] = [];
  const intro = (parts[0] || "").trim();
  if (intro.replace(/<[^>]+>/g, "").trim()) {
    sections.push({ title: "Descrição", html: normalizeLooseHtml(intro) });
  }
  for (let i = 1; i < parts.length; i += 2) {
    const title = (parts[i] || "").replace(/<[^>]+>/g, "").trim();
    const body = (parts[i + 1] || "").trim();
    if (title) sections.push({ title, html: normalizeLooseHtml(body) });
  }
  return sections;
}

const RelatedSlider = ({ products }: { products: Product[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -600 : 600;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="mt-12">
      <h2 className="mb-4 text-xl font-bold text-foreground">Produtos relacionados</h2>
      <div className="group relative">
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-md transition-opacity hover:bg-secondary group-hover:flex md:flex"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto pb-4"
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-md transition-opacity hover:bg-secondary group-hover:flex md:flex"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </div>
  );
};

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = products.find((p) => p.id === slug);
  const desc = product ? getProductDescription(product.id) : undefined;
  const variants = product?.hasVariants ? desc?.variants || [] : [];
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(variants[0] || null);
  const { addItem } = useCart();


  if (!product) {
    return (
      <StoreLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="text-2xl font-bold text-foreground">Produto não encontrado</h1>
          <Link to="/" className="mt-4 text-primary underline">Voltar para a loja</Link>
        </div>
      </StoreLayout>
    );
  }




  const variantLabel = desc?.variantLabel || "Sabor";
  const variantImage = selectedVariant ? desc?.variantImages?.[selectedVariant] : undefined;
  const displayImage = variantImage || product.image;
  const baseImages = product.images && product.images.length > 0 ? product.images : [product.image];
  // Filter the full image list to only those matching the selected variant key,
  // e.g. variant "00" matches "...-hidra-glow-00.jpg", "...-00-2.jpg", "...-00--1-.jpg"
  // Guards against "5" matching "55" by requiring a non-digit boundary after the key.
  const variantFiltered = selectedVariant
    ? baseImages.filter((url) => {
        const safe = selectedVariant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`-${safe}(?!\\d)(?:[-.])`, "i").test(url);
      })
    : [];
  const displayImages =
    variantFiltered.length > 0
      ? variantFiltered
      : variantImage
      ? [variantImage]
      : baseImages;
  const formatPrice = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;
  const variantPriceInfo = selectedVariant ? desc?.variantPrices?.[selectedVariant] : undefined;
  const effectivePrice = variantPriceInfo?.price ?? product.price;
  const effectiveOriginal = variantPriceInfo?.originalPrice ?? product.originalPrice;
  const pixPrice = effectivePrice * 0.9;
  const savings = effectiveOriginal ? effectiveOriginal - effectivePrice : 0;
  const pixSavings = effectivePrice - pixPrice;

  // Related products: same category, then same family prefix, then same root group
  const otherProducts = products.filter((p) => p.id !== product.id);
  const segs = product.category.split("-");
  const familyPrefix = segs.slice(0, 2).join("-"); // e.g. "cosmeticos-cabelos"
  const rootPrefix = segs[0]; // e.g. "cosmeticos"
  const exact = otherProducts.filter((p) => p.category === product.category);
  const family = otherProducts.filter(
    (p) => p.category.startsWith(familyPrefix + "-") && p.category !== product.category,
  );
  const root = otherProducts.filter(
    (p) => p.category.startsWith(rootPrefix + "-") && !p.category.startsWith(familyPrefix),
  );
  const seen = new Set<string>();
  const relatedProducts = [...exact, ...family, ...root]
    .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
    .slice(0, 12);

  // ---------- SEO ----------
  const canonicalUrl = `${SITE_URL}/produtos/${product.id}`;
  const brand = guessBrand(product.name);
  const descPlainFull = desc ? stripHtml(desc.descriptionHtml) : product.name;
  const metaDescription = truncate(
    `${product.name} por R$ ${effectivePrice.toFixed(2).replace(".", ",")} no Pix. ${descPlainFull}`,
    158,
  );
  const seoTitle = truncate(`${product.name} | ${SITE_NAME}`, 60);
  const productImages = (displayImages || [displayImage]).filter(Boolean);
  // Price valid until end of next year (Merchant requires future date)
  const priceValidUntil = `${new Date().getFullYear() + 1}-12-31`;
  const availability = "https://schema.org/InStock";
  const itemCondition = "https://schema.org/NewCondition";
  // Stable GTIN/MPN-like SKU derived from the slug
  const skuId = product.id.replace(/^epoca-/, "").slice(0, 50);

  const productJsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: productImages,
    description: truncate(descPlainFull, 500),
    sku: skuId,
    mpn: skuId,
    brand: { "@type": "Brand", name: brand },
    category: product.category.replace(/-/g, " "),
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "BRL",
      price: effectivePrice.toFixed(2),
      priceValidUntil,
      availability,
      itemCondition,
      seller: { "@type": "Organization", name: SITE_NAME },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "BR",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0.00",
          currency: "BRL",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "BR",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 7, unitCode: "DAY" },
        },
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category.replace(/-/g, " "),
        item: `${SITE_URL}/collections/${product.category}`,
      },
      { "@type": "ListItem", position: 3, name: product.name, item: canonicalUrl },
    ],
  };

  return (
    <StoreLayout>
      <ProductSEO
        nome={product.name}
        descricao={descPlainFull}
        preco={effectivePrice.toFixed(2)}
        imagem={displayImage}
        slug={product.id}
        disponivel={true}
        marca={brand}
        gtin={product.ean ?? ""}
      />

      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        {/* Open Graph (Product) */}
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={displayImage} />
        <meta property="og:image:alt" content={product.name} />
        <meta property="og:locale" content="pt_BR" />
        {/* Product-specific OG */}
        <meta property="product:brand" content={brand} />
        <meta property="product:availability" content="in stock" />
        <meta property="product:condition" content="new" />
        <meta property="product:price:amount" content={effectivePrice.toFixed(2)} />
        <meta property="product:price:currency" content="BRL" />
        <meta property="product:retailer_item_id" content={skuId} />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.name} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={displayImage} />
        <meta name="twitter:label1" content="Preço" />
        <meta name="twitter:data1" content={`R$ ${effectivePrice.toFixed(2).replace(".", ",")}`} />
        <meta name="twitter:label2" content="Disponibilidade" />
        <meta name="twitter:data2" content="Em estoque" />
        <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      {/* Product Main */}
      <main className="container-page pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 py-2 text-[11px] text-muted-foreground">
          <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Home className="h-2.5 w-2.5" />
          </Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="line-clamp-1 text-foreground font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Image Gallery */}
          <ProductGallery
            key={displayImage}
            mainImage={displayImage}
            images={displayImages}
            productName={product.name}
          />

          {/* Info */}
          <div className="flex flex-col">
            {product.category && (
              <p className="mb-1 text-xs font-semibold capitalize text-[#0d6efd]">
                {product.category.split(/[\/\-]/).filter(Boolean).pop()?.replace(/-/g, " ")}
              </p>
            )}

            <h1 className="text-2xl font-semibold leading-tight text-foreground lg:text-3xl">
              {product.name}
            </h1>





            <div className="mt-4 rounded-lg border border-border bg-card p-4">
              <div className="mb-2 text-xs leading-tight">
                <p className="font-bold uppercase text-muted-foreground">Vendido e entregue por</p>
                <p className="font-semibold text-[#0d6efd]">Tendência Cosméticos</p>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-foreground">{formatPrice(effectivePrice)}</span>
              </div>

              {/* Pix Offer Banner */}
              <div className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-3 text-white">
                <img src={pixIcon} alt="Pix" className="h-5 w-5 invert"  loading="lazy"/>
                <span className="text-sm font-bold">Oferta exclusiva para Pix!</span>
              </div>

              {/* Variants */}
              {variants.length > 1 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-sm font-semibold text-foreground">
                    {variantLabel}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => (
                      <button
                        key={v}
                        onClick={() => setSelectedVariant(v)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedVariant === v
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-foreground hover:border-primary/50"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + Buy */}
              <div className="mt-3 flex w-full items-center gap-2">
                <div className="flex h-11 items-center overflow-hidden rounded border border-[#ccc] bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-11 w-9 items-center justify-center text-xl font-light leading-none text-[#555]"
                    aria-label="Diminuir"
                  >
                    −
                  </button>
                  <span className="w-9 select-none text-center text-base text-[#333]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-11 w-9 items-center justify-center text-xl font-light leading-none text-[#555]"
                    aria-label="Aumentar"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => {
                    let finalName = product.name;
                    if (selectedVariant) {
                      const sizeRegex = /\d+(?:[.,]\d+)?\s?(?:ml|mg|g|kg|l|un|cápsulas|caps|comprimidos|comp|tabletes|sachês|sache|sachets)\b/i;
                      if (sizeRegex.test(product.name)) {
                        finalName = product.name.replace(sizeRegex, selectedVariant);
                      } else {
                        finalName = `${product.name} - ${selectedVariant}`;
                      }
                    }
                    addItem(
                      {
                        ...product,
                        name: finalName,
                        price: effectivePrice,
                        originalPrice: effectiveOriginal,
                        image: displayImage,
                      },
                      quantity,
                      selectedVariant || undefined,
                    );
                  }}
                  className="flex h-11 flex-1 items-center justify-center gap-2.5 rounded bg-[#29ABE2] px-5 text-[15px] font-bold uppercase tracking-wide text-white"
                >
                  COMPRAR
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </button>
              </div>
            </div>

            <ShippingCalculator />







            {/* Payment methods removed */}
          </div>
        </div>

        {/* Description */}
        {desc && (() => {
          const sections = parseDescriptionSections(desc.descriptionHtml);
          const intro = sections.find((s) => /descri[cç]/i.test(s.title)) || sections[0];
          const rest = sections.filter((s) => s !== intro);
          const proseCls =
            "prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-headings:mt-4 prose-headings:mb-2 prose-p:mb-3 prose-p:leading-relaxed prose-strong:text-foreground prose-li:text-foreground prose-ul:my-3 prose-ol:my-3 prose-li:mb-1.5 prose-table:text-xs prose-td:border prose-td:border-border prose-td:px-2 prose-td:py-1";
          return (
            <div className="mt-12">
              <h2 className="mb-4 text-xl font-bold text-foreground">Descrição do Produto</h2>
              {intro && (
                <div className={proseCls} dangerouslySetInnerHTML={{ __html: intro.html }} />
              )}

              {rest.length > 0 && (
                <div className="mt-8">
                  <h2 className="mb-1 text-xl font-bold text-foreground">Ficha técnica completa</h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Tudo o que você precisa saber antes de comprar
                  </p>
                  <Accordion type="multiple" className="rounded-lg border border-border bg-card">
                    {rest.map((s, i) => (
                      <AccordionItem
                        key={i}
                        value={`item-${i}`}
                        className="border-b border-border last:border-b-0 px-4"
                      >
                        <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline">
                          {s.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div
                            className={proseCls}
                            dangerouslySetInnerHTML={{ __html: s.html }}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </div>
          );
        })()}

        {/* Reviews */}
        <section id="avaliacoes" className="mt-12 scroll-mt-24">
          <h2 className="mb-4 text-xl font-bold text-foreground">Avaliações dos clientes</h2>

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-4xl font-bold text-foreground">{reviewStats.rating.toFixed(1)}</span>
              <StarRating rating={reviewStats.rating} size={20} />
              <span className="mt-1 text-xs text-muted-foreground">
                Baseado em {formatReviewCount(reviewStats.count)} avaliações
              </span>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const pct =
                  star === 5 ? 88 :
                  star === 4 ? 10 :
                  star === 3 ? 1.5 :
                  star === 2 ? 0.3 : 0.2;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-6 text-foreground">{star}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-muted-foreground">
                      {Math.round((reviewStats.count * pct) / 100).toLocaleString("pt-BR")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <ul className="mt-6 space-y-4">
            {visibleReviews.map((rev, idx) => (
              <li key={idx} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StarRating rating={rev.rating} size={14} />
                    <span className="text-sm font-semibold text-foreground">{rev.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{rev.date}</span>
                </div>
                {rev.title && (
                  <p className="mt-2 text-sm font-semibold text-foreground">{rev.title}</p>
                )}
                <p className="mt-1 text-sm leading-relaxed text-foreground/90">{rev.text}</p>
              </li>
            ))}
          </ul>

          {!reviewsExpanded && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setReviewsExpanded(true)}
                className="rounded-md border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Exibir todas as avaliações
              </button>
            </div>
          )}
        </section>



        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <RelatedSlider products={relatedProducts} />
        )}
      </main>

    </StoreLayout>
  );
};


export default ProductPage;
