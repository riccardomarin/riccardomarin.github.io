# riccardomarin.github.io

Sito statico in HTML puro: niente build, niente framework. Si modificano solo file di testo.

## Dove mettere le mani

| Cosa | File |
|---|---|
| Nome, posizione, link (email, Scholar, …) | `index.html`, blocco `HEADER` |
| Foto | `photo.jpg` |
| Pubblicazioni selezionate | `publications/` |
| Post del blog | `blog/` |
| Corsi | `teaching/` |
| Bio | `bio.md` |
| Colori, font, spaziature | `style.css` (in alto, i token colore) |

`site.js` e `post.html` non vanno toccati.

Ogni cartella contiene un file `list.txt` (cosa mostrare, in che ordine) e un file `.md` per elemento.
Nel `list.txt` va il nome del file senza `.md`, uno per riga. Le righe che iniziano con `#` sono ignorate,
quindi per nascondere un elemento senza cancellarlo basta commentarlo.

## Aggiungere una pubblicazione

1. Metti teaser (`.jpg`, `.png`, `.gif` o `.mp4` breve) in `publications/`.
2. Copia un file esistente, es. `publications/echo.md` → `publications/nuovo.md`, e modificalo:

```
---
title: Titolo del paper
authors: Nome Cognome, Riccardo Marin, Altro Autore
venue: CVPR 2027
notes: Oral, Best Paper Award
media: nuovo.mp4
links:
  project: https://...
  arXiv: https://arxiv.org/abs/...
  code: https://github.com/...
---
Una riga di descrizione.
```

3. Aggiungi `nuovo` in `publications/list.txt`, nella posizione desiderata.

- Il primo link è anche quello del titolo e della miniatura.
- `notes` è opzionale: voci separate da virgola, lascialo vuoto se non serve.
- "Riccardo Marin" viene evidenziato automaticamente.

## Aggiungere un post

1. Crea `blog/nome-post.md`:

```
---
title: Titolo
subtitle: Sottotitolo (opzionale)
date: 2026-10-01
---
Testo in Markdown. Le immagini vanno in blog/ e si richiamano con ![descrizione](immagine.jpg).
```

2. Aggiungi `nome-post` in `blog/list.txt`. In homepage i post sono ordinati per data, dal più recente.
   La pagina del post è `post.html?p=nome-post`.

### Post bilingue (originale in italiano + traduzione inglese)

Stesso file. Nell'header il titolo inglese va in `title`/`subtitle`, quello italiano in `title_it`/`subtitle_it`.
Nel corpo scrivi prima l'inglese, poi una riga `<!-- italiano -->`, poi l'originale:

```
---
title: Students in search of research.
subtitle: A pyramidal drama.
title_it: Studenti alla ricerca di ricerca.
subtitle_it: Un dramma piramidale.
date: 2026-06-06
---
English translation…

<!-- italiano -->
Testo originale…
```

- Il post si apre in inglese, con la nota "Translated from the Italian original" e lo switch English · Italiano.
- Il link diretto alla versione italiana è `post.html?p=nome-post&lang=it`.
- In homepage il post è segnato con "en · it".
- Se manca la parte inglese (nulla prima di `<!-- italiano -->`), il post appare solo in italiano, senza switch.
- Note e riferimenti in stile `[1]: https://...` vanno ripetuti in entrambe le versioni.

## Aggiungere un corso

Copia `teaching/cv3.md`. `thumb` può essere un'immagine o un `.svg`.
`terms` è una lista `Semestre: link`.

## Pagine di progetto

Una cartella nella root diventa una pagina del sito. Esempio: `odin/` è servita su
`riccardomarin.github.io/odin/`. `odin.html` è un semplice redirect a quella pagina.
Per un nuovo progetto, copia la sua cartella qui accanto.

## Vedere il sito in locale

Aprire `index.html` con doppio clic **non** funziona: il browser blocca la lettura dei file.
Avvia un server dalla cartella del sito:

```
python -m http.server
```

e apri http://localhost:8000.

## Opzioni

- **Palette viridis invece del blu:** in `index.html` e `post.html` cambia `data-palette="accent"` in `data-palette="gradient"`.
- **Frase sotto il nome:** è commentata in `index.html`. Togli `<!--` e `-->` per mostrarla.
- **Tema:** chiaro di default. Il pulsante "dark" passa allo scuro e la scelta viene ricordata.
- **Statistiche visite:** GoatCounter, dashboard su https://riccardomarin.goatcounter.com.
  Lo script è nell'`<head>` di `index.html` e `post.html`; le visite da `localhost` non vengono contate.

## Pubblicazione

Il contenuto di questa cartella va nella root del repo `riccardomarin.github.io`.
Il file `.nojekyll` va tenuto: dice a GitHub Pages di servire i file così come sono.
