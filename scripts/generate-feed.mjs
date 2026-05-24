#!/usr/bin/env node
/**
 * Gera public/feed.xml no padrão Google Merchant.
 * - Lê src/data/products.ts via parsing simples (regex).
 * - Copia imagens bundled de src/assets/products/ -> public/products/.
 * - Usa identifier_exists=false (marca própria, sem GTIN).
 * - MPN = product.id (estável e único).
 *
 * Rodar:  node scripts/generate-feed.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE = "https://gcomerciosuplementos.com";
const DEFAULT_BRAND = "Tendencia Cosmeticos";
const KNOWN_BRANDS = ["Growth Supplements", "Masterway", "Max Titanium", "Integralmédica", "Probiótica", "Black Skull", "Dux Nutrition", "Atlhetica", "Optimum Nutrition", "Nutrata", "Darkness"];
const CATEGORY = "Health & Beauty > Health Care > Fitness & Nutrition > Nutritional Supplements";
const detectBrand = (name) => KNOWN_BRANDS.find((b) => name.toLowerCase().includes(b.toLowerCase())) || DEFAULT_BRAND;

const productsPath = path.join(ROOT, "src/data/products.ts");
const src = fs.readFileSync(productsPath, "utf8");

// 1) Mapa de imports: varName -> caminho relativo (ex: daily-whey-chocolate.png)
const importMap = {};
for (const m of src.matchAll(/import\s+(\w+)\s+from\s+["']@\/assets\/(?:products\/)?([^"']+)["']/g)) {
  importMap[m[1]] = m[2]; // "products/daily-whey-chocolate.png" ou "daily-whey-chocolate.png"
}

// 2) Copia imagens bundled -> public/products/
const publicProducts = path.join(ROOT, "public/products");
fs.mkdirSync(publicProducts, { recursive: true });
const copiedImages = {};
for (const [varName, rel] of Object.entries(importMap)) {
  const srcImg = path.join(ROOT, "src/assets", rel);
  if (!fs.existsSync(srcImg)) continue;
  const fname = path.basename(rel);
  const dst = path.join(publicProducts, fname);
  fs.copyFileSync(srcImg, dst);
  copiedImages[varName] = `${SITE}/products/${fname}`;
}

// 3) Parse produtos: { id, name, image, price }
const productBlocks = [...src.matchAll(/\{\s*id:\s*"([^"]+)",[\s\S]*?\}/g)];
const products = [];
for (const block of productBlocks) {
  const body = block[0];
  const id = block[1];
  const name = body.match(/name:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
  const priceStr = body.match(/price:\s*([\d.]+)/)?.[1];
  // image pode ser var (sem aspas) ou string http
  const imgVar = body.match(/image:\s*([A-Za-z_]\w*)\s*,/)?.[1];
  const imgUrl = body.match(/image:\s*"(https?:\/\/[^"]+)"/)?.[1];
  if (!name || !priceStr) continue;
  let image = imgUrl;
  if (imgVar && copiedImages[imgVar]) image = copiedImages[imgVar];
  if (!image) continue; // sem imagem resolvível, pular
  products.push({ id, name, image, price: parseFloat(priceStr) });
}

// dedupe por id
const seen = new Set();
const unique = products.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));

console.log(`Produtos encontrados: ${productBlocks.length}, com imagem resolvível: ${unique.length}`);

// 4) Escapa XML
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// 5) Gera XML
const items = unique
  .map((p) => {
    const link = `${SITE}/products/${p.id}`;
    const desc = p.name; // descrição curta = nome (descrição completa fica na página)
    return `    <item>
      <g:id>${esc(p.id)}</g:id>
      <g:title>${esc(p.name.slice(0, 150))}</g:title>
      <g:description>${esc(desc)}</g:description>
      <g:link>${esc(link)}</g:link>
      <g:image_link>${esc(p.image)}</g:image_link>
      <g:availability>in stock</g:availability>
      <g:price>${p.price.toFixed(2)} BRL</g:price>
      <g:condition>new</g:condition>
      <g:brand>${esc(detectBrand(p.name))}</g:brand>
      <g:mpn>${esc(p.id)}</g:mpn>
      <g:identifier_exists>false</g:identifier_exists>
      <g:google_product_category>${esc(CATEGORY)}</g:google_product_category>
      <g:shipping>
        <g:country>BR</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 BRL</g:price>
      </g:shipping>
    </item>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Tendencia Cosmeticos</title>
    <link>${SITE}</link>
    <description>Tendencia Cosmeticos — Suplementos alimentares, esportivos e cosméticos com os melhores preços.</description>
${items}
  </channel>
</rss>
`;

fs.writeFileSync(path.join(ROOT, "public/feed.xml"), xml);
console.log(`✅ public/feed.xml gerado com ${unique.length} produtos.`);
console.log(`📥 Envie a URL ao Google Merchant Center: ${SITE}/feed.xml`);
