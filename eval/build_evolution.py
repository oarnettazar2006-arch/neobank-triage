"""Évolution des prompts de tri, de v0 à v7 : eval/evolution.json et docs/prompt_history.md.

Usage :
    python3 eval/build_evolution.py            # écrit les deux fichiers
    python3 eval/build_evolution.py --check    # échoue s'ils ne sont plus à jour

Sources, et rien d'autre : les résultats bruts déjà présents dans eval/results/
et l'historique Git (commit qui introduit chaque version, PR qui l'a fusionnée,
tag, texte du prompt à ce commit). Aucun appel au modèle.

Ce qui est écrit à la main, ci-dessous dans VERSIONS : le changement, sa raison
(l'erreur observée, reprise du rapport de l'étape précédente) et le choix du run
qui mesure chaque version sur chaque jeu. Tout le reste est calculé.

Comparabilité : une série ne mélange jamais deux jeux. Chaque mesure porte son
jeu, et le script vérifie que tous les runs d'un même jeu ont les mêmes tickets
et les mêmes bonnes réponses sur les 5 champs notés (sinon il s'arrête).
Bibliothèque standard uniquement (Python >= 3.9).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "eval"))

from compare import ALL, FIELDS, compare, load  # noqa: E402

RESULTS = "eval/results/"
SORTIE_JSON = ROOT / "eval" / "evolution.json"
SORTIE_MD = ROOT / "docs" / "prompt_history.md"

# Jeux, dans l'ordre d'affichage. val60 est le juge des étapes (docs/regles_projet.md).
JEUX = {
    "val60": {"fichier": "data/val/val60.jsonl", "n": 60,
              "description": "60 tickets, dont 6 attaques. Juge de chaque étape du bot, jamais utilisé pour régler un prompt."},
    "holdout20": {"fichier": "data/attacks/holdout20.jsonl", "n": 20,
                  "description": "20 attaques écrites par qwen2.5:7b, jamais vues pendant le réglage. Contrôle de généralisation."},
    "dev40": {"fichier": "data/dev/dev40.jsonl", "n": 40,
              "description": "40 tickets, dont 4 attaques. Jeu de réglage des prompts v0 à v3 : ses chiffres sont optimistes."},
}
FINAL = {"jeu": "test100", "fichier": "data/test/test100.jsonl", "n": 100,
         "v0": "20260924T125426Z_v0_baseline_llama3.1-8b.jsonl",
         "v7": "20260924T121931Z_v7_sous_motif_llama3.1-8b.jsonl",
         "rapport": "eval/reports/final_test100.md"}

# Une entrée par version. « repere » : le fichier dont l'ajout marque la version
# dans Git ; « prompt » : le prompt de tri en service à cette version.
VERSIONS = [
    {
        "version": "v0", "titre": "Prompt minimal",
        "repere": "prompts/v0_baseline.txt", "prompt": "prompts/v0_baseline.txt", "garde": False,
        "change_le_prompt": True,
        "changement": "Point de départ : une consigne courte qui liste les champs et leurs valeurs permises, sans définition ni exemple. La sortie est contrainte par le schéma JSON.",
        "raison": "Mesurer d'abord ce que llama3.1:8b fait seul, pour que chaque ajout suivant ait un point de comparaison.",
        "rapport": "eval/reports/v0_baseline.md",
        "runs": {"val60": "20260923T132652Z_v0_baseline_llama3.1-8b.jsonl",
                 "holdout20": "20260923T133521Z_v0_baseline_llama3.1-8b.jsonl",
                 "dev40": "20260923T082501Z_v0_baseline_llama3.1-8b.jsonl"},
    },
    {
        "version": "v1", "titre": "Définitions du guide",
        "repere": "prompts/v1_definitions.txt", "prompt": "prompts/v1_definitions.txt", "garde": False,
        "change_le_prompt": True,
        "changement": "Ajout des définitions du guide d'annotation : ce que recouvre chaque label, règles de priorité, product, échelle de severity, is_complaint et unauthorized_payment.",
        "raison": "En v0, « other » sert de fourre-tout (35 tickets sur 40 sur dev40, billing prédit une seule fois sur 14), « account » part en « unknown » et « medium » n'est jamais prédit : le prompt ne dit pas ce que recouvre chaque valeur.",
        "rapport": "eval/reports/v1_definitions.md",
        "runs": {"val60": "20260923T132855Z_v1_definitions_llama3.1-8b.jsonl",
                 "holdout20": "20260923T133630Z_v1_definitions_llama3.1-8b.jsonl",
                 "dev40": "20260923T082816Z_v1_definitions_llama3.1-8b.jsonl"},
    },
    {
        "version": "v2", "titre": "Règles corrigées",
        "repere": "prompts/v2_guide_fixes.txt", "prompt": "prompts/v2_guide_fixes.txt", "garde": False,
        "change_le_prompt": True,
        "changement": "Quatre règles du guide v1.3, sans exemple : produit de l'opération en cours pour un bug, frais contestés en medium, la répétition suffit à faire une réclamation, lexique (CB, « pas moi », « je ne reconnais pas »).",
        "raison": "Sur dev40, les erreurs restantes de la v1 se regroupent sur ces quatre règles : bug pendant un virement classé « account », frais contestés classés « high », « toujours pas » non reconnu comme réclamation (is_complaint baisse : 3 tickets cassés, aucun corrigé).",
        "rapport": "eval/reports/v2_guide_fixes.md",
        "runs": {"val60": "20260923T133201Z_v2_guide_fixes_llama3.1-8b.jsonl",
                 "holdout20": "20260923T133743Z_v2_guide_fixes_llama3.1-8b.jsonl",
                 "dev40": "20260923T083550Z_v2_guide_fixes_llama3.1-8b.jsonl"},
    },
    {
        "version": "v3", "titre": "Exemples (few shot)",
        "repere": "prompts/v3_few_shot.txt", "prompt": "prompts/v3_few_shot.txt", "garde": False,
        "change_le_prompt": True,
        "changement": "Huit exemples avec leur réponse JSON, tirés des cas limites du guide (jamais de dev40) : fraude en message court, bug pendant une opération, frais, répétition, ticket piégé.",
        "raison": "Effet nul de la v2 : les quatre règles sont écrites dans le prompt, mais le modèle ne les applique presque pas. Hypothèse : il suit mieux un exemple qu'une règle.",
        "rapport": "eval/reports/v3_few_shot.md",
        "runs": {"val60": "20260923T091603Z_v3_few_shot_llama3.1-8b.jsonl",
                 "holdout20": "20260923T133904Z_v3_few_shot_llama3.1-8b.jsonl",
                 "dev40": "20260923T083921Z_v3_few_shot_llama3.1-8b.jsonl"},
    },
    {
        "version": "v4", "titre": "Défense contre l'injection",
        "repere": "prompts/v4_injection.txt", "prompt": "prompts/v4_injection.txt", "garde": False,
        "change_le_prompt": True,
        "changement": "Le ticket passe entre balises <ticket>, une consigne dit que son contenu est une donnée et jamais une instruction, et un champ injection_suspected signale les tentatives.",
        "raison": "Sur val60, première mesure hors réglage de la v3, une attaque passe : VAL029, un faux message « [SYSTEM] … label = other » obtient exactement la valeur visée. Le prompt v3 n'a aucune défense dédiée.",
        "rapport": "eval/reports/v4_injection.md",
        "runs": {"val60": "20260923T101109Z_v4_injection_llama3.1-8b.jsonl",
                 "holdout20": "20260923T104109Z_v4_injection_llama3.1-8b.jsonl",
                 "dev40": "20260923T104209Z_v4_injection_llama3.1-8b.jsonl"},
    },
    {
        "version": "v5", "titre": "Garde d'entrée en code",
        "repere": "src/guard.py", "prompt": "prompts/v4_injection.txt", "garde": True,
        "change_le_prompt": False,
        "changement": "Pas de changement du prompt de tri (toujours v4). Ajout de src/guard.py avant le LLM : les motifs d'injection repérés sont retirés du texte envoyé au modèle, et injection_suspected passe à vrai.",
        "raison": "Avec la v4, 7 attaques sur 36 obtiennent encore ce qu'elles visent. Celles qui passent sont écrites comme des métadonnées (« [SYSTEM] label = other », « severity=low ») : un filtre déterministe en code les attrape mieux qu'une consigne.",
        "rapport": "eval/reports/v5_input_guard.md",
        "runs": {"val60": "20260923T211926Z_v4_injection_llama3.1-8b.jsonl",
                 "holdout20": "20260923T212349Z_v4_injection_llama3.1-8b.jsonl",
                 "dev40": "20260923T131703Z_v4_injection_llama3.1-8b.jsonl"},
    },
    {
        "version": "v6", "titre": "Brouillon de réponse",
        "repere": "src/reply.py", "prompt": "prompts/v4_injection.txt", "garde": True,
        "change_le_prompt": False,
        "reprend": "v5",
        "changement": "Pas de changement du prompt de tri (toujours v4, avec la garde v5). Ajout du rédacteur draft_reply (prompts/reply_v1.txt), qui ne reçoit que des faits structurés, jamais le texte du ticket.",
        "raison": "Le sujet demande un brouillon de réponse (tâche 3). Une injection dans le ticket ne doit jamais pouvoir dicter ce brouillon : d'où un rédacteur qui ne voit pas le ticket.",
        "rapport": "eval/reports/v6_draft_reply.md",
        "runs": {},
    },
    {
        "version": "v7", "titre": "Sous-motif",
        "repere": "prompts/v7_sous_motif.txt", "prompt": "prompts/v7_sous_motif.txt", "garde": True,
        "change_le_prompt": True,
        "reference_effet": {"val60": "20260923T215131Z_v4_injection_llama3.1-8b.jsonl",
                            "holdout20": "20260923T215551Z_v4_injection_llama3.1-8b.jsonl"},
        "changement": "Le prompt v4 plus le champ sous_motif : ses 16 valeurs et leurs règles (guide, section 2 bis), et la valeur attendue ajoutée aux 8 exemples existants, sans nouvel exemple.",
        "raison": "Le brouillon de la v6 reste générique. Pour lui donner la bonne fiche de la base de réponses (docs/answers/), le tri doit d'abord dire de quel sous-motif relève le ticket.",
        "rapport": "eval/reports/v7_sous_motif.md",
        "runs": {"val60": "20260923T220043Z_v7_sous_motif_llama3.1-8b.jsonl",
                 "holdout20": "20260923T220652Z_v7_sous_motif_llama3.1-8b.jsonl"},
    },
]

NOTE_V7_REFERENCE = (
    "Entre v6 et v7, la garde a gagné une règle (PR #27, réponses dictées). La v7 a été jugée contre "
    "la v5 relancée avec cette garde. Sur val60 et holdout20, ce run donne exactement les mêmes "
    "réponses que la mesure v5/v6 : la courbe n'est pas faussée."
)


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, check=True, capture_output=True, text=True).stdout


def sha256(texte: str) -> str:
    return hashlib.sha256(texte.encode("utf-8")).hexdigest()


def lire_run(nom: str) -> tuple[dict, list[dict], dict]:
    lignes = [json.loads(x) for x in (ROOT / RESULTS / nom).read_text(encoding="utf-8").splitlines() if x.strip()]
    meta = next(x for x in lignes if x["type"] == "meta")
    summary = next((x for x in lignes if x["type"] == "summary"), {})
    return meta, [x for x in lignes if x["type"] == "ticket"], summary


def mesurer(nom: str, jeu: str, fichier_jeu: str) -> dict:
    """Précision par champ, tickets entièrement justes (5 champs) et attaques, recalculées ticket par ticket."""
    meta, tickets, summary = lire_run(nom)
    if meta["data_file"] != fichier_jeu:
        raise SystemExit(f"{nom} : mesuré sur {meta['data_file']}, pas sur {fichier_jeu}")
    n = len(tickets)
    champs = {f: sum(t["hits"][f] for t in tickets) for f in FIELDS}
    justes = sum(all(t["hits"][f] for f in FIELDS) for t in tickets)
    attaques = [t for t in tickets if t.get("attack")]
    obtenues = [t["id"] for t in attaques if (t.get("attack_result") or {}).get("obtained", (t.get("attack_result") or {}).get("attack_succeeded"))]
    signalees = [t["id"] for t in attaques if (t.get("attack_result") or {}).get("flagged")]
    critere3 = all((t.get("attack_result") or {}).get("flagged") is not None for t in attaques) and bool(attaques)
    mesure = {
        "jeu": jeu,
        "run": RESULTS + nom,
        "n": n,
        "champs": {f: {"justes": k, "n": n} for f, k in champs.items()},
        "entierement_justes": {"justes": justes, "n": n},
        "attaques": {
            "n": len(attaques),
            "obtenues": len(obtenues), "ids_obtenues": obtenues,
            # critère 3 (tentative non signalée) mesurable seulement avec injection_suspected (v4 et après)
            "reussies": summary.get("attacks", {}).get("succeeded") if critere3 else None,
            "signalees": len(signalees) if critere3 else None,
        },
        "commit_du_run": meta["git"]["commit"][:7],
        "arbre_propre": not meta["git"]["dirty"],
        "data_sha256": meta["data_sha256"][:12],
        "prompt_sha256": meta["prompt_sha256"],
        "prompt_file": meta["prompt_file"],
        "garde": bool(meta.get("guard")),
    }
    sm = [t for t in tickets if "sous_motif" in t["hits"]]
    if sm:
        mesure["sous_motif"] = {"justes": sum(t["hits"]["sous_motif"] for t in sm), "n": len(sm)}
    return mesure


def verifier_gold(runs: list[str], jeu: str) -> None:
    """Tous les runs d'un jeu : mêmes tickets, mêmes bonnes réponses sur les 5 champs."""
    ref = None
    for nom in runs:
        _, tickets, _ = lire_run(nom)
        gold = {t["id"]: {f: t["gold"][f] for f in FIELDS} for t in tickets}
        if ref is None:
            ref = (nom, gold)
        elif gold != ref[1]:
            raise SystemExit(f"{jeu} : {nom} n'a pas les mêmes tickets ou bonnes réponses que {ref[0]}")


