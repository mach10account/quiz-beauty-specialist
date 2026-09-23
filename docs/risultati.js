// I compiti corretti, per la direzione. Il PIN non sta in questo file: sta nel
// database (quiz.config), e a confrontarlo e' la funzione quiz_bs_risultati.
// Cosi' leggere il sorgente della pagina non serve a entrare.

import { sb, app, esc, schermata, dataOra } from "./core.js?v=1";

const CHIAVE = "quiz-bs-pin";
let dati = null;

function chiediPin(avviso) {
  schermata(`
    <div class="marca">MACH<b>10</b> · Salone Vincente</div>
    <h1>Risultati del test</h1>
    <div class="scheda" style="max-width:420px;margin-top:22px">
      ${avviso ? `<div class="errore">${esc(avviso)}</div>` : ""}
      <div class="campo">
        <label for="pin">PIN</label>
        <input id="pin" type="password" autocomplete="current-password">
      </div>
      <button class="bottone" id="entra">Entra</button>
    </div>`);
  const pin = document.getElementById("pin");
  const entra = document.getElementById("entra");
  pin.focus();
  pin.onkeydown = (e) => { if (e.key === "Enter") entra.click(); };
  entra.onclick = () => carica(pin.value.trim(), true);
}

async function carica(pin, ricorda) {
  app.innerHTML = `<div class="attesa">Un attimo…</div>`;
  try {
    const { data, error } = await sb.rpc("quiz_bs_risultati", { p_pin: pin });
    if (error) throw error;
    if (!data || !data.ok) { sessionStorage.removeItem(CHIAVE); chiediPin("PIN errato."); return; }
    if (ricorda) sessionStorage.setItem(CHIAVE, pin);
    dati = data;
    disegna();
  } catch (e) {
    console.error(e);
    chiediPin("Non riesco a collegarmi. Riprova.");
  }
}

function disegna() {
  const t = dati.tentativi || [];
  const chiusi = t.filter((x) => x.chiuso_at);
  const superati = chiusi.filter((x) => x.esito === "superato");
  const media = chiusi.length
    ? Math.round(chiusi.reduce((s, x) => s + Number(x.percentuale), 0) / chiusi.length) : 0;

  // Una persona puo' rifare il test: per sapere "chi e' a posto" conta il suo
  // tentativo migliore, non l'ultimo.
  const perPersona = new Map();
  chiusi.forEach((x) => {
    const k = x.nome.trim().toLowerCase();
    const p = perPersona.get(k);
    if (!p || Number(x.percentuale) > Number(p.percentuale)) perPersona.set(k, x);
  });
  const okPersone = [...perPersona.values()].filter((x) => x.esito === "superato").length;

  app.innerHTML = `
    <div class="pagina largo">
      <div class="marca">MACH<b>10</b> · Salone Vincente</div>
      <h1>Risultati del test</h1>
      <p class="sfumato">Si passa con l'${Number(dati.soglia).toFixed(0)}%. Clicca una riga per
      vedere risposta per risposta.</p>

      <div class="sommario">
        <div class="tessera"><div class="n">${perPersona.size}</div><div class="k">persone che l'hanno consegnato</div></div>
        <div class="tessera"><div class="n">${okPersone}</div><div class="k">l'hanno superato (miglior tentativo)</div></div>
        <div class="tessera"><div class="n">${chiusi.length}</div><div class="k">test consegnati in tutto</div></div>
        <div class="tessera"><div class="n">${media}%</div><div class="k">media dei consegnati</div></div>
        <div class="tessera"><div class="n">${t.length - chiusi.length}</div><div class="k">cominciati e non consegnati</div></div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="bottone fantasma" id="csv" type="button">Scarica CSV</button>
        <button class="bottone fantasma" id="ricarica" type="button">Aggiorna</button>
      </div>

      <table>
        <thead><tr>
          <th>Chi</th><th>Quando</th><th class="num">Minuti</th>
          <th class="num">Punteggio</th><th class="num">%</th><th>Esito</th>
        </tr></thead>
        <tbody>
          ${t.length ? t.map((x, i) => riga(x, i)).join("") :
            `<tr><td colspan="6" class="sfumato">Ancora nessuno ha aperto il test.</td></tr>`}
        </tbody>
      </table>

      ${domandeDifficili(chiusi)}
    </div>`;

  document.getElementById("csv").onclick = scaricaCsv;
  document.getElementById("ricarica").onclick = () => carica(sessionStorage.getItem(CHIAVE), false);
  app.querySelectorAll("tr.apribile").forEach((tr) => {
    tr.onclick = () => {
      const d = document.getElementById("dett-" + tr.dataset.i);
      if (d) d.hidden = !d.hidden;
    };
  });
}

