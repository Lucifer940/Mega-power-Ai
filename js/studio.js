/* ============================================================
   MEGA POWER AI — studio.js  |  Create Studio
   Sliding tabs: 🖼 Image · 🎬 Video · 🗣 Voice  (feature 6 & 13)
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.studio = { images: [], videoAbort: null };

Mega.studio.init = () => {
  const p = Mega.$('#page-studio');
  if (p.dataset.init) return; p.dataset.init = '1';

  /* sliding tabs */
  const tabs = Mega.$$('.st-tab', p);
  const slider = Mega.$('.st-slider', p);
  const move = (tab) => {
    tabs.forEach(t => t.classList.toggle('on', t === tab));
    slider.style.left = tab.offsetLeft + 'px';
    slider.style.width = tab.offsetWidth + 'px';
    Mega.$$('.st-panel', p).forEach(pn => pn.classList.toggle('on', pn.dataset.panel === tab.dataset.tab));
  };
  tabs.forEach(t => t.onclick = () => move(t));
  setTimeout(() => move(tabs[0]), 60);
  window.addEventListener('resize', () => move(Mega.$('.st-tab.on', p)));

  /* IMAGE */
  Mega.$('#imgGen').onclick = () => Mega.studio.genImages();
  Mega.$('#imgPrompt').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) Mega.studio.genImages(); });
  Mega.$('#imgStyle').onchange = () => { if (Mega.$('#imgStyle').value === 'logo') { Mega.$('#imgAspect').value = '1:1'; } };

  /* VIDEO */
  Mega.$('#vidGen').onclick = () => Mega.studio.genVideo();
  Mega.$('#vidCancel').onclick = () => { Mega.studio.videoAbort?.abort(); };

  /* VOICE */
  const loadVoices = () => {
    const vs = speechSynthesis.getVoices();
    const sel = Mega.$('#voiceSel');
    if (!vs.length) return;
    sel.innerHTML = vs.map((v, i) => `<option value="${i}">${Mega.esc(v.name)} (${v.lang})</option>`).join('');
    const pref = vs.findIndex(v => /en[-_]?(US|GB|IN)/i.test(v.lang) && /google|natural|zira|aria/i.test(v.name));
    if (pref >= 0) sel.value = pref;
  };
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
  Mega.$('#voicePlay').onclick = () => Mega.studio.speak();
  Mega.$('#voiceStop').onclick = () => speechSynthesis.cancel();
  Mega.$$('[data-vpreset]').forEach(b => b.onclick = () => {
    Mega.$('#voiceRate').value = b.dataset.vpreset.split(',')[0];
    Mega.$('#voicePitch').value = b.dataset.vpreset.split(',')[1];
    Mega.$('#rateVal').textContent = b.dataset.vpreset.split(',')[0];
    Mega.$('#pitchVal').textContent = b.dataset.vpreset.split(',')[1];
  });
  Mega.$('#voiceRate').oninput = (e) => Mega.$('#rateVal').textContent = e.target.value;
  Mega.$('#voicePitch').oninput = (e) => Mega.$('#pitchVal').textContent = e.target.value;

  /* restore gallery */
  Mega.studio.images = Mega.store.get('studioImages', []);
  Mega.studio.renderGallery();
};

