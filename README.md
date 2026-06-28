# Job Widget — Filtrare inteligentă a locurilor de muncă

**Filtrare inteligentă a locurilor de muncă folosind AI**

## Ideea proiectului

Colectăm toate locurile de muncă de pe [peviitor.ro](https://peviitor.ro) și, pe baza unor tag-uri generate automat cu ajutorul AI, determinăm ce joburi se potrivesc pentru fiecare facultate și școală profesională din România.

## Stack tehnologic

- **n8n** — orchestrare workflow-uri și colectare date
- **OpenCode** — agenți AI pentru procesare și taguire
- **AI (LLM)** — generare tag-uri și matching inteligent
- **Peviitor.ro** — sursa principală de date (joburi)

## Cum funcționează

1. Extragem joburile din API-ul Peviitor
2. Analizăm fiecare job cu ajutorul AI pentru a extrage tag-uri relevante (domeniu, tehnologii, skill-uri, nivel)
3. Mapăm facultățile și școlile profesionale pe baza profilelor lor de studiu
4. Match-uim tag-urile joburilor cu profilurile instituțiilor de învățământ
5. Generăm recomandări personalizate per instituție

## Configurare

### `conf/local_tag.md`

După ce ai făcut fork la repo, în `conf/local_tag.md` scriem tag-ul folosit de această facultate. Tot aici punem și sursa de unde își va lua agentul materiile și va deduce skillurile studentului.

Format:
```
TAG
sursa: exemplu.com
```

### `filter/NUME.md`

În directorul `filter/` punem un fișier `.md` care are ca nume tag-ul menționat în `conf/local_tag.md`, cu lista de materii. Folosind sursa să extragem materiile + cursurile + să deducem skillurile studentului. Acest fișier va fi generat cu un prompt în opencode prin GitHub Actions.

### `agents/student.md`

`agents/student.md` va conține un prompt care va fi inspirat din agenții existenți și va fi personalizat pe baza celor extrase în `filter/`. Va fi generat cu un prompt de opencode și rulat în GitHub Actions.

## Widget Incorporabil

Widget-ul de joburi **poate fi încorporat pe site-ul oricărei facultăți** printr-un simplu `<iframe>`:

```html
<iframe
  src="URL_DEPLOY/#/widget?tag=FACULTATE_TAG&title=Titlu&color=culoare"
  width="100%"
  height="650px"
></iframe>
```

Parametrii se personalizează în funcție de facultate: `tag` pentru filtrarea joburilor, `title` pentru titlul afișat, `color` pentru tema vizuală. Vezi [documentația tehnică](docs/tehnica.md) pentru detalii complete.

## Licență

Acest proiect este distribuit sub licența **MIT**. Vezi fișierul [LICENSE](LICENSE).

## Contribuții

Contribuțiile sunt binevenite! Vezi [CONTRIBUTING.md](CONTRIBUTING.md) și [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) pentru detalii.
