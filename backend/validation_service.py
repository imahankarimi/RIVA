from decimal import Decimal

from sqlalchemy.orm import Session

from models import Account
from schemas import SUPPORTED_CURRENCIES

SUPPORTED_CURRENCIES = set(SUPPORTED_CURRENCIES)


def validate_accounting_action(
    db: Session,
    business_id: str,
    action,
):
    if not action.amount:
        raise ValueError("Transaction amount is missing.")

    if action.amount <= Decimal("0"):
        raise ValueError("Transaction amount must be greater than zero.")

    if action.currency not in SUPPORTED_CURRENCIES:
        raise ValueError("Unsupported currency.")

    if not action.debit_account_id:
        raise ValueError("Debit account is missing.")

    if not action.credit_account_id:
        raise ValueError("Credit account is missing.")

    if action.debit_account_id == action.credit_account_id:
        raise ValueError(
            "Debit and credit accounts cannot be the same."
        )

    debit_account = (
        db.query(Account)
        .filter(
            Account.id == action.debit_account_id,
            Account.business_id == business_id,
        )
        .first()
    )

    credit_account = (
        db.query(Account)
        .filter(
            Account.id == action.credit_account_id,
            Account.business_id == business_id,
        )
        .first()
    )

    if not debit_account:
        raise ValueError("Invalid debit account.")

    if not credit_account:
        raise ValueError("Invalid credit account.")

    return debit_account, credit_account