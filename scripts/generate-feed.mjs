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
const STORE_NAME = "Tendência Cosméticos";
const DEFAULT_BRAND = "Tendência Cosméticos";
// Order matters: longer/more specific first
const KNOWN_BRANDS = [
  "L'Oréal Professionnel", "L'Oréal Paris", "L'Oréal", "L'Oreal", "Loreal",
  "Wella Professionals", "Wella SP", "Wella",
  "La Roche-Posay", "La Roche Posay",
  "Mantecorp Skincare", "Mantecorp", "Epidrat",
  "Lola Cosmetics", "Lola",
  "Widi Care",
  "Real Techniques",
  "Ruby Kisses",
  "Boca Rosa",
  "Catharine Hill",
  "Jo Malone London", "Jo Malone",
  "Garnier Skin", "Garnier",
  "Bepantol", "Bepantriz",
  "Bio-Oil",
  "O Boticário", "Boticário",
  "Kérastase", "Kerastase",
  "Redken",
  "Sebastian",
  "SkinCeuticals",
  "Cadiveu",
  "Dailus",
  "Dermage",
  "Avène", "Avene",
  "Neostrata",
  "Maybelline",
  "Vichy",
  "Eucerin",
  "Bioderma",
  "Bioré", "Biore",
  "CeraVe",
  "Cetaphil",
  "Neutrogena",
  "Nivea",
  "Dove",
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
  "Granado",
  "Medicube",
  "SKIN1004",
  "Celimax",
  "Biolab",
  "Natuflora",
  "Phytoderm",
  "Dior",
  "Givenchy",
  "Shiseido",
  "Revlon Professional", "Revlon",
  "Niina Secrets",
  "Eudora",
  "Bruna Tavares", "BT ",
  "Pink Cheeks",
  "Isdin",
  "Hada Labo",
  "Adcos",
  "5km",
  "Fino Premium", "Fino",
  "Zella",
  "Coréga", "Corega",
  "Carmed",
  "Actine",
  "Acnase",
  "Lancôme", "Lancome",
  "M·A·C", "MAC",
  "Océane", "Oceane",
  "Vizzela", "Ricca", "Latika", "Essence",
  "Contém 1g",
  "Acnezil", "Ollie", "Impala",
  "Época",
];

