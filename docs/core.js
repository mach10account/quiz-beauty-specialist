// Il minimo condiviso fra la copertina, il test e la pagina dei risultati.
// Ricalcato su checkup-app/core.js: stesse scelte, stesse ragioni.

// jsDelivr e non esm.sh, e una versione FISSA e non "@2". Il 5/8/2026 un sito
// e' rimasto appeso su "Caricamento..." per mezz'ora perche' esm.sh serviva una
// build monca di supabase-js: un import che non si completa non solleva nessun
// errore, resta li'. La versione qui si alza a mano, dopo averla provata.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.1/+esm";

export const SUPABASE_URL = "https://hypkwdvvrmakqrowbkqw.supabase.co";
// Chiave publishable: sta in chiaro per definizione, e' la stessa del resto
// della piattaforma. Qui non protegge niente — le domande escono senza il flag
// della risposta giusta e la correzione la fa il database, non questa pagina.
export const SUPABASE_KEY = "sb_publishable_y0_DEhM-bC37jEKkiC_GGQ_TaWvPqVe";

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

export const app = document.getElementById("app");

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const schermata = (html) => { app.innerHTML = `<div class="pagina">${html}</div>`; };

export function schermataErrore(titolo, dettaglio) {
  schermata(`
    <h1>${esc(titolo)}</h1>
    <p class="sfumato">${esc(dettaglio)}</p>
    <p><button class="bottone" onclick="location.reload()">Riprova</button></p>`);
}

// Il token del tentativo in corso. Se il pc si spegne a meta' test, riaprendo
// la pagina si riprende da dove si era rimaste invece di ricominciare da capo.
const CHIAVE = "quiz-bs-token";
export const tokenSalvato = () => { try { return localStorage.getItem(CHIAVE); } catch { return null; } };
export const salvaToken   = (t) => { try { localStorage.setItem(CHIAVE, t); } catch {} };
export const scordaToken  = ()  => { try { localStorage.removeItem(CHIAVE); } catch {} };

export const dataOra = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric",
                                     hour: "2-digit", minute: "2-digit" });
};
