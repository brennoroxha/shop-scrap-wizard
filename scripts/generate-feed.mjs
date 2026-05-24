#!/usr/bin/env node
/**
 * Gera public/feed.xml no padrão Google Merchant a partir de src/data/products.ts.
 * Links sempre apontam para https://lojas-epoca.store/produtos/{id}.
 *
 * Política aplicada:
 *  - Preço único: nunca emitir g:sale_price / sale_price_effective_date.
 *  - GTINs duplicados entre produtos diferentes => mantém GTIN apenas no não-kit
 *    e emite g:identifier_exists=false + g:mpn (id interno) nos demais.
 *  - URLs de imagem com espaços/caracteres => encodeURI.
 *  - Overrides explícitos de categoria por id (lista corrigida pelo usuário).
 *  - Adiciona g:mpn, g:product_type e g:item_group_id (heurístico por raiz do slug).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_ID_LEN = 50;

const WORDS_TO_REMOVE = ["de", "e", "a", "o", "com", "para", "em", "kit", "profissional", "professionals", "professional"];
const BRAND_ABBREVIATIONS = {
  "wella-professionals": "wella",
  "l-oreal-professionnel": "loreal-prof",
  "la-roche-posay": "lrp",
  "kerastase": "kerast",
  "skinceuticals": "skinceut",
  "mantecorp-skincare": "mantecorp",
  "neutrogena": "neutrog",
  "bioderma": "bioderm",
  "eucerin": "eucerin"
};

const slugify = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/&/g, " e ")
  .replace(/[’'`´]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .replace(/-+/g, "-");

/**
 * Aplica as regras agressivas de encurtamento do Google Merchant.
 */
const applyGoogleShorteningRules = (id) => {
  let slug = slugify(id);

  // Rule: Abrevie nomes de marcas conhecidas
  for (const [full, short] of Object.entries(BRAND_ABBREVIATIONS)) {
    if (slug.includes(full)) {
      slug = slug.replace(new RegExp(full, "g"), short);
    }
  }

  // Rule: Remova palavras genéricas desnecessárias
  const parts = slug.split("-");
  const filteredParts = parts.filter(p => !WORDS_TO_REMOVE.includes(p));
  slug = filteredParts.join("-");

  // Rule: Remova o prefixo epoca- quando o resultado ainda ficar acima de 50 caracteres
  if (slug.length > MAX_ID_LEN && slug.startsWith("epoca-")) {
    slug = slug.replace(/^epoca-/, "");
  }

  if (slug.length <= MAX_ID_LEN) return slug.replace(/-+$/g, "");

  // Rule: Se houver um número identificador ao final do ID original (ex: -67453, -71803), mantenha-o
  const numericSuffixMatch = slug.match(/-(\d+)$/);
  const numericSuffix = numericSuffixMatch ? numericSuffixMatch[0] : "";

  if (numericSuffix) {
    const limit = MAX_ID_LEN - numericSuffix.length;
    const base = slug.slice(0, slug.lastIndexOf(numericSuffix));
    const truncatedBase = base.slice(0, limit);
    const lastHyphen = truncatedBase.lastIndexOf("-");
    const finalBase = lastHyphen !== -1 ? truncatedBase.slice(0, lastHyphen) : truncatedBase;
    slug = `${finalBase}${numericSuffix}`;
  } else {
    // Rule: Se ainda ultrapassar 50 caracteres, trunce garantindo que não quebre no meio de uma palavra
    const truncated = slug.slice(0, MAX_ID_LEN);
    const lastHyphen = truncated.lastIndexOf("-");
    slug = lastHyphen !== -1 ? truncated.slice(0, lastHyphen) : truncated;
  }

  return slug.replace(/-+$/g, "").replace(/^-+/, "");
};

