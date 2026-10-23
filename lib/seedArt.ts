/**
 * Genereert illustraties (SVG) voor de voorbeelddata: dezelfde straat 'toen' (sepia,
 * paard-en-wagen, gaslantaarns) en 'nu' (kleur, bomen, fietsen, deels nieuwbouw).
 * Zo werkt het prototype volledig offline, zonder externe beeldbanken.
 */

type Era = "then" | "now";

export interface SceneOptions {
  seed: number;
  canal?: boolean;
  /** Index van het pand dat in het heden vervangen is door nieuwbouw. */
  rebuiltIndex?: number;
}

const W = 1200;
const H = 800;
const STREET_Y = 560;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FACADES = ["#8c3b2a", "#a2512f", "#6f2f24", "#c9b48a", "#7b4a35", "#e4d9c2", "#5b3a2e", "#b7743f"];

interface House {
  x: number;
  w: number;
  h: number;
  color: string;
  gable: "step" | "bell" | "neck" | "flat";
}

function buildHouses(rand: () => number): House[] {
  const houses: House[] = [];
  let x = -20;
  while (x < W + 20) {
    const w = 110 + Math.floor(rand() * 70);
    houses.push({
      x,
      w,
      h: 250 + Math.floor(rand() * 150),
      color: FACADES[Math.floor(rand() * FACADES.length)],
      gable: (["step", "bell", "neck", "flat"] as const)[Math.floor(rand() * 4)],
    });
    x += w;
  }
  return houses;
}

function gablePath(h: House, top: number): string {
  const { x, w } = h;
  const r = x + w;
  const mid = x + w / 2;
  switch (h.gable) {
    case "step": {
      const s = w / 6;
      return `M${x},${top} L${x},${top - 15} L${x + s},${top - 15} L${x + s},${top - 35} L${x + 2 * s},${top - 35} L${x + 2 * s},${top - 55} L${r - 2 * s},${top - 55} L${r - 2 * s},${top - 35} L${r - s},${top - 35} L${r - s},${top - 15} L${r},${top - 15} L${r},${top} Z`;
    }
    case "bell":
      return `M${x},${top} C${x},${top - 30} ${mid - w * 0.3},${top - 30} ${mid - w * 0.22},${top - 70} L${mid},${top - 85} L${mid + w * 0.22},${top - 70} C${mid + w * 0.3},${top - 30} ${r},${top - 30} ${r},${top} Z`;
    case "neck":
      return `M${x},${top} L${x + w * 0.2},${top - 20} L${x + w * 0.3},${top - 20} L${x + w * 0.3},${top - 70} L${r - w * 0.3},${top - 70} L${r - w * 0.3},${top - 20} L${r - w * 0.2},${top - 20} L${r},${top} Z`;
    default:
      return `M${x - 4},${top} L${r + 4},${top} L${r + 4},${top - 14} L${x - 4},${top - 14} Z`;
  }
}

function windows(h: House, top: number, era: Era, rand: () => number): string {
  const cols = h.w > 150 ? 3 : 2;
  const gap = h.w / (cols + 1);
  const rows = Math.floor((STREET_Y - top - 90) / 70);
  const glass = era === "then" ? "#2b2620" : rand() > 0.5 ? "#9cc3d5" : "#6f98ad";
  let out = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = h.x + gap * (c + 1) - 14;
      const wy = top + 25 + r * 70;
      out += `<rect x="${wx}" y="${wy}" width="28" height="44" fill="${glass}" stroke="#f3eee3" stroke-width="3"/>`;
      out += `<line x1="${wx + 14}" y1="${wy}" x2="${wx + 14}" y2="${wy + 44}" stroke="#f3eee3" stroke-width="2"/>`;
    }
  }
  // Deur / winkelpui op de begane grond
  const doorX = h.x + h.w / 2 - 16;
  out += `<rect x="${doorX}" y="${STREET_Y - 62}" width="32" height="62" fill="${era === "then" ? "#3a2a1e" : "#24543a"}"/>`;
  return out;
}

function modernBuilding(h: House): string {
  const top = STREET_Y - h.h - 40;
  let out = `<rect x="${h.x}" y="${top}" width="${h.w}" height="${h.h + 40}" fill="#cfd8dc"/>`;
  for (let y = top + 12; y < STREET_Y - 10; y += 34) {
    out += `<rect x="${h.x + 8}" y="${y}" width="${h.w - 16}" height="24" fill="#7fb2c9" opacity="0.85"/>`;
  }
  return out;
}

