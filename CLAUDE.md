# quiz-beauty-specialist

Test finale sulle procedure per beauty specialist. Pagina statica su GitHub Pages, dati nel
progetto Supabase **SV Platform** `hypkwdvvrmakqrowbkqw`, schema `quiz`. Vedi `README.md` per
l'elenco delle funzioni.

## Da sapere prima di metterci mano

- 🚨 **Le risposte giuste non escono mai dal database.** `quiz_bs_domande_pubbliche` toglie il
  flag `ok` e mescola le opzioni con il token come seme; corregge `quiz_bs_chiudi`. Se un domani
  qualcuno "semplifica" mandando le domande complete al browser, il test non vale più niente.
- 🚨 **Il testo delle domande si cambia in `domande.json`, poi `PIN=... python3 sync.py`.** Toccare
  `quiz.domande` a mano fa divergere il repo dal database e al primo sync le modifiche spariscono.
- ⚠️ **Il ruolo `anon` di Supabase rifiuta gli `UPDATE` senza `WHERE`** (`21000: UPDATE requires a
  WHERE clause`): dentro le funzioni chiamate dalla pagina ogni update deve avere il suo `where`.
- ⚠️ `gen_random_bytes` sta in `extensions`, non in `public`: le funzioni che lo usano hanno
  `search_path = quiz, public, extensions`.
- I tentativi consegnati si portano dietro il **dettaglio congelato** (`quiz.tentativi.dettaglio`):
  cambiare le domande non riscrive i voti già dati, ed è voluto.
- Le domande nascono dal manuale operativo **e dalle trascrizioni dei cinque video Loom** linkati
  dentro: diverse risposte (messaggi WhatsApp automatici, soglie delle metriche, procedura della
  registrazione) stanno solo nei video.

## Collaudo

`python3 -m http.server 8765` nella cartella e poi gli script Playwright: uno compila il test
rispondendo giusto (deve dare 64/64) e uno sbagliando una domanda ogni N (deve dare "non superato"
e l'elenco del ripasso). Playwright sta in `/usr/lib/node_modules`, quindi si importa con il
percorso assoluto.
