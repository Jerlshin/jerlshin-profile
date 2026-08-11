#!/usr/bin/env node
// scripts/port-legacy-data.mjs
//
// One-shot: reads src/portfolioData.json (the pre-migration "central source
// of truth" that App.jsx actually ignored — audit finding #1) and emits the
// target .mdx/.yaml collections defined in src/content.config.ts.
//
// What this script does NOT do: invent facts that exist nowhere in the
// source. Several schema-required fields (research abstracts, complete
// author lists beyond the named "et al." lead, project repo/live URLs,
// certification verification) have no source value to port. Inventing them
// would put false professional/academic claims on a live site, which is a
// worse failure mode than the one this whole migration exists to fix (see
// plan §1.1). Those entries are written with every real fact captured, but
// filed with a leading underscore so the collection loader's `[^_]` glob
// (content.config.ts) excludes them from the build until a human — who
// actually knows the missing facts — fills them in and drops the prefix.
//
// ── RETAINED AS A RECORD; IT CAN NO LONGER RUN. ────────────────────────────
//
// `src/portfolioData.json` was deleted at the end of Phase 2, once its output
// had been validated, so the `readFileSync` below now throws ENOENT. That is
// deliberate and it is not a bug to fix: the script is kept because it is the
// reviewable record of exactly which fields were derived mechanically from the
// v1 data and which were hand-authored afterwards. Restore the JSON from the
// `v1-spa` tag if it ever needs to be re-run and diffed.
//
// It is not wired into any npm script, so nothing invokes it by accident.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SOURCE = JSON.parse(readFileSync(path.join(ROOT, 'src/portfolioData.json'), 'utf8'));

// ── minimal YAML writer (block style, tailored to this file's data shapes) ──

function yamlScalar(v) {
  if (v === null) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v; // bare YAML timestamp
    return JSON.stringify(v); // double-quoted, escaped — safe for any string
  }
  throw new Error(`unsupported scalar: ${JSON.stringify(v)}`);
}

function fieldLine(key, v, indent) {
  const pad = '  '.repeat(indent);
  if (Array.isArray(v)) {
    if (v.length === 0) return `${pad}${key}: []`;
    if (typeof v[0] === 'object' && v[0] !== null) {
      return `${pad}${key}:\n${v.map((item) => listObjectItem(item, indent + 1)).join('\n')}`;
    }
    return `${pad}${key}: [${v.map(yamlScalar).join(', ')}]`;
  }
  if (v !== null && typeof v === 'object') {
    return `${pad}${key}:\n${objectBlock(v, indent + 1)}`;
  }
  return `${pad}${key}: ${yamlScalar(v)}`;
}

function objectBlock(obj, indent) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => fieldLine(k, v, indent))
    .join('\n');
}

function listObjectItem(obj, indent) {
  const pad = '  '.repeat(indent);
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  return entries
    .map(([k, v], i) => {
      const line = fieldLine(k, v, indent + 1).trimStart();
      return i === 0 ? `${pad}- ${line}` : `${pad}  ${line}`;
    })
    .join('\n');
}

const toYamlDocument = (items) => items.map((item) => listObjectItem(item, 0)).join('\n') + '\n';
const toFrontmatter = (obj) => `---\n${objectBlock(obj, 0)}\n---\n`;

const write = (relPath, content) => {
  const abs = path.join(ROOT, relPath);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  console.log(`wrote ${relPath}`);
};

// ── period string -> {start, end} — "May 2025 - Oct 2025" -> ISO dates ──
// Day is always pinned to 01 (plan §5.3): exact days were never tracked.

const MONTHS = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
};
function parsePeriod(period) {
  const [from, to] = period.split(' - ').map((s) => s.trim());
  const toISO = (s) => {
    const [mon, year] = s.split(' ');
    const key = mon.slice(0, 3); // source mixes "Jul" and "July" — normalize
    return `${year}-${MONTHS[key]}-01`;
  };
  return { start: toISO(from), end: toISO(to) };
}

// ═════════════════════════════════════════════════════════════════════════
// about.mdx — profile.about becomes prose that can grow, not a fixed string
// ═════════════════════════════════════════════════════════════════════════

write('src/content/about.mdx', `---\ntitle: "About"\n---\n\n${SOURCE.profile.about}\n`);

// ═════════════════════════════════════════════════════════════════════════
// experience.yaml — every fact here is present in the source; no gaps.
// Botter Solutions location corrected per APPROVED DECISION (c): the source
// JSON says "Haryana, India" but that's the stale copy — App.jsx already had
// the fix. Bangalore is applied here explicitly, not inherited from either.
// ═════════════════════════════════════════════════════════════════════════

