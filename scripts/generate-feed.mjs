#!/usr/bin/env node
/**
 * Gera public/feed.xml no padrão Google Merchant a partir de src/data/products.ts.
 * Links sempre apontam para https://lojas-epoca.store/produtos/{id}.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE = "https://lojas-epoca.store";
const DEFAULT_BRAND = "Época Cosméticos";
const KNOWN_BRANDS = [
  "Wella", "L'Oréal", "L'Oreal", "Loreal", "Maybelline", "Vichy", "La Roche-Posay",
  "Eucerin", "Bioré", "Biore", "Neostrata", "SkinCeuticals", "Dior", "M·A·C", "MAC",
  "Ruby Kisses", "Catharine Hill", "Océane", "Oceane", "Vizzela", "Ricca", "Latika",
  "Essence", "Principia", "Contém 1g", "Boca Rosa", "Real Techniques", "Época",
];
const CATEGORY = "Health & Beauty > Personal Care > Cosmetics";
const detectBrand = (name) => KNOWN_BRANDS.find((b) => name.toLowerCase().includes(b.toLowerCase())) || DEFAULT_BRAND;

const src = fs.readFileSync(path.join(ROOT, "src/data/products.ts"), "utf8");

// Mapa de imports: varName -> URL pública sob /products/
const importMap = {};
for (const m of src.matchAll(/import\s+(\w+)\s+from\s+["']@\/assets\/(?:products\/)?([^"']+)["']/g)) {
  importMap[m[1]] = `/products/${path.basename(m[2])}`;
}

// Extrai blocos de produto: do "id" até o fechamento "}" antes do próximo "{" ou final do array
const blockRe = /\{\s*"?id"?\s*:\s*"([^"]+)"[\s\S]*?\n\s{2}\}/g;
const products = [];
for (const m of src.matchAll(blockRe)) {
  const body = m[0];
  const id = m[1];
  const name = body.match(/"?name"?\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
  const priceStr = body.match(/"?price"?\s*:\s*([\d.]+)/)?.[1];
  const origStr = body.match(/"?originalPrice"?\s*:\s*([\d.]+)/)?.[1];
  const ean = body.match(/"?ean"?\s*:\s*"([^"]+)"/)?.[1];

  // image: pode ser "string", variável (sem aspas), ou URL absoluta
  let image;
  const imgStr = body.match(/"?image"?\s*:\s*"([^"]+)"/)?.[1];
  const imgVar = body.match(/"?image"?\s*:\s*([A-Za-z_]\w*)\s*,/)?.[1];
  if (imgStr) image = imgStr.startsWith("http") ? imgStr : `${SITE}${imgStr.startsWith("/") ? "" : "/"}${imgStr}`;
  else if (imgVar && importMap[imgVar]) image = `${SITE}${importMap[imgVar]}`;

  // additional images
  const imagesBlock = body.match(/"?images"?\s*:\s*\[([\s\S]*?)\]/)?.[1] ?? "";
  const additional = [...imagesBlock.matchAll(/"([^"]+)"/g)]
    .map((x) => x[1])
    .filter((u) => u !== imgStr)
    .map((u) => (u.startsWith("http") ? u : `${SITE}${u.startsWith("/") ? "" : "/"}${u}`))
    .slice(0, 10);

  if (!name || !priceStr || !image) continue;
  products.push({
    id, name, image, additional,
    price: parseFloat(priceStr),
    originalPrice: origStr ? parseFloat(origStr) : null,
    ean,
  });
}

const seen = new Set();
const unique = products.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
console.log(`Produtos: ${unique.length}`);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const items = unique.map((p) => {
  const link = `${SITE}/produtos/${p.id}`;
  const salePrice = p.originalPrice && p.originalPrice > p.price ? p.price : null;
  const basePrice = p.originalPrice && p.originalPrice > p.price ? p.originalPrice : p.price;
  const addl = p.additional.map((u) => `      <g:additional_image_link>${esc(u)}</g:additional_image_link>`).join("\n");
  return `    <item>
      <g:id>${esc(p.id)}</g:id>
      <g:title>${esc(p.name.slice(0, 150))}</g:title>
      <g:description>${esc(p.name)}</g:description>
      <g:link>${esc(link)}</g:link>
      <g:image_link>${esc(p.image)}</g:image_link>
${addl}
      <g:availability>in stock</g:availability>
      <g:price>${basePrice.toFixed(2)} BRL</g:price>${salePrice ? `\n      <g:sale_price>${salePrice.toFixed(2)} BRL</g:sale_price>` : ""}
      <g:condition>new</g:condition>
      <g:brand>${esc(detectBrand(p.name))}</g:brand>
      <g:mpn>${esc(p.id)}</g:mpn>
      ${p.ean ? `<g:gtin>${esc(p.ean)}</g:gtin>` : `<g:identifier_exists>false</g:identifier_exists>`}
      <g:google_product_category>${esc(CATEGORY)}</g:google_product_category>
      <g:shipping>
        <g:country>BR</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 BRL</g:price>
      </g:shipping>
    </item>`;
}).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Lojas Época</title>
    <link>${SITE}</link>
    <description>Lojas Época — Cosméticos, maquiagem e cuidados com a pele com os melhores preços.</description>
${items}
  </channel>
</rss>
`;

fs.writeFileSync(path.join(ROOT, "public/feed.xml"), xml);
console.log(`✅ public/feed.xml: ${unique.length} produtos. URL: ${SITE}/feed.xml`);