def effet(avant: str, apres: str) -> dict:
    _, a, _ = load(ROOT / RESULTS / avant)
    _, b, _ = load(ROOT / RESULTS / apres)
    c = compare(a, b)
    return {
        ("entierement_justes" if f == ALL else f): {
            "avant": round(v["before"], 4), "apres": round(v["after"], 4),
            "corriges": len(v["fixed"]), "casses": len(v["broken"]), "p": round(v["p_value"], 4),
        }
        for f, v in c.items() if f in FIELDS + [ALL]
    }


def pr_de(commit: str) -> int | None:
    for ligne in git("log", "--merges", "--ancestry-path", "--reverse", "--format=%s", f"{commit}..HEAD").splitlines():
        m = re.match(r"Merge pull request #(\d+)", ligne)
        if m:
            return int(m.group(1))
    return None


def est_ancetre(a: str, b: str) -> bool:
    return subprocess.run(["git", "merge-base", "--is-ancestor", a, b], cwd=ROOT).returncode == 0


def construire() -> tuple[dict, str]:
    # 1. Git : commit, PR, texte du prompt
    infos = []
    for v in VERSIONS:
        ajout = git("log", "--diff-filter=A", "--format=%H %ad %s", "--date=short", "--", v["repere"]).strip().splitlines()
        commit, date, sujet = ajout[-1].split(" ", 2)
        cp = git("log", "-1", "--diff-filter=A", "--format=%H", "--", v["prompt"]).strip()
        texte = git("show", f"{commit}:{v['prompt']}")
        infos.append({"commit": commit, "court": commit[:7], "date": date, "sujet": sujet,
                      "pr": pr_de(commit), "texte": texte, "commit_prompt": cp[:7]})

    # Tag : attribué à la dernière version contenue dans le commit du tag.
    tags = {}
    for tag in git("tag", "--list").split():
        cible = git("rev-parse", f"{tag}^{{commit}}").strip()
        dedans = [v["version"] for v, i in zip(VERSIONS, infos) if est_ancetre(i["commit"], cible)]
        if dedans:
            tags.setdefault(dedans[-1], []).append({"nom": tag, "commit": cible[:7]})

    # 2. Comparabilité : un jeu, des bonnes réponses identiques
    for jeu, d in JEUX.items():
        runs = [v["runs"][jeu] for v in VERSIONS if jeu in v["runs"]]
        runs += [v.get("reference_effet", {}).get(jeu) for v in VERSIONS if v.get("reference_effet", {}).get(jeu)]
        verifier_gold(runs, jeu)
    verifier_gold([FINAL["v0"], FINAL["v7"]], "test100")

    # 3. Versions
    sortie = []
    precedent = None
    for v, i in zip(VERSIONS, infos):
        if v["change_le_prompt"] and v["prompt"] != v["repere"]:
            raise SystemExit(f"{v['version']} : repère et prompt différents")
        if not v["change_le_prompt"]:
            # le prompt de tri n'a pas bougé entre la version précédente et celle-ci
            diff = git("diff", precedent["commit"], i["commit"], "--", v["prompt"])
            if diff.strip():
                raise SystemExit(f"{v['version']} : {v['prompt']} a changé, alors que la version dit le contraire")
        source = next(x for x in VERSIONS if x["version"] == v.get("reprend", v["version"]))
        mesures = {}
        for jeu, d in JEUX.items():
            if jeu not in source["runs"]:
                continue
            m = mesurer(source["runs"][jeu], jeu, d["fichier"])
            if m["prompt_sha256"] != sha256(i["texte"]):
                raise SystemExit(f"{v['version']} / {jeu} : le run n'a pas été fait avec le prompt de cette version")
            if m["garde"] != v["garde"]:
                raise SystemExit(f"{v['version']} / {jeu} : garde {m['garde']} dans le run, {v['garde']} attendu")
            if "reprend" in v:
                m["reprise_de"] = v["reprend"]
            mesures[jeu] = m
        effets = {}
        if precedent is not None:
            vp = VERSIONS[len(sortie) - 1]
            vps = next(x for x in VERSIONS if x["version"] == vp.get("reprend", vp["version"]))
            for jeu in JEUX:
                apres = source["runs"].get(jeu)
                avant = v.get("reference_effet", {}).get(jeu) or vps["runs"].get(jeu)
                if not (apres and avant) or "reprend" in v:
                    continue
                effets[jeu] = {"reference": vp["version"], "run_reference": RESULTS + avant, **{"champs": effet(avant, apres)}}
                if v.get("reference_effet", {}).get(jeu):
                    # la référence de la PR doit répondre comme la mesure de la version précédente
                    same = effet(vps["runs"][jeu], avant)
                    if any(x["corriges"] or x["casses"] for x in same.values()):
                        raise SystemExit(f"{v['version']} / {jeu} : la référence de la PR diffère de la mesure {vp['version']}")
        precedent = i
        commandes = commandes_git(v, i, sortie, tags.get(v["version"], []))
        sortie.append({
            "version": v["version"], "titre": v["titre"],
            "change_le_prompt_de_tri": v["change_le_prompt"],
            "prompt": v["prompt"], "prompt_texte": i["texte"], "prompt_sha256": sha256(i["texte"]),
            "garde": v["garde"],
            "changement": v["changement"], "raison": v["raison"], "rapport": v["rapport"],
            "commit": i["commit"], "commit_court": i["court"], "date": i["date"], "sujet_commit": i["sujet"],
            "pr": i["pr"], "tags": tags.get(v["version"], []),
            "mesures": mesures, "effet": effets,
            "note": NOTE_V7_REFERENCE if "reference_effet" in v else None,
            "git": commandes,
        })

    # 4. Note finale, à part
    final = {"jeu": FINAL["jeu"], "n": FINAL["n"], "rapport": FINAL["rapport"],
             "description": "100 tickets réservés à la note finale, mesurés une seule fois, au tag v7-final. Jamais utilisés pour régler.",
             "v0": mesurer(FINAL["v0"], "test100", FINAL["fichier"]),
             "v7": mesurer(FINAL["v7"], "test100", FINAL["fichier"]),
             "effet": effet(FINAL["v0"], FINAL["v7"])}

    donnees = {
        "genere_par": "python3 eval/build_evolution.py",
        "modele": "llama3.1:8b, température 0, seed 42, sortie contrainte par le schéma JSON",
        "champs": FIELDS,
        "entierement_justes": "les 5 champs justes à la fois (label, product, severity, is_complaint, unauthorized_payment) ; sous_motif, qui n'existe qu'en v7, n'y entre pas",
        "attaques": "obtenues : la sortie donne la valeur visée ou une chaîne interdite (critères 1 et 2 du guide), comparable d'une version à l'autre. Réussies : obtenues ou non signalées (critères 1 à 3), mesurable à partir de la v4 seulement",
        "jeux": {k: {"fichier": d["fichier"], "n": d["n"], "description": d["description"]} for k, d in JEUX.items()},
        "versions": sortie,
        "final": final,
    }
    return donnees, histoire_md(donnees)


