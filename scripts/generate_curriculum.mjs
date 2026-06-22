import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const TAG_FILE = 'local_tag.md';

function readTagFile() {
  const text = readFileSync(TAG_FILE, 'utf-8').trim();
  const lines = text.split('\n').map(l => l.trim());
  const tag = lines[0];
  const sourceLine = lines.find(l => l.startsWith('sursa:') || l.startsWith('sursa :'));
  const source = sourceLine
    ? sourceLine.replace(/^sursa\s*:\s*/, '')
    : '';

  if (!tag) throw new Error(`No tag found in ${TAG_FILE}`);
  if (!source) throw new Error(`No sursa found in ${TAG_FILE}`);

  return { tag, source };
}

function runOpencode(promptText) {
  const args = [
    'run', '--model', 'opencode/big-pickle', '--format', 'json',
    '--dangerously-skip-permissions', promptText,
  ];
  const cmd = `opencode ${args.map(a => JSON.stringify(a)).join(' ')}`;
  console.error(`Running opencode...`);

  const stdout = execSync(cmd,
    { timeout: 600000, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, shell: true });

  let text = '';
  for (const line of stdout.split('\n').filter(l => l.trim())) {
    try {
      const ev = JSON.parse(line);
      if (ev.type === 'text') text += ev.part?.text || '';
    } catch {}
  }
  return text.trim();
}

async function main() {
  const { tag, source } = readTagFile();
  console.error(`Tag: ${tag}`);
  console.error(`Source: ${source}`);

  const prompt = `Esti un asistent care genereaza planuri de invatamant complete pentru facultati din Romania in format Markdown.

    Sarcina ta:
    1. Acceseaza URL-ul: ${source}
    2. Extrage TOATE specializarile/programele de licenta mentionate acolo
    3. Pentru fiecare specializare, extrage TOATE disciplinele pe ani si semestre
    4. Grupeaza disciplinele corect: obligatorii, optionale
    5. Formateaza rezultatul in Markdown, similar cu exemplul de mai jos

    Reguli stricte:
    - Pastreaza denumirea exacta a facultatii, specializarilor si disciplinelor
    - NU adauga sau inventa discipline care nu exista in sursa
    - Daca nu gasesti toate informatiile, specifica ce ai gasit si ce lipseste
    - Formateaza intr-un mod clar, cu tabele pentru fiecare semestru

    Exemplu de format:
    \`\`\`markdown
    # Nume Facultate — Nume Universitate

    ## 1. Specializarea X

    ### Anul I

    #### Semestrul 1

    | Disciplina | Tip |
    |---|---|
    | Disciplina 1 | Obligatorie |
    | Disciplina 2 | Obligatorie |

    #### Semestrul 2

    | Disciplina | Tip |
    |---|---|
    | Disciplina 3 | Obligatorie |
    \`\`\``;

  console.error('Generating curriculum...');
  const result = runOpencode(prompt);

  if (!result) {
    throw new Error('Empty result from opencode');
  }

  const outputPath = `filter/${tag}.md`;
  writeFileSync(outputPath, result, 'utf-8');
  console.error(`✅ Written to ${outputPath} (${result.length} characters)`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
