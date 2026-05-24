// ============================================================
// ARQUIVO: src/components/ProductSEO.tsx
// Instale antes: npm install react-helmet-async
// No seu main.tsx envolva o App com <HelmetProvider>
// ============================================================

import { Helmet } from "react-helmet-async";

interface ProductSEOProps {
  nome: string;
  descricao: string;
  preco: number | string;
  imagem: string;
  slug: string; // ex: "epoca-base-liquida-niina-secrets-by-eudora-hidra-glow"
  disponivel?: boolean;
  marca?: string;
  gtin?: string; // código de barras EAN do produto
}

export function ProductSEO({
  nome,
  descricao,
  preco,
  imagem,
  slug,
  disponivel = true,
  marca = "",
  gtin = "",
}: ProductSEOProps) {
  const url = `https://gcomerciosuplementos.com/products/${slug}`;
  const titulo = `${nome} | Tendencia Cosmeticos`;
  const descricaoMeta = descricao.length > 155
    ? descricao.substring(0, 152) + "..."
    : descricao;

  const schemaProduct = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: nome,
    image: imagem,
    description: descricao,
    ...(marca && { brand: { "@type": "Brand", name: marca } }),
    ...(gtin && { gtin13: gtin }),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BRL",
      price: String(preco),
      availability: disponivel
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Tendencia Cosmeticos",
      },
    },
  };

  return (
    <Helmet>
      {/* Título e descrição */}
      <title>{titulo}</title>
      <meta name="description" content={descricaoMeta} />

      {/* Open Graph (Facebook / WhatsApp) */}
      <meta property="og:type" content="product" />
      <meta property="og:title" content={titulo} />
      <meta property="og:description" content={descricaoMeta} />
      <meta property="og:image" content={imagem} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Tendencia Cosmeticos" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={titulo} />
      <meta name="twitter:description" content={descricaoMeta} />
      <meta name="twitter:image" content={imagem} />

      {/* Canonical URL (evita conteúdo duplicado) */}
      <link rel="canonical" href={url} />

      {/* Schema.org — Dados estruturados para Google Shopping */}
      <script type="application/ld+json">
        {JSON.stringify(schemaProduct)}
      </script>
    </Helmet>
  );
}


// ============================================================
// COMO USAR na sua página de produto:
// ============================================================
//
// import { ProductSEO } from "@/components/ProductSEO";
//
// function PaginaProduto() {
//   const produto = { ...dados do seu produto... };
//
//   return (
//     <>
//       <ProductSEO
//         nome={produto.nome}
//         descricao={produto.descricao}
//         preco={produto.preco}
//         imagem={produto.imagem}
//         slug={produto.slug}
//         disponivel={produto.emEstoque}
//         marca={produto.marca}
//         gtin={produto.codigoBarras}
//       />
//
//       {/* Resto do layout da página */}
//       <div>...</div>
//     </>
//   );
// }
