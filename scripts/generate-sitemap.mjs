#!/usr/bin/env node
/**
 * Gera public/sitemap.xml com todas as rotas públicas + produtos + categorias + páginas legais.
 * Roda automaticamente via predev/prebuild.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE_URL = "https://lojas-epoca.store";

// Static routes
const staticRoutes = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/fale-conosco", changefreq: "monthly", priority: "0.5" },
  { path: "/paginas/about", changefreq: "monthly", priority: "0.5" },
  { path: "/paginas/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/paginas/shipping", changefreq: "monthly", priority: "0.5" },
  { path: "/paginas/returns", changefreq: "monthly", priority: "0.5" },
  { path: "/paginas/terms", changefreq: "monthly", priority: "0.5" },
  { path: "/paginas/privacy", changefreq: "monthly", priority: "0.5" },
];

// Categorias (extraídas de Navigation.tsx)
const navSrc = fs.readFileSync(path.join(ROOT, "src/components/Navigation.tsx"), "utf8");
const categorySlugs = [...new Set([...navSrc.matchAll(/\/collections\/([a-z0-9-]+)/g)].map((m) => m[1]))];
const categoryRoutes = categorySlugs.map((slug) => ({
  path: `/collections/${slug}`,
  changefreq: "weekly",
  priority: "0.8",
}));

// Produtos
const productsSrc = fs.readFileSync(path.join(ROOT, "src/data/products.ts"), "utf8");
const productIds = [...new Set([...productsSrc.matchAll(/"?id"?\s*:\s*"([^"]+)"/g)].map((m) => m[1]))];
const productRoutes = productIds.map((id) => ({
  path: `/produtos/${id}`,
  changefreq: "weekly",
  priority: "0.9",
}));

const entries = [...staticRoutes, ...categoryRoutes, ...productRoutes];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const urls = entries
  .map((e) =>
    [
      "  <url>",
      `    <loc>${esc(BASE_URL + e.path)}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n")
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

fs.mkdirSync(path.join(ROOT, "public"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "public/sitemap.xml"), xml);
console.log(`✅ sitemap.xml gerado com ${entries.length} URLs (${productRoutes.length} produtos, ${categoryRoutes.length} categorias).`);
