import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';

// Include hashed production assets in installation, so the first online visit
// prepares a complete offline shell rather than requiring a second visit.
const assets = (await readdir('dist/assets')).map((name) => `/assets/${name}`);
const precache = ['/', '/icon.svg', '/manifest.webmanifest', ...assets];
const hash = createHash('sha256')
  .update(await readFile('dist/index.html'))
  .update(JSON.stringify(assets))
  .digest('hex')
  .slice(0, 12);
let source = await readFile('public/sw.js', 'utf8');
source = source.replace(/const CACHE = [^;]+;/, `const CACHE = 'mmv-shell-${hash}';`);
source = source.replace(/const PRECACHE = [^;]+;/, `const PRECACHE = ${JSON.stringify(precache)};`);
await writeFile('dist/sw.js', source);
console.log(`Offline shell: ${precache.length} assets, revision ${hash}`);
