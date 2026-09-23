# Test finale — Procedure Beauty Specialist

Esame a risposta chiusa sulle procedure del manuale operativo dei setter/beauty specialist
(CRM4, esiti, acconti, registrazione chiamate, Manager Stats, metriche). Serve a verificare che
il documento **e i cinque video tutorial** siano stati studiati davvero: diverse domande nascono
solo dai video, non dal testo.

- **Test:** <https://mach10account.github.io/quiz-beauty-specialist/>
- **Risultati (direzione):** <https://mach10account.github.io/quiz-beauty-specialist/risultati.html> — PIN
- **64 domande**, ~25 minuti, si passa con l'**85%**.

## Com'è fatto

Pagina statica (niente build: HTML + CSS + ESM), servita da GitHub Pages. I dati stanno nel
progetto Supabase **SV Platform** (`hypkwdvvrmakqrowbkqw`), schema `quiz`.

| file | cosa fa |
|---|---|
| `index.html` + `app.js` | copertina (nome e cognome) → test → esito |
| `quiz.js` | una domanda per schermata, salvataggio a ogni risposta, riepilogo prima di consegnare |
| `esito.js` | voto, andamento per sezione, ripasso delle domande sbagliate con la spiegazione |
| `risultati.html` + `risultati.js` | la pagina della direzione: chi ha consegnato, quanto ha preso, risposta per risposta, CSV |
| `domande.json` | **il testo delle domande: è qui che si modificano** |
| `sync.py` | ricopia `domande.json` nel database |

## Le risposte giuste non sono nella pagina

`quiz_bs_domande_pubbliche` restituisce le opzioni **senza il flag della risposta giusta** e
mescolate con un ordine diverso per ogni tentativo (il seme è il token). La correzione la fa
`quiz_bs_chiudi` nel database. Guardare il sorgente della pagina o il traffico di rete non serve
a niente, e due persone affiancate non vedono le opzioni nello stesso ordine.

## Modificare le domande

1. si tocca `domande.json` (`opzioni` è una lista di `[testo, è_giusta]`);
2. `PIN=<pin> python3 sync.py`;
3. commit e push.

`sync.py` **sostituisce l'elenco intero**: una domanda tolta dal file esce dal test. I tentativi
già consegnati non si toccano — il dettaglio corretto è congelato dentro il tentativo, quindi i
voti vecchi restano leggibili anche se le domande cambiano.

## Funzioni sul database (schema `public`, tabelle in `quiz`)

| funzione | a cosa serve |
|---|---|
| `quiz_bs_inizia(nome, email, ua)` | apre un tentativo, torna il token e le domande |
| `quiz_bs_apri(token)` | ripresa a metà test, o risultato se già consegnato |
| `quiz_bs_rispondi(token, codice, valore)` | salva una risposta |
| `quiz_bs_chiudi(token)` | corregge, calcola il voto, congela il dettaglio |
| `quiz_bs_risultati(pin)` | l'elenco per la direzione |
| `quiz_bs_carica_domande(pin, domande)` | usata da `sync.py` |

PIN e soglia stanno in `quiz.config` (`pin_admin`, `soglia`), non nel codice:

```sql
update quiz.config set valore = 'nuovo-pin' where chiave = 'pin_admin';
update quiz.config set valore = '90'        where chiave = 'soglia';
```

La soglia vale per i test consegnati **da lì in avanti**: quelli vecchi mantengono l'esito con cui
sono stati chiusi.
