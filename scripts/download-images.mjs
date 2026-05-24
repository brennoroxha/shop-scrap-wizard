#!/usr/bin/env node
// Parallel downloader using fetch
import fs from 'fs';
import path from 'path';

const mapping = JSON.parse(fs.readFileSync('url-mapping.json', 'utf8'));
const PROJECT_ROOT = process.cwd();
const OUT = path.join(PROJECT_ROOT, 'public');

const entries = Object.entries(mapping).filter(([url, local]) => {
  return !fs.existsSync(path.join(OUT, local));
});

console.log(`To download: ${entries.length}`);

const CONCURRENCY = 30;
let idx = 0;
let done = 0;
let failed = 0;

async function worker() {
  while (idx < entries.length) {
    const i = idx++;
    const [url, local] = entries[i];
    const out = path.join(OUT, local);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) { failed++; continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(out, buf);
      done++;
    } catch (e) {
      failed++;
    }
    if ((done + failed) % 100 === 0) {
      console.log(`Progress: ${done + failed}/${entries.length} (failed: ${failed})`);
    }
  }
}

await Promise.all(Array.from({length: CONCURRENCY}, worker));
console.log(`Done. success=${done} failed=${failed}`);
