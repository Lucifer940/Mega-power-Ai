/* ============================================================
   MEGA POWER AI — media.js  |  image & video generation
   Real in-browser video encoding (Canvas + MediaRecorder).
   Free, unlimited, and 100% watermark-free. Created by Umesh Chaudhary.
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.media = {};

Mega.media.videoPresets = {
  short:   { label: 'Short — 15s',  total: 15 },
  standard:{ label: 'Standard — 30s', total: 30 },
  long:    { label: 'Long — 60s',   total: 60 }
};

/* split a video prompt into scenes (by ; newline "then" or commas) */
Mega.media.scenes = (prompt, max = 8) => {
  let parts = prompt.split(/\n|;|\bthen\b|\band then\b/i)
    .map(s => s.trim()).filter(Boolean);
  if (parts.length === 1 && parts[0].length > 60) {
    parts = parts[0].split(/,\s*/).map(s => s.trim()).filter(s => s.length > 8);
  }
  if (!parts.length) parts = [prompt];
  return parts.slice(0, max);
};

/* ---------- single-image animation (image → video) ---------- */
Mega.media.imageToVideo = async (img, opts = {}) => {
  const dur = Math.min(60, Math.max(3, opts.duration || 10));
  const fps = opts.fps || 30;
  const motion = opts.motion || 'zoom-in';
  const music = opts.music !== false;
  const onProgress = opts.onProgress || (() => {});
  return await Mega.media._render([img], { title: '', dur, fps, motion, music, mode: 'single', onProgress, signal: opts.signal });
};

/* ---------- scenes → full video ---------- */
Mega.media.sceneVideo = async (scenePrompts, opts = {}) => {
  const fps = opts.fps || +Mega.settings.videoFps || 30;
  const res = (opts.res || Mega.settings.videoResolution || '1280x720').split('x').map(Number);
  const music = opts.music !== undefined ? opts.music : (Mega.settings.videoMusic !== false);
  const preset = opts.preset || Mega.settings.videoDuration || 'standard';
  const total = Mega.media.videoPresets[preset]?.total || 30;
  const secPer = Math.max(2, Math.round(total / scenePrompts.length));
  const onProgress = opts.onProgress || (() => {});
  const signal = opts.signal;

  onProgress({ phase: 'images', done: 0, total: scenePrompts.length });
  const imgs = [];
  for (let i = 0; i < scenePrompts.length; i++) {
    if (signal && signal.aborted) throw new DOMException('aborted', 'AbortError');
    onProgress({ phase: 'images', done: i, total: scenePrompts.length, current: scenePrompts[i] });
    const img = await Mega.ai.image.get(scenePrompts[i], { size: res[0] > res[1] ? '16:9' : (res[0] < res[1] ? '9:16' : '1:1'), style: opts.style });
    imgs.push(img);
  }
  return await Mega.media._render(imgs, {
    title: opts.title || '', dur: secPer * imgs.length, fps, res, motion: 'kenburns', music, mode: 'scenes', onProgress, signal
  });
};

