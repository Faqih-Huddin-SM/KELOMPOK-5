(() => {
'use strict';

/* ============ PENGATURAN ============ */
const BASE = '/KELOMPOK-5/';
const REFRESH_MS = 5 * 60 * 1000;          // pembaruan otomatis 5 menit
const API_BARBER  = 'api/barber/publik.php';   // -> data: [{nama, spesialisasi, foto}]
const API_LAYANAN = 'api/layanan/publik.php';  // -> data: [{nama_layanan, harga}]
const MSG_429 = 'Terlalu banyak permintaan. Silakan coba lagi sebentar lagi';

/* ====== FOTO CAROUSEL HERO ======
   Mau tambah foto? Copy satu baris lalu ganti nama file-nya.
   File ada di KELOMPOK-5/assets/img/. Jumlah titik (dots) otomatis mengikuti. */
const HERO_SLIDES = [
  { src: 'assets/img/kosongan.png',       alt: 'Foto Kataji 1' },
  { src: 'assets/img/suasana_barber.png', alt: 'Suasana barbershop Kataji' },
  // { src: 'assets/img/NAMA_FILE.png',   alt: 'Deskripsi foto' },
];

/* ============ UTIL ============ */
const $ = (s) => document.querySelector(s);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const rupiah = (n) => 'Rp ' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function ambil(path) {
  const r = await fetch(BASE + path, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  let b = null; try { b = await r.json(); } catch (e) {}
  if (!r.ok || !b || !Array.isArray(b.data)) {
    const err = new Error((b && b.message) || ''); err.status = r.status; throw err;
  }
  return b.data;
}
const pesanGagal = (err, bawaan) => (err.status === 429 ? (err.message || MSG_429) : bawaan);

/* ============ MENU ============ */
const burger = $('#burger'), menu = $('#menu');
burger.addEventListener('click', () => {
  const buka = menu.classList.toggle('buka'); burger.setAttribute('aria-expanded', buka);
});
menu.addEventListener('click', (e) => {
  if (e.target.tagName !== 'A') return;
  menu.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a === e.target));
  menu.classList.remove('buka'); burger.setAttribute('aria-expanded', false);
});

/* ============ HERO CAROUSEL ============ */
(() => {
  const wadah = $('#slides'), dots = $('#heroDots'); let i = 0, timer;
  const ikon = '<svg viewBox="0 0 24 24" fill="none" stroke="#8D90D8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M4 18l5-4 4 3 3-2 4 3"/></svg>';
  HERO_SLIDES.forEach((s, n) => {
    const d = el('div', 'slide' + (n ? '' : ' on'));
    d.innerHTML = ikon; d.append(el('span', '', 'Foto carousel ' + (n + 1) + ' · isi dengan foto Kataji'));
    const im = new Image(); im.alt = s.alt || ''; im.src = BASE + s.src;
    im.onload = () => { d.querySelector('svg').style.display = 'none'; d.querySelector('span').style.display = 'none'; d.prepend(im); };
    wadah.append(d);
    const b = el('button'); b.setAttribute('aria-label', 'Foto ' + (n + 1)); b.onclick = () => ke(n, true); dots.append(b);
  });
  const sl = wadah.children, dt = dots.children;
  function ke(n, manual) {
    i = (n + sl.length) % sl.length;
    [...sl].forEach((s, k) => s.classList.toggle('on', k === i)); [...dt].forEach((d, k) => d.classList.toggle('on', k === i));
    if (manual) mulai();
  }
  function mulai() { clearInterval(timer); if (sl.length > 1 && !reduce) timer = setInterval(() => ke(i + 1), 6000); }
  $('#heroPrev').onclick = () => ke(i - 1, true); $('#heroNext').onclick = () => ke(i + 1, true);
  if (sl.length < 2) { $('#heroPrev').hidden = $('#heroNext').hidden = true; }
  ke(0); mulai();
})();

/* ============ BARBER: carousel 3D (geser pakai tangan; desktop = rata) ============ */
const panggung = $('#panggung'), petunjuk = $('#petunjuk');
const desktop = matchMedia('(min-width: 900px)');
let kartu = [], pos = 0;                     // pos = posisi kartu di tengah (boleh pecahan saat digeser)
const mod = (a, n) => ((a % n) + n) % n;

function tagSpesialisasi(teks) {          // pisah "dan" (kata utuh) atau koma
  const lihat = new Set(), hasil = [];
  String(teks || '').split(/\s+dan\s+|,/i).forEach((t) => {
    t = t.trim(); const k = t.toLowerCase();
    if (t && !lihat.has(k)) { lihat.add(k); hasil.push(t); }
  });
  return hasil;
}
function buatKartu(b) {
  const k = el('article', 'kb'), foto = el('div', 'foto');
  const mono = () => { foto.replaceChildren(el('div', 'mono', (b.nama || '?').trim().charAt(0).toUpperCase())); };
  if (b.foto) { const im = new Image(); im.alt = 'Foto ' + b.nama; im.draggable = false; im.onerror = mono; im.src = BASE + b.foto; foto.append(im); } else mono();
  const bw = el('div', 'bawah'), tags = tagSpesialisasi(b.spesialisasi), h = el('h3', '', b.nama);
  h.title = b.nama; bw.append(h);
  if (tags.length) { const t = el('div', 'tags'); tags.forEach((x) => { const s = el('span', '', x); s.title = x; t.append(s); }); bw.append(t); }
  else bw.append(el('p', 'kosong', 'Spesialisasi belum diisi'));
  k.append(foto, bw); return k;
}
function posisi() {
  const n = kartu.length;
  kartu.forEach((k, i) => {
    let d = i - pos; if (n > 2) d = mod(d + n / 2, n) - n / 2;
    const a = Math.abs(d);
    k.style.transform = `translate(-50%,-50%) translateX(${d * 64}%) translateZ(${-a * 110}px) rotateY(${-d * 34}deg) scale(${1 - a * .07})`;
    k.style.zIndex = Math.round(10 - a); k.style.opacity = a > 2 ? 0 : 1 - a * .22; k.style.pointerEvents = a > 2 ? 'none' : 'auto';
    k.classList.toggle('aktif', a < .5);
  });
}
let x0 = null, p0 = 0, geserSudah = false, alvo = null, step = 1;
const batas = (v) => (kartu.length <= 2 ? Math.min(Math.max(v, 0), kartu.length - 1) : v);
panggung.addEventListener('pointerdown', (e) => {
  if (desktop.matches || kartu.length < 2) return;
  x0 = e.clientX; p0 = pos; geserSudah = false; alvo = e.target.closest('.kb'); step = kartu[0].offsetWidth * .64;
  panggung.setPointerCapture(e.pointerId);
});
panggung.addEventListener('pointermove', (e) => {
  if (x0 == null) return; const dx = e.clientX - x0;
  if (!geserSudah && Math.abs(dx) > 6) { geserSudah = true; panggung.classList.add('menggeser'); }
  if (geserSudah) { pos = batas(p0 - dx / step); posisi(); }
});
const lepas = () => {
  if (x0 == null) return; x0 = null; panggung.classList.remove('menggeser');
  if (geserSudah) pos = batas(Math.round(pos));
  else if (alvo) { const i = kartu.indexOf(alvo); let d = i - pos; if (kartu.length > 2) d = mod(d + kartu.length / 2, kartu.length) - kartu.length / 2; pos = batas(Math.round(pos + d)); }
  posisi();
};
panggung.addEventListener('pointerup', lepas); panggung.addEventListener('pointercancel', lepas);
panggung.addEventListener('keydown', (e) => {
  if (kartu.length < 2) return;
  if (e.key === 'ArrowLeft') { pos = batas(Math.round(pos) - 1); posisi(); }
  if (e.key === 'ArrowRight') { pos = batas(Math.round(pos) + 1); posisi(); }
});

function tampilBarber(data) {
  const nama = kartu.length ? kartu[mod(Math.round(pos), kartu.length)].querySelector('h3').textContent : null;
  const urut = data.filter((b) => b && b.nama).sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));
  panggung.replaceChildren();
  if (!urut.length) return pesanBarber('Belum ada barber yang ditampilkan');
  kartu = urut.map(buatKartu); panggung.append(...kartu);
  const idx = urut.findIndex((b) => b.nama === nama); pos = idx >= 0 ? idx : 0;
  petunjuk.hidden = kartu.length < 2; posisi();
}
function pesanBarber(t) { kartu = []; panggung.replaceChildren(el('p', 'pesan', t)); petunjuk.hidden = true; }

