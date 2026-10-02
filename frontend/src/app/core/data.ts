export interface Service { icon: string; name: string; desc: string; price: string }
export interface Doctor { name: string; role: string; years: string; rating: string; bio: string; img: string }

export const SERVICES: Service[] = [
  { icon: 'gem', name: 'Porcelain veneers', desc: 'Hand-layered ceramic that reflects light like natural enamel.', price: 'Rs 25,000 per tooth' },
  { icon: 'bezier2', name: 'Invisible aligners', desc: 'Clear removable trays with a digital preview of your final smile.', price: 'Rs 180,000' },
  { icon: 'brightness-high', name: 'Advanced whitening', desc: 'Up to eight shades brighter in one calm 60-minute visit.', price: 'Rs 15,000' },
  { icon: 'pin-angle', name: 'Dental implants', desc: 'Titanium roots and custom crowns that feel like your own teeth.', price: 'Rs 90,000' },
  { icon: 'heart-pulse', name: 'Painless root canal', desc: 'Microscope-guided care under gentle, comfortable anaesthesia.', price: 'Rs 12,000' },
  { icon: 'emoji-smile', name: 'Family and kids', desc: 'Check-ups, cleaning and sealants in a room children like.', price: 'Rs 3,000' },
];

export const DOCTORS: Doctor[] = [
  { name: 'Dr. Ayesha Khan', role: 'Cosmetic and restorative dentistry', years: '14 years', rating: '4.9', bio: 'Designs smiles with veneers and whitening. Known for natural results.', img: 'images/dr-ayesha.jpg' },
  { name: 'Dr. Zain Malik', role: 'Implants and oral surgery', years: '12 years', rating: '4.9', bio: 'Places implants with 3D guidance and a very gentle hand.', img: 'images/dr-zain.jpg' },
  { name: 'Dr. Sana Riaz', role: 'Orthodontics and paediatrics', years: '10 years', rating: '4.8', bio: 'Straightens teeth with clear aligners and calms every child.', img: 'images/dr-sana.jpg' },
];

export const TIMES = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'];
export const SERVICE_NAMES = SERVICES.map(s => s.name);
export const DOCTOR_NAMES = DOCTORS.map(d => d.name);

export function pad(n: number): string { return n < 10 ? '0' + n : String(n); }
/** Local date as yyyy-MM-dd, offset by `o` days from today. */
export function ds(o: number): string {
  const d = new Date();
  d.setDate(d.getDate() + o);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
export function fmtDate(d: string): string {
  return new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function initials(n: string): string {
  return (n || '').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
export function starList(n: number): boolean[] {
  return [1, 2, 3, 4, 5].map(i => i <= Math.round(n));
}

/* ---------- before / after smile drawings (same as the original site) ---------- */
interface TeethSpec { w: number[]; x: number[]; h: number[]; r: number[]; c: string; s: string; g: string; a: string }

function teeth(o: TeethSpec): string {
  let s = '';
  for (let i = 0; i < 8; i++) {
    const w = o.w[i], x = o.x[i], h = o.h[i];
    s += `<rect x="${x}" y="60" width="${w}" height="${h}" rx="${w / 2.4}" fill="${o.c}" stroke="${o.s}" stroke-width="1.5" transform="rotate(${o.r[i]} ${x + w / 2} 62)"/>`;
  }
  return s;
}
function smile(o: TeethSpec): string {
  return `<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${o.a}"><rect width="400" height="200" fill="#3A1420"/><rect x="46" y="50" width="308" height="20" rx="10" fill="${o.g}"/>${teeth(o)}<path d="M0 0H400V56Q200 34 0 56Z" fill="#D9838C"/><path d="M0 200H400V150Q200 172 0 150Z" fill="#CF7480"/></svg>`;
}
const XS = [0, 1, 2, 3, 4, 5, 6, 7].map(i => 60 + i * 36);
const GOOD: TeethSpec = { w: [32, 32, 32, 32, 32, 32, 32, 32], x: XS, h: [74, 74, 74, 74, 74, 74, 74, 74], r: [0, 0, 0, 0, 0, 0, 0, 0], c: '#FFFFFF', s: '#C9D9F2', g: '#F19AA6', a: 'Brighter smile after treatment' };
function bad(o: Partial<TeethSpec>): TeethSpec { return { ...GOOD, ...o }; }

export interface BaCase { title: string; caption: string; before: string; after: string }
export const CASES: BaCase[] = [
  { title: 'Whitening', caption: 'Eight shades brighter in one visit',
    before: smile(bad({ c: '#E4CE86', s: '#B79A47', g: '#D97C8A', a: 'Stained teeth before whitening' })), after: smile(GOOD) },
  { title: 'Veneers', caption: 'Chipped and uneven, restored with porcelain',
    before: smile(bad({ c: '#EFDDA6', s: '#BFA25A', g: '#D97C8A', w: [30, 34, 27, 33, 31, 28, 34, 30], h: [64, 80, 58, 76, 70, 56, 78, 66], x: [60, 94, 131, 164, 203, 236, 270, 308], r: [3, -2, 5, -3, 2, -5, 3, -2], a: 'Uneven teeth before veneers' })), after: smile(GOOD) },
  { title: 'Aligners', caption: 'Crowding corrected with clear aligners',
    before: smile(bad({ c: '#F4EBCB', s: '#C4AE6F', g: '#D97C8A', x: [62, 90, 124, 158, 204, 232, 266, 304], r: [-9, 7, -13, 10, -8, 12, -7, 9], h: [70, 78, 66, 76, 68, 80, 66, 74], a: 'Crowded teeth before aligners' })), after: smile(GOOD) },
];
