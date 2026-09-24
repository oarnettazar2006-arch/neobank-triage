"""Trace d'un ticket, étape par étape, enregistrée pendant le lot (onglet Pipeline de la console).

Rien n'est relancé pour afficher une trace : pendant le lot, eval/triage_csv.py
passe chaque étape de chaque ticket par `Traceur` (paramètre `trace` de
`process`), qui la chronomètre, écoute les appels à Ollama (prompt réellement
envoyé, réponse brute du modèle) et range le tout en base. Le code du bot
(src/) n'est pas modifié : l'écoute se fait autour de `urllib.request.urlopen`,
le temps du lot, et ne rend au bot que les octets reçus d'Ollama.

`vue(lot, n)` assemble ensuite les six blocs de GET /lots/{id}/tickets/{n}/trace :
garde d'entrée, tri llama, contrôleur qwen, rédacteur, garde de sortie, délais.
"""

from __future__ import annotations

import json
import re
import threading
import time
import urllib.request
from contextlib import contextmanager
from datetime import date, datetime, timedelta

import answers  # noqa: E402  (src/, ajouté au chemin par api/main.py)
import reply  # noqa: E402
from deadlines import add_months, easter, holidays  # noqa: E402

from . import db

# --- Enregistrement pendant le lot ------------------------------------------------


class _Relu:
    """La réponse d'Ollama, déjà lue : le bot la relit à l'identique."""

    def __init__(self, corps: bytes):
        self.corps = corps

    def read(self, *_):
        return self.corps

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class Traceur:
    """Appelable passé à triage_csv.process : exécute l'étape, la chronomètre et l'enregistre."""

    def __init__(self, lot_id: str):
        self.lot_id = lot_id
        self.fil = threading.get_ident()
        self.appels: list[dict] | None = None

    @contextmanager
    def ecoute(self):
        """Le temps du lot : chaque appel à Ollama de ce fil est noté (prompt, réponse brute, durée)."""
        origine = urllib.request.urlopen

        def urlopen(req, *args, **kwargs):
            if self.appels is None or threading.get_ident() != self.fil or not req.full_url.endswith("/api/chat"):
                return origine(req, *args, **kwargs)
            envoye = json.loads(req.data)
            debut = time.perf_counter()
            with origine(req, *args, **kwargs) as r:
                corps = r.read()
            self.appels.append({"modele": envoye["model"], "prompt": envoye["messages"][0]["content"],
                                "reponse_brute": json.loads(corps)["message"]["content"],
                                "debut": debut, "secondes": time.perf_counter() - debut})
            return _Relu(corps)

        urllib.request.urlopen = urlopen
        try:
            yield self
        finally:
            urllib.request.urlopen = origine

    def __call__(self, etape: str, k: int, appel):
        self.appels = []
        debut = time.perf_counter()
        try:
            resultat = appel()
            secondes = time.perf_counter() - debut
            appels = [{**a, "debut": a["debut"] - debut} for a in self.appels]
        finally:
            self.appels = None
        db.set_trace(self.lot_id, k, ETAPES[etape], ENREGISTRE[etape](resultat, appels, secondes))
        return resultat


def _r(s: float) -> float:
    return round(s, 3)


def _appel(a: dict) -> dict:
    return {"modele": a["modele"], "prompt": a["prompt"], "reponse_brute": a["reponse_brute"], "secondes": _r(a["secondes"])}


def _tri(t: dict, appels: list[dict], secondes: float) -> dict:
    # La garde tourne avant l'appel au modèle : sa durée va jusqu'au départ de la requête.
    garde_s = appels[0]["debut"] if appels else secondes
    return {"garde": {**t["guard"], "entree": t["original_text"], "envoye": t["llm_text"], "secondes": _r(garde_s)},
            "appel": _appel(appels[0]) if appels else None, "champs": t["fields"], "secondes": _r(secondes - garde_s)}


