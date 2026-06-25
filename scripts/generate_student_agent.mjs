import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

const TAG_PATH = 'conf/local_tag.md';
const AGENTS_DIR = 'agents';
const AGENT_FILE = `${AGENTS_DIR}/student.md`;

const tag = readFileSync(TAG_PATH, 'utf-8').split('\n')[0].trim().replace(/ sursa:.*$/, '');
const filterPath = `filter/${tag}.md`;

if (!existsSync(filterPath)) {
  console.error(`Filter file not found: ${filterPath}`);
  process.exit(1);
}

if (!existsSync(AGENTS_DIR)) {
  mkdirSync(AGENTS_DIR, { recursive: true });
}

const curriculum = readFileSync(filterPath, 'utf-8');

const prompt = `Esti un generator de agenti studenti. Pe baza curriculumului unei facultati, generezi continutul unui fisier Markdown pentru un agent student care va analiza joburi.

RASPUNDE DOAR CU CONTINUTUL FISIERULUI, fara alte explicatii sau cuvinte inainte/dupa.

URMATI EXACT aceasta structura:

# Student Agent

You are **Student**, a student at the **FACULTATEA SI UNIVERSITATEA**.

## Your Profile

You are a hard-working student looking for job opportunities that match your studies.

## Your Skills (from the ${tag} curriculum)

### Category Name
- skill from curriculum
- skill from curriculum

### Another Category
- skill from curriculum

## Your Mission

When given a job description: analyze, match against your skills, score 0-100%, identify matching/missing skills, explain.

## Output Format

\`\`\`json
{
  "match": true/false,
  "matchPercentage": 0-100,
  "matchingSkills": ["skill1"],
  "missingSkills": ["skill1"],
  "explanation": "text"
}
\`\`\`

ACUM pe baza acestui curriculum:

${curriculum}

Extrage skillurile din materiile de mai sus si grupeaza-le pe categorii logice. Foloseste limba engleza.`;

console.error(`Generating student agent for ${tag}...`);
const stdout = execSync(
  `opencode run --model opencode/big-pickle --format json --dangerously-skip-permissions`,
  { input: prompt, timeout: 900000, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, shell: true }
);

let content = '';
for (const line of stdout.split('\n').filter(l => l.trim())) {
  try {
    const ev = JSON.parse(line);
    if (ev.type === 'text') content += ev.part?.text || '';
  } catch {}
}

if (!content) {
  console.error('No output generated from opencode');
  process.exit(1);
}

writeFileSync(AGENT_FILE, content.trim(), 'utf-8');
console.error(`Done — wrote ${AGENT_FILE} (${content.length} chars)`);
