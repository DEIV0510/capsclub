// Optimización de imágenes CAPS CLUB AXM -> WebP responsive
// Fuente real: C:\Users\Lenovo\Desktop\capsclub (logo.png + gorras.png, únicas 2 imágenes del cliente)
// Estrategia: la carpeta del cliente solo trae UNA foto de producto (3 gorras en vitrina).
// Para poblar todas las secciones sin inventar productos ni usar stock genérico,
// se generan múltiples encuadres/zooms REALES de esa misma foto (técnica editorial).
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_DIR = 'C:\\Users\\Lenovo\\Desktop\\capsclub';
const GORRAS = path.join(SRC_DIR, 'gorras.png');
const LOGO = path.join(SRC_DIR, 'logo.png');
const OUT_IMG = path.join(__dirname, 'assets', 'img');
const OUT_LOGO = path.join(__dirname, 'assets', 'logo');

fs.mkdirSync(OUT_IMG, { recursive: true });
fs.mkdirSync(OUT_LOGO, { recursive: true });

const WEBP = { effort: 6, smartSubsample: true };

// left, top, width, height sobre el original 692x900
const CROPS = {
  'hero':            { box: [0, 0, 692, 900],        w: 1000, q: 92, enlarge: false },
  'hero-desktop':     { box: [0, 210, 692, 690],       w: 1100, q: 92, enlarge: false },
  'producto-verde':   { box: [8, 330, 232, 480],       w: 800,  q: 92, enlarge: true },
  'producto-negra':   { box: [222, 250, 282, 530],     w: 800,  q: 92, enlarge: true },
  'producto-beige':   { box: [436, 328, 250, 482],     w: 800,  q: 92, enlarge: true },
  'cat-urbanas':      { box: [258, 296, 224, 300],     w: 700,  q: 90, enlarge: true },
  'cat-deportivas':   { box: [36, 348, 204, 282],      w: 700,  q: 90, enlarge: true },
  'cat-nuevos':       { box: [458, 348, 204, 282],     w: 700,  q: 90, enlarge: true },
  'cat-negocio':      { box: [0, 268, 692, 500],       w: 1000, q: 90, enlarge: false },
  'gallery-grupo':    { box: [50, 330, 592, 560],      w: 1000, q: 92, enlarge: false },
  'gallery-detalle':  { box: [258, 366, 268, 268],     w: 800,  q: 88, enlarge: true },
  'gallery-verde':    { box: [0, 296, 280, 566],       w: 800,  q: 92, enlarge: false },
  'gallery-beige':    { box: [408, 296, 284, 566],     w: 800,  q: 92, enlarge: false },
  'gallery-negra':    { box: [186, 214, 322, 632],     w: 800,  q: 92, enlarge: false },
  'gallery-reflejo':  { box: [0, 512, 692, 236],       w: 1000, q: 88, enlarge: false },
  'mayorista-bg':     { box: [0, 140, 692, 760],       w: 1000, q: 90, enlarge: false },
  'cta-bg':           { box: [0, 190, 692, 710],       w: 1000, q: 90, enlarge: false },
};

async function crops() {
  for (const [name, cfg] of Object.entries(CROPS)) {
    const [left, top, width, height] = cfg.box;
    const full = sharp(GORRAS).extract({ left, top, width, height });

    await full.clone()
      .resize({ width: cfg.w, withoutEnlargement: !cfg.enlarge })
      .webp({ quality: cfg.q, ...WEBP })
      .toFile(path.join(OUT_IMG, name + '.webp'));

    // versión móvil ligera (ancho menor) para las que van full-bleed de fondo
    if (cfg.w >= 900) {
      await full.clone()
        .resize({ width: 640, withoutEnlargement: !cfg.enlarge })
        .webp({ quality: cfg.q - 2, ...WEBP })
        .toFile(path.join(OUT_IMG, name + '-640.webp'));
    }
    console.log('crop OK ->', name);
  }
}

async function logo() {
  const trimmed = await sharp(LOGO).trim({ threshold: 8 }).toBuffer();
  const m = await sharp(trimmed).metadata();

  await sharp(trimmed).resize({ width: 640 }).webp({ quality: 95, ...WEBP }).toFile(path.join(OUT_LOGO, 'logo-640.webp'));
  await sharp(trimmed).resize({ width: 1200 }).png().toFile(path.join(OUT_LOGO, 'logo-1200.png'));
  await sharp(trimmed).resize({ width: 360 }).png().toFile(path.join(OUT_LOGO, 'logo-360.png'));

  // favicon / apple-touch / OG: el wordmark es muy ancho, se centra en lienzo cuadrado/rect oscuro
  const pad = Math.round(m.height * 0.35);
  const sq = Math.max(m.width, m.height) + pad * 2;
  await sharp({ create: { width: sq, height: sq, channels: 4, background: '#0a0a0a' } })
    .composite([{ input: await sharp(trimmed).resize({ width: sq - pad * 2 }).toBuffer(), gravity: 'center' }])
    .png().toFile(path.join(OUT_LOGO, 'icon-1024.png'));

  for (const size of [512, 192, 48]) {
    await sharp(path.join(OUT_LOGO, 'icon-1024.png')).resize(size, size).png().toFile(path.join(OUT_LOGO, `icon-${size}.png`));
  }
  fs.copyFileSync(path.join(OUT_LOGO, 'icon-192.png'), path.join(OUT_LOGO, 'apple-touch-icon.png'));

  console.log('logo OK -> recorte', m.width + 'x' + m.height);
}

async function ogImage() {
  const base = await sharp(GORRAS)
    .extract({ left: 0, top: 200, width: 692, height: 692 })
    .resize({ width: 1200, height: 1200 })
    .toBuffer();

  const gradient = Buffer.from(
    `<svg width="1200" height="630"><defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0.3">
      <stop offset="0" stop-color="#000" stop-opacity="0.92"/><stop offset="1" stop-color="#000" stop-opacity="0.15"/>
    </linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>`
  );

  const logoBuf = await sharp(path.join(OUT_LOGO, 'logo-1200.png')).resize({ width: 480 }).toBuffer();

  await sharp(base)
    .extract({ left: 0, top: 285, width: 1200, height: 630 })
    .composite([{ input: gradient, top: 0, left: 0 }, { input: logoBuf, left: 60, top: 430 }])
    .jpeg({ quality: 88 })
    .toFile(path.join(OUT_IMG, 'og-image.jpg'));
  console.log('OG image OK');
}

async function run() {
  await logo();
  await crops();
  await ogImage();

  const files = fs.readdirSync(OUT_IMG).concat(fs.readdirSync(OUT_LOGO).map(f => f));
  let total = 0;
  for (const f of fs.readdirSync(OUT_IMG)) total += fs.statSync(path.join(OUT_IMG, f)).size;
  for (const f of fs.readdirSync(OUT_LOGO)) total += fs.statSync(path.join(OUT_LOGO, f)).size;
  console.log(`\nArchivos: ${files.length}  |  Peso total: ${(total / 1024 / 1024).toFixed(2)} MB`);
}

run().catch(e => { console.error(e); process.exit(1); });
