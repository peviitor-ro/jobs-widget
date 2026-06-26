import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const TAG_FILE = 'conf/local_tag.md';

function readTagFile() {
  const text = readFileSync(TAG_FILE, 'utf-8').trim();
  const lines = text.split('\n').map(l => l.trim());
  const tag = lines[0];
  const sourceLine = lines.find(l => /sursa?\s*:/i.test(l.replace(/[*"]/g, '')));
  const source = sourceLine
    ? sourceLine.replace(/^[*\s]*sursa?\s*:\s*/i, '')
    : '';

  if (!tag) throw new Error(`No tag found in ${TAG_FILE}`);
  if (!source) throw new Error(`No sursa found in ${TAG_FILE}`);

  return { tag, source };
}

function runOpencodeWithRetry(prompt, timeoutMs = 900000) {
  const cmd = `opencode run --model opencode/big-pickle --dangerously-skip-permissions`;
  const stdout = execSync(cmd,
    { input: prompt, timeout: timeoutMs, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, shell: true });
  return stdout;
}

async function main() {
  const { tag, source } = readTagFile();
  const outputPath = `filter/${tag}.md`;

  console.error(`Tag: ${tag}`);
  console.error(`Source: ${source}`);
  console.error(`Output: ${outputPath}`);

  try {
    console.error('Fetching curriculum page...');
    const raw = execSync(`curl -sL "${source}"`, { encoding: 'utf-8', timeout: 30000, shell: true });

    // Strip HTML to clean text
    const clean = raw
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    console.error(`Fetched and cleaned: ${clean.length} chars`);

    // Phase 1: extract specializations + subjects as JSON (fast, small output)
    const extractPrompt = `Extract the curriculum data from the text below as a JSON object.

Return ONLY valid JSON with this structure:
{
  "university": "University Name",
  "faculty": "Faculty Name",
  "years": "e.g. 2026-2029",
  "specializations": [
    {
      "name": "Specialization Name",
      "years": [
        {
          "year": 1,
          "semesters": [
            {
              "semester": 1,
              "subjects": [
                {"code": "...", "name": "Subject Name"}
              ]
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- Use exact subject/specialization names from the text
- Do NOT invent anything
- Group subjects by year and semester
- Output ONLY the JSON, no other text

Text:
${clean.substring(0, 40000)}`;

    console.error('Phase 1: extracting curriculum structure...');
    const jsonOut = runOpencodeWithRetry(extractPrompt, 900000);

    // Parse the JSON from the output
    const jsonMatch = jsonOut.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from opencode output');
      console.error(`Output preview: ${jsonOut.substring(0, 500)}`);
      process.exit(1);
    }
    const curriculum = JSON.parse(jsonMatch[0]);

    // Phase 2: render markdown from the structured JSON
    let md = `# ${curriculum.faculty} — ${curriculum.university}\n`;
    md += `# Planuri de învățământ ${curriculum.years} (Licență)\n\n`;
    md += `> **Sursă:** ${source}\n\n`;
    md += `## Cuprins\n`;
    for (const spec of curriculum.specializations || []) {
      const anchor = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      md += `1. [${spec.name}](#${anchor})\n`;
    }

    for (const spec of curriculum.specializations || []) {
      md += `\n---\n\n`;
      const anchor = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      md += `## ${spec.name}\n\n`;
      for (const yr of spec.years || []) {
        for (const sem of yr.semesters || []) {
          md += `### Anul ${yr.year}, Semestrul ${sem.semester}\n`;
          md += `| Cod | Denumirea disciplinei |\n`;
          md += `|-----|----------------------|\n`;
          for (const subj of sem.subjects || []) {
            md += `| ${subj.code || '-'} | ${subj.name} |\n`;
          }
          md += `\n`;
        }
      }
    }

    writeFileSync(outputPath, md.trim() + '\n', 'utf-8');
    console.error(`Done — wrote ${outputPath} (${md.length} chars)`);

  } catch (e) {
    throw e;
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