/* ============ LAYANAN + animasi gunting zigzag ============ */
const layanan = $('#layanan'), gap = $('#gap'), daftar = $('#daftarLayanan');
const seam = $('.seam'), garis = $('#garis'), gunting = $('.gunting');
let terbuka = false, sudahPotong = false;
/* Garis potong = tepi atas kertas sobek (sama dengan bentuk tepi di desain), jadi hasil potongan cocok */
const Z = [[0,1242.9],[40.9,1241.4],[93.1,1248.3],[151.6,1239.5],[183.2,1232.7],[233.8,1243.6],[282,1245.5],[328.4,1244.1],[352.8,1242.2],[373.9,1244.1],[390,1233.1]];
garis.setAttribute('points', Z.map((p) => p.join(',')).join(' '));

function titik(t) {                          // t 0..1 -> posisi (px) dan sudut gunting di sepanjang zigzag
  const r = seam.getBoundingClientRect(), sx = r.width / 390, sy = r.height / 22, X = t * 390;
  let i = 0; while (i < Z.length - 2 && X > Z[i + 1][0]) i++;
  const [x1, y1] = Z[i], [x2, y2] = Z[i + 1], y = y1 + (y2 - y1) * ((X - x1) / (x2 - x1));
  return { x: X * sx, y: (y - 1232) * sy, a: Math.atan2((y2 - y1) * sy, (x2 - x1) * sx) * 180 / Math.PI };
}
function tinggiBuka() {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const isi = layanan.querySelector('.kepala').offsetHeight + daftar.scrollHeight + .6 * rem;
  return Math.min(isi, innerHeight * .62, 26 * rem) + 1.4 * rem + 2.9 * rem;   // + tepi atas + tepi bawah
}
function atur() { if (terbuka) gap.style.height = tinggiBuka() + 'px'; }
function potong() {
  if (sudahPotong) return; sudahPotong = true;
  const buka = () => { terbuka = true; layanan.classList.add('selesai'); atur(); };
  if (reduce) { garis.parentNode.style.clipPath = 'none'; buka(); return; }
  layanan.classList.add('potong');
  const g = gunting.getBoundingClientRect(), px = g.width * .42, py = g.height * .5, dur = 2800, t0 = performance.now();
  (function langkah(now) {
    const t = Math.min((now - t0) / dur, 1), p = titik(t);
    gunting.style.transform = `translate(${p.x - px}px,${p.y - py}px) rotate(${p.a}deg)`;
    garis.parentNode.style.clipPath = `inset(-10px ${(1 - t) * 100}% -10px 0)`;
    if (t < 1) requestAnimationFrame(langkah); else setTimeout(buka, 250);
  })(t0);
}
new IntersectionObserver((es, ob) => {
  if (es.some((e) => e.isIntersecting)) { ob.disconnect(); potong(); }
}, { rootMargin: '-40% 0px -40% 0px' }).observe(layanan);
addEventListener('resize', atur);

