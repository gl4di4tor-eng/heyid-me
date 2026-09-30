// Tiny dependency-free Markdown renderer tuned for this site.
// Supports: front matter, ## / ### headings (with ids), paragraphs, bold, italic, code,
// links, images, lists, blockquotes, tables, hr, and shortcodes on their own line:
//   {{cta}}  {{ad}}  {{tool:starters}}  {{todo: note}}   and inline [[foreign words]] (translate="no")

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseFrontMatter(raw) {
  const text = raw.replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 1 || line.trim().startsWith('#')) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((v) => v.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else val = val.replace(/^["']|["']$/g, '');
    data[key] = val;
  }
  return { data, body: text.slice(m[0].length) };
}

function inline(s) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\[\[([^\]]+)\]\]/g, '<span translate="no">$1</span>');
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" decoding="async">');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
    const ext = /^https?:/.test(u);
    return `<a href="${u}"${ext ? ' rel="noopener"' : ''}>${t}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(>])\*([^*\n]+)\*(?=[\s).,;:!?<]|$)/g, '$1<em>$2</em>');
  return s;
}

export function renderMarkdown(body, hooks = {}) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const toc = [];
  const todos = [];
  const used = new Set();
  let i = 0;
  let words = 0;

  const isBlockStart = (l) =>
    /^#{2,3}\s/.test(l) || /^>\s?/.test(l) || /^[-*]\s+/.test(l) || /^\d+\.\s+/.test(l) ||
    /^\|/.test(l) || /^---+$/.test(l) || /^\{\{.*\}\}$/.test(l.trim());

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const sc = line.trim().match(/^\{\{\s*([a-z]+)\s*(?::\s*([^}]*))?\}\}$/i);
    if (sc) {
      const [, name, arg] = sc;
      if (name === 'todo') todos.push(arg || '');
      else if (hooks[name]) out.push(hooks[name](arg ? arg.trim() : ''));
      i++; continue;
    }

    const h = line.match(/^(#{2,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      let id = slugify(text) || 'section';
      while (used.has(id)) id += '-2';
      used.add(id);
      if (level === 2) toc.push({ id, text });
      words += text.split(/\s+/).length;
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i++; continue;
    }

    if (/^---+$/.test(line.trim())) { out.push('<hr>'); i++; continue; }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      words += buf.join(' ').split(/\s+/).length;
      out.push(`<blockquote><p>${inline(buf.join(' '))}</p></blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const ordered = /^\d+\.\s+/.test(line);
      const re = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      const items = [];
      while (i < lines.length && re.test(lines[i])) { items.push(lines[i].replace(re, '')); i++; }
      items.forEach((t) => (words += t.split(/\s+/).length));
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</${tag}>`);
      continue;
    }

    if (/^\|/.test(line) && /^\|?\s*:?-{2,}/.test((lines[i + 1] || '').replace(/^\|/, ''))) {
      const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
      rows.flat().forEach((t) => (words += t.split(/\s+/).length));
      out.push(
        '<div class="table-wrap"><table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>'
      );
      continue;
    }

    const buf = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) { buf.push(lines[i]); i++; }
    if (!buf.length) { buf.push(lines[i]); i++; }
    const text = buf.join(' ');
    words += text.split(/\s+/).length;
    out.push(`<p>${inline(text)}</p>`);
  }
  return { html: out.join('\n'), toc, words, todos };
}