const EXPERIENCE_META = [
  {
    id: 'augsburg-dl-researcher',
    kind: 'research',
    summary:
      'Multimodal gait analysis integrating video-based pose estimation with wearable IMU and ECG signals, using a hybrid pipeline for high-fidelity temporal alignment.',
    stack: ['Pose Estimation', 'IMU', 'ECG', 'Signal Synchronization'],
  },
  {
    id: 'ntu-ml-researcher',
    kind: 'research',
    summary:
      'Multimodal physiological signal analysis for educational assessment using ECG and GSR data across 73 participants, with cross-subject validation and domain-shift analysis.',
    stack: ['ECG', 'GSR', 'Wavelet Denoising', 'Signal Processing'],
  },
  {
    id: 'botter-ai-developer',
    kind: 'industry',
    locationOverride: 'Bangalore, India', // APPROVED DECISION (c)
    summary:
      'End-to-end transformer-based AI pipeline for intelligent table recognition, with multi-cloud inference across Vertex AI, SageMaker, and Azure ML.',
    stack: ['Transformers', 'Vertex AI', 'AWS SageMaker', 'Azure ML', 'MinerU'],
  },
  {
    id: 'tekaccel-ai-intern',
    kind: 'internship',
    summary:
      'LangGraph-based orchestration for context-aware AI interactions, with RAG latency cut 63% via GPU threading, Qdrant indexing, and Neo4j graph reasoning.',
    stack: ['LangGraph', 'Qdrant', 'Neo4j', 'RAG'],
  },
];

const experienceEntries = SOURCE.experience.map((job, i) => {
  const meta = EXPERIENCE_META[i];
  const { start, end } = parsePeriod(job.period);
  return {
    id: meta.id,
    role: job.role,
    organization: job.company,
    location: meta.locationOverride ?? job.location,
    kind: meta.kind,
    start,
    end,
    summary: meta.summary,
    highlights: job.description,
    stack: meta.stack,
  };
});

write('src/content/experience.yaml', toYamlDocument(experienceEntries));

// ═════════════════════════════════════════════════════════════════════════
// education.yaml — exact enrollment/graduation months are not recorded
// anywhere in the source (only "2021 - 2025"). Using plan §5.2's suggested
// placeholder (July intake / May graduation) pending confirmation.
// ═════════════════════════════════════════════════════════════════════════

const edu = SOURCE.education[0];
write(
  'src/content/education.yaml',
  toYamlDocument([
    {
      id: 'vit-btech-cse',
      degree: edu.degree,
      specialization: edu.specialization.replace(/^Specialization in /, ''),
      institution: edu.institution,
      location: edu.location,
      start: '2021-07-01', // TODO: confirm exact month — plan §5.2 placeholder
      end: '2025-05-01', // TODO: confirm exact month — plan §5.2 placeholder
      grade: edu.grade.replace(/^CGPA:\s*/, '') + ' / 10 CGPA',
      thesis: {
        title: edu.thesis,
        // entry: 'seed-classification-moe' — reference('research') left unset:
        // that paper is still a `_`-prefixed draft (see below), and a
        // reference() to a not-yet-live collection entry fails the build.
        // Add it back once research/seed-classification-moe loses its prefix.
      },
    },
  ]),
);

// ═════════════════════════════════════════════════════════════════════════
// skills.yaml — the four-category grouping is preserved verbatim (plan §5.7)
// ═════════════════════════════════════════════════════════════════════════

const SKILL_IDS = {
  'Languages & Core': 'languages-core',
  'Machine Learning': 'machine-learning',
  'AI Frameworks': 'ai-frameworks',
  'Research Focus': 'research-focus',
};

const skillEntries = Object.entries(SOURCE.skills).map(([category, items], i) => ({
  id: SKILL_IDS[category],
  category,
  order: i + 1,
  items,
}));

write('src/content/skills.yaml', toYamlDocument(skillEntries));

// ═════════════════════════════════════════════════════════════════════════
// achievements.yaml — awards destructure cleanly from source strings (plan
// §5.6). Certifications are deliberately NOT emitted here: the source gives
// only a title string per cert, no date, and no verification URL or
// credential ID — and achievements.refine() rejects a `kind: certification`
// entry without one. Inventing a verification link for a real credential
// would be a fabricated claim, not a port. See the TODO block below.
// ═════════════════════════════════════════════════════════════════════════

const AWARD_META = [
  { id: 'gavs-hackathon-2024', kind: 'hackathon', date: '2024-05-01', standing: { rank: 1 } },
  {
    id: 'bits-pilani-open-2025',
    kind: 'competition',
    date: '2025-01-01',
    standing: { rank: 5, label: 'Finalist', outOf: 2500 },
  },
  { id: 'vit-program-rep-2022', kind: 'leadership', date: '2022-01-01' },
];

const awardEntries = SOURCE.awards.map((award, i) => {
  const meta = AWARD_META[i];
  const title = award.title.replace(/^(Winner|Finalist)\s*-\s*/, '');
  return {
    id: meta.id,
    title,
    issuer: award.organization,
    date: meta.date,
    kind: meta.kind,
    standing: meta.standing,
    description: award.desc,
  };
});

write(
  'src/content/achievements.yaml',
  toYamlDocument(awardEntries) +
    `
# TODO — certifications (plan §5.6), NOT ported: each needs a verification
# URL or credentialId (achievements.refine() requires one for kind:
# certification) plus an issue date, none of which exist in portfolioData.json.
# Source titles, for reference:
#   - Natural Language Processing Specialization (DeepLearning.AI)
#   - Generative Adversarial Networks Specialization (DeepLearning.AI)
#   - Deep Learning Specialization (DeepLearning.AI)
#   - Machine Learning Specialization (Stanford University)
`,
);

