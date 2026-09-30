import { esc } from './markdown.mjs';

export const COVER = {
  talk: ['#1A62D6', '#22B8CF', '#ffffff'],
  languages: ['#2F9E57', '#9BD65F', '#0B2A14'],
  world: ['#0B7E9E', '#3CC8DC', '#ffffff'],
  safety: ['#F08A00', '#FFC640', '#3A2200'],
  heyid: ['#0C2144', '#1A62D6', '#ffffff'],
};

export const fmtDate = (d) =>
  new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' });

export function makeTemplates(site, data) {
  const topicName = (t) => site.topics[t] || t;

  const playLink = (ctx) =>
    `${site.playUrl}&referrer=${encodeURIComponent('utm_source=heyid.me&utm_medium=site&utm_campaign=' + ctx)}`;

  const ad = (kind) => {
    const a = site.adsense;
    if (!a.client || !a.slots[kind]) return '';
    return `<aside class="ad" aria-label="Advertisement"><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(a.client)}" data-ad-slot="${esc(a.slots[kind])}" data-ad-format="auto" data-full-width-responsive="true"></ins></aside>`;
  };

  // ---------- widgets ----------
  const starterWidget = () => `
<section class="starter" data-tool="starters" aria-label="Conversation starter">
  <div class="chips" role="group" aria-label="Mood">
    <button class="chip is-on" type="button" data-mode="any" data-i18n="starter.any">Surprise me</button>
    <button class="chip" type="button" data-mode="light" data-i18n="starter.light">Light</button>
    <button class="chip" type="button" data-mode="deep" data-i18n="starter.deep">Deeper</button>
    <button class="chip" type="button" data-mode="fun" data-i18n="starter.fun">Playful</button>
  </div>
  <div class="bubble bubble--main" aria-live="polite">
    <p class="starter-q" data-q>${esc(data.starters.en.light[0])}</p>
    <div class="typing" data-typing hidden aria-hidden="true"><i></i><i></i><i></i></div>
  </div>
  <div class="actions">
    <button class="btn" type="button" data-next data-i18n="starter.another">Another question</button>
    <button class="btn btn--ghost" type="button" data-copy data-i18n="starter.copy">Copy</button>
    <a class="btn btn--amber" href="/heyid/?from=starter" data-i18n="starter.use">Ask it on HEYID</a>
  </div>
</section>`;

  const helloWidget = () => `
<section class="hello" data-tool="hello" aria-label="Say hello">
  <div class="hello-card">
    <p class="hello-lang"><span data-hello-name>Spanish</span> <small data-hello-native translate="no">español</small></p>
    <p class="hello-word" data-hello-word translate="no">Hola</p>
    <p class="hello-say"><span data-i18n="hello.say">Say it like</span> <b data-hello-say translate="no">OH-lah</b></p>
  </div>
  <div class="actions">
    <button class="btn" type="button" data-spin data-i18n="hello.spin">Another language</button>
    <button class="btn btn--ghost" type="button" data-listen hidden data-i18n="hello.listen">Listen</button>
  </div>
</section>`;

  const worldWidget = () => `
<section class="world" data-tool="world" aria-label="The world right now">
  <ul class="world-list" data-world-list></ul>
  <p class="world-detail" data-world-detail data-i18n="world.tap">Tap a city to see how people there would greet you right now.</p>
</section>`;

  const demoWidget = () => `
<section class="demo" data-tool="demo" aria-label="Example conversation">
  <div class="demo-top">
    <div class="chips" role="group">
      <button class="chip is-on" type="button" data-as="ana" data-i18n="demo.asAna">Read as Ana</button>
      <button class="chip" type="button" data-as="kenji" data-i18n="demo.asKenji">Read as Kenji</button>
    </div>
    <p class="demo-who" data-demo-who></p>
  </div>
  <div class="chat" data-chat></div>
  <p class="demo-note" data-i18n="demo.note">Tap a message to see what the other person actually wrote.</p>
</section>`;

  const ctaInline = () => `
<aside class="cta-inline">
  <div class="bubble bubble--amber">
    <p><strong data-i18n="cta.title">Try it on someone new.</strong> <span data-i18n="cta.text">HEYID matches you with a random person anywhere in the world and translates as you talk.</span></p>
  </div>
  <a class="btn" href="/heyid/?from=article" data-i18n="cta.btn">See what HEYID does</a>
</aside>`;

  const hooks = () => ({
    cta: () => ctaInline(),
    ad: () => ad('article'),
    tool: (name) => ({ starters: starterWidget, hello: helloWidget, world: worldWidget }[name] || (() => ''))(),
  });

  // ---------- cards ----------
  const card = (p, cls = '') => {
    const [c1, c2, fg] = COVER[p.topic] || COVER.talk;
    return `<a class="card ${cls}" href="/blog/${p.slug}/" data-topic="${esc(p.topic)}">
  <div class="cover" style="--c1:${c1};--c2:${c2};--fg:${fg}"><span class="cover-word" translate="no">${esc(p.cover || '')}</span><span class="cover-topic">${esc(topicName(p.topic))}</span></div>
  <div class="card-body"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span class="meta">${fmtDate(p.date)} · ${p.readMin} min</span></div>
</a>`;
  };

  // ---------- shell ----------
  const navItems = [
    ['/discover/', 'nav.discover', 'Discover'],
    ['/blog/', 'nav.blog', 'Blog'],
    ['/about/', 'nav.about', 'About'],
  ];

  const header = (path) => {
    const link = ([href, key, label]) =>
      `<a href="${href}"${path.startsWith(href) ? ' aria-current="page"' : ''} data-i18n="${key}">${label}</a>`;
    return `<a class="skip" href="#main" data-i18n="nav.skip">Skip to content</a>
<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="/" aria-label="HEYID home"><img src="/img/icon-96.png" width="38" height="38" alt=""><span>HEYID</span></a>
    <nav class="nav" aria-label="Main">${navItems.map(link).join('')}<a class="btn btn--sm" href="/heyid/" data-i18n="nav.get">Get HEYID</a></nav>
    <details class="menu">
      <summary aria-label="Menu"><span class="burger"></span></summary>
      <div class="menu-panel">${navItems.map(link).join('')}<a class="btn" href="/heyid/" data-i18n="nav.get">Get HEYID</a></div>
    </details>
  </div>
</header>`;
  };

  const footer = () => `
<footer class="site-footer">
  <div class="wrap foot">
    <div class="foot-brand">
      <a class="brand" href="/"><img src="/img/icon-96.png" width="38" height="38" alt=""><span>HEYID</span></a>
      <p data-i18n="footer.tag">A global chat app with live translation, and a small corner of the internet about talking to people.</p>
      <label class="lang"><span data-i18n="footer.lang">Language</span>
        <select data-lang-select aria-label="Language">
          <option value="en">English</option><option value="pl">Polski</option><option value="de">Deutsch</option>
          <option value="es">Español</option><option value="fr">Français</option><option value="pt">Português</option>
        </select>
      </label>
    </div>
    <nav aria-label="Site"><h2 data-i18n="footer.explore">Explore</h2>
      <a href="/discover/" data-i18n="nav.discover">Discover</a><a href="/blog/" data-i18n="nav.blog">Blog</a><a href="/heyid/" data-i18n="nav.get">Get HEYID</a></nav>
    <nav aria-label="About"><h2 data-i18n="footer.about">About</h2>
      <a href="/about/" data-i18n="nav.about">About</a><a href="/contact/" data-i18n="footer.contact">Contact</a><a href="/privacy/" data-i18n="footer.privacy">Privacy</a><a href="/terms/" data-i18n="footer.terms">Terms</a></nav>
  </div>
  <div class="wrap legal"><small>© ${new Date().getUTCFullYear()} HEYID · <a href="${site.productSite}" rel="noopener">heyid.online</a></small></div>
</footer>`;

  function layout({ title, description, path, type = 'website', body, jsonld = [], noindex = false, ogImage, published, modified }) {
    const full = title.length + 8 <= 62 && path !== '/' ? `${title} | HEYID` : title;
    const url = site.url + path;
    const img = site.url + (ogImage || '/og-default.png');
    const ld = jsonld.length ? `<script type="application/ld+json">${JSON.stringify(jsonld.length === 1 ? jsonld[0] : jsonld)}</script>` : '';
    const ads = site.adsense.client ? `<meta name="heyid-ads" content="${esc(site.adsense.client)}">` : '';
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
<meta name="theme-color" content="#1A62D6">
<meta property="og:site_name" content="HEYID">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
${published ? `<meta property="article:published_time" content="${published}">` : ''}
${modified ? `<meta property="article:modified_time" content="${modified}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${img}">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="HEYID" href="/feed.xml">
${ads}
<link rel="stylesheet" href="/css/site.css?v=${data.buildId}">
${ld}
</head>
<body>
${header(path)}
<main id="main">
${body}
</main>
${footer()}
<script src="/js/app.js?v=${data.buildId}" defer></script>
</body>
</html>`;
  }

  // ---------- pages ----------
  const crumbs = (items) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: site.url + p })),
  });

  function appBand(ctx) {
    return `<section class="band">
  <div class="wrap band-in">
    <img src="/img/icon-192.png" width="120" height="120" alt="" loading="lazy">
    <div>
      <h2 data-i18n="app.title">Ready for a real conversation?</h2>
      <p data-i18n="app.lead">HEYID is a free-to-start chat app that connects you with people worldwide and translates as you talk.</p>
      <a class="btn btn--amber" href="/heyid/?from=${ctx}" data-i18n="app.cta">See what HEYID does</a>
    </div>
  </div>
</section>`;
  }

  function home(posts) {
    const [featured, ...rest] = posts;
    const moods = [['start', 'mood.start', 'Start a conversation'], ['learn', 'mood.learn', 'Practise a language'], ['lonely', 'mood.lonely', 'Feel less alone'], ['safe', 'mood.safe', 'Stay safe online']];
    const tiles = moods.map(([k, key, label]) => {
      const ps = posts.filter((p) => (p.mood || []).includes(k)).slice(0, 2);
      if (!ps.length) return '';
      return `<div class="tile"><h3 data-i18n="${key}">${label}</h3><ul>${ps.map((p) => `<li><a href="/blog/${p.slug}/">${esc(p.title)}</a></li>`).join('')}</ul></div>`;
    }).join('');
    const body = `
<section class="hero">
  <div class="wrap hero-in">
    <div class="hero-copy">
      <h1 data-i18n="home.h1">Talk to the whole planet. Start with one good question.</h1>
      <p class="lead" data-i18n="home.lead">Conversation starters, greetings in 33 languages and guides for people who like talking to people from other countries.</p>
    </div>
    ${starterWidget()}
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="head"><h2 data-i18n="world.title">The world, right now</h2><p data-i18n="world.sub">Who is waking up, who is having dinner, who is probably asleep.</p></div>
    ${worldWidget()}
  </div>
</section>

<section class="section section--tint">
  <div class="wrap split">
    <div>
      <div class="head"><h2 data-i18n="hello.title">Say hello in 33 languages</h2><p data-i18n="hello.sub">Tap, read it out loud, and you already have a first line.</p></div>
      <a class="more" href="/discover/say-hello/" data-i18n="hello.more">Open the full tool</a>
    </div>
    ${helloWidget()}
  </div>
</section>

${featured ? `<section class="section">
  <div class="wrap">
    <div class="head"><h2 data-i18n="blog.latest">Latest from the blog</h2></div>
    <div class="grid grid--feature">${card(featured, 'card--big')}${rest.slice(0, 4).map((p) => card(p)).join('')}</div>
    <p class="center"><a class="more" href="/blog/" data-i18n="blog.all">All articles</a></p>
  </div>
</section>` : ''}

<section class="section section--tint">
  <div class="wrap split split--demo">
    <div>
      <div class="head"><h2 data-i18n="demo.title">What a translated chat feels like</h2><p data-i18n="demo.sub">Ana is in Mexico City, Kenji is in Tokyo. Each of them reads the conversation in their own language.</p></div>
    </div>
    ${demoWidget()}
  </div>
</section>

${tiles ? `<section class="section"><div class="wrap"><div class="head"><h2 data-i18n="mood.title">What are you in the mood for?</h2></div><div class="tiles">${tiles}</div></div></section>` : ''}

${appBand('home')}`;
    return layout({
      title: 'HEYID: talk to the whole planet',
      description: site.description,
      path: '/',
      body,
      jsonld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'HEYID', url: site.url + '/', description: site.description }],
    });
  }

  function blogIndex(posts) {
    const topics = [...new Set(posts.map((p) => p.topic))];
    const cards = posts.map((p, i) => card(p) + (i === 5 ? ad('list') : '')).join('');
    const body = `
<section class="page-head"><div class="wrap">
  <h1 data-i18n="blog.title">The HEYID blog</h1>
  <p class="lead" data-i18n="blog.lead">Practical guides about talking to people across languages and cultures.</p>
  <div class="chips" role="group" aria-label="Topics">
    <button class="chip is-on" type="button" data-topic-filter="all" data-i18n="blog.everything">Everything</button>
    ${topics.map((t) => `<button class="chip" type="button" data-topic-filter="${esc(t)}">${esc(topicName(t))}</button>`).join('')}
  </div>
</div></section>
<section class="section"><div class="wrap"><div class="grid" data-blog-grid>${cards}</div></div></section>
${appBand('blog')}`;
    return layout({
      title: 'HEYID blog: guides to talking across languages and cultures',
      description: 'Practical, human guides to starting conversations, learning languages and getting along with people from other countries.',
      path: '/blog/',
      body,
      jsonld: [crumbs([['Home', '/'], ['Blog', '/blog/']])],
    });
  }

  function post(p, all) {
    const rel = (p.related || []).map((s) => all.find((x) => x.slug === s)).filter(Boolean);
    const fill = all.filter((x) => x.slug !== p.slug && !rel.includes(x) && x.topic === p.topic);
    const related = [...rel, ...fill].slice(0, 3);
    const toc = p.toc.length >= 4
      ? `<nav class="toc" aria-label="In this article"><details open><summary data-i18n="post.toc">In this article</summary><ol>${p.toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol></details></nav>`
      : '';
    const [c1, c2, fg] = COVER[p.topic] || COVER.talk;
    const body = `
<article class="post">
  <header class="post-head" style="--c1:${c1};--c2:${c2};--fg:${fg}">
    <div class="wrap wrap--narrow">
      <p class="crumbs"><a href="/blog/" data-i18n="nav.blog">Blog</a> / <span>${esc(topicName(p.topic))}</span></p>
      <h1>${esc(p.title)}</h1>
      <p class="dek">${esc(p.description)}</p>
      <p class="byline">By ${esc(p.author || site.author)} · <time datetime="${p.date}">${fmtDate(p.date)}</time> · ${p.readMin} min read${p.updated ? ` · Updated <time datetime="${p.updated}">${fmtDate(p.updated)}</time>` : ''}</p>
    </div>
  </header>
  <div class="wrap wrap--narrow">
    ${toc}
    <div class="prose" lang="en" dir="ltr">${p.html}</div>
    <div class="share"><button class="btn btn--ghost" type="button" data-share data-title="${esc(p.title)}" data-i18n="post.share">Share this article</button></div>
  </div>
</article>
${related.length ? `<section class="section section--tint"><div class="wrap"><div class="head"><h2 data-i18n="post.more">Keep reading</h2></div><div class="grid">${related.map((r) => card(r)).join('')}</div></div></section>` : ''}
${appBand('post')}`;
    return layout({
      title: p.title,
      description: p.description,
      path: `/blog/${p.slug}/`,
      type: 'article',
      published: p.date,
      modified: p.updated || p.date,
      body,
      jsonld: [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: p.title,
          description: p.description,
          datePublished: p.date,
          dateModified: p.updated || p.date,
          author: { '@type': 'Person', name: p.author || site.author },
          publisher: { '@type': 'Organization', name: 'HEYID', logo: { '@type': 'ImageObject', url: site.url + '/img/icon-512.png' } },
          mainEntityOfPage: site.url + `/blog/${p.slug}/`,
          image: site.url + '/og-default.png',
          inLanguage: 'en',
        },
        crumbs([['Home', '/'], ['Blog', '/blog/'], [p.title, `/blog/${p.slug}/`]]),
      ],
    });
  }

  function tool({ slug, title, description, h1, lead, widget, prose }) {
    const body = `
<section class="page-head"><div class="wrap"><p class="crumbs"><a href="/discover/" data-i18n="nav.discover">Discover</a></p><h1>${esc(h1)}</h1><p class="lead">${esc(lead)}</p></div></section>
<section class="section"><div class="wrap wrap--narrow tool-wrap">${widget}</div></section>
<section class="section section--tint"><div class="wrap wrap--narrow"><div class="prose" lang="en" dir="ltr">${prose}</div></div></section>
${appBand('tool-' + slug)}`;
    return layout({
      title,
      description,
      path: `/discover/${slug}/`,
      body,
      jsonld: [crumbs([['Home', '/'], ['Discover', '/discover/'], [title, `/discover/${slug}/`]])],
    });
  }

  function discover() {
    const items = [
      ['/discover/conversation-starters/', 'Conversation starters', 'Questions that get past “where are you from?”. Pick a mood, get one good question.', '?'],
      ['/discover/say-hello/', 'Say hello', 'Greetings in 33 languages with pronunciation and audio.', 'Hola'],
      ['/discover/world-now/', 'The world right now', 'See who is awake, who is at lunch and who is asleep, city by city.', '🌍'],
    ];
    const body = `
<section class="page-head"><div class="wrap"><h1 data-i18n="discover.title">Discover</h1><p class="lead" data-i18n="discover.lead">Small tools for the moment before a conversation starts.</p></div></section>
<section class="section"><div class="wrap"><div class="grid">${items.map(([href, t, d, w]) => `<a class="card card--tool" href="${href}"><div class="cover" style="--c1:#1A62D6;--c2:#22B8CF;--fg:#fff"><span class="cover-word" translate="no">${w}</span></div><div class="card-body"><h3>${t}</h3><p>${d}</p></div></a>`).join('')}</div></div></section>
<section class="section section--tint"><div class="wrap wrap--narrow"><div class="prose" lang="en" dir="ltr">
<h2>Why these tools exist</h2>
<p>Most conversations with someone new die in the first minute. Not because people have nothing to say, but because the first line is hard. These three tools are there for that moment: a question you can borrow, a greeting you can say in the other person's language, and a quick look at what time it is where they live.</p>
<p>They run entirely in your browser. Nothing you click is stored on a server, and there is nothing to sign up for.</p>
</div></div></section>
${appBand('discover')}`;
    return layout({
      title: 'Discover: tools for starting conversations with people worldwide',
      description: 'Conversation starters, greetings in 33 languages and a live world clock. Small tools for the moment before a conversation starts.',
      path: '/discover/',
      body,
      jsonld: [crumbs([['Home', '/'], ['Discover', '/discover/']])],
    });
  }

  function heyidPage() {
    const f = [
      ['Random chat', 'Tap once and get matched with someone, from your own city or from the other side of the world. No long profile to fill in first.'],
      ['Text, voice, photos, stickers', 'Talk the way you like. Send messages, voice notes, pictures and stickers.'],
      ['Live translation', 'Write in your language and the other person reads theirs. Real-time voice translation is part of Premium.'],
      ['SPARX, the AI helper', 'Stuck on what to say? SPARX suggests replies and helps when the conversation goes quiet.'],
      ['You stay in control', 'Block, report or end any conversation at any moment.'],
      ['Free to start', 'Start chatting in seconds. Premium unlocks live voice translation.'],
    ];
    const body = `
<section class="page-head page-head--app"><div class="wrap app-hero">
  <div>
    <h1>HEYID: chat with people worldwide, in any language</h1>
    <p class="lead">HEYID is a chat app for meeting people from other countries. It matches you with someone new and translates what you both write, so the conversation does not stop at the language barrier.</p>
    <div class="actions"><a class="btn btn--amber btn--lg" href="${playLink('heyid-page')}" rel="noopener">Get it on Google Play</a></div>
    <p class="fine">Check the store page for the current age rating and details.</p>
  </div>
  <img src="/img/icon-512.png" width="260" height="260" alt="HEYID logo: a globe inside a speech bubble" loading="eager">
</div></section>
<section class="section"><div class="wrap">
  <div class="head"><h2>What you get</h2></div>
  <div class="tiles tiles--3">${f.map(([t, d]) => `<div class="tile"><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
</div></section>
<section class="section section--tint"><div class="wrap split split--demo">
  <div><div class="head"><h2>See the translation in action</h2><p>Ana writes in Spanish, Kenji writes in Japanese. Each one reads the chat in their own language.</p></div></div>
  ${demoWidget()}
</div></section>
<section class="section"><div class="wrap wrap--narrow"><div class="prose" lang="en" dir="ltr">
<h2>New to talking with strangers online?</h2>
<p>Read a few of our guides first. They cover <a href="/blog/">how to start a conversation, what to share and what to keep to yourself</a>, and how to get along with people from other cultures.</p>
<p>Want the product details, plans and the app's privacy policy? The app's own site is <a href="${site.productSite}" rel="noopener">heyid.online</a> and the <a href="${site.appPrivacyUrl}" rel="noopener">app privacy policy</a> is public.</p>
</div></div></section>`;
    return layout({
      title: 'HEYID app: random chat with live translation',
      description: 'HEYID matches you with people around the world and translates your messages as you chat. Text, voice and AI reply suggestions. Free to start.',
      path: '/heyid/',
      body,
      jsonld: [{
        '@context': 'https://schema.org',
        '@type': 'MobileApplication',
        name: 'HEYID',
        operatingSystem: 'Android',
        applicationCategory: 'CommunicationApplication',
        url: site.url + '/heyid/',
        downloadUrl: site.playUrl,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      }],
    });
  }

  function plain(pg) {
    const body = `
<section class="page-head"><div class="wrap"><h1>${esc(pg.title)}</h1>${pg.lead ? `<p class="lead">${esc(pg.lead)}</p>` : ''}</div></section>
<section class="section"><div class="wrap wrap--narrow"><div class="prose" lang="en" dir="ltr">${pg.html}</div></div></section>`;
    return layout({ title: pg.title, description: pg.description, path: `/${pg.slug}/`, body, noindex: !!pg.noindex, jsonld: [crumbs([['Home', '/'], [pg.title, `/${pg.slug}/`]])] });
  }

  function notFound() {
    const body = `<section class="page-head"><div class="wrap"><h1>That page wandered off</h1><p class="lead">The link may be old or mistyped. Try the <a href="/blog/">blog</a> or the <a href="/discover/">Discover tools</a>.</p></div></section>`;
    return layout({ title: 'Page not found', description: 'This page does not exist.', path: '/404.html', body, noindex: true });
  }

  return { home, blogIndex, post, tool, discover, heyidPage, plain, notFound, starterWidget, helloWidget, worldWidget, hooks, playLink };
}