/* ================= IMAGE ================= */
Mega.studio.genImages = async () => {
  const prompt = Mega.$('#imgPrompt').value.trim();
  if (!prompt) return Mega.toast('Describe your image', 'Example: “a neon cyber city at night, rain” ✨', 'warn');
  const style = Mega.$('#imgStyle').value;
  const [aw, ah] = Mega.$('#imgAspect').value.split(':').map(Number);
  const count = +Mega.$('#imgCount').value;
  const model = Mega.$('#imgModel').value;
  const enhance = Mega.$('#imgEnhance').checked;
  const gal = Mega.$('#imgGallery');
  const W = 1024, H = Math.round(1024 * ah / aw);
  const btn = Mega.$('#imgGen'); btn.disabled = true; btn.innerHTML = '⏳ Generating… (free queue)';
  const cards = [];
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'img-card';
    card.innerHTML = `<div class="img-shimmer"><span>🎨 painting scene ${i + 1}…</span></div>`;
    gal.prepend(card);
    cards.push(card);
  }
  const jobs = cards.map((card, i) => (async () => {
    try {
      const img = await Mega.ai.image.get(prompt, { width: W, height: H, style, model, enhance, seed: Math.floor(Math.random() * 1e9) });
      const url = img.src;
      card.innerHTML = `<img src="${Mega.esc(url)}" alt="${Mega.esc(prompt)}" loading="lazy">
        <div class="img-acts">
          <button class="btn sm" data-dl>⬇️ Save</button>
          <button class="btn sm" data-re>🔁 Re-roll</button>
          <button class="btn sm" data-vid>🎬 To video</button>
        </div>`;
      const rec = { url, prompt, style, at: Date.now() };
      card.onclick = (e) => {
        if (e.target.closest('[data-dl]')) return Mega.studio.dl(url, 'mega-image-' + Date.now() + '.jpg');
        if (e.target.closest('[data-re]')) { card.remove(); Mega.studio.images = Mega.studio.images.filter(x => x.url !== url); Mega.store.set('studioImages', Mega.studio.images); return Mega.studio.genOne(prompt, { width: W, height: H, style, model, enhance }); }
        if (e.target.closest('[data-vid]')) {
          Mega.$('#vidScenes').value += (Mega.$('#vidScenes').value ? '\n' : '') + prompt;
          Mega.go('studio'); Mega.toast('Added to video scenes 🎬', 'Switched to the Video tab — press Generate Video.', 'ok');
          return;
        }
        Mega.modal('🖼 ' + Mega.esc(prompt), '', `<img src="${Mega.esc(url)}" style="width:100%;border-radius:14px">`, {});
      };
      Mega.studio.images.unshift(rec);
      Mega.studio.images = Mega.studio.images.slice(0, 60);
      Mega.store.set('studioImages', Mega.studio.images);
    } catch (err) {
      card.innerHTML = `<div class="img-shimmer" style="color:var(--err)">⚠️ failed — free server busy.<br>Try again in a moment.</div>`;
      setTimeout(() => card.remove(), 2600);
    }
  })());
  await Promise.allSettled(jobs);
  btn.disabled = false; btn.innerHTML = '✨ Generate images';
};

Mega.studio.genOne = async (prompt, opts) => {
  const gal = Mega.$('#imgGallery');
  const card = document.createElement('div');
  card.className = 'img-card';
  card.innerHTML = `<div class="img-shimmer"><span>🎨 painting…</span></div>`;
  gal.prepend(card);
  try {
    const img = await Mega.ai.image.get(prompt, opts);
    const url = img.src;
    card.innerHTML = `<img src="${Mega.esc(url)}" alt=""><div class="img-acts"><button class="btn sm" onclick="Mega.studio.dl('${Mega.esc(url)}','mega-image.jpg')">⬇️ Save</button></div>`;
    Mega.studio.images.unshift({ url, prompt, style: opts.style, at: Date.now() });
    Mega.store.set('studioImages', Mega.studio.images);
  } catch { card.innerHTML = `<div class="img-shimmer" style="color:var(--err)">⚠️ failed</div>`; setTimeout(() => card.remove(), 2000); }
};

