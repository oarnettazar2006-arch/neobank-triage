"""Tests des délais : python3 -m unittest discover -s tests"""

import sys
import unittest
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
from deadlines import add_business_days, compute_deadlines, easter, holidays, is_business_day, nearest  # noqa: E402


def due(ds, kind):
    return next(d.due for d in ds if d.kind == kind)


class CalendarTest(unittest.TestCase):
    def test_easter_and_movable_holidays_2027(self):
        self.assertEqual(easter(2027), date(2027, 3, 28))
        h = holidays(2027)
        self.assertIn(date(2027, 3, 29), h)   # lundi de Pâques
        self.assertIn(date(2027, 5, 6), h)    # Ascension
        self.assertIn(date(2027, 5, 17), h)   # lundi de Pentecôte

    def test_11_november_is_not_a_business_day(self):
        self.assertFalse(is_business_day(date(2026, 11, 11)))   # mercredi férié
        self.assertTrue(is_business_day(date(2026, 11, 12)))


class DeadlineTest(unittest.TestCase):
    def test_friday_evening_counts_from_monday(self):
        # Vendredi 2 octobre 2026, 22 h : premier jour ouvrable = lundi 5
        ds = compute_deadlines(datetime(2026, 10, 2, 22, 0), False, True, "card", "chat")
        self.assertEqual(due(ds, "remboursement"), datetime(2026, 10, 5, 23, 59, 59))

    def test_saturday_counts_from_monday(self):
        ds = compute_deadlines(datetime(2026, 10, 3, 11, 0), False, False, "account", "form")
        # objectif interne 2 jours ouvrables : lundi 5 (1), mardi 6 (2)
        self.assertEqual(due(ds, "objectif_interne"), datetime(2026, 10, 6, 23, 59, 59))

    def test_eve_of_11_november_skips_the_holiday(self):
        # Mardi 10 novembre 2026 : le jour ouvrable suivant est le jeudi 12 (le 11 est férié)
        ds = compute_deadlines(datetime(2026, 11, 10, 16, 0), False, True, "transfer", "email")
        self.assertEqual(due(ds, "remboursement"), datetime(2026, 11, 12, 23, 59, 59))

    def test_card_complaint_15_business_days(self):
        # Lundi 2 novembre 2026, par email : le 11/11 est sauté
        ds = compute_deadlines(datetime(2026, 11, 2, 9, 0), True, False, "card", "email")
        self.assertEqual(due(ds, "reponse"), datetime(2026, 11, 24, 23, 59, 59))
        self.assertEqual(due(ds, "accuse_reception"), datetime(2026, 11, 17, 23, 59, 59))
        self.assertEqual(nearest(ds).kind, "accuse_reception")

    def test_account_complaint_two_months(self):
        ds = compute_deadlines(datetime(2026, 12, 31, 10, 0), True, False, "account", "form")
        self.assertEqual(due(ds, "reponse"), datetime(2027, 2, 28, 23, 59, 59))   # 31/02 n'existe pas

    def test_unauthorized_payment_next_business_day(self):
        ds = compute_deadlines(datetime(2026, 10, 7, 14, 0), False, True, "card", "form")
        self.assertEqual([d.kind for d in ds], ["remboursement"])
        self.assertEqual(ds[0].due, datetime(2026, 10, 8, 23, 59, 59))

    def test_chat_complaint_has_no_acknowledgement(self):
        ds = compute_deadlines(datetime(2026, 10, 7, 14, 0), True, False, "card", "chat")
        self.assertEqual([d.kind for d in ds], ["reponse"])

    def test_unknown_product_complaint_15_business_days(self):
        ds = compute_deadlines(datetime(2026, 10, 7, 14, 0), True, False, "unknown", "email")
        self.assertEqual(due(ds, "reponse").date(), add_business_days(date(2026, 10, 7), 15))

    def test_unauthorized_complaint_has_all_three(self):
        ds = compute_deadlines(datetime(2026, 10, 7, 14, 0), True, True, "card", "email")
        self.assertEqual([d.kind for d in ds], ["remboursement", "accuse_reception", "reponse"])


if __name__ == "__main__":
    unittest.main()