/* ---------- shared renderer: Canvas + MediaRecorder ---------- */
Mega.media._render = async (imgs, o) => {
  const res = o.res || (o.mode === 'single' ? [1024, 1024] : [1280, 720]);
  const [W, H] = imgs.length === 1 && o.mode === 'single'
    ? [Math.min(1280, imgs[0].naturalWidth || 1024), Math.min(1280, imgs[0].naturalHeight || 1024)]
    : res;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const stream = canvas.captureStream(o.fps);
  let audioCtx, oscs = [];
  if (o.music) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const g = audioCtx.createGain(); g.gain.value = 0.045;
      [130.8, 164.8, 196.0, 261.6].forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        osc.type = i % 2 ? 'sine' : 'triangle'; osc.frequency.value = f;
        const g2 = audioCtx.createGain(); g2.gain.value = 0.25;
        osc.connect(g2); g2.connect(g); osc.start(); oscs.push(osc);
      });
      g.connect(dest);
      dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    } catch {}
  }
  let rec;
  try {
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || '';
    rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 5_000_000 } : undefined);
  } catch (err) {
    if (audioCtx) audioCtx.close().catch(() => {});
    throw new Error('This browser cannot record video (try Chrome / Edge)');
  }
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise(r => rec.onstop = r);
  rec.start(200);
  o.onProgress({ phase: 'render', pct: 0 });
  const D = o.dur;
  const t0 = performance.now();
  await new Promise((resolve) => {
    const frame = () => {
      const t = (performance.now() - t0) / 1000;
      if ((o.signal && o.signal.aborted) || t >= D) return resolve();
      const n = imgs.length;
      const idx = Math.min(n - 1, Math.floor(t / (D / n)));
      const local = n > 1 ? (t - idx * (D / n)) / (D / n) : t / D;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      const drawImage = (image, scale, dx) => {
        const iw = W * scale, ih = H * scale;
        try { ctx.drawImage(image, (W - iw) / 2 + dx, (H - ih) / 2, iw, ih); } catch {}
      };
      if (o.mode === 'single') {
        if (o.motion === 'zoom-out') drawImage(imgs[0], 1.25 - 0.2 * local, 0);
        else if (o.motion === 'pan-left') { const s = 1.18; drawImage(imgs[0], s, 40 - 80 * local); }
        else if (o.motion === 'pan-right') { const s = 1.18; drawImage(imgs[0], s, -40 + 80 * local); }
        else if (o.motion === 'rotate') {
          ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate((local - 0.5) * 0.12);
          const s = 1.2; ctx.drawImage(imgs[0], -W * s / 2, -H * s / 2, W * s, H * s); ctx.restore();
        } else drawImage(imgs[0], 1.02 + 0.2 * local, 0); // zoom-in
      } else {
        const dir = idx % 2 ? -1 : 1;
        drawImage(imgs[idx], 1.04 + 0.1 * local * dir + (dir < 0 ? 0.14 : 0), 26 * dir * local);
        const fadeStart = 0.82;
        if (local > fadeStart && idx < n - 1) {
          ctx.globalAlpha = (local - fadeStart) / (1 - fadeStart);
          try { ctx.drawImage(imgs[idx + 1], 0, 0, W, H); } catch {}
          ctx.globalAlpha = 1;
        }
      }
      if (o.title && t < 1.8 && o.mode !== 'single') {
        ctx.globalAlpha = t < 1.4 ? 1 : (1.8 - t) / 0.4;
        const g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, '#6d5dfc'); g.addColorStop(1, '#35e0ff');
        ctx.fillStyle = g;
        ctx.font = `bold ${Math.round(W * 0.055)}px Segoe UI, sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 18;
        ctx.fillText(o.title.slice(0, 42), W / 2, H / 2);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
      // NOTE: no watermark — nothing is drawn on top of your video
      o.onProgress({ phase: 'render', pct: Math.round(t / D * 100) });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  rec.stop();
  if (audioCtx) { oscs.forEach(x => { try { x.stop(); } catch {} }); audioCtx.close().catch(() => {}); }
  await done;
  if (o.signal && o.signal.aborted) throw new DOMException('aborted', 'AbortError');
  const blob = new Blob(chunks, { type: 'video/webm' });
  o.onProgress({ phase: 'done', pct: 100 });
  return { blob, url: URL.createObjectURL(blob), duration: D, width: W, height: H, size: blob.size };
};

Mega.media.dl = (url, name) => {
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
};
Mega.media.dlBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  Mega.media.dl(url, name);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

/* ---------- voice (kept from Studio) ---------- */
Mega.media.speak = (text, o = {}) => {
  if (!('speechSynthesis' in window)) return Mega.toast('Voice not supported', 'This device has no speech engine.', 'warn');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.slice(0, 5000));
  const vs = speechSynthesis.getVoices();
  if (o.voice != null && vs[o.voice]) u.voice = vs[o.voice];
  u.rate = o.rate || 1; u.pitch = o.pitch || 1; u.volume = o.volume || 1;
  speechSynthesis.speak(u);
};
