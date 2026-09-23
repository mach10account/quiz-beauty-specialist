// Una domanda per schermata, tutte chiuse, e ogni risposta salvata appena data.
//
// Il salvataggio a ogni risposta non e' una raffinatezza: con 64 domande, una
// connessione che cade o un browser che si chiude a meta' butterebbe via il
// test intero. Cosi' invece si riprende dalla domanda dopo.

import { sb, app, esc, schermata, schermataErrore } from "./core.js?v=1";
import { mostraEsito } from "./esito.js?v=1";

export function avviaQuiz(token, domande, risposteIniziali) {
  const risposte = { ...(risposteIniziali || {}) };   // codice -> array di etichette
  let inVolo = false;

  // Le risposte che la rete non ha voluto prendere restano qui e si riprovano
  // alla domanda dopo. Prima di consegnare si svuota questa coda: un punteggio
  // calcolato su risposte mancanti sarebbe sbagliato senza che nessuno se ne
  // accorga.
  const daRimandare = [];
  async function salva(codice, valore) {
    try {
      const { data, error } = await sb.rpc("quiz_bs_rispondi",
        { p_token: token, p_codice: codice, p_valore: valore });
      if (error) throw error;
      if (data && data.ok === false) console.warn("risposta rifiutata:", codice, data.motivo);
      while (daRimandare.length) {
        const r = daRimandare.shift();
        await sb.rpc("quiz_bs_rispondi", { p_token: token, p_codice: r.codice, p_valore: r.valore });
      }
    } catch (e) {
      console.error("salvataggio fallito, riprovo dopo:", codice, e);
      daRimandare.push({ codice, valore });
    }
  }

  function disegna(i) {
    if (i >= domande.length) { riepilogo(); return; }
    const d = domande[i];
    const scelte = risposte[d.codice] || [];
    const multipla = d.tipo === "multipla";

    app.innerHTML = `
      <div class="avanzamento"><i style="width:${Math.round((i / domande.length) * 100)}%"></i></div>
      <div class="pagina">
        <div class="conta">Domanda ${i + 1} di ${domande.length}</div>
        <div class="sezione-nome">${esc(d.sezione)}</div>
        <p class="domanda">${esc(d.testo)}</p>
        ${multipla ? `<p class="aiuto">Più di una risposta è giusta: segnale tutte.</p>` : ""}
        <div class="opzioni ${multipla ? "multipla" : ""}" id="opzioni">
          ${d.opzioni.map((o, k) => `
            <button class="opzione" type="button" data-k="${k}"
                    aria-pressed="${scelte.includes(o) ? "true" : "false"}">
              <span class="segno">${scelte.includes(o) ? "✓" : ""}</span>
              <span>${esc(o)}</span>
            </button>`).join("")}
        </div>
        <div class="azioni">
          <button class="bottone" id="avanti" type="button" ${scelte.length ? "" : "disabled"}>
            ${i === domande.length - 1 ? "Vai al riepilogo" : "Avanti"}
          </button>
          ${i > 0 ? `<button class="bottone fantasma" id="indietro" type="button">← Indietro</button>` : ""}
        </div>
      </div>`;

    // Anche sulle domande a risposta singola c'e' il bottone "Avanti": in un
    // esame un tocco storto non deve consegnare la domanda e passare oltre.
    document.getElementById("opzioni").onclick = (e) => {
      const b = e.target.closest(".opzione");
      if (!b) return;
      const label = d.opzioni[Number(b.dataset.k)];
      if (multipla) {
        const g = risposte[d.codice] || [];
        risposte[d.codice] = g.includes(label) ? g.filter((x) => x !== label) : [...g, label];
      } else {
        risposte[d.codice] = [label];
      }
      ridisegnaSegni(d);
    };

    document.getElementById("avanti").onclick = () => {
      salva(d.codice, risposte[d.codice]);
      disegna(i + 1);
    };
    const ind = document.getElementById("indietro");
    if (ind) ind.onclick = () => disegna(i - 1);
  }

  // Si ridisegnano solo i segni di spunta: rifare la schermata sposterebbe lo
  // scorrimento a ogni tocco.
  function ridisegnaSegni(d) {
    const scelte = risposte[d.codice] || [];
    document.querySelectorAll("#opzioni .opzione").forEach((b, k) => {
      const presa = scelte.includes(d.opzioni[k]);
      b.setAttribute("aria-pressed", presa ? "true" : "false");
      b.querySelector(".segno").textContent = presa ? "✓" : "";
    });
    document.getElementById("avanti").disabled = scelte.length === 0;
  }

  // Prima di consegnare si dice chiaro quante ne mancano: consegnare per sbaglio
  // con dieci domande in bianco sarebbe una bocciatura che non dice niente.
  function riepilogo() {
    const vuote = domande.filter((d) => !(risposte[d.codice] || []).length);
    schermata(`
      <div class="avanzamento"><i style="width:100%"></i></div>
      <h1>Hai finito le domande</h1>
      ${vuote.length
        ? `<div class="nota"><b>${vuote.length} domande sono ancora in bianco.</b>
             Una domanda senza risposta conta come sbagliata: se puoi, torna indietro e completale.</div>`
        : `<p class="sfumato">Hai risposto a tutte e ${domande.length} le domande.</p>`}
      <p>Quando consegni il test viene corretto e non si può più modificare.</p>
      <div class="azioni">
        <button class="bottone" id="consegna" type="button">Consegna il test</button>
        <button class="bottone fantasma" id="rivedi" type="button">← Rivedi le risposte</button>
      </div>
      ${vuote.length ? `<p class="piccolo sfumato" style="margin-top:20px">In bianco: ${
        vuote.map((d) => `n. ${domande.indexOf(d) + 1}`).join(", ")}</p>` : ""}`);

    document.getElementById("rivedi").onclick = () =>
      disegna(vuote.length ? domande.indexOf(vuote[0]) : 0);
    document.getElementById("consegna").onclick = consegna;
  }

  async function consegna() {
    if (inVolo) return;
    inVolo = true;
    app.innerHTML = `<div class="attesa">Sto correggendo il test…</div>`;
    try {
      while (daRimandare.length) {
        const r = daRimandare.shift();
        await sb.rpc("quiz_bs_rispondi", { p_token: token, p_codice: r.codice, p_valore: r.valore });
      }
      const { data, error } = await sb.rpc("quiz_bs_chiudi", { p_token: token });
      if (error) throw error;
      if (!data || !data.ok) throw new Error(data && data.motivo);
      mostraEsito(data);
    } catch (e) {
      console.error(e);
      inVolo = false;
      schermataErrore("Le risposte ci sono, la correzione no",
        "Ricarica la pagina fra un minuto: riprende da qui senza farti rifare niente.");
    }
  }

  // Si riparte dalla prima domanda ancora senza risposta.
  const prima = domande.findIndex((d) => !(risposte[d.codice] || []).length);
  disegna(prima === -1 ? 0 : prima);
}
