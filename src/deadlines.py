"""Délais du guide (section 7), calculés en code, jamais par le LLM.

    from deadlines import compute_deadlines
    ds = compute_deadlines(received_at, is_complaint=True, unauthorized_payment=False,
                           product="card", channel="email")

Conventions (guide, section 7, et choix documentés ici) :
- jour ouvrable : du lundi au vendredi, hors jours fériés français (fériés
  nationaux, dont le lundi de Pentecôte ; pas les fériés propres à
  l'Alsace-Moselle) ;
- « sous N jours ouvrables » : on compte à partir du premier jour ouvrable qui
  suit la réception (un ticket reçu un vendredi soir ou un samedi commence à
  courir le lundi) ; l'échéance est la fin (23:59:59) du N-ième jour ouvrable ;
- « 2 mois » : même quantième deux mois plus tard (ramené au dernier jour du
  mois s'il n'existe pas), fin de journée ;
- une échéance qui tombe un jour non ouvrable (férié ou week-end) est avancée
  au dernier jour ouvrable qui la précède : répondre un jour trop tôt ne coûte
  rien, un jour trop tard coûte une non-conformité (décision du 23/09/2026).
  Seuls les délais en mois sont concernés : ceux comptés en jours ouvrables
  tombent toujours un jour ouvrable ;
- opération non autorisée : fin du premier jour ouvrable qui suit le signalement ;
- réclamation par chat : pas d'accusé de réception à 10 jours ouvrables (le
  guide demande d'inviter le client à formaliser par écrit) ; le délai de
  réponse s'applique quand même.
Bibliothèque standard uniquement.
"""

from __future__ import annotations

import calendar
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from functools import lru_cache

PAYMENT_SERVICES = {"card", "transfer", "direct_debit"}
END_OF_DAY = time(23, 59, 59)


@dataclass(frozen=True)
class Deadline:
    kind: str          # accuse_reception, reponse, remboursement, objectif_interne
    due: datetime
    rule: str          # texte court de la règle appliquée
    source: str


def easter(year: int) -> date:
    """Dimanche de Pâques (algorithme grégorien anonyme)."""
    a, b, c = year % 19, year // 100, year % 100
    d, e = b // 4, b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = c // 4, c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = (h + l - 7 * m + 114) % 31 + 1
    return date(year, month, day)


@lru_cache(maxsize=None)
def holidays(year: int) -> frozenset[date]:
    """Jours fériés nationaux français."""
    e = easter(year)
    fixed = [(1, 1), (5, 1), (5, 8), (7, 14), (8, 15), (11, 1), (11, 11), (12, 25)]
    return frozenset([date(year, m, d) for m, d in fixed]
                     + [e + timedelta(days=1), e + timedelta(days=39), e + timedelta(days=50)])


def is_business_day(d: date) -> bool:
    return d.weekday() < 5 and d not in holidays(d.year)


def add_business_days(start: date, n: int) -> date:
    """N-ième jour ouvrable strictement après `start`."""
    d, count = start, 0
    while count < n:
        d += timedelta(days=1)
        if is_business_day(d):
            count += 1
    return d


def add_months(start: date, months: int) -> date:
    y, m = divmod(start.month - 1 + months, 12)
    year, month = start.year + y, m + 1
    return date(year, month, min(start.day, calendar.monthrange(year, month)[1]))


def previous_business_day_if_needed(d: date) -> date:
    """d s'il est ouvrable, sinon le dernier jour ouvrable avant d."""
    while not is_business_day(d):
        d -= timedelta(days=1)
    return d


def end_of(d: date) -> datetime:
    return datetime.combine(d, END_OF_DAY)


def compute_deadlines(received_at: datetime, is_complaint: bool, unauthorized_payment: bool,
                      product: str, channel: str) -> list[Deadline]:
    """Tous les délais qui courent pour ce ticket, du plus proche au plus lointain."""
    day = received_at.date()
    out: list[Deadline] = []
    if unauthorized_payment:
        out.append(Deadline("remboursement", end_of(add_business_days(day, 1)),
                            "fin du premier jour ouvrable suivant le signalement", "CMF L133-18"))
    if is_complaint:
        if channel != "chat":
            out.append(Deadline("accuse_reception", end_of(add_business_days(day, 10)),
                                "accusé de réception sous 10 jours ouvrables", "ACPR 2022-R-01"))
        if product == "account":
            due = previous_business_day_if_needed(add_months(day, 2))
            out.append(Deadline("reponse", end_of(due), "réponse sous 2 mois (avancée au jour ouvrable précédent si besoin)", "ACPR 2022-R-01"))
        else:
            source = "CMF L133-45" if product in PAYMENT_SERVICES else "règle VAULT (produit inconnu)"
            out.append(Deadline("reponse", end_of(add_business_days(day, 15)),
                                "réponse sous 15 jours ouvrables (35 au maximum avec réponse d'attente motivée)", source))
    if not is_complaint and not unauthorized_payment:
        out.append(Deadline("objectif_interne", end_of(add_business_days(day, 2)),
                            "objectif interne : 2 jours ouvrables", "règle VAULT"))
    return sorted(out, key=lambda d: d.due)


def nearest(deadlines: list[Deadline]) -> Deadline | None:
    """Le délai que la console affiche : le plus proche."""
    return deadlines[0] if deadlines else None
