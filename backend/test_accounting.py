from decimal import Decimal

from sqlalchemy.orm import Session

from accounting_service import create_journal_entry
from database import SessionLocal
from models import Business, Account
from schemas import JournalEntryInput, JournalLineInput


def main():
    db: Session = SessionLocal()

    try:
        # Create test business
        business = Business(
            name="LedgerAI Test Business",
            language="fa",
            base_currency="IRR",
        )

        db.add(business)
        db.flush()

        # Create accounts
        bank = Account(
            business_id=business.id,
            name="Bank",
            account_type="asset",
            code="1010",
        )

        electricity = Account(
            business_id=business.id,
            name="Electricity Expense",
            account_type="expense",
            code="5100",
        )

        db.add_all([bank, electricity])
        db.flush()

        # Create balanced journal entry
        entry_data = JournalEntryInput(
            business_id=business.id,
            description="Electricity bill",
            currency="IRR",
            lines=[
                JournalLineInput(
                    account_id=electricity.id,
                    debit=Decimal("2000000"),
                    credit=Decimal("0"),
                    description="Electricity expense",
                ),
                JournalLineInput(
                    account_id=bank.id,
                    debit=Decimal("0"),
                    credit=Decimal("2000000"),
                    description="Paid from bank",
                ),
            ],
        )

        entry = create_journal_entry(
            db=db,
            data=entry_data,
            business_base_currency=business.base_currency,
        )

        print("✅ Journal entry created!")
        print(f"Entry ID: {entry.id}")
        print(f"Description: {entry.description}")
        print(f"Currency: {entry.currency}")

        for line in entry.lines:
            print(
                f"{line.account_id} | "
                f"Debit: {line.debit} | "
                f"Credit: {line.credit}"
            )

    finally:
        db.close()


if __name__ == "__main__":
    main()