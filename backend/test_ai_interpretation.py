from decimal import Decimal
import unittest

from ai_service import normalize_accounting_action, normalize_amount
from schemas import AIAccountingAction


ACCOUNTS = [
    {"id": "cash", "name": "Cash", "type": "asset", "code": "1000"},
    {"id": "bank", "name": "Bank", "type": "asset", "code": "1010"},
    {"id": "utilities", "name": "Utilities Expense", "type": "expense", "code": "5100"},
    {"id": "other", "name": "Other Expenses", "type": "expense", "code": "5900"},
]


class TomanBusinessCurrencyTests(unittest.TestCase):
    """A business whose own ledger currency IS Toman needs no unit scaling at
    all — and one ledgered in Rial still gets the existing behavior above,
    unaffected by this business_currency parameter existing."""

    def test_toman_business_toman_speech_is_unscaled(self):
        self.assertEqual(
            normalize_amount("۲ میلیون تومان فروش داشتم", "TOMAN"),
            (Decimal("2000000"), "TOMAN"),
        )

    def test_toman_business_rial_speech_is_scaled_down(self):
        self.assertEqual(
            normalize_amount("۲۰ میلیون ریال فروش داشتم", "TOMAN"),
            (Decimal("2000000"), "TOMAN"),
        )

    def test_foreign_currency_business_is_not_scaled(self):
        # A genuine currency mismatch (not a unit to convert) — the number is
        # reported as stated; the caller is responsible for forcing the
        # business's own ledger currency onto the final action.
        self.assertEqual(
            normalize_amount("۲ میلیون تومان فروش داشتم", "USD"),
            (Decimal("2000000"), "TOMAN"),
        )


class AmountNormalizationTests(unittest.TestCase):
    def test_toman_is_converted_to_rial(self):
        self.assertEqual(normalize_amount("۵ میلیون تومن برای خرید شیر دادم", "IRR"), (Decimal("50000000"), "IRR"))

    def test_english_digits_with_persian_scale_are_supported(self):
        self.assertEqual(normalize_amount("5 میلیون تومان", "IRR"), (Decimal("50000000"), "IRR"))

    def test_arabic_indic_digits_are_supported(self):
        self.assertEqual(normalize_amount("٥ مليون تومان", "IRR"), (Decimal("50000000"), "IRR"))

    def test_rial_is_not_converted(self):
        self.assertEqual(normalize_amount("۵ میلیون ریال برای قبض برق پرداخت کردم", "IRR"), (Decimal("5000000"), "IRR"))

    def test_grouped_toman_amount(self):
        self.assertEqual(normalize_amount("۲,۵۰۰,۰۰۰ تومان", "IRR"), (Decimal("25000000"), "IRR"))

    def test_unseparated_rial_amount(self):
        self.assertEqual(normalize_amount("۲۵۰۰۰۰۰ ریال", "IRR"), (Decimal("2500000"), "IRR"))


class ConservativePreviewTests(unittest.TestCase):
    def test_milk_purchase_preserves_amount_and_description_without_assumed_accounts(self):
        message = "امروز ۵ میلیون تومن دادم برای خرید ۵ کارتن شیر ماهشام"
        result = normalize_accounting_action(
            message,
            AIAccountingAction(intent="expense", amount=Decimal("5000000"), currency="IRR", description="هزینه متفرقه", debit_account_id="other", credit_account_id="cash"),
            ACCOUNTS,
            "IRR",
        )
        self.assertEqual(result.intent, "purchase_payment")
        self.assertEqual(result.amount, Decimal("50000000"))
        self.assertEqual(result.currency, "IRR")
        self.assertEqual(result.description, "خرید ۵ کارتن شیر ماهشام")
        self.assertIsNone(result.debit_account_id)
        self.assertIsNone(result.credit_account_id)

    def test_no_payment_source_never_defaults_to_cash(self):
        result = normalize_accounting_action(
            "۵ میلیون تومن برای خرید شیر دادم",
            AIAccountingAction(intent="expense", amount=Decimal("1"), currency="IRR", debit_account_id="other", credit_account_id="cash"),
            ACCOUNTS,
            "IRR",
        )
        self.assertIsNone(result.credit_account_id)

    def test_explicit_cash_uses_only_available_cash_account(self):
        result = normalize_accounting_action(
            "۵ میلیون تومان برای خرید شیر از صندوق پرداخت کردم",
            AIAccountingAction(intent="expense", amount=Decimal("1"), currency="IRR", debit_account_id="other"),
            ACCOUNTS,
            "IRR",
        )
        self.assertEqual(result.credit_account_id, "cash")
        self.assertIsNone(result.debit_account_id)


if __name__ == "__main__":
    unittest.main()