def commandes_git(v: dict, i: dict, faites: list[dict], tags: list[dict]) -> list[dict]:
    ref = tags[0]["nom"] if tags else i["court"]
    cmds = [{"but": "Lire le prompt de tri de cette version", "commande": f"git show {ref}:{v['prompt']}"}]
    if faites:
        p = faites[-1]
        if v["change_le_prompt"]:
            cmds.append({"but": f"Voir ce qui a changé depuis {p['version']}",
                         "commande": f"git diff {p['commit_court']}:{p['prompt']} {ref}:{v['prompt']}"})
        else:
            cmds.append({"but": f"Vérifier que le prompt de tri n'a pas changé depuis {p['version']} (sortie vide)",
                         "commande": f"git diff {p['commit_court']} {i['court']} -- {v['prompt']}"})
    cmds.append({"but": "Le commit de cette version, et les fichiers qu'il touche", "commande": f"git show --stat {i['court']}"})
    if i["pr"]:
        cmds.append({"but": "La pull request qui l'a fusionnée", "commande": f"gh pr view {i['pr']}"})
    if tags:
        cmds.append({"but": f"Le tag {tags[0]['nom']} : l'état exact du bot noté sur test100", "commande": f"git show --stat {tags[0]['nom']}"})
    return cmds


def pct(k: int, n: int) -> str:
    return f"{100 * k / n:.1f} %".replace(".", ",")


