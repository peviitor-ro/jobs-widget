# Structura fișierului `jobs.json`

`jobs.json` este un array JSON care conține **joburi matcheate** de agentul AI. Fiecare obiect reprezintă un anunț de loc de muncă care s-a potrivit cu profilul unei persoane.

---

## Câmpurile unui obiect job

| Câmp | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| `url` | `string` | da | Link-ul direct către anunțul original |
| `title` | `string` | da | Titlul postului |
| `company` | `string` | da | Numele companiei angajatoare |
| `location` | `string[]` | da | Lista de orașe/locații (de obicei un singur element) |
| `salary` | `string[]` | nu | Salariul exprimat ca string (ex: `"4000-6000 RON"`) |
| `date` | `string` (ISO 8601) | nu | Data publicării anunțului |
| `status` | `string` | da | Starea anunțului — întotdeauna `"published"` |
| `_version_` | `number` | da | Identificator intern de versionare (probabil SolR) |
| `_root_` | `string` | da | URL-ul rădăcină (de obicei identic cu `url`) |
| `f_tag` | `string[]` | da | Tag-ul (tag-urile) de filtrare |
| `matchPercentage` | `number` | da | Scorul de potrivire calculat de agentul AI (0–100) |
| `reason` | `string` | da | Justificarea oferită de agent pentru match |

### Exemplu

```json
{
  "url": "https://www.olx.ro/oferta/...",
  "title": "Software Developer Junior",
  "company": "Tech Company SRL",
  "location": ["Cluj-Napoca"],
  "salary": ["4000-6000 RON"],
  "date": "2026-05-21T00:00:00Z",
  "status": "published",
  "_version_": 1865967876689625093,
  "_root_": "https://www.olx.ro/oferta/...",
  "f_tag": ["UTCNAC"],
  "matchPercentage": 85,
  "reason": "Se potrivește cu competențele de programare (C/C++/Java/Python) și cerințele pentru nivel junior."
}
```

---

## Câmpul `f_tag` în detaliu

Câmpul `f_tag` (array de string-uri) asociază fiecare job cu una sau mai multe **persoane (agenți)** care caută activ un loc de muncă. Fiecare valoare din array corespunde numelui unui fișier Markdown din directorul `filter/` (fără extensia `.md`).

### Cum funcționează

1. În `filter/` există fișiere de tip `NUME.md` care descriu **competențele** unei persoane (curriculum universitar, skill-uri tehnice, certificări).
2. Un agent AI (definit în `agents/`) analizează fiecare anunț de job și, dacă skill-urile persoanei se potrivesc cu descrierea jobului, adaugă tag-ul respectiv în `f_tag` împreună cu un scor și o justificare.
3. Astfel, un job poate fi etichetat cu mai multe tag-uri dacă se potrivește cu mai multe persoane.

---

## Surse de proveniență

Joburile sunt agregate din următoarele platforme:

- **ANOFM** — `https://mediere.anofm.ro/`
- **OLX** — `https://www.olx.ro/`
- **bestjobs** — `https://www.bestjobs.eu/`
- **publi24** — `https://www.publi24.ro/`
- **jobviewtrack** — URL-uri trackate (sursa originală poate varia)
- **hipo** — `https://www.hipo.ro/`
- **iajob** — `https://www.iajob.ro/`
- **oferimdemunca** — `https://oferimdemunca.ro/`
- **ceragon**, **hootsuite**, **mastercard**, **JTI**, **DIVERSEY**, etc. — cariere directe ale companiilor
