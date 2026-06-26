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

async function main() {
  const { tag, source } = readTagFile();
  const outputPath = `filter/${tag}.md`;

  console.error(`Tag: ${tag}`);
  console.error(`Source: ${source}`);
  console.error(`Output: ${outputPath}`);

  try {
    console.error('Fetching curriculum page...');
    const raw = execSync(`curl -sL "${source}"`, { encoding: 'utf-8', timeout: 30000, shell: true });

    // Strip HTML to clean text — remove scripts, styles, tags
    const clean = raw
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const curriculumText = clean.substring(0, 50000);
    console.error(`Fetched and cleaned: ${clean.length} chars → ${curriculumText.length} chars sent`);

    const prompt = `Esti un asistent care genereaza planuri de invatamant complete pentru facultati din Romania in format Markdown.

Pe baza textului extras de pe pagina de curriculum a facultatii (mai jos), creeaza fisierul ${outputPath}.

Reguli stricte:
- Pastreaza denumirea exacta a facultatii, specializarilor si disciplinelor
- NU adauga sau inventa discipline care nu exista in textul extras
- Daca nu gasesti toate informatiile, specifica ce ai gasit si ce lipseste
- Formateaza intr-un mod clar, cu tabele pentru fiecare semestru
- FARA text in plus in raspuns — doar continutul markdown al fisierului
- Ordoneaza specializarile exact ca in textul extras

Formatul fisierului:
# Nume Facultate — Nume Universitate
# Planuri de învățământ YYYY–YYYY (Licență)

> **Sursă:** ${source}

## Cuprins
1. [Specializarea 1](#specializarea-1)
2. [Specializarea 2](#specializarea-2)

---

## Specializarea 1
### Anul X, Semestrul Y
| Cod | Denumirea disciplinei |
|-----|----------------------|
| ... | ... |

ACUM, pe baza acestui continut:

${curriculumText.substring(0, 50000)}

Genereaza ${outputPath} cu TOATE specializarile si TOATE disciplinele.`;

    console.error('Generating curriculum with opencode...');
    execSync(`opencode run --model opencode/big-pickle --dangerously-skip-permissions`,
      { input: prompt, timeout: 600000, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, shell: true, stdio: ['pipe', 'inherit', 'inherit'] });

    console.error(`Done — check ${outputPath}`);

  } catch (e) {
    throw e;
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