def _controle(sous_motif: str, appels: list[dict], secondes: float) -> dict:
    return {"appel": _appel(appels[0]) if appels else None, "sous_motif": sous_motif, "secondes": _r(secondes)}


def _brouillon(d: dict, appels: list[dict], secondes: float) -> dict:
    modele_s = sum(a["secondes"] for a in appels)
    return {"appels": [_appel(a) for a in appels], "fiche": d["fiche"], "faits": d["facts"],
            "brouillon_modele": d["llm_draft"], "brouillon": d["draft"], "dates": d["dates"],
            "bloque": d["blocked"], "violations": d["issues"],
            "secondes": _r(modele_s), "secondes_code": _r(secondes - modele_s)}


def _delais(ds: list, _appels: list[dict], secondes: float) -> dict:
    return {"echeances": [{"kind": d.kind, "due": d.due.isoformat(), "regle": d.rule, "source": d.source} for d in ds],
            "secondes": _r(secondes)}


ETAPES = {"tri": "tri", "contrôle": "controle", "brouillon": "brouillon", "délais": "delais"}
ENREGISTRE = {"tri": _tri, "contrôle": _controle, "brouillon": _brouillon, "délais": _delais}


# --- Vue : les six blocs ---------------------------------------------------------

SANS_BROUILLON = "Lot lancé sans brouillon : le rédacteur n'a pas tourné."
ETAPE = {"remboursement": "Opération non autorisée : traitement par un conseiller",
         "accuse_reception": "Accusé de réception de la réclamation",
         "reponse": "Réponse à la réclamation",
         "objectif_interne": "Réponse d'un conseiller (objectif interne)"}
REGLES_SORTIE = [   # src/output_guard.py : check, dans l'ordre du code
    ("montant", "Aucun montant (€, euros, $)"),
    ("promesse", "Aucune promesse de remboursement, de dédommagement ou de garantie"),
    ("lien", "Aucun lien, nom de domaine ni adresse email"),
    ("chaîne interdite", "Aucune chaîne interdite (liste fournie par l'évaluation des attaques)"),
    ("numéro du ticket", "Aucun numéro recopié du ticket (les dates d'échéance sont permises)"),
    ("nom du ticket", "Aucun nom propre recopié du ticket"),
]
DATES = {"ok": "Toutes les dates calculées figuraient déjà dans le brouillon",
         "corrigé": "Dates remises en code dans le brouillon (fix_dates)",
         "repli générique": "La fiche faisait perdre les dates : brouillon refait sans fiche",
         "modèle fixe": "Brouillon remplacé par le modèle fixe écrit en code"}
FICHE = {"accord": "tri et contrôleur d'accord, cohérents avec le label : fiche transmise",
         "désaccord": "tri et contrôleur en désaccord sur le sous-motif : pas de fiche",
         "incohérent avec label": "sous-motif incohérent avec le label prédit : pas de fiche",
         "incohérent avec unauthorized_payment": "sous-motif incohérent avec « paiement non autorisé » : pas de fiche",
         "anglais": "ticket en anglais : les fiches n'existent qu'en français",
         "pas de contrôleur": "pas d'avis du contrôleur : pas de fiche",
         "pas de sous_motif prédit": "le tri n'a pas donné de sous-motif : pas de fiche"}


def _mots(texte: str) -> list[str]:
    return re.findall(r"\w+", texte.lower())


def suite_commune(ticket: str, prompt: str, n: int = 5) -> str | None:
    """Première suite de n mots du ticket qui figure aussi dans le prompt (None : aucune)."""
    mots, cible = _mots(ticket), " " + " ".join(_mots(prompt)) + " "
    n = min(n, len(mots))
    for i in range(len(mots) - n + 1):
        suite = " ".join(mots[i:i + n])
        if n and f" {suite} " in cible:
            return suite
    return None


