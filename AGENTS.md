# Agenți & Pipeline

## Fluxul datelor

```
peviitor API  ──►  fetch_agent_jobs.mjs --all  ──►  agenți (opencode)  ──►  next_jobs_<agent>.json
                                                                                   │
                                                                                   ▼
                                                                       merge_jobs.mjs (promovare)
                                                                                   │
                                                                                   ▼
                                                                       jobs_100.json (citit de widget)
```

1. **Surse joburi**: API-ul peviitor (`https://api.peviitor.ro/v1/search/`) interogat cu termeni ca `software`, `engineer`, `developer`, `programator`, `it`, `ai`, `data`, `embedded`, `automation`, `robot`, `python`, `java`, `web`, `internship`, `intern`, `junior`.
2. **Script**: `scripts/fetch_agent_jobs.mjs --all` adună joburile unice, extrage descrierile, și le trimite tuturor agenților AI.
3. **Agenți AI**: Fiecare agent analizează descrierile și decide dacă jobul se potrivește cu skill-urile persoanei pe care o reprezintă. Rezultatul fiecărui agent se salvează în `next_jobs_<agent>.json` (cu `f_tag`-ul agentului).
4. **Promovare**: `scripts/merge_jobs.mjs` îmbină toate fișierele `next_jobs_*.json` în `jobs_100.json` — adaugă joburile noi, reunește `f_tag`-urile pentru joburile existente și elimină câmpurile de matching (`matchPercentage`, `reason`). E aditiv: nu șterge nimic.
5. **Automatizare**: workflow-ul `.github/workflows/fetch-jobs.yml` rulează pașii 1-4 automat (Lu/Mi/Vi, 06:00 UTC) și face commit la `next_jobs_*.json` + `jobs_100.json`. Astfel agenții noi (ex. Sofia) sunt incluși fără modificări suplimentare — `--all` îi rulează, iar `merge_jobs.mjs` le preia automat output-ul.

---

## Agenți existenți

| Agent | Fișier profil | `f_tag` | Facultatea |
|-------|---------------|---------|------------|
| **Ada** | `agents/Ada.md` | `UTCNAC` | Automatică și Calculatoare, UTCN |
| **Medeea** | `agents/Medeea.md` | `UBVFMIIA` | Informatică Aplicată, Univ. Transilvania Brașov |
| **Sofia** | `agents/Sofia.md` | `UBBFMI` | Matematică și Informatică, UBB Cluj-Napoca |

### Ada

- Studentă la **Facultatea de Automatică și Calculatoare, UTCN**
- Skill-uri: programare (C/C++/Java/Python), AI/ML/Deep Learning/Computer Vision, embedded, automatizări, rețele, securitate
- Rulează pe promptul din `scripts/ada_check.mjs` și filtrează joburi potrivite pentru nivel internship/junior/mid

### Medeea

- Studentă la **Informatică Aplicată, Universitatea Transilvania din Brașov**
- Skill-uri: programare (C/C++/Java/Python/OOP), web (Angular, .Net), mobile (Android), AI/ML/NLP/LLM, cloud, testare, Unity, grafică 3D
- Rulează pe promptul din `scripts/ada_check.mjs` și filtrează joburi potrivite pentru nivel internship/junior/mid

### Sofia

- Studentă la **Facultatea de Matematică și Informatică, UBB Cluj-Napoca** ([cs.ubbcluj.ro](https://www.cs.ubbcluj.ro))
- Skill-uri: programare (C/C++/Java/Python, OOP, SDA, compilatoare), web & mobile (Android, iOS), AI/ML/Deep Learning/NLP/LLM/Computer Vision/RPA, baze de date (distribuite, cloud, BI), embedded/IoT (linia Ingineria Informației), rețele, securitate/criptografie/blockchain, testare/QA, matematică/optimizare
- Înregistrată în `scripts/fetch_agent_jobs.mjs` și filtrează joburi potrivite pentru nivel internship/junior/mid

---

## Validare URL-uri

Înainte de a publica `jobs_100.json`, toate URL-urile trebuie verificate să returneze HTTP 200 (nu 404). Script de test:

```bash
node -e "
const j = require('./jobs_100.json');
async function check() {
  for (let i = 0; i < j.length; i++) {
    try {
      const r = await fetch(j[i].url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' }, signal: AbortSignal.timeout(10000) });
      console.log((i+1) + '. ' + r.status + ' ' + j[i].title);
    } catch(e) {
      console.log((i+1) + '. ERROR ' + j[i].title + ' - ' + e.message.substring(0,60));
    }
  }
}
check();
"
```

Orice URL cu status diferit de 200 trebuie înlocuit sau eliminat înainte de commit.

---

## Cum se adaugă un agent nou

Vezi `INSTRUCTIONS.md` — pașii sunt:

1. Creează fișierul de profil în `filter/NUME.md` (competențele persoanei)
2. Creează agentul în opencode
3. Actualizează workflow-ul n8n
4. Adaugă `f_tag` în jobs

---

## Fișiere relevante

| Fișier | Rol |
|--------|-----|
| `scripts/fetch_agent_jobs.mjs` | Extrage joburi din API, rulează agenții (`--all` = toți), generează `next_jobs_<agent>.json` |
| `scripts/merge_jobs.mjs` | Promovează `next_jobs_*.json` în `jobs_100.json` (adaugă joburi, reunește `f_tag`-uri) |
| `.github/workflows/fetch-jobs.yml` | Workflow programat care leagă fetch → match → merge → commit |
| `agents/Ada.md` | Profilul agentului Ada (prompt + skill-uri) |
| `agents/Medeea.md` | Profilul agentului Medeea (prompt + skill-uri) |
| `agents/Sofia.md` | Profilul agentului Sofia (prompt + skill-uri) |
| `filter/UTCNAC.md` | Curriculum-ul UTCN Automatică și Calculatoare |
| `filter/UBVFMIIA.md` | Curriculum-ul UBV Informatică Aplicată |
| `filter/UBBFMI.md` | Curriculum-ul UBB Matematică și Informatică (2025-2026) |
| `jobs_100.json` | Subset de joburi folosit de frontend (cu fallback local) |
| `jobs_ada_matched.json` | Output complet după procesarea agenților |
| `src/services/api.js` | Frontend: încarcă `jobs_100.json` din GitHub, cu fallback local |
