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

## Pentru facultăți

Dacă reprezinți o facultate și vrei să folosești acest widget, urmează ghidul pas cu pas din [docs/pentru-facultati.md](docs/pentru-facultati.md).

Pe scurt:
1. Rulează **Genereaza Tag Unic Facultate** din Actions
2. Creează un repository nou folosind **Use this template**
3. Creează `conf/local_tag.md` cu tag-ul și sursa curriculum-ului
4. Rulează **Full Pipeline** din Actions
5. Activează GitHub Pages (source: GitHub Actions)
6. Integrează `<iframe>` pe site-ul facultății

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