def feries(debut: date, fin: date) -> list[dict]:
    """Jours fériés (src/deadlines.py : holidays) entre la réception et la dernière échéance, avec leur nom."""
    noms = {}
    for an in range(debut.year, fin.year + 1):
        p = easter(an)
        noms.update({date(an, 1, 1): "Jour de l'an", date(an, 5, 1): "Fête du travail", date(an, 5, 8): "Victoire 1945",
                     date(an, 7, 14): "Fête nationale", date(an, 8, 15): "Assomption", date(an, 11, 1): "Toussaint",
                     date(an, 11, 11): "Armistice", date(an, 12, 25): "Noël", p + timedelta(days=1): "Lundi de Pâques",
                     p + timedelta(days=39): "Ascension", p + timedelta(days=50): "Lundi de Pentecôte"})
    jours = sorted(d for an in range(debut.year, fin.year + 1) for d in holidays(an) if debut <= d <= fin)
    return [{"date": d.isoformat(), "texte": reply.format_date(datetime.combine(d, datetime.min.time()), "fr"),
             "nom": noms[d]} for d in jours]


def _bloc(cle: str, titre: str, qui: str, etat: str, secondes: float | None = None, **contenu) -> dict:
    return {"cle": cle, "titre": titre, "qui": qui, "etat": etat, "secondes": secondes, **contenu}


def _garde_entree(t: dict | None) -> dict:
    if not t:
        return _bloc("garde_entree", "Garde d'entrée", "code", "en_attente")
    g = t["garde"]
    return _bloc("garde_entree", "Garde d'entrée", "code (src/guard.py)", "fait", g["secondes"],
                 texte_recu=g["entree"], retires=g["matches"], signal=g["flagged"], texte_envoye=g["envoye"])


def _tri_bloc(t: dict | None) -> dict:
    if not t:
        return _bloc("tri", "Tri", "llama", "en_attente")
    a = t["appel"]
    try:
        brut = json.loads(a["reponse_brute"])
    except (TypeError, ValueError):
        brut = {}
    return _bloc("tri", "Tri", a["modele"], "fait", t["secondes"], prompt=a["prompt"],
                 ticket_insere=t["garde"]["envoye"], reponse_brute=a["reponse_brute"], champs=t["champs"],
                 injection={"modele": bool(brut.get("injection_suspected")), "garde": t["garde"]["flagged"]})


def _controleur(t: dict | None, c: dict | None) -> dict:
    if not c or not t:
        return _bloc("controleur", "Contrôleur", "qwen", "en_attente")
    a, tri = c["appel"], t["champs"].get("sous_motif")
    garde_fou = answers.choose(t["champs"], c["sous_motif"])["reason"]
    return _bloc("controleur", "Contrôleur", a["modele"], "fait", c["secondes"], prompt=a["prompt"],
                 ticket_insere=t["garde"]["envoye"], reponse_brute=a["reponse_brute"],
                 sous_motif=c["sous_motif"], sous_motif_tri=tri, accord=c["sous_motif"] == tri,
                 garde_fou=garde_fou, garde_fou_texte=FICHE.get(garde_fou, garde_fou))


def _redacteur(b: dict | None, brouillon: bool, ticket: str) -> dict:
    if not brouillon:
        return _bloc("redacteur", "Rédacteur", "llama", "sans_brouillon", message=SANS_BROUILLON)
    if not b:
        return _bloc("redacteur", "Rédacteur", "llama", "en_attente")
    f = b["faits"]
    envoye = {k: f[k] for k in reply.WRITER_KEYS + (reply.FICHE_KEYS if f.get("fiche") else []) if k in f}
    raison = b["fiche"]["reason"]
    return _bloc("redacteur", "Rédacteur", b["appels"][0]["modele"] if b["appels"] else "llama", "fait", b["secondes"],
                 faits_envoyes=envoye, champs_envoyes=list(envoye),
                 appels=[{"prompt": a["prompt"], "reponse_brute": a["reponse_brute"], "secondes": a["secondes"]}
                         for a in b["appels"]],
                 ticket_dans_prompt=next((s for a in b["appels"] if (s := suite_commune(ticket, a["prompt"]))), None),
                 fiche=b["fiche"]["sous_motif"], fiche_raison=raison, fiche_texte=FICHE.get(raison, raison),
                 langue=f["langue"], brouillon_modele=b["brouillon_modele"])


