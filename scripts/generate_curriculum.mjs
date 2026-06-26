import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

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

  // Create temp dir for PDFs
  const tmpDir = mkdtempSync(join(tmpdir(), 'curric-'));
  const pdfDir = join(tmpDir, 'pdfs');
  const txtDir = join(tmpDir, 'txt');
  execSync(`mkdir -p "${pdfDir}" "${txtDir}"`, { shell: true });

  try {
    // Step 1: Fetch HTML and extract PDF URLs
    console.error('Fetching curriculum page...');
    const html = execSync(`curl -sL "${source}"`, { encoding: 'utf-8', timeout: 30000, shell: true });
    const pdfUrls = [...html.matchAll(/href="([^"]*Plan_inv[^"]*\.pdf)"|href="([^"]*FL_plan[^"]*\.pdf)"|href="([^"]*Plan_inv[^"]*\.pdf)"/gi)]
      .map(m => m[1] || m[2] || m[3])
      .filter(Boolean)
      .map(u => u.startsWith('http') ? u : new URL(u, source).href);
    const unique = [...new Set(pdfUrls)];
    console.error(`Found ${unique.length} PDFs`);

    if (unique.length === 0) {
      // Fallback: try finding any PDF
      const anyPdf = [...html.matchAll(/href="([^"]*\.pdf)"/gi)].map(m => m[1]).filter(Boolean);
      const anyUnique = [...new Set(anyPdf)].map(u => u.startsWith('http') ? u : new URL(u, source).href);
      console.error(`Fallback: found ${anyUnique.length} PDFs (any)`);
      unique.push(...anyUnique);
    }

    // Step 2: Download PDFs
    console.error('Downloading PDFs...');
    const pdfFiles = [];
    for (const url of unique) {
      const name = url.split('/').pop() || `pdf_${pdfFiles.length}.pdf`;
      const dest = join(pdfDir, name);
      try {
        execSync(`curl -sL "${url}" -o "${dest}"`, { timeout: 30000, shell: true });
        if (existsSync(dest) && readFileSync(dest).length > 1000) {
          pdfFiles.push({ name, path: dest });
        }
      } catch (e) {
        console.error(`  Failed to download ${name}: ${e.message}`);
      }
    }
    console.error(`Downloaded ${pdfFiles.length}/${unique.length} PDFs`);

    // Step 3: Extract text from PDFs
    console.error('Extracting text from PDFs...');
    const allText = [];
    for (const { name, path: pdfPath } of pdfFiles) {
      const txtPath = join(txtDir, name.replace(/\.pdf$/i, '') + '.txt');
      try {
        execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`, { timeout: 60000, shell: true });
        if (existsSync(txtPath)) {
          const text = readFileSync(txtPath, 'utf-8').trim();
          if (text.length > 50) {
            allText.push(`=== ${name.replace(/\.pdf$/i, '')} ===\n${text}`);
          }
        }
      } catch (e) {
        console.error(`  Failed to extract ${name}: ${e.message}`);
      }
    }
    console.error(`Extracted text from ${allText.length} PDFs`);

    if (allText.length === 0) {
      throw new Error('No text could be extracted from any PDF');
    }

    // Step 4: Send to opencode for structuring
    const curriculumText = allText.join('\n\n---\n\n');
    console.error(`Total extracted text: ${curriculumText.length} chars`);

    const prompt = `Esti un asistent care genereaza planuri de invatamant complete pentru facultati din Romania in format Markdown.

Pe baza textului extras din PDF-urile planurilor de invatamant de mai jos, creeaza fisierul ${outputPath}.

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

ACUM, pe baza acestui text extras din PDF-uri:

${curriculumText.substring(0, 50000)}

Genereaza ${outputPath} cu TOATE specializarile si TOATE disciplinele.`;

    console.error('Generating curriculum with opencode...');
    execSync(`opencode run --model opencode/big-pickle --dangerously-skip-permissions`,
      { input: prompt, timeout: 600000, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, shell: true, stdio: ['pipe', 'inherit', 'inherit'] });

    console.error(`Done — check ${outputPath}`);

  } finally {
    // Cleanup
    execSync(`rm -rf "${tmpDir}"`, { shell: true });
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
