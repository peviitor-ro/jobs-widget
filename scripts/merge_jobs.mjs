// Promote agent matcher output (next_jobs_*.json) into jobs_100.json — the
// dataset the frontend widget actually reads (see src/services/api.js).
//
// For every agent's next_jobs_<name>.json this script:
//   - appends jobs that aren't already in jobs_100.json
//   - unions f_tag arrays for jobs that already exist (so a job matched by
//     several agents ends up with all their tags, e.g. ["UTCNAC","UBBFMI"])
//   - drops the matcher-only fields (matchPercentage, reason) to keep the
//     jobs_100.json schema documented in STRUCTURE.md
//
// It is additive: existing jobs and their tags are never removed, so any
// hand-curated entries survive untouched. Runs for every next_jobs_*.json
// present, so new agents (Ada, Medeea, Sofia, ...) are picked up with no edits.

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JOBS_PATH = join(ROOT, 'jobs_100.json');

// Fields kept in jobs_100.json (matchPercentage / reason are intentionally dropped)
const SCHEMA_FIELDS = [
  'url', 'title', 'company', 'location', 'salary',
  'date', 'status', '_version_', '_root_', 'f_tag',
];

// Identity of a job — prefer the canonical URL, fall back to root or title+company
function keyOf(job) {
  return job.url || job._root_ || `${job.title || ''}@${job.company || ''}`;
}

function clean(job) {
  const out = {};
  for (const f of SCHEMA_FIELDS) {
    if (f === 'f_tag') continue;
    if (job[f] !== undefined && job[f] !== null) out[f] = job[f];
  }
  out.f_tag = Array.isArray(job.f_tag) ? [...new Set(job.f_tag)] : [];
  return out;
}

let jobs = [];
try {
  jobs = JSON.parse(readFileSync(JOBS_PATH, 'utf-8'));
} catch {
  jobs = [];
}

const byKey = new Map();
for (const j of jobs) {
  j.f_tag = Array.isArray(j.f_tag) ? j.f_tag : [];
  byKey.set(keyOf(j), j);
}

const files = readdirSync(ROOT).filter((f) => /^next_jobs_.*\.json$/.test(f));
let added = 0;
let retagged = 0;

for (const file of files) {
  let incoming = [];
  try {
    incoming = JSON.parse(readFileSync(join(ROOT, file), 'utf-8'));
  } catch {
    console.warn(`Skipping unreadable ${file}`);
    continue;
  }

  for (const inc of incoming) {
    const key = keyOf(inc);
    const tags = Array.isArray(inc.f_tag) ? inc.f_tag : [];

    if (byKey.has(key)) {
      const existing = byKey.get(key);
      const before = existing.f_tag.length;
      existing.f_tag = [...new Set([...existing.f_tag, ...tags])];
      if (existing.f_tag.length > before) retagged++;
    } else {
      const fresh = clean(inc);
      byKey.set(key, fresh);
      jobs.push(fresh);
      added++;
    }
  }
}

writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 2) + '\n');
console.log(
  `Merged ${files.length} next_jobs file(s): +${added} new job(s), ` +
  `${retagged} existing job(s) got new tag(s). Total now ${jobs.length}.`
);