function tree(x: number, rand: () => number): string {
  const s = 0.8 + rand() * 0.5;
  return `<g transform="translate(${x},${STREET_Y + 10}) scale(${s})">
    <rect x="-6" y="-80" width="12" height="90" fill="#5d4330"/>
    <circle cx="0" cy="-120" r="55" fill="#4f8f2f"/>
    <circle cx="-35" cy="-95" r="38" fill="#5fa23a"/>
    <circle cx="35" cy="-100" r="40" fill="#3f7d27"/>
  </g>`;
}

function gasLamp(x: number): string {
  return `<g transform="translate(${x},${STREET_Y + 20})">
    <rect x="-3" y="-140" width="6" height="140" fill="#1d1a16"/>
    <path d="M-14,-140 L14,-140 L9,-170 L-9,-170 Z" fill="#3a332a" stroke="#1d1a16" stroke-width="3"/>
    <rect x="-10" y="-176" width="20" height="6" fill="#1d1a16"/>
  </g>`;
}

function horseCart(x: number): string {
  return `<g transform="translate(${x},${STREET_Y + 150})" fill="#231d17">
    <ellipse cx="0" cy="-60" rx="55" ry="22"/>
    <rect x="-45" y="-50" width="8" height="50"/><rect x="-25" y="-50" width="8" height="50"/>
    <rect x="25" y="-50" width="8" height="50"/><rect x="40" y="-50" width="8" height="50"/>
    <path d="M45,-70 L75,-110 L90,-100 L65,-62 Z"/>
    <rect x="-210" y="-95" width="140" height="55" rx="4"/>
    <circle cx="-175" cy="-30" r="30" fill="none" stroke="#231d17" stroke-width="7"/>
    <circle cx="-100" cy="-30" r="30" fill="none" stroke="#231d17" stroke-width="7"/>
    <line x1="-70" y1="-70" x2="-30" y2="-62" stroke="#231d17" stroke-width="5"/>
    <rect x="-190" y="-135" width="22" height="40"/><rect x="-194" y="-150" width="30" height="10"/><rect x="-188" y="-165" width="18" height="16"/>
  </g>`;
}

function person(x: number, era: Era, color: string): string {
  const hat =
    era === "then"
      ? `<rect x="-11" y="-118" width="22" height="16" fill="#1d1a16"/><rect x="-16" y="-104" width="32" height="4" fill="#1d1a16"/>`
      : "";
  return `<g transform="translate(${x},${STREET_Y + 120})">
    <rect x="-12" y="-82" width="24" height="60" rx="8" fill="${color}"/>
    <rect x="-10" y="-24" width="8" height="40" fill="#2a2a2a"/><rect x="2" y="-24" width="8" height="40" fill="#2a2a2a"/>
    <circle cx="0" cy="-92" r="11" fill="#d8b49a"/>${hat}
  </g>`;
}

function bike(x: number, color: string): string {
  return `<g transform="translate(${x},${STREET_Y + 150})" stroke="${color}" stroke-width="5" fill="none">
    <circle cx="-38" cy="-24" r="24"/><circle cx="38" cy="-24" r="24"/>
    <path d="M-38,-24 L-8,-62 L28,-62 L38,-24 M-8,-62 L0,-24 L28,-62 M-14,-72 L0,-72 M28,-62 L24,-80 L36,-80"/>
  </g>`;
}

function car(x: number, color: string): string {
  return `<g transform="translate(${x},${STREET_Y + 175})">
    <path d="M-110,-20 L-110,-55 L-70,-60 L-40,-95 L50,-95 L85,-60 L110,-55 L110,-20 Z" fill="${color}"/>
    <path d="M-32,-88 L-2,-88 L-2,-62 L-58,-62 Z M6,-88 L44,-88 L70,-62 L6,-62 Z" fill="#cfe3ec"/>
    <circle cx="-62" cy="-18" r="20" fill="#222"/><circle cx="62" cy="-18" r="20" fill="#222"/>
    <circle cx="-62" cy="-18" r="8" fill="#999"/><circle cx="62" cy="-18" r="8" fill="#999"/>
  </g>`;
}

