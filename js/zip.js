/* ============================================================
   MEGA POWER AI — zip.js  |  zero-dependency ZIP writer (STORE)
   Creates real .zip archives fully in the browser.
   ============================================================ */
'use strict';
window.Mega = window.Mega || {};
Mega.zip = (() => {
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  const crc32 = (bytes) => {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  };
  const enc = (s) => new TextEncoder().encode(s);
  const dosTime = (d) => ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2)) & 0xFFFF;
  const dosDate = (d) => (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;

  /**
   * files: [{ path, data (string | Uint8Array | ArrayBuffer) }]
   * returns Blob (application/zip)
   */
  const create = (files) => {
    const enc2 = new TextEncoder();
    const chunks = [];       // all local parts
    const central = [];      // central directory records
    let offset = 0;
    const now = new Date();
    const seen = new Set();
    const norm = [];
    // auto-add parent folders
    for (const f of files) {
      const parts = f.path.split('/').filter(Boolean);
      let acc = '';
      for (let i = 0; i < parts.length - 1; i++) { acc += parts[i] + '/'; if (!seen.has(acc)) { seen.add(acc); norm.push({ path: acc, data: '' }); } }
      if (!seen.has(f.path)) { seen.add(f.path); norm.push(f); } else norm.push(f);
    }
    for (const f of norm) {
      const nameB = enc2.encode(f.path);
      let dataB;
      if (f.data == null) dataB = new Uint8Array(0);
      else if (typeof f.data === 'string') dataB = enc2.encode(f.data);
      else if (f.data instanceof ArrayBuffer) dataB = new Uint8Array(f.data);
      else dataB = new Uint8Array(f.data.buffer || f.data);
      const crc = crc32(dataB);
      const isDir = f.path.endsWith('/');
      const local = new Uint8Array(30 + nameB.length);
      const dv = new DataView(local.buffer);
      dv.setUint32(0, 0x04034b50, true);
      dv.setUint16(4, 20, true);          // version
      dv.setUint16(6, 0x0800, true);      // UTF-8 flag
      dv.setUint16(8, 0, true);           // method STORE
      dv.setUint16(10, dosTime(now), true);
      dv.setUint16(12, dosDate(now), true);
      dv.setUint32(14, crc, true);
      dv.setUint32(18, dataB.length, true);
      dv.setUint32(22, dataB.length, true);
      dv.setUint16(26, nameB.length, true);
      dv.setUint16(28, 0, true);
      local.set(nameB, 30);
      chunks.push(local, dataB);
      const cd = new Uint8Array(46 + nameB.length);
      const cv = new DataView(cd.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime(now), true);
      cv.setUint16(14, dosDate(now), true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, dataB.length, true);
      cv.setUint32(24, dataB.length, true);
      cv.setUint16(28, nameB.length, true);
      cv.setUint32(42, offset, true);
      cd.set(nameB, 46);
      central.push(cd);
      offset += local.length + dataB.length;
    }
    const cdSize = central.reduce((a, c) => a + c.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, central.length, true);
    ev.setUint16(10, central.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, offset, true);
    return new Blob([...chunks, ...central, eocd], { type: 'application/zip' });
  };

  const save = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return { create, save, crc32 };
})();
