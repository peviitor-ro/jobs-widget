# Ghid pentru facultăți — Cum să folosești widget-ul de joburi

Acest ghid descrie pașii pe care o facultate trebuie să îi urmeze pentru a-și configura propriul widget de joburi filtrat pe baza competențelor studenților săi.

---

## 1. Generează tag-ul unic al facultății

Din **Actions** tab-ul repository-ului, rulează workflow-ul **Genereaza Tag Unic Facultate**.

Completează câmpurile:
- **Numele universității** (ex: `Universitatea Babeș-Bolyai`)
- **Orașul** din care face parte facultatea (ex: `Cluj-Napoca`)
- **Numele facultății** (ex: `Facultatea de Psihologie și Științe ale Educației`)

Workflow-ul va genera un tag unic (ex: `UBBFPSE`) și îl va adăuga în fișierul `centralized/unicodes.csv`.

---

## 2. Creează un repository nou

Folosește butonul **Use this template** din repository-ul [peviitor-ro/jobs-widget](https://github.com/peviitor-ro/jobs-widget) pentru a crea un repository nou pentru facultatea ta.

> **Notă:** Repository-ul creat trebuie să fie **public** pentru ca GitHub Pages să funcționeze corect și pentru ca widget-ul să fie accesibil.

---

## 3. Creează fișierul `conf/local_tag.md`

În noul tău repository, în folderul `conf/`, creează manual un fișier numit `local_tag.md`.

Conținutul va fi:

```
TAG
sursa: <link-ul către pagina cu curriculum-ul facultății>
```

**Exemplu:**
```
UBBFPSE
sursa: https://www.psiedu.ubbcluj.ro/ro/planuri-de-invatamant
```

Pe prima linie se află tag-ul unic generat la pasul 1. Pe a doua linie, prefixat cu `sursa: `, se află link-ul către pagina oficială a facultății care conține planul de învățământ / curriculum-ul.

---

## 4. Rulează pipeline-ul complet

Din **Actions** tab, rulează workflow-ul **Full Pipeline**.

Acesta va:
1. Genera fișierul `filter/<TAG>.md` (curriculum-ul structurat pe baza sursei din `local_tag.md`)
2. Genera agentul `agents/student.md` (prompt personalizat pentru AI)
3. Rula scriptul `scripts/fetch_agent_jobs.mjs` pentru a interoga API-ul peviitor.ro
4. Analiza fiecare job cu ajutorul AI
5. Salva joburile potrivite în `jobs.json` (cu `f_tag`, `matchPercentage` și `reason`)
6. Face deploy pe GitHub Pages

---

## 5. Activează GitHub Pages

Din **Settings → Pages**, la secțiunea **Source**, selectează **GitHub Actions**.

Astfel, după fiecare rulare a pipeline-ului, GitHub Pages va publica automat cea mai recentă versiune a widget-ului.

---

## 6. Integrează widget-ul pe site-ul facultății

Adaugă următorul cod HTML pe site-ul facultății (de obicei în sidebar sau într-o secțiune dedicată):

```html
<iframe
  src="https://<ORGANIZATIE>.github.io/<REPO>/#/widget?tag=TAG&title=Titlu&color=culoare"
  width="100%"
  height="650px"
></iframe>
```

**Parametrii:**
| Parametru | Descriere | Exemplu |
|-----------|-----------|---------|
| `tag` | Tag-ul unic al facultății | `UBBFPSE` |
| `title` | Titlul afișat în widget | `Facultatea%20de%20Psihologie` |
| `color` | Culoarea temei (hex, URL-encoded) | `%234261e4` → #4261e4 |

> Vezi [documentația tehnică](tehnica.md) pentru detalii complete despre parametri și opțiuni avansate.

---

## Rezumat

| Pas | Acțiune | Rezultat |
|-----|---------|----------|
| 1 | Rulează **Genereaza Tag Unic Facultate** | Tag adăugat în `centralized/unicodes.csv` |
| 2 | **Use this template** → creează repo nou | Repository propriu pentru facultate |
| 3 | Creează `conf/local_tag.md` manual | Tag + sursă curriculum |
| 4 | Rulează **Full Pipeline** | Joburi filtrate + deploy |
| 5 | **Settings → Pages → GitHub Actions** | Publicare automată |
| 6 | Adaugă `<iframe>` pe site-ul facultății | Widget live pentru studenți |
