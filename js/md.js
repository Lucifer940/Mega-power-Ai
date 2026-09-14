/* ============================================================
   MEGA POWER AI — md.js  |  markdown renderer + highlighter
   Zero-dependency, escape-safe. Pure functions (node-testable).
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.md = {};

/* ---------- syntax highlighter (regex tokenizer) ---------- */
Mega.hl = (code, lang) => {
  const esc = Mega.esc(code);
  const L = (lang || '').toLowerCase();
  if (L === 'html' || L === 'xml' || L === 'svg' || L === 'vue') return Mega._hlHtml(esc);
  const KW = {
    js: 'const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|super|this|typeof|instanceof|in|of|try|catch|finally|throw|async|await|yield|import|export|from|default|delete|void|null|undefined|true|false|static|get|set|=>',
    ts: 'const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|implements|interface|type|enum|super|this|typeof|instanceof|in|of|try|catch|finally|throw|async|await|yield|import|export|from|default|delete|void|null|undefined|true|false|static|readonly|public|private|protected|as|satisfies',
    py: 'def|return|if|elif|else|for|while|break|continue|class|import|from|as|try|except|finally|raise|with|lambda|global|nonlocal|pass|yield|async|await|None|True|False|and|or|not|in|is|assert|del|match|case|self',
    java: 'public|private|protected|class|interface|extends|implements|static|final|void|int|long|double|float|boolean|char|String|new|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|import|package|this|super|null|true|false|abstract|override|record|var',
    c: 'int|float|double|char|void|long|short|unsigned|signed|struct|union|enum|typedef|static|const|return|if|else|for|while|do|switch|case|break|continue|sizeof|include|define|NULL|true|false|class|new|delete|public|private|protected|namespace|using|template|auto',
    css: '',
    bash: 'echo|cd|ls|mkdir|rm|cp|mv|cat|grep|sudo|apt|npm|node|python|pip|git|curl|wget|chmod|export|source|if|then|fi|for|do|done|while|function|return',
    json: 'true|false|null'
  };
  let k = KW.js, l = L;
  if (L === 'javascript' || L === 'js' || L === 'jsx') l = 'js';
  if (L === 'typescript' || L === 'ts' || L === 'tsx') l = 'ts';
  if (L === 'python' || L === 'py') l = 'py';
  if (L === 'java' || L === 'kt' || L === 'cs' || L === 'go' || L === 'rust') { k = KW.java; l = 'java'; }
  if (L === 'c' || L === 'cpp' || L === 'c++' || L === 'h') { k = KW.c; l = 'c'; }
  if (L === 'sh' || L === 'shell' || L === 'zsh') l = 'bash';
  k = KW[l] !== undefined ? KW[l] : KW.js;
  const comPattern = l === 'py' || l === 'bash' ? '#[^\\n]*' : (l === 'css' ? '\\/\\*[\\s\\S]*?\\*\\/' : '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/');
  const re = new RegExp(`(${comPattern})|(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|\`[^\`]*\`)|\\b(${k})\\b|\\b(\\d+(?:\\.\\d+)?)\\b|([A-Za-z_$][\\w$]*)(?=\\()`, 'g');
  return esc.replace(re, (m, com, str, kw, num, fn) => {
    if (com) return `<span class="tok-com">${com}</span>`;
    if (str) return `<span class="tok-str">${str}</span>`;
    if (kw) return `<span class="tok-kw">${kw}</span>`;
    if (num) return `<span class="tok-num">${num}</span>`;
    if (fn) return `<span class="tok-fn">${fn}</span>`;
    return m;
  });
};
Mega._hlHtml = (esc) => esc
  .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-com">$1</span>')
  .replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, '$1<span class="tok-tag">$2</span>')
  .replace(/([a-zA-Z-]+)(=)(&quot;[^&]*?&quot;)/g, '<span class="tok-attr">$1</span>$2<span class="tok-str">$3</span>');

/* ---------- markdown ---------- */
Mega.md.render = (src, opts = {}) => {
  if (!src) return '';
  const codes = [];
  // extract fenced code first
  let s = String(src).replace(/\r\n/g, '\n').replace(/```([\w+#.-]*)\n?([\s\S]*?)```/g, (m, lang, code) => {
    const i = codes.length;
    codes.push({ lang: lang || 'text', code: code.replace(/\n$/, '') });
    return `\u0000CB${i}\u0000`;
  });
  s = Mega.esc(s);
  // headings
  s = s.replace(/^#### (.*)$/gm, '<h4>$1</h4>').replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>');
  // hr
  s = s.replace(/^(?:---|\*\*\*)\s*$/gm, '<hr>');
  // blockquote
  s = s.replace(/^&gt; ?(.*)$/gm, '<blockquote>$1</blockquote>');
  s = s.replace(/<\/blockquote>\n<blockquote>/g, '<br>');
  // table
  s = s.replace(/(^\|.+\|)\n(\|[\s:|-]+\|)\n((?:\|.*\|\n?)*)/gm, (m, h, sep, body) => {
    const th = h.split('|').filter(x => x.trim() !== '').map(x => `<th>${x.trim()}</th>`).join('');
    const rows = body.trim().split('\n').map(r => '<tr>' + r.split('|').filter(x => x.trim() !== '').map(x => `<td>${x.trim()}</td>`).join('') + '</tr>').join('');
    return `<table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>`;
  });
  // lists (one nesting level)
  s = s.replace(/((?:^[ \t]*(?:[-*+]|\d+\.) .+\n?)+)/gm, (block) => {
    const ordered = /^\s*\d+\./.test(block.trim());
    const items = block.trim().split('\n').map(l => l.replace(/^[ \t]*(?:[-*+]|\d+\.)\s+/, ''));
    return `<${ordered ? 'ol' : 'ul'}>` + items.map(i => `<li>${i}</li>`).join('') + `</${ordered ? 'ol' : 'ul'}>`;
  });
  // inline code
  s = s.replace(/`([^`\n]+)`/g, '<code style="background:rgba(120,140,255,.14);padding:2px 7px;border-radius:7px;font-family:var(--mono);font-size:.88em">$1</code>');
  // images + links
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2" loading="lazy">');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // bold / italic / strike
  s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<b><i>$1</i></b>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>').replace(/~~([^~]+)~~/g, '<s>$1</s>');
  // paragraphs
  s = s.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>');
  s = '<p>' + s + '</p>';
  s = s.replace(/<p>(\s*<(h\d|ul|ol|blockquote|table|hr|img|pre|div)[\s>])/g, '$1').replace(/(<\/(h\d|ul|ol|blockquote|table|hr|pre|div)>)\s*<\/p>/g, '$1');
  s = s.replace(/<p>\s*<\/p>/g, '');
  // restore code blocks
  codes.forEach((c, i) => {
    const fixAttrs = opts.fixable === false ? '' : ` <button class="cb-btn" data-fixcb="${i}">${Mega.settings?.autocorrect ? '🔧 Auto-fix' : '🔧 Fix code'}</button>`;
    const html = `<div class="codeblock"><div class="cb-head"><span class="clang">${Mega.esc(c.lang)}</span><div class="cb-acts"><button class="cb-btn" data-copycb="${i}">📋 Copy</button>${fixAttrs}</div></div><pre><code>${Mega.hl(c.code, c.lang)}</code></pre><textarea style="display:none" data-rawcb="${i}">${Mega.esc(c.code)}</textarea></div>`;
    s = s.replace(`\u0000CB${i}\u0000`, html);
  });
  return s;
};
