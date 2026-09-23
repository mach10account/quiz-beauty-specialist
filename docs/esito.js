// La pagina del risultato. Oltre al voto mostra il ripasso delle domande
// sbagliate con la spiegazione: un test che dice solo "48/64" insegna zero.

import { esc, schermata, scordaToken } from "./core.js?v=1";

// Il manuale operativo con dentro i video: a chi non passa si dice dove tornare.
const MANUALE = "https://docs.google.com/document/d/1w5dYcPKMqE9gMNHMfqKiF1hXvn_HILM7rm1CivuScXM/edit";

export function mostraEsito(r) {
  const superato = r.esito === "superato";
  const dettaglio = r.dettaglio || [];
  const sbagliate = dettaglio.filter((d) => !d.corretta);

  // Per sezione: dice dove ripassare, che è l'unica informazione utile a chi
  // non ha passato il test.
  const sezioni = {};
  dettaglio.forEach((d) => {
    const s = sezioni[d.sezione] || (sezioni[d.sezione] = { ok: 0, tot: 0 });
    s.tot++; if (d.corretta) s.ok++;
  });

  schermata(`
    <div class="verdetto ${superato ? "ok" : "ko"}">
      <span class="timbro ${superato ? "ok" : "ko"}">${superato ? "Test superato" : "Test non superato"}</span>
      <div class="punteggio">${r.punteggio}<span style="font-size:28px;color:var(--fg-soft)">/${r.totale}</span></div>
      <p class="sfumato" style="margin:0">${esc(r.nome || "")} — ${Number(r.percentuale).toFixed(0)}% di risposte giuste${
        r.soglia ? ` (serve l'${Number(r.soglia).toFixed(0)}%)` : ""}</p>
    </div>

    ${superato
      ? `<p style="margin-top:24px">Le procedure le sai. Qui sotto trovi comunque le domande che hai
         sbagliato: leggile, sono i punti su cui inciampare costa un appuntamento.</p>`
      : `<p style="margin-top:24px">Non ci siamo ancora. Riprendi il
         <a href="${MANUALE}" target="_blank" rel="noopener">manuale operativo</a> e i video tutorial
         sulle sezioni più deboli qui sotto, poi il test si rifà: quello che conta è che le procedure
         siano chiare, non il numero di tentativi.</p>`}

    <h2>Come sei andata, sezione per sezione</h2>
    <div class="barre">
      ${Object.entries(sezioni).map(([nome, s]) => `
        <div class="barra-riga">
          <div>
            ${esc(nome)}
            <div class="barra"><i style="width:${Math.round(s.ok / s.tot * 100)}%"></i></div>
          </div>
          <div class="cifra">${s.ok}/${s.tot}</div>
        </div>`).join("")}
    </div>

    <h2>${sbagliate.length ? `Da ripassare (${sbagliate.length})` : "Non hai sbagliato niente"}</h2>
    <div class="ripasso">
      ${sbagliate.map((d) => `
        <details>
          <summary>${esc(d.testo)}</summary>
          <div class="riga"><span class="etichetta">Hai risposto</span>${
            (d.data && d.data.length) ? esc(d.data.join(" · ")) : "<i>niente</i>"}</div>
          <div class="riga"><span class="etichetta">Risposta giusta</span><b>${esc((d.giusta || []).join(" · "))}</b></div>
          <div class="perche">${esc(d.spiegazione)}</div>
        </details>`).join("")}
    </div>

    <p style="margin-top:28px"><button class="bottone fantasma" id="chiudi" type="button">Chiudi e libera questo computer</button></p>
    <p class="piccolo sfumato">Il risultato è già stato inviato alla direzione: non serve che tu faccia
    uno screenshot o lo mandi a qualcuno.</p>`);

  // Il token resta nel browser finché non si chiude: serve a poter riaprire il
  // proprio risultato. Se il computer è condiviso, questo bottone lo cancella.
  document.getElementById("chiudi").onclick = () => {
    scordaToken();
    schermata(`<h1>Fatto.</h1><p class="sfumato">Puoi chiudere la pagina.</p>`);
  };
}
