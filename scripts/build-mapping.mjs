import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PROJECT_ROOT = process.cwd();
const PUBLIC_PRODUCTS_DIR = path.join(PROJECT_ROOT, 'public/products');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

const IMAGE_REGEX = /https?:\/\/[^\s"'<>()]+\.(?:jpg|jpeg|png|webp|gif|svg)/gi;

function getFiles(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) results = results.concat(getFiles(fp));
    else if (['.ts','.tsx','.js','.jsx','.html','.css','.json'].includes(path.extname(fp))) results.push(fp);
  }
  return results;
}

const files = [...getFiles(SRC_DIR), path.join(PROJECT_ROOT, 'index.html')];
const allUrls = new Set();
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(IMAGE_REGEX) || [];
  for (const url of matches) {
    if (!url.includes('localhost') && !url.includes('lojas-epoca.store')) {
      allUrls.add(url);
    }
  }
}

const mapping = {};
for (const url of allUrls) {
  const urlObj = new URL(url);
  let filename = path.basename(urlObj.pathname);
  if (!filename || filename.length > 100) {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    filename = `image_${hash}${path.extname(urlObj.pathname) || '.jpg'}`;
  } else {
    const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    filename = `${base}_${hash}${ext}`;
  }
  filename = filename.replace(/[^a-z0-9._-]/gi, '_');
  mapping[url] = `/products/${filename}`;
}
fs.writeFileSync('url-mapping.json', JSON.stringify(mapping, null, 2));
console.log(`Mapping: ${Object.keys(mapping).length} urls`);
console.log(`Already downloaded: ${fs.readdirSync(PUBLIC_PRODUCTS_DIR).length}`);