// ═════════════════════════════════════════════════════════════════════════
// projects/*/​_index.mdx — descriptions in the source are real, usable
// prose, so summary/body port cleanly. Two of three are "shipped" (plan
// §5.4 table) and achievements.refine() requires a repo or live link for
// shipped status — no URL exists in the source for any of the three, so all
// three ship as drafts (`_index.mdx`) pending real links and dates.
// ═════════════════════════════════════════════════════════════════════════

const PROJECT_META = [
  {
    slug: 'graph-multitask-medical-imaging',
    category: 'research',
    status: 'shipped',
    tags: ['graph-neural-networks', 'medical-imaging', 'multi-task-learning'],
    metrics: [{ label: 'PH2 dataset', value: 'SOTA' }],
    related: ['superpixel-graph-skin-lesion'], // reference('research') — plan §5.4
  },
  {
    slug: 'adaptive-learning-device',
    category: 'engineering',
    status: 'prototype',
    tags: ['llm', 'edge-inference', 'adaptive-learning'],
  },
  {
    slug: 'healthcare-communication-platform',
    category: 'engineering',
    status: 'shipped',
    tags: ['multi-agent', 'lora-peft', 'healthcare'],
  },
];

for (const [i, project] of SOURCE.projects.entries()) {
  const meta = PROJECT_META[i];
  const frontmatter = toFrontmatter({
    title: project.title,
    summary: project.description,
    category: meta.category,
    status: meta.status,
    start: '2024-01-01', // TODO: confirm real start date — not in source
    end: null,
    stack: project.tech,
    tags: meta.tags,
    metrics: meta.metrics,
    related: meta.related,
  });
  write(
    `src/content/projects/${meta.slug}/_index.mdx`,
    `${frontmatter}\n${project.description}\n\n<!-- TODO before removing the \`_\` draft prefix:\n     - confirm start/end dates\n     - add links.repo or links.live (required: status is "${meta.status}")\n     - expand into a real case-study body -->\n`,
  );
}

// ═════════════════════════════════════════════════════════════════════════
// research/*/​_index.mdx — the source gives only a title, venue, year, and a
// possibly-truncated author string ("…, et al."). There is no abstract
// anywhere in the source: research.abstract (min 80 chars) would have to be
// invented from nothing, and research.refine() #3 needs a complete, real
// author list. Both are academic-integrity-sensitive, so every paper ports
// as a draft with only the confirmed facts filled in.
// ═════════════════════════════════════════════════════════════════════════

const RESEARCH_META = [
  {
    slug: 'seed-classification-moe',
    venue: { name: 'Expert Systems with Applications', short: 'ESWA', kind: 'journal' },
    topics: ['self-supervised-learning', 'mixture-of-experts', 'fine-grained-classification'],
    authors: [{ name: 'Jerlshin J G', isMe: true }],
  },
  {
    slug: 'superpixel-graph-skin-lesion',
    venue: { name: 'IEEE Access', short: 'IEEE Access', kind: 'journal' },
    topics: ['skin-lesion-diagnosis', 'graph-neural-networks', 'explainable-ai'],
    authors: [{ name: 'Jerlshin J G', isMe: true }],
  },
  {
    slug: 'vit-human-action-recognition',
    venue: { name: 'Information Processing and Management', short: 'IPM', kind: 'journal' },
    topics: ['vision-transformers', 'human-action-recognition', 'domain-adaptation'],
    // Source order is "Sarkar R., Jerlshin J.G., et al." — order preserved.
    authors: [{ name: 'R. Sarkar' }, { name: 'Jerlshin J G', isMe: true }],
  },
];

for (const [i, pub] of SOURCE.publications.entries()) {
  const meta = RESEARCH_META[i];
  const frontmatter = toFrontmatter({
    title: pub.title,
    authors: meta.authors,
    venue: { ...meta.venue, year: Number(pub.year) },
    status: 'under-review',
    date: `${pub.year}-01-01`, // TODO: confirm real submission/status date
    abstract:
      'TODO — no abstract exists in the source data (portfolioData.json only ever stored a title). Write the real abstract before removing the draft prefix; min 80 characters.',
    tldr: 'TODO — one-line summary for cards and OG images.',
    topics: meta.topics,
  });
  write(
    `src/content/research/${meta.slug}/_index.mdx`,
    `${frontmatter}\n<!-- TODO before removing the \`_\` draft prefix:\n     - write a real abstract (min 80 chars) and tldr (max 240 chars)\n     - add the remaining "et al." co-authors, in the correct order\n     - confirm the status date -->\n`,
  );
}

console.log('\nDone. Live (build-visible): experience.yaml, education.yaml, skills.yaml,');
console.log('achievements.yaml (awards only), about.mdx.');
console.log('Draft (excluded by the `_` prefix, pending real facts): all 3 research entries,');
console.log('all 3 project entries, and the 4 certifications (not yet written at all).');
