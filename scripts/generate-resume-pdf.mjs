/**
 * Builds public/resume.pdf straight from src/data/cv.ts.
 *
 * Zero dependencies on purpose: the four standard-14 fonts are the only ones a
 * PDF reader is required to provide, so the output stays small, prints
 * identically everywhere, and remains selectable text for applicant trackers.
 *
 *   node scripts/generate-resume-pdf.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../public/resume.pdf');

/* ------------------------------------------------------------------ *
 * Page geometry (A4, points)
 * ------------------------------------------------------------------ */

const PAGE_W = 595.276;
const PAGE_H = 841.89;
const MARGIN_X = 52;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 52;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const BOTTOM_LIMIT = PAGE_H - MARGIN_BOTTOM;

/* ------------------------------------------------------------------ *
 * Standard-14 font metrics (AFM advance widths, units per 1000 em)
 * Only ASCII 32-126 is needed; anything else is normalised away or
 * measured with a conservative fallback.
 * ------------------------------------------------------------------ */

const W = {
  'Times-Roman': [
    250, 333, 408, 500, 500, 833, 778, 180, 333, 333, 500, 564, 250, 333, 250, 278,
    500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 278, 278, 564, 564, 564, 444,
    921, 722, 667, 667, 722, 611, 556, 722, 722, 333, 389, 722, 611, 889, 722, 722,
    556, 722, 667, 556, 611, 722, 722, 944, 722, 722, 611, 333, 278, 333, 469, 500,
    333, 444, 500, 444, 500, 444, 333, 500, 500, 278, 278, 500, 278, 778, 500, 500,
    500, 500, 333, 389, 278, 500, 500, 722, 500, 500, 444, 480, 200, 480, 541,
  ],
  'Times-Bold': [
    250, 333, 555, 500, 500, 1000, 833, 278, 333, 333, 500, 570, 250, 333, 250, 278,
    500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 333, 333, 570, 570, 570, 500,
    930, 722, 667, 722, 722, 667, 611, 778, 778, 389, 500, 778, 667, 944, 722, 778,
    611, 778, 722, 556, 667, 722, 722, 1000, 722, 722, 667, 333, 278, 333, 581, 500,
    333, 500, 556, 444, 556, 444, 333, 500, 556, 278, 333, 556, 278, 833, 556, 500,
    556, 556, 444, 389, 333, 556, 500, 722, 500, 500, 444, 394, 220, 394, 520,
  ],
  Helvetica: [
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
    1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
    333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
    556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
  ],
  'Helvetica-Bold': [
    278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
    975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
    333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
    611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
  ],
};

const FALLBACK_WIDTH = 500; // measured as a wide lowercase 'n'

const FONTS = ['Times-Roman', 'Times-Bold', 'Helvetica', 'Helvetica-Bold'];
const FONT_REF = { 'Times-Roman': 'F1', 'Times-Bold': 'F2', Helvetica: 'F3', 'Helvetica-Bold': 'F4' };

/** Fold typographic characters onto the ASCII subset the metrics cover. */
function normalise(input) {
  return input
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[\u2022\u00B7\u25CF\u25AA]/g, '-')
    .replace(/[\u2192]/g, '->')
    .replace(/[\u2265]/g, '>=')
    .replace(/[\u00D7]/g, 'x')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x20-\x7E]/g, '');
}

function measure(text, font, size, charSpacing = 0) {
  const table = W[font];
  let units = 0;
  const clean = normalise(text);
  for (let i = 0; i < clean.length; i += 1) {
    const code = clean.charCodeAt(i);
    units += code >= 32 && code <= 126 ? table[code - 32] : FALLBACK_WIDTH;
  }
  const tracking = charSpacing ? charSpacing * Math.max(0, clean.length - 1) : 0;
  return ((units + tracking) / 1000) * size;
}