Mega.studio.renderGallery = () => {
  const gal = Mega.$('#imgGallery');
  if (!Mega.studio.images.length) {
    gal.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="big">🖼️</div><b>Your AI art appears here</b><span>Describe anything — “a tiger made of galaxies”, “minimal logo of a bolt”…</span></div>';
    return;
  }
  gal.innerHTML = Mega.studio.images.map(im =>
    `<div class="img-card"><img src="${Mega.esc(im.url)}" alt="${Mega.esc(im.prompt)}" loading="lazy">
     <div class="img-acts"><button class="btn sm" onclick="Mega.studio.dl('${Mega.esc(im.url)}','mega-image.jpg')">⬇️</button>
     <button class="btn sm" onclick="Mega.studio.fullImg(this)" data-u="${Mega.esc(im.url)}">🔍</button></div></div>`).join('');
};

Mega.studio.fullImg = (btn) => Mega.modal('🖼 Image', '', `<img src="${btn.dataset.u}" style="width:100%;border-radius:14px">`, {});
Mega.studio.dl = (url, name) => {
  fetch(url).then(r => r.blob()).then(b => Mega.zip.save(b, name)).catch(() => window.open(url, '_blank'));
};

/* ================= VIDEO (real in-browser generator) ================= */
Mega.studio.genVideo = async () => {
  const title = Mega.$('#vidTitle').value.trim() || 'My AI Video';
  const raw = Mega.$('#vidScenes').value.trim();
  if (!raw) return Mega.toast('Add scenes', 'One scene per line — e.g. “a rocket launching at sunset”.', 'warn');
  const scenes = raw.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 8);
  const style = Mega.$('#vidStyle').value;
  const secPer = +Mega.$('#vidSec').value;
  const res = Mega.$('#vidRes').value.split('x').map(Number);
  const fps = +Mega.$('#vidFps').value;
  const music = Mega.$('#vidMusic').checked;
  const out = Mega.$('#vidOut');
  const bar = Mega.$('#vidBar'), st = Mega.$('#vidStat');
  const btn = Mega.$('#vidGen'); btn.disabled = true;
  Mega.studio.videoAbort = new AbortController();
  const signal = Mega.studio.videoAbort.signal;

  out.style.display = 'block';
  bar.style.width = '4%'; st.textContent = '🎬 Painting scenes with AI…';

  /* 1. generate scene images */
  const imgs = [];
  try {
    for (let i = 0; i < scenes.length; i++) {
      if (signal.aborted) throw new DOMException('aborted', 'AbortError');
      st.textContent = `🎨 Scene ${i + 1}/${scenes.length}: ${scenes[i].slice(0, 40)}…`;
      const img = await Mega.ai.image.get(scenes[i], { width: 1024, height: Math.round(1024 * res[1] / res[0]), style, model: 'flux' });
      imgs.push(img);
      bar.style.width = (4 + (i + 1) / scenes.length * 56) + '%';
    }
  } catch (err) {
    btn.disabled = false;
    if (String(err).includes('Abort')) { st.innerHTML = '<span class="pill warn">⏹ cancelled</span>'; Mega.toast('Video cancelled', '', 'warn'); }
    else { st.innerHTML = '<span class="pill err">⚠️ ' + Mega.esc(err.message || err) + '</span>'; }
    return;
  }

  /* 2. render + record */
  st.textContent = '🎞 Rendering & encoding video…';
  const canvas = document.createElement('canvas');
  canvas.width = res[0]; canvas.height = res[1];
  const ctx = canvas.getContext('2d');
  const stream = canvas.captureStream(fps);
  let audioCtx, oscs = [], gain;
  if (music) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      gain = audioCtx.createGain(); gain.gain.value = 0.05;
      [130.8, 164.8, 196, 261.6].forEach((f, i) => {
        const o = audioCtx.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f;
        const g2 = audioCtx.createGain(); g2.gain.value = 0.25;
        o.connect(g2); g2.connect(gain); o.start(); oscs.push(o);
      });
      gain.connect(dest);
      dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    } catch {}
  }
  let rec;
  try {
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || '';
    rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 4_000_000 } : undefined);
  } catch (err) {
    btn.disabled = false;
    st.innerHTML = '<span class="pill err">⚠️ This browser cannot record video (try Chrome / Edge)</span>';
    if (audioCtx) audioCtx.close().catch(() => {});
    return;
  }
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise(r => rec.onstop = r);
  rec.start(200);

  const D = imgs.length * secPer;
  const t0 = performance.now();
  await new Promise((resolve) => {
    const frame = () => {
      const t = (performance.now() - t0) / 1000;
      if (signal.aborted) { resolve(); return; }
      if (t >= D) { resolve(); return; }
      const idx = Math.min(imgs.length - 1, Math.floor(t / secPer));
      const local = (t - idx * secPer) / secPer;
      const dir = idx % 2 ? -1 : 1;
      const zoom = 1.02 + 0.08 * local * dir + (dir < 0 ? 0.1 : 0);
      const iw = res[0] * zoom, ih = res[1] * zoom;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, res[0], res[1]);
      try { ctx.drawImage(imgs[idx], (res[0] - iw) / 2 + 30 * dir * local, (res[1] - ih) / 2, iw, ih); } catch {}
      // crossfade
      const fadeStart = 0.82;
      if (local > fadeStart && idx < imgs.length - 1) {
        ctx.globalAlpha = (local - fadeStart) / (1 - fadeStart);
        try { ctx.drawImage(imgs[idx + 1], 0, 0, res[0], res[1]); } catch {}
        ctx.globalAlpha = 1;
      }
      // title overlay
      if (t < 1.8) {
        ctx.globalAlpha = t < 1.4 ? 1 : (1.8 - t) / 0.4;
        const g = ctx.createLinearGradient(0, 0, res[0], 0);
        g.addColorStop(0, '#6d5dfc'); g.addColorStop(1, '#35e0ff');
        ctx.fillStyle = g;
        ctx.font = `bold ${Math.round(res[0] * 0.055)}px Segoe UI, sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 18;
        ctx.fillText(title.slice(0, 42), res[0] / 2, res[1] / 2);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
      // watermark
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.font = `${Math.round(res[0] * 0.018)}px Segoe UI`;
      ctx.textAlign = 'right';
      ctx.fillText('⚡ Mega Power AI', res[0] - 16, res[1] - 14);
      bar.style.width = (60 + t / D * 38) + '%';
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });

  rec.stop();
  if (audioCtx) { oscs.forEach(o => { try { o.stop(); } catch {} }); audioCtx.close().catch(() => {}); }
  await done;
  if (signal.aborted) { btn.disabled = false; st.innerHTML = '<span class="pill warn">⏹ cancelled</span>'; return; }
  bar.style.width = '100%';
  const blob = new Blob(chunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  st.innerHTML = '<span class="pill ok">✅ Video ready</span>';
  out.querySelector('.video-out').innerHTML =
    `<video controls autoplay loop src="${url}"></video>
     <div class="row" style="padding:12px;justify-content:center">
       <button class="btn primary" id="vidDl">⬇️ Download video</button>
     </div>`;
  Mega.$('#vidDl').onclick = () => Mega.zip.save(blob, title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.webm');
  btn.disabled = false;
  Mega.toast('Video generated 🎬', (imgs.length * secPer) + 's · ' + res.join('x') + ' · ' + Mega.fmtBytes(blob.size), 'ok');
};

/* ================= VOICE ================= */
Mega.studio.speak = () => {
  const text = Mega.$('#voiceText').value.trim();
  if (!text) return Mega.toast('Write something', 'I will narrate any text aloud 🗣', 'warn');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const vs = speechSynthesis.getVoices();
  const sel = +Mega.$('#voiceSel').value;
  if (vs[sel]) u.voice = vs[sel];
  u.rate = +Mega.$('#voiceRate').value;
  u.pitch = +Mega.$('#voicePitch').value;
  u.volume = +Mega.$('#voiceVol').value;
  speechSynthesis.speak(u);
  Mega.toast('Speaking 🗣', vs[sel] ? vs[sel].name : 'Default voice', 'ai', 2000);
};