export function sceneSvg(era: Era, opts: SceneOptions): string {
  const rand = rng(opts.seed);
  const houses = buildHouses(rand);
  const decoRand = rng(opts.seed * 7 + (era === "then" ? 1 : 2));
  const then = era === "then";

  let body = "";
  body += `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${then ? "#d9d2c3" : "#7fc4ec"}"/>
      <stop offset="1" stop-color="${then ? "#efe9dc" : "#d8eefa"}"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#2b1d0e" stop-opacity="0.75"/>
    </radialGradient>
    <filter id="sepia">
      <feColorMatrix type="matrix" values="0.393 0.769 0.189 0 0  0.349 0.686 0.168 0 0  0.272 0.534 0.131 0 0  0 0 0 1 0"/>
    </filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${opts.seed}"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.22"/></feComponentTransfer>
    </filter>
  </defs>`;

  let scene = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  if (!then) {
    scene += `<circle cx="1040" cy="110" r="48" fill="#ffe08a"/>`;
    scene += `<g fill="#fff" opacity="0.9"><ellipse cx="220" cy="120" rx="80" ry="26"/><ellipse cx="280" cy="105" rx="60" ry="30"/><ellipse cx="700" cy="80" rx="70" ry="20"/></g>`;
  }

  houses.forEach((h, i) => {
    if (!then && i === opts.rebuiltIndex) {
      scene += modernBuilding(h);
      return;
    }
    const top = STREET_Y - h.h;
    scene += `<rect x="${h.x}" y="${top}" width="${h.w}" height="${h.h}" fill="${h.color}" stroke="#2a1f17" stroke-width="2"/>`;
    scene += `<path d="${gablePath(h, top)}" fill="${h.color}" stroke="#2a1f17" stroke-width="2"/>`;
    scene += windows(h, top, era, decoRand);
  });

  if (opts.canal) {
    scene += `<rect x="0" y="${STREET_Y}" width="${W}" height="40" fill="${then ? "#8a8070" : "#9b9b95"}"/>`;
    scene += `<rect x="0" y="${STREET_Y + 40}" width="${W}" height="${H - STREET_Y - 40}" fill="${then ? "#6d6a60" : "#3f7f9a"}"/>`;
    for (let i = 0; i < 14; i++) {
      const y = STREET_Y + 60 + decoRand() * 180;
      const x = decoRand() * W;
      scene += `<line x1="${x}" y1="${y}" x2="${x + 60 + decoRand() * 80}" y2="${y}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3"/>`;
    }
    scene += then
      ? `<path d="M380,${STREET_Y + 150} L700,${STREET_Y + 150} L660,${STREET_Y + 190} L420,${STREET_Y + 190} Z" fill="#2b241c"/><rect x="520" y="${STREET_Y + 40}" width="6" height="110" fill="#2b241c"/>`
      : `<path d="M360,${STREET_Y + 160} L720,${STREET_Y + 160} L690,${STREET_Y + 195} L390,${STREET_Y + 195} Z" fill="#f4f4f4"/><rect x="420" y="${STREET_Y + 125}" width="220" height="35" rx="6" fill="#1f4f6b"/>`;
  } else {
    scene += `<rect x="0" y="${STREET_Y}" width="${W}" height="${H - STREET_Y}" fill="${then ? "#9a9081" : "#6e6e6e"}"/>`;
    if (then) {
      for (let y = STREET_Y + 10; y < H; y += 22) {
        for (let x = (y / 22) % 2 ? 0 : 20; x < W; x += 40) {
          scene += `<rect x="${x}" y="${y}" width="36" height="18" rx="5" fill="#857b6c"/>`;
        }
      }
    } else {
      scene += `<rect x="0" y="${STREET_Y}" width="${W}" height="38" fill="#b9b2a6"/>`;
      scene += `<rect x="0" y="${STREET_Y + 38}" width="${W}" height="60" fill="#b5483a"/>`;
      for (let x = 20; x < W; x += 120) scene += `<rect x="${x}" y="${STREET_Y + 160}" width="60" height="8" fill="#f2f2f2"/>`;
    }
  }

  if (then) {
    scene += gasLamp(140) + gasLamp(1000);
    if (!opts.canal) scene += horseCart(760);
    scene += person(250, era, "#3b3129") + person(300, era, "#55493d") + person(980, era, "#2e2620");
  } else {
    scene += tree(120, decoRand) + tree(1080, decoRand);
    if (!opts.canal) scene += car(820, "#d8443a");
    scene += bike(320, "#1f6f8b") + bike(520, "#333");
    scene += person(250, era, "#e2733b") + person(660, era, "#3a7bd5");
  }

  if (then) {
    body += `<g filter="url(#sepia)">${scene}</g>`;
    body += `<rect width="${W}" height="${H}" filter="url(#grain)"/>`;
    body += `<rect width="${W}" height="${H}" fill="url(#vignette)"/>`;
  } else {
    body += scene;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`;
}

export function sceneDataUri(era: Era, opts: SceneOptions): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sceneSvg(era, opts))}`;
}