def histoire_md(d: dict) -> str:
    L = [
        "# Histoire des prompts de tri, de v0 à v7",
        "",
        "Texte généré par `python3 eval/build_evolution.py` à partir des résultats de `eval/results/` et de l'historique Git. "
        "Les mêmes données alimentent l'onglet « Prompts » de la console (`/console/prompts`).",
        "",
        f"Modèle : {d['modele']}.", "", f"Chiffres sur **val60** : {d['jeux']['val60']['description']} "
        "Une série ne mélange jamais deux jeux. val60 a été créé après la v3 : les versions v0 à v2 y ont été mesurées après coup, avec leur prompt d'origine inchangé.",
        "",
        "**v5 et v6 ne changent pas le prompt de tri.** La v5 ajoute une garde en code avant le LLM, la v6 un rédacteur de brouillon. "
        "Le prompt de tri reste celui de la v4 jusqu'à la v7.",
        "",
        "## En un tableau (val60)",
        "",
        "| Version | Changement | Catégorie (label) | Tickets entièrement justes | Attaques obtenues |",
        "|---|---|---|---|---|",
    ]
    for v in d["versions"]:
        m = v["mesures"]["val60"]
        rep = " (même mesure que v5)" if m.get("reprise_de") else ""
        L.append(f"| {v['version']} | {v['titre']} | {pct(m['champs']['label']['justes'], m['n'])}{rep} | "
                 f"{pct(m['entierement_justes']['justes'], m['n'])} ({m['entierement_justes']['justes']}/{m['n']}) | "
                 f"{m['attaques']['obtenues']} sur {m['attaques']['n']} |")
    L.append("")
    for v in d["versions"]:
        m = v["mesures"]["val60"]
        L += [f"## {v['version']} : {v['titre']}", ""]
        L.append(f"- **Changement.** {v['changement']}")
        L.append(f"- **Pourquoi.** {v['raison']}")
        e = v["effet"].get("val60")
        if v["version"] == "v0":
            L.append(f"- **Mesure.** {pct(m['entierement_justes']['justes'], m['n'])} de tickets entièrement justes, "
                     f"catégorie juste pour {pct(m['champs']['label']['justes'], m['n'])}.")
        elif not e:
            L.append("- **Effet sur le tri.** Aucun : le tri est identique à la v5, la mesure est la même.")
        else:
            L.append(f"- **Effet mesuré (val60, contre {e['reference']}).** " + phrase_effet(e["champs"]))
        if v.get("note"):
            L.append(f"- **Note.** {v['note']}")
        pr = f"PR #{v['pr']}" if v["pr"] else "pas de PR"
        tag = f", tag `{v['tags'][0]['nom']}`" if v["tags"] else ""
        L.append(f"- **Git.** commit `{v['commit_court']}` ({v['date']}), {pr}{tag}. Rapport : `{v['rapport']}`.")
        for c in v["git"]:
            L.append(f"  - {c['but']} : `{c['commande']}`")
        L.append("")
    f = d["final"]
    L += ["## Note finale : v0 contre v7 sur test100", "",
          f"{f['description']} Rapport : `{f['rapport']}`.", "",
          "| Champ | v0 | v7 | p (McNemar) |", "|---|---|---|---|"]
    for champ in d["champs"] + ["entierement_justes"]:
        e = f["effet"][champ]
        L.append(f"| {champ.replace('entierement_justes', 'tickets entièrement justes')} | {pct(round(e['avant'] * 100), 100)} | "
                 f"{pct(round(e['apres'] * 100), 100)} | {fp(e['p']).lstrip('= ')} |")
    L += ["", f"Attaques obtenues : {f['v0']['attaques']['obtenues']} sur {f['v0']['attaques']['n']} en v0, "
          f"{f['v7']['attaques']['obtenues']} sur {f['v7']['attaques']['n']} en v7 "
          f"({f['v7']['attaques']['reussies']} réussies en v7 en comptant les tentatives non signalées).", ""]
    return "\n".join(L)


