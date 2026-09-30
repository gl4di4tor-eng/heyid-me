// heyid.me static site builder. Zero dependencies. Usage: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontMatter, renderMarkdown, esc } from './lib/markdown.mjs';
import { makeTemplates } from './lib/templates.mjs';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const site = JSON.parse(read('site.json'));
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' });
const showFuture = process.env.DRAFTS === '1';

const data = {
  starters: JSON.parse(read('public/data/starters.json')),
  buildId: Date.now().toString(36),
};
const T = makeTemplates(site, data);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });

const write = (rel, content) => {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
};
const listMd = (dir) => (fs.existsSync(path.join(ROOT, dir)) ? fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.md')) : []);

const warnings = [];
const warn = (m) => warnings.push(m);

// ---------- blog posts ----------
let posts = [];
for (const file of listMd('src/blog')) {
  const { data: fm, body } = parseFrontMatter(read('src/blog/' + file));
  const slug = fm.slug || file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  if (fm.draft === true) { warn(`[draft skipped] ${slug}`); continue; }
  if (!fm.title || !fm.description || !fm.date) { warn(`[skipped] ${file}: title, description and date are required`); continue; }
  if (fm.date > today && !showFuture) { warn(`[scheduled] ${slug} goes live on ${fm.date}`); continue; }
  const r = renderMarkdown(body, T.hooks());
  posts.push({ ...fm, slug, html: r.html, toc: r.toc, words: r.words, todos: r.todos, readMin: Math.max(1, Math.round(r.words / 220)) });
}
posts.sort((a, b) => (a.date < b.date ? 1 : -1));

// ---------- QA for every post ----------
const titles = new Set();
for (const p of posts) {
  const id = `[${p.slug}]`;
  if (p.title.length > 60) warn(`${id} title is ${p.title.length} chars (aim for 60 or fewer)`);
  if (p.description.length < 110 || p.description.length > 160) warn(`${id} description is ${p.description.length} chars (aim for 110 to 160)`);
  if (p.words < 900) warn(`${id} only ${p.words} words (target about 1000)`);
  if (!COVER_OK(p.topic)) warn(`${id} unknown topic "${p.topic}"`);
  if (titles.has(p.title)) warn(`${id} duplicate title`);
  titles.add(p.title);
  for (const r of p.related || []) if (!posts.find((x) => x.slug === r)) warn(`${id} related slug not found: ${r}`);
  if (!/\{\{cta\}\}/.test(p.html) && !/cta-inline/.test(p.html)) warn(`${id} has no {{cta}} block`);
  for (const t of p.todos) warn(`${id} TODO for you: ${t}`);
}
function COVER_OK(t) { return !!site.topics[t]; }

// ---------- pages ----------
const urls = []; // [path, lastmod]
const emit = (p, html, lastmod) => {
  write(p === '/' ? 'index.html' : p.replace(/^\//, '') + 'index.html', html);
  urls.push([p, lastmod || today]);
};

emit('/', T.home(posts));
emit('/discover/', T.discover());
emit('/blog/', T.blogIndex(posts), posts[0]?.date);
emit('/heyid/', T.heyidPage());
for (const p of posts) emit(`/blog/${p.slug}/`, T.post(p, posts), p.updated || p.date);

for (const file of listMd('src/tools')) {
  const { data: fm, body } = parseFrontMatter(read('src/tools/' + file));
  const r = renderMarkdown(body, T.hooks());
  const widget = { starters: T.starterWidget, hello: T.helloWidget, world: T.worldWidget }[fm.widget]();
  emit(`/discover/${fm.slug}/`, T.tool({ ...fm, widget, prose: r.html }));
}

for (const file of listMd('src/pages')) {
  const { data: fm, body } = parseFrontMatter(read('src/pages/' + file));
  const r = renderMarkdown(body, T.hooks());
  const slug = fm.slug || file.replace(/\.md$/, '');
  emit(`/${slug}/`, T.plain({ ...fm, slug, html: r.html }), fm.updated);
}

write('404.html', T.notFound());

// ---------- sitemap, robots, feed, ads.txt ----------
write('sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(([p, d]) => `  <url><loc>${site.url}${p}</loc><lastmod>${d}</lastmod></url>`).join('\n') + '\n</urlset>\n');
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
write('CNAME', 'heyid.me\n');
write('.nojekyll', '');
write('ads.txt', site.adsense.client
  ? `google.com, ${site.adsense.client.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n`
  : '# Add your AdSense line here after approval.\n');
write('feed.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>HEYID</title><link>${site.url}/</link><description>${esc(site.description)}</description><language>en</language>\n` +
  posts.slice(0, 20).map((p) => `<item><title>${esc(p.title)}</title><link>${site.url}/blog/${p.slug}/</link><guid>${site.url}/blog/${p.slug}/</guid><pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`).join('\n') +
  '\n</channel></rss>\n');

// ---------- report ----------
console.log(`\nBuilt ${urls.length} pages (${posts.length} articles) into dist/`);
if (warnings.length) { console.log('\nNotes:'); warnings.forEach((w) => console.log('  - ' + w)); }
console.log('');
