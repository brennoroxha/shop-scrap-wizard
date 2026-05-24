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
  "epoca-acnezil-gel-5-com-20g-145487": "Health & Beauty > Health Care > Medicine & Drugs",
  "epoca-gel-facial-zella-150mg-acido-azelaico-30g-169655": "Health & Beauty > Personal Care > Skin Care > Facial Treatments & Masks",
};

const getCategory = (id, cat) =>
  CATEGORY_OVERRIDES[id] || CATEGORY_MAP[cat] || DEFAULT_CATEGORY;

// product_type derivado do slug interno da categoria
const productTypeFromCategory = (cat) => {
  if (!cat) return "Cosméticos";
  const parts = cat.split("-").filter(Boolean);
  return parts.map((w) => w[0].toUpperCase() + w.slice(1)).join(" > ");
};

// item_group_id: agrupa variantes pelo tronco do slug (sem sufixos de tamanho/volume).
const itemGroupId = (id) => {
  return id
    .replace(/-\d+\s*(ml|g|mg|kg|un|unidades?|cm)?(?:-\d+)?$/i, "")
    .replace(/-\d{4,}$/g, "") // remove sufixo numérico longo (id legado)
    .replace(/-kit(-.*)?$/i, "")
    .replace(/-com-\d+(-unidades?)?$/i, "")
    .slice(0, 80);
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

const generateDescription = (name, brand, googleCategory) => {
  const hint = inferCategoryHint(googleCategory);
  const vol = volumeFromName(name);
  const sizeBit = vol ? ` Apresentação: ${vol}.` : "";
  const brandBit = brand !== STORE_NAME ? `Da marca ${brand}. ` : "";
  return `${name}.${sizeBit} ${brandBit}${hint} Compre na ${STORE_NAME} com entrega rápida para todo o Brasil e pagamento via Pix com desconto.`;
};

const items = unique.map((p) => {
  const link = `${SITE}/produtos/${p.id}`;
  const googleCategory = getCategory(p.id, p.category);
  const brand = detectBrand(p.name);
  const description = generateDescription(p.name, brand, googleCategory);
  const addl = p.additional.map((u) => `      <g:additional_image_link>${esc(safeUrl(u))}</g:additional_image_link>`).join("\n");
  const groupId = itemGroupId(p.id);

  // GTIN handling: Google só aceita 8, 12, 13 ou 14 dígitos.
  const isValidGtin = (gtin) => /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(gtin);
  
  let gtinField = "";
  let identifierExists = "true";
  let mpnField = `<g:mpn>${esc(p.id)}</g:mpn>`;

  if (p.ean && isValidGtin(p.ean)) {
    // Se duplicado e não é o vencedor do grupo, desativa identifier_exists
    if (gtinCounts[p.ean] > 1 && winnerByGtin[p.ean] !== p.id) {
      identifierExists = "false";
      gtinField = "";
    } else {
      gtinField = `<g:gtin>${esc(p.ean)}</g:gtin>`;
    }
  } else {
    identifierExists = "false";
    gtinField = "";
  }

  const identifierExistsTag = identifierExists === "false" ? `<g:identifier_exists>false</g:identifier_exists>` : "";

  return `    <item>
      <g:id>${esc(p.id)}</g:id>
      <g:title>${esc(p.name.slice(0, 150))}</g:title>
      <g:description>${esc(description.slice(0, 5000))}</g:description>
      <g:link>${esc(link)}</g:link>
      <g:image_link>${esc(safeUrl(p.image))}</g:image_link>
${addl}
      <g:availability>in stock</g:availability>
      <g:price>${p.price.toFixed(2)} BRL</g:price>
      <g:condition>new</g:condition>
      <g:brand>${esc(brand)}</g:brand>
      ${gtinField}
      ${identifierExistsTag}
      ${mpnField}
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
