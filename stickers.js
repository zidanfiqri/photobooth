/* Atribut (stiker) bawaan — semua ilustrasi orisinal (SVG), bebas dipakai.
   {{A}} = warna aksen, {{A2}} = aksen gelap, {{L}} = aksen terang → ikut warna tema acara.
   kind 'text' digambar dengan font aplikasi (lihat app.js › textSticker). */
window.PB_STICKERS = {
  packs: [
    { id: 'elegan', name: 'Elegan' },
    { id: 'floral', name: 'Floral' },
    { id: 'lucu', name: 'Lucu' },
    { id: 'teks', name: 'Teks' },
    { id: 'kustom', name: 'Kustom' },
  ],
  items: [
    /* ---------------- ELEGAN ---------------- */
    { id: 'rings', pack: 'elegan', name: 'Cincin', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <g fill="none" stroke-width="11"><circle cx="122" cy="120" r="46" stroke="{{A2}}"/><circle cx="78" cy="120" r="46" stroke="{{A}}"/>
      <path d="M110.1 164.4 A46 46 0 0 1 91.2 154.2" stroke="{{A2}}"/></g>
      <polygon points="78,40 94,58 78,80 62,58" fill="#eef7ff" stroke="{{A}}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M62 58h32M78 40l-6 18 6 22 6-22z" fill="none" stroke="#b7d4ee" stroke-width="2"/>
      <path d="M150 34l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="{{L}}"/></svg>` },
    { id: 'heart_gold', pack: 'elegan', name: 'Hati emas', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{{L}}"/><stop offset="1" stop-color="{{A2}}"/></linearGradient></defs>
      <path d="M100 176C38 132 16 98 28 64 40 32 82 28 100 60 118 28 160 32 172 64 184 98 162 132 100 176Z" fill="url(#g)" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>
      <path d="M56 70c6-14 22-19 33-10" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".75"/></svg>` },
    { id: 'hearts_duo', pack: 'elegan', name: 'Dua hati', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M78 150C36 120 22 96 30 72 38 50 66 47 78 68 90 47 118 50 126 72 134 96 120 120 78 150Z" fill="none" stroke="{{A}}" stroke-width="9" stroke-linejoin="round"/>
      <path d="M126 168C88 140 76 118 83 96 90 76 115 73 126 92 137 73 162 76 169 96 176 118 164 140 126 168Z" fill="#f2b8c3" fill-opacity=".85" stroke="#e07a90" stroke-width="7" stroke-linejoin="round"/></svg>` },
    { id: 'dove', pack: 'elegan', name: 'Merpati', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 200">
      <path d="M36 126C58 94 108 84 140 98 154 88 170 84 184 86 174 94 166 102 162 112 152 140 110 154 70 144 54 154 38 158 18 155 30 148 36 138 36 126Z" fill="#fff" stroke="{{A}}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M84 116C94 72 130 46 168 40 152 62 142 88 118 112Z" fill="#fff" stroke="{{A}}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M104 92c10-14 24-24 38-30M98 104c12-12 28-22 44-26" fill="none" stroke="{{L}}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="154" cy="98" r="4.5" fill="{{A2}}"/><path d="M182 88l16 2-14 8z" fill="{{A}}"/>
      <path d="M200 58c-6-8-16-4-12 4l12 12 12-12c4-8-6-12-12-4z" fill="#e5768c"/></svg>` },
    { id: 'crown', pack: 'elegan', name: 'Tiara', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 170">
      <path d="M28 132L38 58 74 98 100 40 126 98 162 58 172 132Z" fill="{{A}}" stroke="{{A2}}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="26" y="128" width="148" height="24" rx="7" fill="{{A2}}"/>
      <circle cx="38" cy="54" r="10" fill="#fff" stroke="{{A2}}" stroke-width="3"/><circle cx="100" cy="34" r="12" fill="#fff" stroke="{{A2}}" stroke-width="3"/><circle cx="162" cy="54" r="10" fill="#fff" stroke="{{A2}}" stroke-width="3"/>
      <circle cx="100" cy="110" r="11" fill="#e5768c"/><circle cx="64" cy="118" r="7" fill="#8ec1ea"/><circle cx="136" cy="118" r="7" fill="#8ec1ea"/>
      <circle cx="60" cy="140" r="4" fill="#fff"/><circle cx="100" cy="140" r="4" fill="#fff"/><circle cx="140" cy="140" r="4" fill="#fff"/></svg>` },
    { id: 'sparkles', pack: 'elegan', name: 'Kilau', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M100 18C106 70 130 94 182 100 130 106 106 130 100 182 94 130 70 106 18 100 70 94 94 70 100 18Z" fill="{{A}}"/>
      <path d="M160 20C162 40 170 48 190 50 170 52 162 60 160 80 158 60 150 52 130 50 150 48 158 40 160 20Z" fill="{{L}}"/>
      <path d="M42 136C44 152 50 158 66 160 50 162 44 168 42 184 40 168 34 162 18 160 34 158 40 152 42 136Z" fill="{{L}}"/></svg>` },
    { id: 'letter', pack: 'elegan', name: 'Surat cinta', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 170">
      <rect x="14" y="30" width="192" height="126" rx="12" fill="#fffaf0" stroke="{{A}}" stroke-width="6"/>
      <path d="M18 150L88 94M202 150L132 94" stroke="{{L}}" stroke-width="5" stroke-linecap="round"/>
      <path d="M20 40l90 66 90-66" fill="none" stroke="{{A}}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M110 130c-22-15-31-27-27-39 3-10 18-12 27 0 9-12 24-10 27 0 4 12-5 24-27 39z" fill="#e0445f" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
      <path d="M176 14l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="{{A}}"/></svg>` },
    { id: 'cake', pack: 'elegan', name: 'Kue', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect x="38" y="128" width="124" height="46" rx="9" fill="#fff" stroke="{{A}}" stroke-width="5"/>
      <rect x="54" y="90" width="92" height="40" rx="9" fill="#fff" stroke="{{A}}" stroke-width="5"/>
      <rect x="70" y="56" width="60" height="36" rx="9" fill="#fff" stroke="{{A}}" stroke-width="5"/>
      <path d="M44 150h112M60 110h80M76 74h48" stroke="{{A}}" stroke-width="6" stroke-dasharray="1 11" stroke-linecap="round"/>
      <path d="M100 52C84 40 90 24 100 33 110 24 116 40 100 52Z" fill="#e5768c"/>
      <rect x="26" y="172" width="148" height="9" rx="4.5" fill="{{A2}}"/></svg>` },
    { id: 'flourish', pack: 'elegan', name: 'Ornamen', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 90">
      <g fill="none" stroke="{{A}}" stroke-width="4" stroke-linecap="round">
      <path d="M140 45H40c-18 0-26-18-14-26 10-7 24 2 18 12-4 6-14 4-14-2"/><path d="M180 45h100c18 0 26-18 14-26-10-7-24 2-18 12 4 6 14 4 14-2"/>
      <path d="M140 45c-14 0-22 14-12 22 8 6 18-2 14-10"/><path d="M180 45c14 0 22 14 12 22-8 6-18-2-14-10"/></g>
      <path d="M160 26l12 19-12 19-12-19z" fill="{{A}}"/><circle cx="160" cy="45" r="4" fill="#fff"/></svg>` },

    /* ---------------- FLORAL ---------------- */
    { id: 'rose', pack: 'floral', name: 'Mawar', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M72 148C60 176 38 180 26 170 42 160 52 150 72 148Z" fill="#7aa874"/><path d="M128 148C140 176 162 180 174 170 158 160 148 150 128 148Z" fill="#6c9a66"/>
      <circle cx="100" cy="96" r="60" fill="#e98fa1"/>
      <path d="M58 92c-6 30 20 56 46 54s44-24 38-50" fill="none" stroke="#cf6680" stroke-width="7" stroke-linecap="round"/>
      <path d="M100 58c30 0 42 30 22 46-15 12-38 3-36-13 2-13 16-15 20-5" fill="none" stroke="#b9506b" stroke-width="7" stroke-linecap="round"/>
      <path d="M70 70c10-16 34-22 52-12" fill="none" stroke="#f5b3c0" stroke-width="6" stroke-linecap="round"/></svg>` },
    { id: 'flower5', pack: 'floral', name: 'Bunga', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g transform="translate(100 100)">
      <g fill="#f6bccb" stroke="#e48aa2" stroke-width="3"><ellipse rx="27" ry="46" cy="-44"/><ellipse rx="27" ry="46" cy="-44" transform="rotate(72)"/>
      <ellipse rx="27" ry="46" cy="-44" transform="rotate(144)"/><ellipse rx="27" ry="46" cy="-44" transform="rotate(216)"/><ellipse rx="27" ry="46" cy="-44" transform="rotate(288)"/></g>
      <circle r="24" fill="#f7d77e" stroke="#e2b54e" stroke-width="3"/><circle r="6" cx="-7" cy="-6" fill="#fff" opacity=".6"/></g></svg>` },
    { id: 'daisy', pack: 'floral', name: 'Aster', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g transform="translate(100 100)" fill="#fff" stroke="#d9d2c4" stroke-width="2.5">
      <ellipse rx="13" ry="44" cy="-46"/><ellipse rx="13" ry="44" cy="-46" transform="rotate(30)"/><ellipse rx="13" ry="44" cy="-46" transform="rotate(60)"/><ellipse rx="13" ry="44" cy="-46" transform="rotate(90)"/>
      <ellipse rx="13" ry="44" cy="-46" transform="rotate(120)"/><ellipse rx="13" ry="44" cy="-46" transform="rotate(150)"/><ellipse rx="13" ry="44" cy="-46" transform="rotate(180)"/><ellipse rx="13" ry="44" cy="-46" transform="rotate(210)"/>
      <ellipse rx="13" ry="44" cy="-46" transform="rotate(240)"/><ellipse rx="13" ry="44" cy="-46" transform="rotate(270)"/><ellipse rx="13" ry="44" cy="-46" transform="rotate(300)"/><ellipse rx="13" ry="44" cy="-46" transform="rotate(330)"/>
      <circle r="24" fill="#f3c94f" stroke="#dba83a" stroke-width="3"/></g></svg>` },
    { id: 'leaf_branch', pack: 'floral', name: 'Daun', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M30 180C70 140 110 90 170 22" fill="none" stroke="#6f8f6a" stroke-width="5" stroke-linecap="round"/>
      <g fill="#9cbf96" stroke="#6f8f6a" stroke-width="2.5"><circle cx="52" cy="150" r="17"/><circle cx="78" cy="152" r="14"/><circle cx="74" cy="120" r="16"/><circle cx="104" cy="118" r="14"/>
      <circle cx="100" cy="88" r="15"/><circle cx="128" cy="86" r="12"/><circle cx="124" cy="60" r="13"/><circle cx="150" cy="56" r="10"/><circle cx="150" cy="34" r="10"/></g></svg>` },
    { id: 'bouquet', pack: 'floral', name: 'Buket', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M86 120L70 186h60l-16-66z" fill="#8fb28a"/><path d="M76 150c16 10 32 10 48 0l6 18c-20 10-40 10-60 0z" fill="{{A}}"/>
      <path d="M60 162l-22 18M140 162l22 18" stroke="{{A}}" stroke-width="7" stroke-linecap="round"/>
      <g fill="#9cbf96"><ellipse cx="44" cy="96" rx="14" ry="26" transform="rotate(-40 44 96)"/><ellipse cx="156" cy="96" rx="14" ry="26" transform="rotate(40 156 96)"/></g>
      <circle cx="100" cy="72" r="34" fill="#e98fa1"/><path d="M100 50c18 0 24 18 12 28-9 7-23 2-22-8 1-8 10-9 12-3" fill="none" stroke="#b9506b" stroke-width="5" stroke-linecap="round"/>
      <circle cx="62" cy="96" r="24" fill="#f6bccb"/><circle cx="62" cy="96" r="9" fill="#f7d77e"/>
      <circle cx="138" cy="96" r="24" fill="#fff" stroke="#e7dccd" stroke-width="2"/><circle cx="138" cy="96" r="9" fill="#f3c94f"/>
      <circle cx="100" cy="116" r="20" fill="#f2a6b6"/><circle cx="100" cy="116" r="7" fill="#fff" opacity=".7"/></svg>` },
    { id: 'butterfly', pack: 'floral', name: 'Kupu-kupu', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M96 98C70 40 20 40 26 80c4 26 36 30 70 22z" fill="#f4b0c0" stroke="#d9768f" stroke-width="4"/><path d="M104 98c26-58 76-58 70-18-4 26-36 30-70 22z" fill="#f4b0c0" stroke="#d9768f" stroke-width="4"/>
      <path d="M96 104c-30 4-52 26-40 48 10 16 34 6 40-26z" fill="#f9d3a8" stroke="#e0a26a" stroke-width="4"/><path d="M104 104c30 4 52 26 40 48-10 16-34 6-40-26z" fill="#f9d3a8" stroke="#e0a26a" stroke-width="4"/>
      <circle cx="56" cy="76" r="8" fill="#fff" opacity=".7"/><circle cx="144" cy="76" r="8" fill="#fff" opacity=".7"/>
      <rect x="94" y="72" width="12" height="70" rx="6" fill="#6b4a3a"/><path d="M98 74c-6-16-14-24-24-26M102 74c6-16 14-24 24-26" fill="none" stroke="#6b4a3a" stroke-width="3" stroke-linecap="round"/></svg>` },
    { id: 'flower_crown', pack: 'floral', name: 'Mahkota bunga', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150">
      <path d="M20 120C80 40 240 40 300 120" fill="none" stroke="#7f9f78" stroke-width="7" stroke-linecap="round"/>
      <g fill="#9cbf96"><ellipse cx="48" cy="92" rx="10" ry="20" transform="rotate(-50 48 92)"/><ellipse cx="272" cy="92" rx="10" ry="20" transform="rotate(50 272 92)"/>
      <ellipse cx="120" cy="56" rx="9" ry="18" transform="rotate(-70 120 56)"/><ellipse cx="200" cy="56" rx="9" ry="18" transform="rotate(70 200 56)"/></g>
      <circle cx="80" cy="76" r="20" fill="#f6bccb"/><circle cx="80" cy="76" r="7" fill="#f7d77e"/><circle cx="160" cy="52" r="24" fill="#e98fa1"/><circle cx="160" cy="52" r="8" fill="#fff" opacity=".7"/>
      <circle cx="240" cy="76" r="20" fill="#fff" stroke="#e7dccd" stroke-width="2"/><circle cx="240" cy="76" r="7" fill="#f3c94f"/>
      <circle cx="118" cy="66" r="12" fill="#f9d3a8"/><circle cx="202" cy="66" r="12" fill="#f9d3a8"/><circle cx="40" cy="112" r="11" fill="#f2a6b6"/><circle cx="280" cy="112" r="11" fill="#f2a6b6"/></svg>` },

    /* ---------------- LUCU (properti & karakter) ---------------- */
    { id: 'heart_glasses', pack: 'lucu', name: 'Kacamata hati', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120">
      <path d="M8 40l26 6M292 40l-26 6" stroke="#2b2b2b" stroke-width="9" stroke-linecap="round"/>
      <path d="M86 110C46 84 30 66 36 46 42 28 68 24 86 42 104 24 130 28 136 46 142 66 126 84 86 110Z" fill="#e0445f" stroke="#2b2b2b" stroke-width="8" stroke-linejoin="round"/>
      <path d="M214 110C174 84 158 66 164 46 170 28 196 24 214 42 232 24 258 28 264 46 270 66 254 84 214 110Z" fill="#e0445f" stroke="#2b2b2b" stroke-width="8" stroke-linejoin="round"/>
      <path d="M136 50c10-10 18-10 28 0" fill="none" stroke="#2b2b2b" stroke-width="8" stroke-linecap="round"/>
      <path d="M54 50c4-8 12-10 18-6M182 50c4-8 12-10 18-6" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/></svg>` },
    { id: 'sunglasses', pack: 'lucu', name: 'Kacamata hitam', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 110">
      <path d="M10 26h280" stroke="#1f1f1f" stroke-width="12" stroke-linecap="round"/>
      <path d="M22 26h104c0 40-14 64-52 64S22 66 22 26Z" fill="#1f1f1f"/><path d="M174 26h104c0 40-14 64-52 64s-52-24-52-64Z" fill="#1f1f1f"/>
      <path d="M40 40l30 26M58 38l18 16M192 40l30 26M210 38l18 16" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".35"/></svg>` },
    { id: 'mustache', pack: 'lucu', name: 'Kumis', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 110">
      <path d="M150 40c-20-24-58-28-80-8-18 16-30 32-50 30-12-1-18-10-14-18-12 14-6 40 20 46 36 8 76-6 124-30 48 24 88 38 124 30 26-6 32-32 20-46 4 8-2 17-14 18-20 2-32-14-50-30-22-20-60-16-80 8z" fill="#2a1d16"/></svg>` },
    { id: 'lips', pack: 'lucu', name: 'Bibir', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120">
      <path d="M10 58C40 30 70 14 96 34c8-6 20-6 28 0 26-20 56-4 86 24-36 40-66 56-100 56S46 98 10 58Z" fill="#d6334f"/>
      <path d="M10 58c40 10 70 14 100 12s60-2 100-12" fill="none" stroke="#9e1f36" stroke-width="6" stroke-linecap="round"/>
      <path d="M66 82c14 8 30 10 44 10" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".5"/></svg>` },
    { id: 'bowtie', pack: 'lucu', name: 'Dasi kupu-kupu', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120">
      <path d="M96 48L16 10v100l80-38z" fill="#1f1f1f"/><path d="M124 48l80-38v100l-80-38z" fill="#1f1f1f"/>
      <rect x="88" y="36" width="44" height="48" rx="12" fill="#2f2f2f"/><path d="M30 30l40 20M30 92l40-20M190 30l-40 20M190 92l-40-20" stroke="#444" stroke-width="5" stroke-linecap="round"/></svg>` },
    { id: 'party_hat', pack: 'lucu', name: 'Topi pesta', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 200">
      <path d="M80 26L24 176h112z" fill="#f2a6b6" stroke="#d9768f" stroke-width="5" stroke-linejoin="round"/>
      <path d="M60 80l46 24M46 118l66 34M36 150l50 26" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".85"/>
      <circle cx="80" cy="22" r="16" fill="{{A}}"/><path d="M18 178h124" stroke="{{A}}" stroke-width="10" stroke-linecap="round"/></svg>` },
    { id: 'groom', pack: 'lucu', name: 'Pengantin pria', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220">
      <path d="M30 220c4-40 30-62 70-62s66 22 70 62z" fill="#2c2c34"/><path d="M84 160l16 34 16-34z" fill="#fff"/><path d="M92 170l8 10 8-10-8-6z" fill="{{A}}"/>
      <circle cx="100" cy="100" r="60" fill="#f2c9a2"/>
      <path d="M42 84c2-36 28-54 58-54s56 18 58 54c-18-12-38-16-58-16s-40 4-58 16z" fill="#2a1e18"/>
      <path d="M48 58c6-22 26-34 52-34s46 12 52 34z" fill="#1d1d24"/><rect x="48" y="54" width="104" height="10" rx="4" fill="{{A}}"/>
      <circle cx="78" cy="106" r="7" fill="#2a1e18"/><circle cx="122" cy="106" r="7" fill="#2a1e18"/><circle cx="80" cy="104" r="2" fill="#fff"/><circle cx="124" cy="104" r="2" fill="#fff"/>
      <ellipse cx="64" cy="126" rx="10" ry="6" fill="#f29a8e" opacity=".6"/><ellipse cx="136" cy="126" rx="10" ry="6" fill="#f29a8e" opacity=".6"/>
      <path d="M84 132c10 10 22 10 32 0" fill="none" stroke="#8a4b3c" stroke-width="5" stroke-linecap="round"/></svg>` },
    { id: 'bride', pack: 'lucu', name: 'Pengantin wanita', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220">
      <path d="M22 210C18 120 46 36 100 36s82 84 78 174z" fill="#fff" fill-opacity=".85" stroke="#e8e1d6" stroke-width="3"/>
      <path d="M44 220c4-36 26-58 56-58s52 22 56 58z" fill="#fff" stroke="#e8e1d6" stroke-width="3"/>
      <path d="M40 112c-4-46 24-74 60-74s64 28 60 74c-8-22-30-38-60-38s-52 16-60 38z" fill="#4a2f25"/>
      <circle cx="100" cy="104" r="54" fill="#f6d2b0"/>
      <path d="M48 96c6-34 28-48 52-48s46 14 52 48c-14-18-32-24-52-24s-38 6-52 24z" fill="#4a2f25"/>
      <circle cx="68" cy="56" r="10" fill="#f6bccb"/><circle cx="84" cy="48" r="8" fill="#fff"/><circle cx="68" cy="56" r="4" fill="#f7d77e"/>
      <circle cx="80" cy="110" r="6.5" fill="#3a2620"/><circle cx="120" cy="110" r="6.5" fill="#3a2620"/><circle cx="82" cy="108" r="2" fill="#fff"/><circle cx="122" cy="108" r="2" fill="#fff"/>
      <ellipse cx="68" cy="128" rx="9" ry="5.5" fill="#f29a8e" opacity=".6"/><ellipse cx="132" cy="128" rx="9" ry="5.5" fill="#f29a8e" opacity=".6"/>
      <path d="M88 134c8 8 16 8 24 0" fill="none" stroke="#b5485c" stroke-width="5" stroke-linecap="round"/></svg>` },
    { id: 'heart_char', pack: 'lucu', name: 'Hati lucu', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <path d="M26 116c-14 6-20 18-14 26M174 116c14 6 20 18 14 26" fill="none" stroke="#c9354f" stroke-width="7" stroke-linecap="round"/>
      <path d="M100 178C38 134 16 100 28 66 40 34 82 30 100 62 118 30 160 34 172 66 184 100 162 134 100 178Z" fill="#ef5a73" stroke="#c9354f" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="76" cy="100" r="9" fill="#2b1d1d"/><circle cx="124" cy="100" r="9" fill="#2b1d1d"/><circle cx="79" cy="97" r="3" fill="#fff"/><circle cx="127" cy="97" r="3" fill="#fff"/>
      <ellipse cx="62" cy="120" rx="11" ry="7" fill="#ffb3bf"/><ellipse cx="138" cy="120" rx="11" ry="7" fill="#ffb3bf"/>
      <path d="M88 122c8 10 16 10 24 0" fill="none" stroke="#2b1d1d" stroke-width="5" stroke-linecap="round"/>
      <path d="M54 66c6-12 18-16 28-10" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".6"/></svg>` },
    { id: 'lovebirds', pack: 'lucu', name: 'Burung cinta', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 200">
      <path d="M110 46c-8-12-26-8-20 6l20 18 20-18c6-14-12-18-20-6z" fill="#e5768c"/>
      <ellipse cx="66" cy="128" rx="50" ry="44" fill="#f6b7c4"/><ellipse cx="154" cy="128" rx="50" ry="44" fill="#a9cdee"/>
      <path d="M30 140c18 14 40 16 56 6" fill="none" stroke="#e48aa2" stroke-width="6" stroke-linecap="round"/><path d="M190 140c-18 14-40 16-56 6" fill="none" stroke="#7fb0de" stroke-width="6" stroke-linecap="round"/>
      <circle cx="84" cy="110" r="6" fill="#2b2b2b"/><circle cx="136" cy="110" r="6" fill="#2b2b2b"/>
      <path d="M100 116l12 4-12 6z" fill="#f2b04a"/><path d="M120 116l-12 4 12 6z" fill="#f2b04a"/>
      <ellipse cx="72" cy="126" rx="7" ry="4.5" fill="#ef8ea1"/><ellipse cx="148" cy="126" rx="7" ry="4.5" fill="#8fbbe6"/></svg>` },

    /* ---------------- TEKS (digambar dengan font aplikasi) ---------------- */
    { id: 't_sah', pack: 'teks', name: 'Sah!', kind: 'text', text: 'Sah!', style: 'bubble' },
    { id: 't_married', pack: 'teks', name: 'Just Married', kind: 'text', text: 'Just Married', style: 'script' },
    { id: 't_happy', pack: 'teks', name: 'Happy Wedding', kind: 'text', text: 'Happy Wedding', style: 'script' },
    { id: 't_barakallah', pack: 'teks', name: 'Barakallah', kind: 'text', text: 'Barakallah', style: 'script' },
    { id: 't_love', pack: 'teks', name: 'Love', kind: 'text', text: 'Love', style: 'script', color: '#d9435e' },
    { id: 't_ciee', pack: 'teks', name: 'Ciee~', kind: 'text', text: 'Ciee~', style: 'bubble' },
    { id: 't_selamat', pack: 'teks', name: 'Selamat!', kind: 'text', text: 'Selamat!', style: 'banner' },
    { id: 't_title', pack: 'teks', name: 'Nama acara', kind: 'text', text: '{{TITLE}}', style: 'script' },
    { id: 't_date', pack: 'teks', name: 'Tanggal', kind: 'text', text: '{{DATE}}', style: 'banner' },
  ],
};
