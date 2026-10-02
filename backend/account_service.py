from sqlalchemy.orm import Session

from models import Account, Business


DEFAULT_ACCOUNTS = [
    {
        "code": "1000",
        "name": "Cash",
        "account_type": "asset",
    },
    {
        "code": "1010",
        "name": "Bank",
        "account_type": "asset",
    },
    {
        "code": "1100",
        "name": "Accounts Receivable",
        "account_type": "asset",
    },
    {
        "code": "2000",
        "name": "Accounts Payable",
        "account_type": "liability",
    },
    {
        "code": "3000",
        "name": "Owner's Equity",
        "account_type": "equity",
    },
    {
        "code": "4000",
        "name": "Sales Revenue",
        "account_type": "revenue",
    },
    {
        "code": "5000",
        "name": "Rent Expense",
        "account_type": "expense",
    },
    {
        "code": "5100",
        "name": "Utilities Expense",
        "account_type": "expense",
    },
    {
        "code": "5200",
        "name": "Marketing Expense",
        "account_type": "expense",
    },
    {
        "code": "5900",
        "name": "Other Expenses",
        "account_type": "expense",
    },
]


def create_default_accounts(
    db: Session,
    business: Business,
) -> list[Account]:

    accounts = []

    for account_data in DEFAULT_ACCOUNTS:
        account = Account(
            business_id=business.id,
            code=account_data["code"],
            name=account_data["name"],
            account_type=account_data["account_type"],
        )

        db.add(account)
        accounts.append(account)

    db.flush()

    return accounts