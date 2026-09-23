#!/usr/bin/env python3
"""Ricopia domande.json nel database. Uso: PIN=... python3 sync.py"""
import json, os, sys, urllib.request

URL = "https://hypkwdvvrmakqrowbkqw.supabase.co/rest/v1/rpc/quiz_bs_carica_domande"
KEY = "sb_publishable_y0_DEhM-bC37jEKkiC_GGQ_TaWvPqVe"
PIN = os.environ.get("PIN")
if not PIN:
    sys.exit("serve la variabile PIN")

src = json.load(open(os.path.join(os.path.dirname(__file__), "domande.json"), encoding="utf-8"))
domande = []
for i, q in enumerate(src, start=1):
    domande.append({
        "codice": q["codice"], "ordine": i, "sezione": q["sezione"], "tipo": q["tipo"],
        "testo": q["testo"], "spiegazione": q["spiegazione"],
        "opzioni": [{"t": t, "ok": bool(ok)} for t, ok in q["opzioni"]],
    })

body = json.dumps({"p_pin": PIN, "p_domande": domande}).encode("utf-8")
req = urllib.request.Request(URL, data=body, method="POST", headers={
    "apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
print(urllib.request.urlopen(req, timeout=60).read().decode())