const limitSlug = (value, max = MAX_ID_LEN) => {
  return applyGoogleShorteningRules(value);
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE = "https://lojas-epoca.store";
const STORE_NAME = "Tendência Cosméticos";
const DEFAULT_BRAND = "Tendência Cosméticos";

const KNOWN_BRANDS = [
  "L'Oréal Professionnel", "L'Oréal Paris", "L'Oréal", "L'Oreal", "Loreal", "Elseve",
  "Wella Professionals", "Wella SP", "Wella",
  "La Roche-Posay", "La Roche Posay",
  "Mantecorp Skincare", "Mantecorp", "Epidrat",
  "Lola Cosmetics", "Lola",
  "Widi Care", "Real Techniques", "Ruby Kisses", "Boca Rosa", "Catharine Hill",
  "Jo Malone London", "Jo Malone",
  "Garnier Skin", "Garnier",
  "Bepantol", "Bepantriz", "Bio-Oil",
  "O Boticário", "Boticário",
  "Kérastase", "Kerastase", "Redken", "Sebastian", "SkinCeuticals", "Cadiveu",
  "Dailus", "Dermage", "Avène", "Avene", "Neostrata", "Maybelline", "Vichy",
  "Eucerin", "Bioderma", "Bioré", "Biore", "CeraVe", "Cetaphil", "Neutrogena",
  "Nivea", "Dove", "Creamy", "Principia", "Sallve", "Darrow", "Theraskin",
  "Umbrella", "Cimed", "Farmax", "Lansinoh", "Mustela", "Granado", "Medicube",
  "SKIN1004", "Celimax", "Biolab", "Natuflora", "Phytoderm", "Dior", "Givenchy",
  "Shiseido", "Revlon Professional", "Revlon", "Niina Secrets", "Eudora",
  "Bruna Tavares", "BT ", "Pink Cheeks", "Isdin", "Hada Labo", "Adcos", "5km",
  "Fino Premium", "Fino", "Zella", "Coréga", "Corega", "Carmed", "Actine",
  "Acnase", "Lancôme", "Lancome", "M·A·C", "MAC", "Océane", "Oceane",
  "Vizzela", "Ricca", "Latika", "Essence", "Contém 1g", "Acnezil", "Ollie",
  "Impala", "Época",
];

const normalize = (s) => s.replace(/[’‘`]/g, "'").toLowerCase();
const detectBrand = (name) => {
  const n = normalize(name);
  const found = KNOWN_BRANDS.find((b) => n.includes(normalize(b)));
  if (found) return found;
  // Fallback: tenta pegar a primeira palavra significativa se não achou nas conhecidas
  const firstWord = name.split(" ")[0];
  if (firstWord && firstWord.length > 2 && !["Combo", "Kit", "Duo", "Presente"].includes(firstWord)) {
    return firstWord;
  }
  return DEFAULT_BRAND;
};

const CATEGORY_MAP = {
  "cosmeticos-cabelos-oleo": "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products > Hair Serums & Hair Oils",
  "cosmeticos-cabelos-normal-ou-todos-os-tipos": "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products > Hair Masks",
  "cosmeticos-cabelos-danificados": "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products > Hair Masks",
  "cosmeticos-cabelos-seco-e-ressecados": "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products > Hair Masks",
  "cosmeticos-cabelos-tratamentos-e-mascaras": "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products > Hair Masks",
  "cosmeticos-cabelos-coloridos-e-com-mechas": "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products > Hair Masks",
  "cosmeticos-cabelos-cacheado-e-crespo": "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products",
  "cosmeticos-cabelos-fino": "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products",
  "cosmeticos-cabelos-loiros-e-descoloridos": "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products",
  "cosmeticos-cabelos-kits-para-cabelos": "Health & Beauty > Personal Care > Hair Care > Hair Treatment & Conditioning Products",
  "cosmeticos-cabelos-balsamo-e-creme": "Health & Beauty > Personal Care > Hair Care > Hair Conditioners",
  "cosmeticos-cabelos-ativador-de-cachos": "Health & Beauty > Personal Care > Hair Care > Hair Styling Products",
  "cosmeticos-cabelos-protetor-termico": "Health & Beauty > Personal Care > Hair Care > Hair Styling Products",
  "cosmeticos-maquiagem-base": "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Face Primers & Makeup Bases",
  "cosmeticos-maquiagem-esponja": "Health & Beauty > Personal Care > Cosmetics > Cosmetic Tool Accessories > Makeup Sponges",
  "cosmeticos-maquiagem-blush": "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Blushes & Bronzers",
  "cosmeticos-maquiagem-contorno": "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Contouring Cosmetics",
  "cosmeticos-maquiagem-corretivo": "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Concealers",
  "cosmeticos-maquiagem-po-compacto": "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Face Powder",
  "cosmeticos-maquiagem-po-facial": "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Face Powder",
  "cosmeticos-maquiagem-fixador-da-maquiagem": "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Setting Sprays & Powders",
  "cosmeticos-maquiagem-mascara-para-cilios": "Health & Beauty > Personal Care > Cosmetics > Eye Makeup > Mascara",
  "cosmeticos-maquiagem-sombra": "Health & Beauty > Personal Care > Cosmetics > Eye Makeup > Eye Shadow",
  "cosmeticos-maquiagem-mascara-para-sobrancelhas": "Health & Beauty > Personal Care > Cosmetics > Eye Makeup > Eyebrow Liner",
  "cosmeticos-maquiagem-lapis-e-kajal": "Health & Beauty > Personal Care > Cosmetics > Eye Makeup > Eyeliner",
  "cosmeticos-maquiagem-batom": "Health & Beauty > Personal Care > Cosmetics > Lip Makeup > Lipstick",
  "cosmeticos-maquiagem-gloss": "Health & Beauty > Personal Care > Cosmetics > Lip Makeup > Lip Gloss",
  "cosmeticos-maquiagem-contorno-labial": "Health & Beauty > Personal Care > Cosmetics > Lip Makeup > Lip Liner",
  "cosmeticos-maquiagem-demaquilante": "Health & Beauty > Personal Care > Skin Care > Makeup Removers",
  "cosmeticos-maquiagem-acessorios-de-remocao-da-maquiagem": "Health & Beauty > Personal Care > Skin Care > Makeup Removers",
  "cosmeticos-maquiagem-estojo-completo-ou-kit-de-maquiagem": "Health & Beauty > Personal Care > Cosmetics > Cosmetic Sets & Kits",
  "cosmeticos-dermocosmeticos-hidratantes": "Health & Beauty > Personal Care > Skin Care > Facial Lotions & Moisturizers",
  "cosmeticos-dermocosmeticos-hidratantes-corporais": "Health & Beauty > Personal Care > Skin Care > Body Lotions & Moisturizers",
  "cosmeticos-dermocosmeticos-protetor-solar": "Health & Beauty > Personal Care > Skin Care > Sunscreen",
  "cosmeticos-dermocosmeticos-protetor-solar-com-cor": "Health & Beauty > Personal Care > Skin Care > Sunscreen",
  "cosmeticos-dermocosmeticos-rejuvenescedores": "Health & Beauty > Personal Care > Skin Care > Anti-Aging Skin Care Kits",
  "cosmeticos-dermocosmeticos-cuidados-faciais-especificos": "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
  "cosmeticos-dermocosmeticos-cuidados-corporais-especificos": "Health & Beauty > Personal Care > Skin Care > Body Wash",
  "cosmeticos-dermocosmeticos-gel-de-limpeza": "Health & Beauty > Personal Care > Skin Care > Facial Cleansers",
  "cosmeticos-dermocosmeticos-limpadores": "Health & Beauty > Personal Care > Skin Care > Facial Cleansers",
  "cosmeticos-dermocosmeticos-anti-marcas": "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
  "cosmeticos-dermocosmeticos-kits": "Health & Beauty > Personal Care > Cosmetics > Cosmetic Sets & Kits",
  "cosmeticos-dermocosmeticos-face": "Health & Beauty > Personal Care > Skin Care",
  "cosmeticos-dermocosmeticos-shampoo": "Health & Beauty > Personal Care > Hair Care > Shampoos",
  "cosmeticos-dermocosmeticos-tonicos": "Health & Beauty > Personal Care > Skin Care > Toners & Astringents",
  "cosmeticos-dermocosmeticos-agua-micelar": "Health & Beauty > Personal Care > Skin Care > Makeup Removers",
  "cosmeticos-dermocosmeticos-tratamentos": "Health & Beauty > Personal Care > Skin Care",
  "cosmeticos-tratamentos-protetor-solar": "Health & Beauty > Personal Care > Skin Care > Sunscreen",
  "cosmeticos-tratamentos-protetor-solar-com-cor": "Health & Beauty > Personal Care > Skin Care > Sunscreen",
  "cosmeticos-tratamentos-hidratantes-faciais": "Health & Beauty > Personal Care > Skin Care > Facial Lotions & Moisturizers",
  "cosmeticos-tratamentos-limpadores-faciais": "Health & Beauty > Personal Care > Skin Care > Facial Cleansers",
  "cosmeticos-tratamentos-agua-micelar": "Health & Beauty > Personal Care > Skin Care > Makeup Removers",
  "cosmeticos-tratamentos-cuidados-faciais-especificos": "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
  "cosmeticos-cuidados-pessoais-sabonetes": "Health & Beauty > Personal Care > Soap & Body Wash",
};
const DEFAULT_CATEGORY = "Health & Beauty > Personal Care > Cosmetics";

// Per-product Google category overrides (corrections requested by user).
const CATEGORY_OVERRIDES = {
  "epoca-wella-professionals-invigo-nutri-enrich-booster-shampoo": "Health & Beauty > Personal Care > Hair Care > Shampoos",
  "epoca-wella-professionals-invigo-nutri-enrich-shampoo-50ml": "Health & Beauty > Personal Care > Hair Care > Shampoos",
  "wella-professionals-invigo-nutri-enrich-shampoo-50ml": "Health & Beauty > Personal Care > Hair Care > Shampoos",
  "epoca-wella-professionals-invigo-nutri-enrich-mascara-30ml": "Health & Beauty > Personal Care > Hair Care > Hair Conditioners",
  "epoca-wella-professionals-invigo-color-brilliance-shampoo-50ml": "Health & Beauty > Personal Care > Hair Care > Shampoos",
  "epoca-wella-professionals-invigo-color-brilliance-mascara-30ml": "Health & Beauty > Personal Care > Hair Care > Hair Conditioners",
  "epoca-wella-professional-ultimate-luxe-oil-shampoo-travel-size": "Health & Beauty > Personal Care > Hair Care > Shampoos",
  "epoca-wella-professionals-balance-aqua-pure-shampoo": "Health & Beauty > Personal Care > Hair Care > Shampoos",
  "epoca-loreal-professionnel-absolut-repair-gold-quinoa-protein-shampoo": "Health & Beauty > Personal Care > Hair Care > Shampoos",
  "epoca-sebastian-professional-penetraitt-shampoo": "Health & Beauty > Personal Care > Hair Care > Shampoos",
  "epoca-sebastian-dark-oil-shampoo-250ml": "Health & Beauty > Personal Care > Hair Care > Shampoos",
  "epoca-wella-professionals-oil-reflections-condicionador-200ml": "Health & Beauty > Personal Care > Hair Care > Hair Conditioners",
  "epoca-wella-professionals-condicionador--fusion": "Health & Beauty > Personal Care > Hair Care > Hair Conditioners",
  "epoca-wella-sp-oil-reflections-shampoo": "Health & Beauty > Personal Care > Hair Care > Shampoos",
  "epoca-serum-facial-skinceuticals-p-tiox": "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
  "epoca-serum-antirrugas-la-roche-posay-pure-vitamin-c12-oil-control": "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
  "epoca-serum-antirrugas-la-roche-posay-retinol-b-3": "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
  "epoca-creme-reparador-intensivo-eucerin-aquaphor-2-10ml": "Health & Beauty > Personal Care > Skin Care > Body Lotions & Moisturizers",
  "eucerin-pomada-reparadora-intensiva-aquaphor-duopack-2x10ml": "Health & Beauty > Personal Care > Skin Care > Body Lotions & Moisturizers",
  "epoca-clareador-corporal-bioderma-pigmentbio-sensitive-areas": "Health & Beauty > Personal Care > Skin Care > Body Lotions & Moisturizers",
  "epoca-oleo-de-banho-bioderma-atoderm": "Health & Beauty > Personal Care > Soap & Body Wash",
  "epoca-corega-ultra-creme-sem-sabor-20g": "Health & Beauty > Health Care > Denture Care",
  "epoca-la-roche-posay-cicaplast-baume-b5-plus-kit-com-2-unidades": "Health & Beauty > Personal Care > Skin Care > Body Lotions & Moisturizers",
  "epoca-primer-facial-catharine-hill-angel-magic": "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Face Primers & Makeup Bases",
  "epoca-fluido-vizzela-gotas-fix-blindagem": "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Face Primers & Makeup Bases",
  "epoca-serum-epigenetic-facial-eucerin-hyaluron-filler": "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
  "epoca-eucerin-aquaphor-reparador-labial-10ml-153462": "Health & Beauty > Personal Care > Skin Care > Lip Care",
  "epoca-bepantol-derma-regenerador-labial-75ml-96598": "Health & Beauty > Personal Care > Skin Care > Lip Care",
  "epoca-bepantol-derma-protetor-labial-fps50-45g-189081": "Health & Beauty > Personal Care > Skin Care > Lip Care",
  "epoca-reparador-labial-la-roche-posay-cicaplast-labios-75ml-142340": "Health & Beauty > Personal Care > Skin Care > Lip Care",
  "epoca-protetor-labial-original-care-sem-cor-nivea-48g-194502": "Health & Beauty > Personal Care > Skin Care > Lip Care",
  "epoca-la-vie-est-belle-eau-de-parfum-lancome-perfume-feminino": "Health & Beauty > Fragrances > Women's Fragrances",
  "epoca-presente-o-boticario-kit-perfume-floratta-red-passion-170833": "Health & Beauty > Fragrances > Women's Fragrances",
  "epoca-body-mist-jo-malone-london-english-pear-freesia": "Health & Beauty > Fragrances > Women's Fragrances",
  "epoca-phytoderm-glamour-kit-deo-colonia-desodorante": "Health & Beauty > Fragrances",
  "epoca-esmalte-impala-cremoso-jane-75ml-170147": "Health & Beauty > Personal Care > Cosmetics > Nail Care > Nail Polish",
  "epoca-iluminador-liquido-dior-forever-glow-maximizer": "Health & Beauty > Personal Care > Cosmetics > Face Makeup > Highlighters & Luminizers",
  "epoca-creme-de-olhos-creamy-eye-cream": "Health & Beauty > Personal Care > Skin Care > Eye Creams & Treatments",
  "epoca-acnezil-gel-5-com-20g-145487": "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
  "epoca-acnase-creme-25g-145781": "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
  "epoca-gel-facial-zella-150mg-acido-azelaico-30g-169655": "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
};

const getCategory = (id, cat) =>
  CATEGORY_OVERRIDES[id] || CATEGORY_MAP[cat] || DEFAULT_CATEGORY;

// product_type derivado do slug interno da categoria.
// Os 2 primeiros segmentos são níveis hierárquicos; o restante forma o nome
// do sub-nível, com conectores (de, e, a, o, com, para, em, ou, da, do) em minúscula.
const PT_ACCENTS = {
  cosmeticos: "Cosméticos", dermocosmeticos: "Dermocosméticos", maquiagem: "Maquiagem",
  cabelos: "Cabelos", cuidados: "Cuidados", pessoais: "Pessoais", tratamentos: "Tratamentos",
  mascara: "Máscara", mascaras: "Máscaras", cilios: "Cílios", sobrancelhas: "Sobrancelhas",
  especificos: "Específicos", tonicos: "Tônicos", oleo: "Óleo", oleos: "Óleos",
  cacheado: "Cacheado", crespo: "Crespo", acessorios: "Acessórios", remocao: "Remoção",
  balsamo: "Bálsamo", agua: "Água", po: "Pó", estojo: "Estojo", termico: "Térmico",
  protetor: "Protetor", rejuvenescedores: "Rejuvenescedores", hidratantes: "Hidratantes",
  faciais: "Faciais", corporais: "Corporais", limpadores: "Limpadores", ativador: "Ativador",
  cachos: "Cachos", fixador: "Fixador", contorno: "Contorno", labial: "Labial",
  demaquilante: "Demaquilante", sabonetes: "Sabonetes", micelar: "Micelar",
  marcas: "Marcas", loiros: "Loiros", descoloridos: "Descoloridos", coloridos: "Coloridos",
  mechas: "Mechas", danificados: "Danificados", seco: "Seco", ressecados: "Ressecados",
  normal: "Normal", todos: "Todos", tipos: "Tipos", base: "Base", blush: "Blush",
  esponja: "Esponja", corretivo: "Corretivo", compacto: "Compacto", facial: "Facial",
  sombra: "Sombra", lapis: "Lápis", kajal: "Kajal", batom: "Batom", gloss: "Gloss",
  gel: "Gel", limpeza: "Limpeza", anti: "Anti", fino: "Fino", kit: "Kit", kits: "Kits",
  shampoo: "Shampoo", solar: "Solar", cor: "Cor",
};
const PT_CONNECTORS = new Set(["de", "da", "do", "e", "a", "o", "com", "para", "em", "ou"]);

const productTypeFromCategory = (cat) => {
  if (!cat) return "Cosméticos";
  const parts = cat.split("-").filter(Boolean);
  const cap = (w) => PT_ACCENTS[w] || (w[0].toUpperCase() + w.slice(1));
  const joinWords = (arr) => arr
    .map((w, i) => (i > 0 && PT_CONNECTORS.has(w)) ? w : cap(w))
    .join(" ");
  if (parts.length <= 2) return parts.map(cap).join(" > ");
  return [cap(parts[0]), cap(parts[1]), joinWords(parts.slice(2))].join(" > ");
};

// item_group_id: agrupa variantes pelo tronco do slug (sem sufixos de tamanho/volume).
const itemGroupId = (id) => {
  if (id === "epoca") return "epoca";
  const base = id
    .replace(/-\d+\s*(ml|g|mg|kg|un|unidades?|cm)?(?:-\d+)?$/i, "")
    .replace(/-\d{4,}$/g, "") // remove sufixo numérico longo (id legado)
    .replace(/-kit(-.*)?$/i, "")
    .replace(/-com-\d+(-unidades?)?$/i, "");
  
  return applyGoogleShorteningRules(base);
};

// Heurística para detectar "kit/duo/multi-unidade" — usado para escolher
// quem perde o GTIN em casos de duplicidade.
const isKit = (name, id) => /\bkit\b|\bduo\b|duopack|estojo|presente|\b\d+\s*unidades?\b|com-\d+-unidades/i.test(`${name} ${id}`);

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

  products.push({
    id, name, image, additional, category, ean,
    price: parseFloat(priceStr),
  });
}

// Dedup por id
const seen = new Set();
const unique = products.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));

// Detecta GTINs compartilhados por mais de um produto.
const gtinCounts = {};
for (const p of unique) if (p.ean) gtinCounts[p.ean] = (gtinCounts[p.ean] || 0) + 1;
// Para cada GTIN duplicado, escolhe um "vencedor" (não-kit) que mantém o GTIN.
const winnerByGtin = {};
for (const ean of Object.keys(gtinCounts)) {
  if (gtinCounts[ean] < 2) continue;
  const group = unique.filter((p) => p.ean === ean);
  const nonKit = group.find((p) => !isKit(p.name, p.id));
  winnerByGtin[ean] = (nonKit || group[0]).id;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Garante URL válida (codifica espaços e similares).
const safeUrl = (u) => {
  try {
    // Se já está codificada, encodeURI é idempotente para os caracteres reservados certos.
    return encodeURI(u.replace(/ /g, "%20"));
  } catch {
    return u;
  }
};

const inferCategoryHint = (cat) => {
  if (cat.includes("Sunscreen")) return "Protetor solar com alta proteção UVA/UVB.";
  if (cat.includes("Shampoo")) return "Shampoo para cuidados diários dos cabelos.";
  if (cat.includes("Hair Oil") || cat.includes("Hair Serum")) return "Óleo ou sérum capilar para nutrição e brilho.";
  if (cat.includes("Hair Mask") || cat.includes("Hair Treatment")) return "Máscara e tratamento capilar profundo.";
  if (cat.includes("Hair Conditioner")) return "Condicionador e creme hidratante capilar.";
  if (cat.includes("Hair Styling")) return "Produto de finalização e estilo para os cabelos.";
  if (cat.includes("Mascara")) return "Máscara para cílios com volume e alongamento.";
  if (cat.includes("Eye Shadow")) return "Sombra para olhos com alta pigmentação.";
  if (cat.includes("Eyeliner") || cat.includes("Kajal")) return "Delineador e lápis para olhos.";
  if (cat.includes("Eyebrow")) return "Produto para design e definição de sobrancelhas.";
  if (cat.includes("Lipstick")) return "Batom com cor intensa e longa duração.";
  if (cat.includes("Lip Gloss")) return "Gloss labial com brilho e hidratação.";
  if (cat.includes("Lip Liner")) return "Lápis contorno labial para delineamento preciso.";
  if (cat.includes("Lip Care")) return "Reparador e protetor labial para lábios macios.";
  if (cat.includes("Blush") || cat.includes("Bronzer")) return "Blush e bronzer para dar cor e vida ao rosto.";
  if (cat.includes("Highlighter") || cat.includes("Luminizer")) return "Iluminador facial para um acabamento radiante.";
  if (cat.includes("Contouring")) return "Contorno facial para definir e esculpir o rosto.";
  if (cat.includes("Concealer")) return "Corretivo de alta cobertura para imperfeições.";
  if (cat.includes("Face Powder")) return "Pó facial para fixação e acabamento matte.";
  if (cat.includes("Setting")) return "Fixador de maquiagem para maior durabilidade.";
  if (cat.includes("Face Primer") || cat.includes("Makeup Base")) return "Base e primer para preparo da pele.";
  if (cat.includes("Makeup Remover")) return "Demaquilante e removedor de maquiagem suave.";
  if (cat.includes("Makeup Sponge")) return "Esponja de maquiagem para aplicação perfeita.";
  if (cat.includes("Cosmetic Set") || cat.includes("Kit")) return "Kit e estojo completo de beleza.";
  if (cat.includes("Facial Cleanser")) return "Limpador facial suave para pele renovada.";
  if (cat.includes("Facial Lotion") || cat.includes("Moisturizer")) return "Hidratante facial com ação nutritiva.";
  if (cat.includes("Body Lotion")) return "Hidratante corporal para pele macia e suave.";
  if (cat.includes("Eye Cream")) return "Creme para área dos olhos com ação revitalizante.";
  if (cat.includes("Toner") || cat.includes("Astringent")) return "Tônico e água micelar para equilíbrio da pele.";
  if (cat.includes("Anti-Aging")) return "Tratamento anti-idade para pele mais jovem.";
  if (cat.includes("Facial Treatment") || cat.includes("Facial Mask")) return "Tratamento e máscara facial intensivo.";
  if (cat.includes("Soap") || cat.includes("Body Wash")) return "Sabonete e gel de banho para higiene diária.";
  if (cat.includes("Fragrances")) return "Fragrância marcante com notas únicas para o dia a dia.";
  if (cat.includes("Nail Polish")) return "Esmalte de longa duração com cobertura uniforme.";
  if (cat.includes("Denture Care")) return "Cuidado completo para próteses dentárias.";
  return "Produto de beleza e cosméticos premium.";
};

// Extrai informações de volume/tamanho do nome quando presentes para enriquecer a descrição.
const volumeFromName = (name) => {
  const m = name.match(/(\d+\s?(?:ml|g|mg|kg|un|unidades?))/i);
  return m ? m[1] : null;
};

const BRAND_NOTES = {
  "Bioderma": "Dermatologicamente testado, ideal para peles sensíveis.",
  "La Roche-Posay": "Recomendado por dermatologistas, com Água Termal de La Roche-Posay.",
  "La Roche Posay": "Recomendado por dermatologistas, com Água Termal de La Roche-Posay.",
  "Vichy": "Tecnologia dermatológica francesa com minerais ativos.",
  "Eucerin": "Cuidado dermatológico avançado para pele sensível e ressecada.",
  "L'Oréal Professionnel": "Performance profissional de salão para resultados visíveis.",
  "L'Oréal Paris": "Beleza acessível com tecnologia de ponta.",
  "Wella Professionals": "Linha profissional para cabelos saudáveis, brilhantes e fortes.",
  "Kérastase": "Cuidado capilar de luxo com ingredientes premium.",
  "Kerastase": "Cuidado capilar de luxo com ingredientes premium.",
  "SkinCeuticals": "Antioxidantes potentes e ciência cosmecêutica avançada.",
  "Neutrogena": "Dermatologicamente comprovado para resultados visíveis.",
  "Garnier": "Fórmulas com ingredientes de origem natural.",
  "CeraVe": "Desenvolvido com dermatologistas, com ceramidas essenciais.",
  "Cetaphil": "Suave, hipoalergênico e indicado para peles sensíveis.",
  "Avène": "Água Termal de Avène, calmante e regeneradora.",
  "Avene": "Água Termal de Avène, calmante e regeneradora.",
  "Nivea": "Tradição em cuidados com a pele e o corpo.",
  "Carmed": "Hidratação intensa e brilho aos lábios com a fórmula icônica.",
  "Mantecorp Skincare": "Ciência dermatológica brasileira de alta performance.",
  "Bepantol": "Cuidado reparador e hidratante para a pele.",
  "Bio-Oil": "Especialista em cuidados com marcas e cicatrizes.",
  "Sebastian": "Estilo e tecnologia para cabelos com atitude.",
  "Redken": "Ciência avançada para cabelos profissionalmente cuidados.",
  "Cadiveu": "Tratamentos profissionais com tecnologia brasileira.",
  "Lola Cosmetics": "Cosméticos com ingredientes naturais e divertidos.",
  "Boticário": "Beleza brasileira para todos os momentos.",
  "Maybelline": "Cores intensas e tendências para a maquiagem.",
  "Dior": "Sofisticação e elegância da alta perfumaria francesa.",
  "Jo Malone": "Fragrâncias britânicas exclusivas para combinar e camadar.",
  "Acnezil": "Auxilia na limpeza e no controle da oleosidade da pele.",
  "Acnase": "Cuidado direcionado para pele com tendência a oleosidade.",
};

const generateDescription = (name, brand, googleCategory, productId) => {
  const hint = inferCategoryHint(googleCategory);
  const vol = volumeFromName(name);
  const sizeBit = vol ? ` Apresentação: ${vol}.` : "";
  const brandBit = brand && brand !== STORE_NAME ? ` Da marca ${brand}.` : "";
  const brandNote = BRAND_NOTES[brand] ? ` ${BRAND_NOTES[brand]}` : "";
  const surpriseNote = productId && productId.includes("carmed-selecoes-edicao-surpresa")
    ? " Produto sortido/surpresa: a variação recebida pode ser diferente da imagem exibida."
    : "";
  const closing = ` Compre na ${STORE_NAME} com entrega rápida para todo o Brasil e pagamento via Pix com desconto.`;
  let desc = `${name}.${sizeBit}${brandBit} ${hint}${brandNote}${surpriseNote}${closing}`.replace(/\s+/g, " ").trim();
  if (desc.length > 500) desc = desc.slice(0, 497).replace(/\s+\S*$/, "") + "...";
  return desc;
};

const buildShortProductId = (product) => {
  const brand = detectBrand(product.name);
  const withoutBrand = product.name.replace(new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "");
  const volume = volumeFromName(product.name);
  const baseName = (withoutBrand || product.name)
    .replace(/\b\d+\s?(?:ml|g|mg|kg|un|unidades?)\b/gi, "")
    .replace(/\b(refil|kit|combo|duo|trio)\b/gi, "")
    .trim();

  // Preserva sufixo numérico do ID original se existir (ex: -12345)
  const numericSuffixMatch = product.id.match(/-(\d+)$/);
  const numericSuffix = numericSuffixMatch ? numericSuffixMatch[0] : "";

  // Combina marca, nome base e volume e aplica as regras agressivas
  const fullSlug = slugify(`${brand}-${baseName}-${volume || ""}${numericSuffix}`);
  return applyGoogleShorteningRules(fullSlug);
};

const appendSuffix = (base, suffix, max = MAX_ID_LEN) => {
  const cleanSuffix = slugify(suffix);
  if (!cleanSuffix) return base.slice(0, max);
  
  const limit = max - cleanSuffix.length - 1;
  let trimmedBase = base.slice(0, limit);
  
  // Evita quebrar no meio de uma palavra se possível
  const lastHyphen = trimmedBase.lastIndexOf("-");
  if (lastHyphen !== -1 && lastHyphen > limit * 0.7) {
    trimmedBase = trimmedBase.slice(0, lastHyphen);
  }
  
  return `${trimmedBase}-${cleanSuffix}`.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
};

const buildStableShortIds = (products) => {
  const globalUsed = new Set();
  const ids = new Map();

  // Primeiro gera todos os IDs ideais
  const sortedProducts = [...products].sort((a, b) => a.id.localeCompare(b.id));
  
  for (const product of sortedProducts) {
    let candidate = buildShortProductId(product);
    
    // Se houver colisão, tenta resolver com sufixo numérico
    if (globalUsed.has(candidate)) {
      let index = 2;
      let nextCandidate = appendSuffix(candidate, String(index));
      while (globalUsed.has(nextCandidate)) {
        index += 1;
        nextCandidate = appendSuffix(candidate, String(index));
      }
      candidate = nextCandidate;
    }
    
    globalUsed.add(candidate);
    ids.set(product.id, candidate);
  }

  return ids;
};

const shortIdByOriginalId = buildStableShortIds(unique);

const items = unique.map((p) => {
  const link = `${SITE}/produtos/${p.id}`;
  const googleCategory = getCategory(p.id, p.category);
  const brand = detectBrand(p.name);
  let description = generateDescription(p.name, brand, googleCategory);
  const addl = p.additional.map((u) => `      <g:additional_image_link>${esc(safeUrl(u))}</g:additional_image_link>`).join("\n");
  const shortPid = shortIdByOriginalId.get(p.id) || buildShortProductId(p);
  const groupId = limitSlug(itemGroupId(p.id));

  // GTIN handling: Google só aceita 8, 12, 13 ou 14 dígitos.
  const isValidGtin = (gtin) => /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(gtin);

  let gtinField = "";
  let identifierExists = "true";
  let gtinForDescription = "";

  if (p.ean && isValidGtin(p.ean)) {
    if (gtinCounts[p.ean] > 1 && winnerByGtin[p.ean] !== p.id) {
      identifierExists = "false";
      gtinField = "";
    } else {
      gtinField = `<g:gtin>${esc(p.ean)}</g:gtin>`;
      gtinForDescription = p.ean;
    }
  } else {
    identifierExists = "false";
    gtinField = "";
  }

  if (gtinForDescription) {
    description = `${description} GTIN: ${gtinForDescription}.`;
  }

  const identifierExistsTag = identifierExists === "false" ? `\n      <g:identifier_exists>false</g:identifier_exists>` : "";
  const gtinTag = gtinField ? `\n      ${gtinField}` : "";
  const mpnTag = identifierExists === "false" ? `\n      <g:mpn>${esc(shortPid)}</g:mpn>` : "";

  return `    <item>
      <g:id>${esc(shortPid)}</g:id>
      <g:title>${esc(p.name.slice(0, 150))}</g:title>
      <g:description>${esc(description.slice(0, 5000))}</g:description>
      <g:link>${esc(link)}</g:link>
      <g:image_link>${esc(safeUrl(p.image))}</g:image_link>${addl ? "\n" + addl : ""}
      <g:availability>in stock</g:availability>
      <g:price>${p.price.toFixed(2)} BRL</g:price>
      <g:condition>new</g:condition>
      <g:brand>${esc(brand)}</g:brand>${gtinTag}${identifierExistsTag}${mpnTag}
      <g:google_product_category>${esc(googleCategory)}</g:google_product_category>
      <g:product_type>${esc(productTypeFromCategory(p.category))}</g:product_type>
      <g:item_group_id>${esc(groupId)}</g:item_group_id>
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

const dupGroups = Object.entries(gtinCounts).filter(([, n]) => n > 1);
console.log(`✅ public/feed.xml gerado: ${unique.length} produtos`);
console.log(`   GTINs duplicados resolvidos: ${dupGroups.length} grupos`);
console.log(`   Categorias com override: ${Object.keys(CATEGORY_OVERRIDES).length}`);
