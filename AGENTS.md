# Agenți & Pipeline

## Fluxul datelor

```
conf/local_tag.md  ──►  fetch_agent_jobs.mjs  ──►  opencode (agents/*.md)  ──►  jobs.json
```

1. **Tag**: `conf/local_tag.md` conține tag-ul facultății (ex: `UBBFPSE`) și sursa curriculum-ului.
2. **Script**: `scripts/fetch_agent_jobs.mjs` citește profilul agentului, generează cuvinte cheie, interoghează API-ul peviitor, extrage descrierile joburilor și le trimite agentului AI.
3. **Agent AI**: `agents/*.md` analizează fiecare job și decide dacă se potrivește cu skill-urile persoanei.
4. **Rezultat**: Joburile potrivite sunt salvate în `jobs.json` cu `f_tag`, `matchPercentage` și `reason`.

---

## Cum se adaugă un agent nou

Vezi `INSTRUCTIONS.md` — pașii sunt:

1. Creează fișierul de profil în `filter/NUME.md` (competențele persoanei / curriculum)
2. Creează agentul în `agents/NUME.md` (prompt + skill-uri)
3. Actualizează `conf/local_tag.md` cu tag-ul corespunzător
4. Rulează `node scripts/fetch_agent_jobs.mjs` pentru a genera `jobs.json`

---

## Fișiere relevante

| Fișier | Rol |
|--------|-----|
| `scripts/fetch_agent_jobs.mjs` | Script principal: generează keywords, interoghează API, rulează agentul, salvează `jobs.json` |
| `agents/student.md` | Profilul agentului (prompt + skill-uri) |
| `filter/NUME.md` | Curriculum-ul facultății |
| `conf/local_tag.md` | Tag-ul facultății și sursa curriculum-ului |
| `jobs.json` | Joburi matcheate cu `f_tag`, `matchPercentage` și `reason` |