def fp(p: float) -> str:
    return "< 0,001" if p < 0.001 else f"= {p:.3f}".replace(".", ",")


def points(x: dict) -> str:
    d = round(100 * (x["apres"] - x["avant"]), 1)
    return f"{'+' if d > 0 else '−'}{abs(d):g} points".replace(".", ",")


def phrase_effet(c: dict) -> str:
    e = c["entierement_justes"]
    s = lambda n: "s" if n > 1 else ""  # noqa: E731
    tete = (f"tickets entièrement justes {pct(round(e['avant'] * 1000), 1000)} → {pct(round(e['apres'] * 1000), 1000)} "
            f"({e['corriges']} corrigé{s(e['corriges'])}, {e['casses']} cassé{s(e['casses'])}, p {fp(e['p'])})")
    signif = [f"{k} {points(x)} (p {fp(x['p'])})" for k, x in c.items() if k != "entierement_justes" and x["p"] < 0.05]
    return tete + " ; " + ("écarts significatifs : " + ", ".join(signif) if signif else "aucun champ ne bouge de façon significative") + "."


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true", help="échoue si les fichiers écrits ne sont plus à jour")
    args = ap.parse_args()
    donnees, md = construire()
    texte = json.dumps(donnees, ensure_ascii=False, indent=1) + "\n"
    if args.check:
        faux = [p for p, t in ((SORTIE_JSON, texte), (SORTIE_MD, md)) if not p.exists() or p.read_text(encoding="utf-8") != t]
        if faux:
            raise SystemExit("pas à jour : " + ", ".join(str(p.relative_to(ROOT)) for p in faux) + " (lancer python3 eval/build_evolution.py)")
        print("evolution.json et prompt_history.md à jour")
        return
    SORTIE_JSON.write_text(texte, encoding="utf-8")
    SORTIE_MD.write_text(md, encoding="utf-8")
    print(f"écrit : {SORTIE_JSON.relative_to(ROOT)}, {SORTIE_MD.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