function riga(x, i) {
  const stato = !x.chiuso_at
    ? `<span class="pallino attesa">in corso · ${x.risposte_date} risposte</span>`
    : x.esito === "superato"
      ? `<span class="pallino ok">superato</span>`
      : `<span class="pallino ko">non superato</span>`;

  return `
    <tr class="${x.chiuso_at ? "apribile" : ""}" data-i="${i}">
      <td><b>${esc(x.nome)}</b>${x.email ? `<div class="piccolo sfumato">${esc(x.email)}</div>` : ""}</td>
      <td>${dataOra(x.chiuso_at || x.iniziato_at)}</td>
      <td class="num">${x.minuti ?? "—"}</td>
      <td class="num">${x.chiuso_at ? `${x.punteggio}/${x.totale}` : "—"}</td>
      <td class="num">${x.chiuso_at ? `${Number(x.percentuale).toFixed(0)}%` : "—"}</td>
      <td>${stato}</td>
    </tr>
    ${x.chiuso_at ? `
    <tr id="dett-${i}" hidden><td colspan="6" style="background:#f8fafc">
      <div class="ripasso">
        ${(x.dettaglio || []).map((d) => `
          <details class="${d.corretta ? "giusta" : ""}">
            <summary>${d.corretta ? "✓" : "✗"} ${esc(d.testo)}</summary>
            <div class="riga"><span class="etichetta">Ha risposto</span>${
              (d.data && d.data.length) ? esc(d.data.join(" · ")) : "<i>niente</i>"}</div>
            <div class="riga"><span class="etichetta">Giusta</span><b>${esc((d.giusta || []).join(" · "))}</b></div>
          </details>`).join("")}
      </div>
    </td></tr>` : ""}`;
}

// Dove inciampano tutte: se una domanda la sbaglia mezzo reparto, il problema
// non e' del reparto, e' della procedura che non e' stata spiegata bene.
function domandeDifficili(chiusi) {
  if (!chiusi.length) return "";
  const m = new Map();
  chiusi.forEach((x) => (x.dettaglio || []).forEach((d) => {
    const q = m.get(d.codice) || { testo: d.testo, sezione: d.sezione, ok: 0, tot: 0, giusta: d.giusta };
    q.tot++; if (d.corretta) q.ok++;
    m.set(d.codice, q);
  }));
  const peggiori = [...m.values()].sort((a, b) => a.ok / a.tot - b.ok / b.tot).slice(0, 12);

  return `
    <h2>Le domande su cui si inciampa di più</h2>
    <p class="sfumato piccolo">Su ${chiusi.length} test consegnati. Se una domanda è rossa per
    tutte, conviene rispiegare quel pezzo di procedura invece che ripetere il test.</p>
    <table>
      <thead><tr><th>Domanda</th><th style="width:150px">Risposte giuste</th></tr></thead>
      <tbody>
        ${peggiori.map((q) => `
          <tr>
            <td>${esc(q.testo)}<div class="piccolo sfumato">${esc(q.sezione)} — giusta: ${esc((q.giusta || []).join(" · "))}</div></td>
            <td>
              <div>${q.ok}/${q.tot}</div>
              <div class="barra-domanda"><i style="width:${Math.round(q.ok / q.tot * 100)}%"></i></div>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

function scaricaCsv() {
  const righe = [["nome", "email", "iniziato", "consegnato", "minuti", "punteggio", "totale", "percentuale", "esito"]];
  (dati.tentativi || []).forEach((x) => righe.push([
    x.nome, x.email || "", x.iniziato_at, x.chiuso_at || "", x.minuti ?? "",
    x.punteggio ?? "", x.totale ?? "", x.percentuale ?? "", x.esito]));
  const csv = righe.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = `test-beauty-specialist-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

const salvato = sessionStorage.getItem(CHIAVE);
if (salvato) carica(salvato, false); else chiediPin();