function escapePdf(text) {
  return normalise(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/* ------------------------------------------------------------------ *
 * Palette — mirrors the site's paper theme
 * ------------------------------------------------------------------ */

const INK = [0.102, 0.094, 0.078];
const INK_SOFT = [0.29, 0.27, 0.23];
const MUTED = [0.42, 0.39, 0.33];
const OXBLOOD = [0.549, 0.184, 0.141];
const RULE = [0.72, 0.69, 0.63];

const fmt = (n) => (Math.round(n * 1000) / 1000).toString();

/* ------------------------------------------------------------------ *
 * Document writer
 * ------------------------------------------------------------------ */

class Doc {
  constructor() {
    this.pages = [];
    this.ops = [];
    this.y = MARGIN_TOP;
    this.newPage();
  }

  newPage() {
    this.flush();
    this.ops = [];
    this.y = MARGIN_TOP;
  }

  flush() {
    if (this.ops.length) this.pages.push(this.ops.join('\n'));
  }

  /** Break to a new page when `space` points would overflow the text block. */
  need(space) {
    if (this.y + space > BOTTOM_LIMIT) {
      this.newPage();
      return true;
    }
    return false;
  }

  get baseline() {
    return PAGE_H - this.y;
  }

  raw(op) {
    this.ops.push(op);
  }

  /** Draw pre-wrapped lines. `lines` must already be fitted to the measure. */
  paint(lines, { font, size, x = MARGIN_X, leading, color = INK, charSpacing = 0 }) {
    const step = leading ?? size * 1.32;
    for (const line of lines) {
      if (line === '') {
        this.y += step;
        continue;
      }
      this.need(step);
      // Tc is part of the graphics state's text state and survives BT/ET, so it
      // is always written explicitly rather than only when tracking is used.
      const tracking = ` ${fmt(charSpacing ?? 0)} Tc`;
      this.raw(
        `BT /${FONT_REF[font]} ${fmt(size)} Tf${tracking} ${fmt(color[0])} ${fmt(color[1])} ${fmt(color[2])} rg 1 0 0 1 ${fmt(x)} ${fmt(this.baseline - size * 0.82)} Tm (${escapePdf(line)}) Tj ET`,
      );
      this.y += step;
    }
  }

  /** Greedy word wrap using the real font metrics. */
  wrap(text, { font, size, width = CONTENT_W, charSpacing = 0 }) {
    const words = normalise(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measure(candidate, font, size, charSpacing) <= width || current === '') {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  text(raw, opts = {}) {
    const size = opts.size ?? 10;
    const leading = opts.leading ?? size * 1.34;
    const lines = this.wrap(raw, { ...opts, size });
    // Keep a heading with at least two lines of its body.
    this.need(opts.keepWithNext ? leading * 2.5 : 0);
    this.paint(lines, { ...opts, size, leading });
    return lines;
  }

  /** Single-line text, no wrapping. */
  line1(raw, opts = {}) {
    const size = opts.size ?? 10;
    const leading = opts.leading ?? size * 1.34;
    this.need(leading);
    this.paint([normalise(raw)], { ...opts, size, leading });
  }

  /** `text` drawn flush right against the right margin. */
  rightAligned(raw, opts = {}) {
    const size = opts.size ?? 9;
    const width = measure(raw, opts.font ?? 'Helvetica', size, opts.charSpacing ?? 0);
    this.line1(raw, { ...opts, size, x: PAGE_W - MARGIN_X - width });
  }

  hrule({ y = this.y, color = RULE, width = 0.6, x1 = MARGIN_X, x2 = PAGE_W - MARGIN_X } = {}) {
    this.raw(`${fmt(x1)} ${fmt(PAGE_H - y)} m ${fmt(x2)} ${fmt(PAGE_H - y)} l ${fmt(color[0])} ${fmt(color[1])} ${fmt(color[2])} RG ${fmt(width)} w S`);
  }

  box({ x = MARGIN_X, y = this.y, w, h, color }) {
    this.raw(`${fmt(x)} ${fmt(PAGE_H - y - h)} ${fmt(w)} ${fmt(h)} re ${fmt(color[0])} ${fmt(color[1])} ${fmt(color[2])} rg f`);
  }

  space(amount) {
    this.y += amount;
  }
}

/* ------------------------------------------------------------------ *
 * Semantic blocks
 * ------------------------------------------------------------------ */

function sectionLabel(doc, label) {
  doc.need(40);
  doc.space(13);
  doc.line1(label.toUpperCase(), {
    font: 'Helvetica-Bold',
    size: 8,
    leading: 12,
    color: OXBLOOD,
    charSpacing: 1.4,
  });
  doc.space(3);
  doc.hrule({ width: 0.8, color: OXBLOOD });
  doc.space(11);
}

function bullet(doc, text, { x = MARGIN_X + 11, width = CONTENT_W - 11, size = 9.6 } = {}) {
  const lines = doc.wrap(text, { font: 'Times-Roman', size, width: width - 11 });
  doc.need(size * 1.34);
  // The glyph sits on the first baseline; wrapped lines align to `x`.
  const baselineY = doc.baseline - size * 0.82;
  doc.raw(
    `BT /${FONT_REF['Times-Roman']} ${fmt(size)} Tf ${fmt(INK_SOFT[0])} ${fmt(INK_SOFT[1])} ${fmt(INK_SOFT[2])} rg 1 0 0 1 ${fmt(x - 9)} ${fmt(baselineY)} Tm (-) Tj ET`,
  );
  doc.paint(lines, { font: 'Times-Roman', size, x, leading: size * 1.34, color: INK_SOFT });
}

function period(item) {
  return `${item.start} - ${item.end ?? 'Present'}`;
}

/* ------------------------------------------------------------------ *
 * Content
 * ------------------------------------------------------------------ */

function build(cv) {
  const doc = new Doc();
  const { profile, socials, about, experience, skills, projects, education } = cv;

  /* --- Masthead --- */
  doc.box({ y: MARGIN_TOP, w: CONTENT_W, h: 2.6, color: OXBLOOD });
  doc.space(20);

  doc.line1(profile.name, { font: 'Times-Bold', size: 25, leading: 30, color: INK });
  doc.space(1);
  doc.line1(profile.role, { font: 'Times-Roman', size: 12.5, leading: 17, color: OXBLOOD });
  doc.space(6);

  const contact = [profile.email, profile.location, profile.availability].filter(Boolean).join('  |  ');
  doc.text(contact, { font: 'Helvetica', size: 8.4, leading: 11.5, color: MUTED });
  doc.space(2);
  doc.text(socials.map((s) => `${s.label} (${s.platform})`).join('  |  '), {
    font: 'Helvetica',
    size: 8.4,
    leading: 11.5,
    color: MUTED,
  });
  doc.space(8);
  doc.hrule({ width: 0.8, color: OXBLOOD });
  doc.space(14);

  /* --- Summary --- */
  sectionLabel(doc, 'Profile');
  doc.text(profile.tagline, { font: 'Times-Roman', size: 10.4, leading: 14.2, color: INK });
  doc.space(7);
  doc.text(about.currentFocus, { font: 'Times-Roman', size: 10.4, leading: 14.2, color: INK });

  const headlineStats = about.stats.map((s) => `${s.value} ${s.label.toLowerCase()}`).join('  /  ');
  doc.space(7);
  doc.text(headlineStats, {
    font: 'Helvetica-Bold',
    size: 8.6,
    leading: 12,
    color: OXBLOOD,
    charSpacing: 0.3,
  });

  /* --- Experience --- */
  sectionLabel(doc, 'Experience');
  experience.forEach((item, index) => {
    if (index > 0) doc.space(9);
    doc.need(46);

    doc.need(15);
    doc.line1(item.role, { font: 'Times-Bold', size: 11.4, leading: 14.5, color: INK });
    doc.rightAligned(period(item), { font: 'Helvetica', size: 8.6, leading: 14.5, color: MUTED });

    doc.line1(`${item.company}  -  ${item.location}`, {
      font: 'Helvetica',
      size: 9,
      leading: 12.5,
      color: OXBLOOD,
    });
    doc.space(3);
    doc.text(item.summary, { font: 'Times-Roman', size: 9.8, leading: 13.2, color: INK_SOFT });

    doc.space(3);
    item.achievements.forEach((line) => bullet(doc, line));
    doc.space(4);
    doc.text(item.tech.join('  /  '), {
      font: 'Helvetica',
      size: 8.2,
      leading: 11.5,
      color: MUTED,
      charSpacing: 0.2,
    });
  });

  /* --- Projects --- */
  sectionLabel(doc, 'Selected Projects');
  projects.forEach((project) => {
    doc.need(34);
    doc.line1(project.title, { font: 'Times-Bold', size: 10.4, leading: 13.5, color: INK });
    doc.rightAligned(project.year, { font: 'Helvetica', size: 8.6, leading: 13.5, color: MUTED });
    doc.text(project.summary, { font: 'Times-Roman', size: 9.6, leading: 12.8, color: INK_SOFT });

    if (project.impact?.length) {
      doc.space(2);
      project.impact.forEach((line) => bullet(doc, line, { size: 9.2 }));
    }

    const links = [project.liveUrl, project.repoUrl].filter(Boolean).join('  |  ');
    doc.space(3);
    if (links) doc.text(links, { font: 'Helvetica', size: 8.2, leading: 11.5, color: OXBLOOD });
    doc.text(project.tech.join('  /  '), {
      font: 'Helvetica',
      size: 8.2,
      leading: 11.5,
      color: MUTED,
      charSpacing: 0.2,
    });
    doc.space(8);
  });

  /* --- Skills --- */
  sectionLabel(doc, 'Skills');
  skills.forEach((group) => {
    doc.need(24);
    const list = group.skills.map((s) => s.name).join(', ');
    doc.need(13);
    doc.line1(`${group.category}:`, { font: 'Helvetica-Bold', size: 9, leading: 12.8, color: INK });
    const labelW = measure(`${group.category}: `, 'Helvetica-Bold', 9);
    const lines = doc.wrap(list, { font: 'Times-Roman', size: 9.4, width: CONTENT_W - labelW });
    doc.paint(lines, {
      font: 'Times-Roman',
      size: 9.4,
      x: MARGIN_X + labelW,
      leading: 12.8,
      color: INK_SOFT,
    });
    doc.space(2.5);
  });

  /* --- Education --- */
  sectionLabel(doc, 'Education');
  education.forEach((item) => {
    doc.need(30);
    doc.line1(`${item.degree} in ${item.field}`, {
      font: 'Times-Bold',
      size: 10.4,
      leading: 13.5,
      color: INK,
    });
    doc.rightAligned(`${item.start} - ${item.end}`, {
      font: 'Helvetica',
      size: 8.6,
      leading: 13.5,
      color: MUTED,
    });
    doc.line1(item.institution, { font: 'Helvetica', size: 9, leading: 12.5, color: OXBLOOD });
    if (item.honors) {
      doc.line1(item.honors, { font: 'Times-Roman', size: 9.4, leading: 12.5, color: INK_SOFT });
    }
    doc.space(6);
  });

  doc.flush();
  return doc;
}

/* ------------------------------------------------------------------ *
 * Page furniture
 * ------------------------------------------------------------------ */

function addFurniture(pages) {
  const total = pages.length;
  // PDF origin is bottom-left, so the footer sits just above the bottom margin.
  const ruleY = MARGIN_BOTTOM - 16;
  const textY = ruleY - 12;
  return pages.map((ops, index) => {
    const label = `Page ${index + 1} of ${total}`;
    const w = measure(label, 'Helvetica', 7.6);
    const stamp = `BT /F3 ${fmt(7.6)} Tf ${fmt(MUTED[0])} ${fmt(MUTED[1])} ${fmt(MUTED[2])} rg 1 0 0 1 ${fmt(PAGE_W - MARGIN_X - w)} ${fmt(textY)} Tm (${label}) Tj ET`;
    const rule = `${fmt(MARGIN_X)} ${fmt(ruleY)} m ${fmt(PAGE_W - MARGIN_X)} ${fmt(ruleY)} l ${fmt(RULE[0])} ${fmt(RULE[1])} ${fmt(RULE[2])} RG 0.4 w S`;
    return `${ops}\n${rule}\n${stamp}`;
  });
}

/* ------------------------------------------------------------------ *
 * Serialisation
 * ------------------------------------------------------------------ */

function serialise(pages, meta) {
  const bodies = [];
  const add = (body) => {
    bodies.push(body);
    return bodies.length; // object number
  };

  const catalogNo = add(null); // reserved, patched below
  const pagesNo = add(null);

  const fontNos = {};
  for (const name of FONTS) {
    fontNos[name] = add(
      `<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`,
    );
  }

  const pageNos = [];
  const contentNos = [];
  for (const ops of pages) {
    // Page objects are numbered first so /Parent and /Kids stay stable; the
    // bodies are patched once the content stream numbers are known.
    pageNos.push(add(null));
    contentNos.push(null);
  }
  pages.forEach((ops, i) => {
    contentNos[i] = add(
      `<< /Length ${Buffer.byteLength(ops, 'latin1')} >>\nstream\n${ops}\nendstream`,
    );
  });

  bodies[catalogNo - 1] = `<< /Type /Catalog /Pages ${pagesNo} 0 R >>`;
  bodies[pagesNo - 1] = `<< /Type /Pages /Kids [${pageNos
    .map((n) => `${n} 0 R`)
    .join(' ')}] /Count ${pageNos.length} >>`;

  const resources = `<< /Font << ${FONTS.map((n) => `/${FONT_REF[n]} ${fontNos[n]} 0 R`).join(' ')} >> >>`;

  pages.forEach((_, i) => {
    bodies[pageNos[i] - 1] =
      `<< /Type /Page /Parent ${pagesNo} 0 R ` +
      `/MediaBox [0 0 ${fmt(PAGE_W)} ${fmt(PAGE_H)}] ` +
      `/Resources ${resources} /Contents ${contentNos[i]} 0 R >>`;
  });

  const infoNo = add(
    `<< /Title (${escapePdf(meta.title)}) /Author (${escapePdf(meta.author)}) ` +
      `/Subject (${escapePdf(meta.subject)}) /Keywords (${escapePdf(meta.keywords)}) ` +
      `/Creator (${escapePdf(meta.creator)}) /Producer (hand-rolled, zero dependencies) ` +
      `/CreationDate (D:${meta.date}) >>`,
  );

  const header = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const chunks = [Buffer.from(header, 'latin1')];
  let offset = Buffer.byteLength(header, 'latin1');

  const offsets = [];
  bodies.forEach((body, i) => {
    offsets.push(offset);
    const buf = Buffer.from(`${i + 1} 0 obj\n${body}\nendobj\n`, 'latin1');
    chunks.push(buf);
    offset += buf.length;
  });

  const xrefStart = offset;
  let xref = `xref\n0 ${bodies.length + 1}\n0000000000 65535 f \n`;
  for (const value of offsets) xref += `${String(value).padStart(10, '0')} 00000 n \n`;

  xref += `trailer\n<< /Size ${bodies.length + 1} /Root ${catalogNo} 0 R /Info ${infoNo} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  chunks.push(Buffer.from(xref, 'latin1'));
  return Buffer.concat(chunks);
}

/* ------------------------------------------------------------------ *
 * main
 * ------------------------------------------------------------------ */

const { cv } = await import('../src/data/cv.ts');

const doc = build(cv);
const pages = addFurniture(doc.pages);

const now = new Date();
const stamp =
  `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}` +
  `${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}Z`;

const buffer = serialise(pages, {
  title: `${cv.profile.name} - ${cv.profile.role}`,
  author: cv.profile.name,
  subject: 'Curriculum Vitae',
  keywords: cv.skills.flatMap((g) => g.skills.map((s) => s.name)).join(', '),
  creator: 'cv-keren resume generator',
  date: stamp,
});

writeFileSync(OUT, buffer);

console.log(
  `resume.pdf written: ${pages.length} page(s), ${(buffer.length / 1024).toFixed(1)} KB -> ${OUT}`,
);
