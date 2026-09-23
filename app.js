// Tre schermate in fila: copertina -> test -> esito.
// Non c'e' login: chi arriva scrive il suo nome e comincia. L'identita' serve
// solo a far ritrovare a Leo il compito giusto, non a proteggere niente.

import { sb, app, esc, schermata, schermataErrore, tokenSalvato, salvaToken, scordaToken } from "./core.js?v=1";
import { avviaQuiz } from "./quiz.js?v=1";
import { mostraEsito } from "./esito.js?v=1";

function copertina(avviso) {
  schermata(`
    <div class="marca">MACH<b>10</b> · Salone Vincente</div>
    <h1>Test finale — Procedure Beauty Specialist</h1>
    <p class="sfumato">Serve a verificare che il manuale operativo e i video tutorial siano
    stati studiati davvero. Non è un sondaggio: le risposte vengono corrette e il risultato
    lo vede la direzione.</p>

    <div class="scheda" style="margin:24px 0">
      <ul class="elenco-puntato">
        <li><b>64 domande</b> — a risposta chiusa, su CRM4, esiti, acconti, registrazioni, Manager Stats e metriche.</li>
        <li><b>Circa 25 minuti.</b> Puoi tornare indietro e cambiare una risposta finché non consegni.</li>
        <li><b>Si passa con l'85%.</b> Alcune domande hanno più di una risposta giusta: vanno segnate tutte.</li>
        <li><b>Se il computer si spegne non perdi niente:</b> ogni risposta viene salvata quando la dai.</li>
      </ul>

      ${avviso ? `<div class="errore">${esc(avviso)}</div>` : ""}

      <div class="campo">
        <label for="nome">Nome e cognome</label>
        <input id="nome" type="text" autocomplete="name" placeholder="Come ti conosciamo in azienda">
      </div>
      <div class="campo">
        <label for="email">Email <span class="sfumato" style="font-weight:400">(facoltativa)</span></label>
        <input id="email" type="email" autocomplete="email" placeholder="nome@esempio.it">
      </div>
      <button class="bottone" id="via">Comincia il test</button>
    </div>

    <p class="piccolo sfumato">Rispondi con quello che sai tu: se copi dal documento il test non
    serve a niente, né a noi né a te.</p>`);

  const nome = document.getElementById("nome");
  const via = document.getElementById("via");
  nome.focus();
  nome.onkeydown = (e) => { if (e.key === "Enter") via.click(); };

  via.onclick = async () => {
    const n = nome.value.trim();
    if (n.length < 3) { nome.focus(); copertina("Scrivi nome e cognome per cominciare."); return; }
    via.disabled = true; via.textContent = "Un attimo…";
    try {
      const { data, error } = await sb.rpc("quiz_bs_inizia",
        { p_nome: n, p_email: document.getElementById("email").value.trim() || null,
          p_ua: navigator.userAgent });
      if (error) throw error;
      if (!data || !data.ok) throw new Error(data && data.motivo);
      salvaToken(data.token);
      avviaQuiz(data.token, data.domande, {});
    } catch (e) {
      console.error(e);
      via.disabled = false; via.textContent = "Comincia il test";
      schermataErrore("Non riesco a collegarmi",
        "Controlla la connessione e riprova: non hai perso niente.");
    }
  };
}

async function avvia() {
  // Ripresa: un tentativo lasciato a metà si riapre da solo. Uno già consegnato
  // rimostra il risultato, cosi' riaprire il link non fa ricominciare da capo.
  const token = tokenSalvato();
  if (!token) { copertina(); return; }

  app.innerHTML = `<div class="attesa">Un attimo…</div>`;
  try {
    const { data, error } = await sb.rpc("quiz_bs_apri", { p_token: token });
    if (error) throw error;
    if (!data || !data.ok) { scordaToken(); copertina(); return; }
    if (data.stato === "chiuso") { mostraEsito({ ...data, gia_visto: true }); return; }
    avviaQuiz(token, data.domande, data.risposte || {});
  } catch (e) {
    console.error(e);
    schermataErrore("Non riesco a collegarmi",
      "Controlla la connessione e ricarica la pagina: le risposte che hai già dato sono salvate.");
  }
}

avvia();
