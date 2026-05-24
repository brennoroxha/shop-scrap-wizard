import fs from 'fs';
import path from 'path';

const mapping = JSON.parse(fs.readFileSync('url-mapping.json', 'utf8'));
const BASE = 'https://lojas-epoca.store';

// Convert /products/xxx -> https://lojas-epoca.store/products/xxx
const finalMap = {};
for (const [url, local] of Object.entries(mapping)) {
  finalMap[url] = BASE + local;
}

const SRC_DIR = path.join(process.cwd(), 'src');
function getFiles(dir) {
  let r = [];
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    const s = fs.statSync(fp);
    if (s.isDirectory()) r = r.concat(getFiles(fp));
    else if (['.ts','.tsx','.js','.jsx','.html','.css','.json'].includes(path.extname(fp))) r.push(fp);
  }
  return r;
}

const files = [...getFiles(SRC_DIR), path.join(process.cwd(), 'index.html')];
const sorted = Object.keys(finalMap).sort((a,b) => b.length - a.length);

let totalChanges = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const url of sorted) {
    if (content.includes(url)) {
      const esc = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const before = content;
      content = content.replace(new RegExp(esc, 'g'), finalMap[url]);
      if (before !== content) { changed = true; totalChanges++; }
    }
  }
  if (changed) fs.writeFileSync(file, content);
}
console.log(`Replaced URLs in files. Total url replacements: ${totalChanges}`);