def _garde_sortie(b: dict | None, brouillon: bool) -> dict:
    if not brouillon:
        return _bloc("garde_sortie", "Garde de sortie", "code", "sans_brouillon", message=SANS_BROUILLON)
    if not b:
        return _bloc("garde_sortie", "Garde de sortie", "code", "en_attente")
    trouve = {v["rule"]: v["text"] for v in b["violations"]}
    verifs = [{"regle": r, "texte": t, "resultat": "violation" if r in trouve else ("sans objet" if r == "chaîne interdite" else "ok"),
               "trouve": trouve.get(r)} for r, t in REGLES_SORTIE]
    return _bloc("garde_sortie", "Garde de sortie", "code (src/output_guard.py, fix_dates)", "fait", b["secondes_code"],
                 verifications=verifs, bloque=b["bloque"], dates=b["dates"], dates_texte=DATES.get(b["dates"], b["dates"]),
                 brouillon=b["brouillon"])


def _delais_bloc(d: dict | None, ligne: dict, recu_defaut: str, champs: dict | None) -> dict:
    if not d:
        return _bloc("delais", "Délais", "code", "en_attente")
    recu = datetime.fromisoformat(ligne.get("recu_le") or recu_defaut)
    echeances, fin = [], recu.date()
    for e in d["echeances"]:
        due = datetime.fromisoformat(e["due"])
        avance, fin = None, max(fin, due.date())
        if e["kind"] == "reponse" and champs and champs["product"] == "account":
            brute = add_months(recu.date(), 2)   # délai en mois : avancé s'il tombe un jour non ouvrable
            if brute != due.date():
                avance, fin = {"de": reply.format_date(datetime.combine(brute, datetime.min.time()), "fr")}, max(fin, brute)
        echeances.append({**e, "etape": ETAPE[e["kind"]], "date_texte": reply.format_date(due, "fr"), "avancee": avance})
    return _bloc("delais", "Délais", "code (src/deadlines.py)", "fait", d["secondes"],
                 canal=ligne.get("canal") or "form", canal_par_defaut=not ligne.get("canal"),
                 recu_le=recu.isoformat(), recu_le_texte=f"{reply.format_date(recu, 'fr')} à {recu:%H:%M}",
                 recu_par_defaut=not ligne.get("recu_le"),
                 reclamation=champs["is_complaint"] if champs else None,
                 paiement_non_autorise=champs["unauthorized_payment"] if champs else None,
                 produit=champs["product"] if champs else None,
                 echeances=echeances, feries=feries(recu.date(), fin))


def vue(lot: dict, n: int) -> dict:
    """Les six blocs du ticket n (à partir de 1), dans l'ordre du pipeline."""
    ligne = lot["lignes"][n - 1]
    t = db.get_trace(lot["id"], n - 1)
    tri = t.get("tri")
    return {"lot": lot["id"], "n": n, "id": ligne.get("id") or f"#{n}", "ticket": ligne["ticket"],
            "brouillon": bool(lot["brouillon"]), "trace": bool(t), "statut_lot": lot["statut"],
            "blocs": [_garde_entree(tri), _tri_bloc(tri), _controleur(tri, t.get("controle")),
                      _redacteur(t.get("brouillon"), bool(lot["brouillon"]), ligne["ticket"]),
                      _garde_sortie(t.get("brouillon"), bool(lot["brouillon"])),
                      _delais_bloc(t.get("delais"), ligne, lot["cree_le"], tri["champs"] if tri else None)]}