function tampilLayanan(data) {
  const y = daftar.scrollTop; daftar.replaceChildren();
  const ada = data.filter((l) => l && l.nama_layanan);
  if (!ada.length) daftar.append(el('li', 'pesan', 'Daftar layanan belum tersedia'));
  ada.forEach((l) => { const li = el('li'); li.append(el('b', '', l.nama_layanan), el('span', 'harga', rupiah(l.harga))); daftar.append(li); });
  daftar.scrollTop = y; atur();
}
function pesanLayanan(t) { daftar.replaceChildren(el('li', 'pesan', t)); atur(); }

/* ============ MUAT + PEMBARUAN OTOMATIS ============ */
const terakhir = { barber: null, layanan: null };
async function muat() {
  const tugas = [
    [API_BARBER, 'barber', tampilBarber, pesanBarber, 'Data barber gagal dimuat. Silakan coba lagi'],
    [API_LAYANAN, 'layanan', tampilLayanan, pesanLayanan, 'Daftar layanan gagal dimuat. Silakan coba lagi'],
  ];
  await Promise.all(tugas.map(async ([path, kunci, tampil, galat, teks]) => {
    try {
      const data = await ambil(path), s = JSON.stringify(data);
      if (s !== terakhir[kunci]) { terakhir[kunci] = s; tampil(data); }     // tidak render ulang kalau sama
    } catch (err) {
      if (terakhir[kunci] === null) galat(pesanGagal(err, teks));            // data lama dipertahankan bila gagal
    }
  }));
}
const loader = $('#loader');
let loaderTutup = false;
function tutupLoader() {
  if (loaderTutup || !loader) return; loaderTutup = true;
  loader.classList.add('hilang'); document.body.classList.remove('memuat');
  setTimeout(() => loader.remove(), 700);
}
const siapLoad = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r)));
const minTampil = new Promise((r) => setTimeout(r, 1600));           // animasi sempat terlihat
Promise.all([muat(), siapLoad, minTampil]).then(tutupLoader);
setTimeout(tutupLoader, 9000);                                        // pengaman bila ada yang macet
setInterval(muat, REFRESH_MS);
})();
