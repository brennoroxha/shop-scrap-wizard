import { products } from "./src/data/products.ts";
import fs from "fs";

const nonSupplementCategories = [
  "cosmeticos-cabelos-ativador-de-cachos",
  "cosmeticos-cabelos-balsamo-e-creme",
  "cosmeticos-cabelos-cacheado-e-crespo",
  "cosmeticos-cabelos-coloridos-e-com-mechas",
  "cosmeticos-cabelos-danificados",
  "cosmeticos-cabelos-fino",
  "cosmeticos-cabelos-kits-para-cabelos",
  "cosmeticos-cabelos-loiros-e-descoloridos",
  "cosmeticos-cabelos-normal-ou-todos-os-tipos",
  "cosmeticos-cabelos-oleo",
  "cosmeticos-cabelos-protetor-termico",
  "cosmeticos-cabelos-seco-e-ressecados",
  "cosmeticos-cabelos-tratamentos-e-mascaras",
  "cosmeticos-cuidados-pessoais-sabonetes",
  "cosmeticos-dermocosmeticos-agua-micelar",
  "cosmeticos-dermocosmeticos-anti-marcas",
  "cosmeticos-dermocosmeticos-cuidados-corporais-especificos",
  "cosmeticos-dermocosmeticos-cuidados-faciais-especificos",
  "cosmeticos-dermocosmeticos-face",
  "cosmeticos-dermocosmeticos-gel-de-limpeza",
  "cosmeticos-dermocosmeticos-hidratantes",
  "cosmeticos-dermocosmeticos-hidratantes-corporais",
  "cosmeticos-dermocosmeticos-kits",
  "cosmeticos-dermocosmeticos-limpadores",
  "cosmeticos-dermocosmeticos-protetor-solar",
  "cosmeticos-dermocosmeticos-protetor-solar-com-cor",
  "cosmeticos-dermocosmeticos-rejuvenescedores",
  "cosmeticos-dermocosmeticos-shampoo",
  "cosmeticos-dermocosmeticos-tonicos",
  "cosmeticos-dermocosmeticos-tratamentos",
  "cosmeticos-ganhe-brindes-brinde",
  "cosmeticos-maquiagem-acessorios-de-remocao-da-maquiagem",
  "cosmeticos-maquiagem-base",
  "cosmeticos-maquiagem-batom",
  "cosmeticos-maquiagem-blush",
  "cosmeticos-maquiagem-contorno",
  "cosmeticos-maquiagem-contorno-labial",
  "cosmeticos-maquiagem-corretivo",
  "cosmeticos-maquiagem-demaquilante",
  "cosmeticos-maquiagem-esponja",
  "cosmeticos-maquiagem-estojo-completo-ou-kit-de-maquiagem",
  "cosmeticos-maquiagem-fixador-da-maquiagem",
  "cosmeticos-maquiagem-gloss",
  "cosmeticos-maquiagem-lapis-e-kajal",
  "cosmeticos-maquiagem-mascara-para-cilios",
  "cosmeticos-maquiagem-mascara-para-sobrancelhas",
  "cosmeticos-maquiagem-po-compacto",
  "cosmeticos-maquiagem-po-facial",
  "cosmeticos-maquiagem-sombra",
  "cosmeticos-mundo-epoca-mundo-epoca",
  "cosmeticos-perfumes-perfume-feminino",
  "cosmeticos-perfumes-perfume-masculino",
  "cosmeticos-perfumes-perfume-para-o-corpo",
  "cosmeticos-tratamentos-agua-micelar",
  "cosmeticos-tratamentos-cuidados-faciais-especificos",
  "cosmeticos-tratamentos-hidratantes-faciais",
  "cosmeticos-tratamentos-limpadores-faciais",
  "cosmeticos-tratamentos-protetor-solar",
  "cosmeticos-tratamentos-protetor-solar-com-cor"
];

const filteredProducts = products.filter(p => nonSupplementCategories.includes(p.category));

const productsFile = fs.readFileSync('src/data/products.ts', 'utf8');
const importsMatch = productsFile.match(/^(import[\s\S]*?\n\n)/);
const interfaceMatch = productsFile.match(/(export interface Product[\s\S]*?\n\})/);
const helperMatch = productsFile.match(/(const S =[\s\S]*?;\n\n)/);

const newContent = `${importsMatch ? importsMatch[1] : ''}${interfaceMatch ? interfaceMatch[1] : ''}

${helperMatch ? helperMatch[1] : ''}const rawProducts: Product[] = ${JSON.stringify(filteredProducts, null, 2)};

export const products: Product[] = rawProducts;

export const getProductsByCategory = (category: string) =>
  products.filter((p) => p.category === category);
`;

fs.writeFileSync('src/data/products.ts', newContent);
console.log(`Kept ${filteredProducts.length} cosmetic products.`);