// Normalize curly apostrophes to straight for matching
const normalize = (s) => s.replace(/[’‘`]/g, "'").toLowerCase();

const CATEGORY_MAP = {
  "cosmeticos-cabelos-oleo":                         "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products > Hair Serums & Hair Oils",
  "cosmeticos-cabelos-normal-ou-todos-os-tipos":     "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products > Hair Masks",
  "cosmeticos-cabelos-danificados":                  "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products > Hair Masks",
  "cosmeticos-cabelos-seco-e-ressecados":            "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products > Hair Masks",
  "cosmeticos-cabelos-tratamentos-e-mascaras":       "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products > Hair Masks",
  "cosmeticos-cabelos-coloridos-e-com-mechas":       "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products > Hair Masks",
  "cosmeticos-cabelos-cacheado-e-crespo":            "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products",
  "cosmeticos-cabelos-fino":                         "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products",
  "cosmeticos-cabelos-loiros-e-descoloridos":        "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products",
  "cosmeticos-cabelos-kits-para-cabelos":            "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products",
  "cosmeticos-cabelos-balsamo-e-creme":              "Health & Beauty > Personal Care > Hair Care > Hair Conditioners",
  "cosmeticos-cabelos-ativador-de-cachos":           "Health & Beauty > Personal Care > Hair Care > Hair Styling Products",
  "cosmeticos-cabelos-protetor-termico":             "Health & Beauty > Personal Care > Hair Care > Hair Styling Products",
  "cosmeticos-maquiagem-base":                       "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Face Primers & Makeup Bases",
  "cosmeticos-maquiagem-esponja":                    "Health & Beauty > Personal Care > Cosmetics > Cosmetic Tool Accessories > Makeup Sponges",
  "cosmeticos-maquiagem-blush":                      "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Blushes & Bronzers",
  "cosmeticos-maquiagem-contorno":                   "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Contouring Cosmetics",
  "cosmeticos-maquiagem-corretivo":                  "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Concealers",
  "cosmeticos-maquiagem-po-compacto":                "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Face Powder",
  "cosmeticos-maquiagem-po-facial":                  "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Face Powder",
  "cosmeticos-maquiagem-fixador-da-maquiagem":       "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Setting Sprays & Powders",
  "cosmeticos-maquiagem-mascara-para-cilios":        "Health & Beauty > Personal Care > Cosmetics > Eye Makeup > Mascara",
  "cosmeticos-maquiagem-sombra":                     "Health & Beauty > Personal Care > Cosmetics > Eye Makeup > Eye Shadow",
  "cosmeticos-maquiagem-mascara-para-sobrancelhas":  "Health & Beauty > Personal Care > Cosmetics > Eye Makeup > Eyebrow Liner",
  "cosmeticos-maquiagem-lapis-e-kajal":              "Health & Beauty > Personal Care > Cosmetics > Eye Makeup > Eyeliner",
  "cosmeticos-maquiagem-batom":                      "Health & Beauty > Personal Care > Cosmetics > Lip Makeup > Lipstick",
  "cosmeticos-maquiagem-gloss":                      "Health & Beauty > Personal Care > Cosmetics > Lip Makeup > Lip Gloss",
  "cosmeticos-maquiagem-contorno-labial":            "Health & Beauty > Personal Care > Cosmetics > Lip Makeup > Lip Liner",
  "cosmeticos-maquiagem-demaquilante":               "Health & Beauty > Personal Care > Skin Care > Makeup Removers",
  "cosmeticos-maquiagem-acessorios-de-remocao-da-maquiagem": "Health & Beauty > Personal Care > Skin Care > Makeup Removers",
  "cosmeticos-maquiagem-estojo-completo-ou-kit-de-maquiagem": "Health & Beauty > Personal Care > Cosmetics > Cosmetic Sets & Kits",
  "cosmeticos-dermocosmeticos-hidratantes":                    "Health & Beauty > Personal Care > Skin Care > Facial Lotions & Moisturizers",
  "cosmeticos-dermocosmeticos-hidratantes-corporais":          "Health & Beauty > Personal Care > Skin Care > Body Lotions & Moisturizers",
  "cosmeticos-dermocosmeticos-protetor-solar":                 "Health & Beauty > Personal Care > Skin Care > Sunscreen",
  "cosmeticos-dermocosmeticos-protetor-solar-com-cor":         "Health & Beauty > Personal Care > Skin Care > Sunscreen",
  "cosmeticos-dermocosmeticos-rejuvenescedores":               "Health & Beauty > Personal Care > Skin Care > Anti-Aging Skin Care Kits",
  "cosmeticos-dermocosmeticos-cuidados-faciais-especificos":   "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
  "cosmeticos-dermocosmeticos-cuidados-corporais-especificos": "Health & Beauty > Personal Care > Skin Care > Body Wash",
  "cosmeticos-dermocosmeticos-gel-de-limpeza":                 "Health & Beauty > Personal Care > Skin Care > Facial Cleansers",
  "cosmeticos-dermocosmeticos-limpadores":                     "Health & Beauty > Personal Care > Skin Care > Facial Cleansers",
  "cosmeticos-dermocosmeticos-anti-marcas":                    "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
  "cosmeticos-dermocosmeticos-kits":                           "Health & Beauty > Personal Care > Cosmetics > Cosmetic Sets & Kits",
  "cosmeticos-dermocosmeticos-face":                           "Health & Beauty > Personal Care > Skin Care",
  "cosmeticos-dermocosmeticos-shampoo":                        "Health & Beauty > Personal Care > Hair Care > Shampoos",
  "cosmeticos-dermocosmeticos-tonicos":                        "Health & Beauty > Personal Care > Skin Care > Toners & Astringents",
  "cosmeticos-dermocosmeticos-agua-micelar":                   "Health & Beauty > Personal Care > Skin Care > Makeup Removers",
  "cosmeticos-dermocosmeticos-tratamentos":                    "Health & Beauty > Personal Care > Skin Care",
  "cosmeticos-tratamentos-protetor-solar":            "Health & Beauty > Personal Care > Skin Care > Sunscreen",
  "cosmeticos-tratamentos-protetor-solar-com-cor":    "Health & Beauty > Personal Care > Skin Care > Sunscreen",
  "cosmeticos-tratamentos-hidratantes-faciais":       "Health & Beauty > Personal Care > Skin Care > Facial Lotions & Moisturizers",
  "cosmeticos-tratamentos-limpadores-faciais":        "Health & Beauty > Personal Care > Skin Care > Facial Cleansers",
  "cosmeticos-tratamentos-agua-micelar":              "Health & Beauty > Personal Care > Skin Care > Makeup Removers",
  "cosmeticos-tratamentos-cuidados-faciais-especificos": "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
  "cosmeticos-cuidados-pessoais-sabonetes":           "Health & Beauty > Personal Care > Soap & Body Wash",
};
const DEFAULT_CATEGORY = "Health & Beauty > Personal Care > Cosmetics";

const getCategory = (cat) => CATEGORY_MAP[cat] || DEFAULT_CATEGORY;
const detectBrand = (name) => {
  const n = normalize(name);
  return KNOWN_BRANDS.find((b) => n.includes(normalize(b))) || DEFAULT_BRAND;
};

const src = fs.readFileSync(path.join(ROOT, "src/data/products.ts"), "utf8");

const importMap = {};
for (const m of src.matchAll(/import\s+(\w+)\s+from\s+["']@\/assets\/(?:products\/)?([^"']+)["']/g)) {
  importMap[m[1]] = `/products/${path.basename(m[2])}`;
}

const blockRe = /\{\s*"?id"?\s*:\s*"([^"]+)"[\s\S]*?\n\s{2}\}/g;
const products = [];
for (const m of src.matchAll(blockRe)) {
  const body = m[0];
  const id = m[1];
  const name = body.match(/"?name"?\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
  const priceStr = body.match(/"?price"?\s*:\s*([\d.]+)/)?.[1];
  const origStr = body.match(/"?originalPrice"?\s*:\s*([\d.]+)/)?.[1];
  const ean = body.match(/"?ean"?\s*:\s*"([^"]+)"/)?.[1];
  const category = body.match(/"?category"?\s*:\s*"([^"]+)"/)?.[1] ?? "";

  let image;
  const imgStr = body.match(/"?image"?\s*:\s*"([^"]+)"/)?.[1];
  const imgVar = body.match(/"?image"?\s*:\s*([A-Za-z_]\w*)\s*,/)?.[1];
  if (imgStr) image = imgStr.startsWith("http") ? imgStr : `${SITE}${imgStr.startsWith("/") ? "" : "/"}${imgStr}`;
  else if (imgVar && importMap[imgVar]) image = `${SITE}${importMap[imgVar]}`;

  const imagesBlock = body.match(/"?images"?\s*:\s*\[([\s\S]*?)\]/)?.[1] ?? "";
  const additional = [...imagesBlock.matchAll(/"([^"]+)"/g)]
    .map((x) => x[1])
    .filter((u) => u !== imgStr)
    .map((u) => (u.startsWith("http") ? u : `${SITE}${u.startsWith("/") ? "" : "/"}${u}`))
    .slice(0, 10);

  if (!name || !priceStr || !image) continue;

  const brand = detectBrand(name);
  const googleCategory = getCategory(category);
  const description = generateDescription(name, brand, googleCategory);

  products.push({
    id, name, image, additional, category, description,
    price: parseFloat(priceStr),
    originalPrice: origStr ? parseFloat(origStr) : null,
    ean,
  });
}

function generateDescription(name, brand, googleCategory) {
  const catHint = inferCategoryHint(googleCategory);
  return `${name}. ${catHint}Compre ${brand !== STORE_NAME ? `${brand} ` : ""}com desconto na ${STORE_NAME} — entrega rápida para todo o Brasil.`;
}

function inferCategoryHint(cat) {
  if (cat.includes("Sunscreen")) return "Protetor solar com alta proteção. ";
  if (cat.includes("Shampoo")) return "Shampoo para cuidados diários dos cabelos. ";
  if (cat.includes("Hair Oil") || cat.includes("Hair Serum")) return "Óleo ou sérum capilar para nutrição e brilho. ";
  if (cat.includes("Hair Mask") || cat.includes("Hair Treatment")) return "Máscara e tratamento capilar profundo. ";
  if (cat.includes("Hair Conditioner")) return "Condicionador e creme hidratante capilar. ";
  if (cat.includes("Hair Styling")) return "Produto de finalização e estilo para os cabelos. ";
  if (cat.includes("Mascara")) return "Máscara para cílios com volume e alongamento. ";
  if (cat.includes("Eye Shadow")) return "Sombra para olhos com alta pigmentação. ";
  if (cat.includes("Eyeliner") || cat.includes("Kajal")) return "Delineador e lápis para olhos. ";
  if (cat.includes("Eyebrow")) return "Produto para design e definição de sobrancelhas. ";
  if (cat.includes("Lipstick")) return "Batom com cor intensa e longa duração. ";
  if (cat.includes("Lip Gloss")) return "Gloss labial com brilho e hidratação. ";
  if (cat.includes("Lip Liner")) return "Lápis contorno labial para delineamento preciso. ";
  if (cat.includes("Blush") || cat.includes("Bronzer")) return "Blush e bronzer para dar cor e vida ao rosto. ";
  if (cat.includes("Contouring")) return "Contorno facial para definir e esculpir o rosto. ";
  if (cat.includes("Concealer")) return "Corretivo de alta cobertura para imperfeições. ";
  if (cat.includes("Face Powder")) return "Pó facial para fixação e acabamento matte. ";
  if (cat.includes("Setting")) return "Fixador de maquiagem para maior durabilidade. ";
  if (cat.includes("Face Primer") || cat.includes("Makeup Base")) return "Base e primer para preparo da pele. ";
  if (cat.includes("Makeup Remover")) return "Demaquilante e removedor de maquiagem suave. ";
  if (cat.includes("Makeup Sponge")) return "Esponja de maquiagem para aplicação perfeita. ";
  if (cat.includes("Cosmetic Set") || cat.includes("Kit")) return "Kit e estojo completo de maquiagem. ";
  if (cat.includes("Facial Cleanser")) return "Limpador facial suave para pele renovada. ";
  if (cat.includes("Facial Lotion") || cat.includes("Moisturizer")) return "Hidratante facial com ação nutritiva. ";
  if (cat.includes("Body Lotion")) return "Hidratante corporal para pele macia e suave. ";
  if (cat.includes("Toner") || cat.includes("Astringent")) return "Tônico e água micelar para equilíbrio da pele. ";
  if (cat.includes("Anti-Aging")) return "Tratamento anti-idade para pele mais jovem. ";
  if (cat.includes("Facial Treatment") || cat.includes("Facial Mask")) return "Tratamento e máscara facial intensivo. ";
  if (cat.includes("Soap") || cat.includes("Body Wash")) return "Sabonete e gel de banho para higiene diária. ";
  return "Produto de beleza e cosméticos premium. ";
}

const seen = new Set();
const unique = products.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
console.log(`Produtos únicos: ${unique.length}`);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const items = unique.map((p) => {
  const link = `${SITE}/produtos/${p.id}`;
  const salePrice = p.originalPrice && p.originalPrice > p.price ? p.price : null;
  const basePrice = p.originalPrice && p.originalPrice > p.price ? p.originalPrice : p.price;
  const addl = p.additional.map((u) => `      <g:additional_image_link>${esc(u)}</g:additional_image_link>`).join("\n");
  const googleCategory = getCategory(p.category);

  return `    <item>
      <g:id>${esc(p.id)}</g:id>
      <g:title>${esc(p.name.slice(0, 150))}</g:title>
      <g:description>${esc(p.description.slice(0, 5000))}</g:description>
      <g:link>${esc(link)}</g:link>
      <g:image_link>${esc(p.image)}</g:image_link>
${addl}
      <g:availability>in stock</g:availability>
      <g:price>${basePrice.toFixed(2)} BRL</g:price>${salePrice ? `\n      <g:sale_price>${salePrice.toFixed(2)} BRL</g:sale_price>\n      <g:sale_price_effective_date>2026-05-24T00:00-03:00/2027-05-24T23:59-03:00</g:sale_price_effective_date>` : ""}
      <g:condition>new</g:condition>
      <g:brand>${esc(detectBrand(p.name))}</g:brand>
      ${p.ean ? `<g:gtin>${esc(p.ean)}</g:gtin>` : `<g:identifier_exists>false</g:identifier_exists>`}
      <g:google_product_category>${esc(googleCategory)}</g:google_product_category>
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
    <title>${STORE_NAME}</title>
    <link>${SITE}</link>
    <description>${STORE_NAME} — Cosméticos, maquiagem e cuidados com a pele com os melhores preços.</description>
${items}
  </channel>
</rss>
`;

fs.writeFileSync(path.join(ROOT, "public/feed.xml"), xml);
console.log(`✅ public/feed.xml gerado: ${unique.length} produtos. URL: ${SITE}/feed.xml`);