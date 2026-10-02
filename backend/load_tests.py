"""Load testing suite for RIVA production scalability audit.

Simulates 1000 concurrent users with realistic RIVA usage patterns:
- User authentication
- Dashboard loading
- Transaction creation
- AI chat interactions
- Report generation

Run with: locust -f load_tests.py --host=http://localhost:8000
"""

import random
import time
from decimal import Decimal
from locust import HttpUser, task, between, events
from locust.exception import StopUser


# Test data pools
CURRENCIES = ["IRR", "TOMAN", "USD", "EUR"]
BUSINESS_NAMES = [
    "Coffee Shop",
    "Tech Startup",
    "Consulting Firm",
    "Retail Store",
    "Restaurant",
    "Online Store",
    "Freelance Business",
]

PERSIAN_EXPENSES = [
    "خرید اینترنت 500 هزار تومان",
    "قبض برق 300 هزار تومان",
    "خرید دفتر 200 هزار تومان",
    "پرداخت حقوق 5 میلیون تومان",
]

ENGLISH_EXPENSES = [
    "Paid $50 for office supplies",
    "Electricity bill $100",
    "Internet subscription $40",
    "Marketing campaign $500",
]


class RIVAUser(HttpUser):
    """Simulates a real RIVA user's behavior patterns."""

    # Think time between actions (realistic user behavior)
    wait_time = between(1, 5)

    def on_start(self):
        """User signup/login on start."""
        self.user_id = None
        self.access_token = None
        self.business_id = None
        self.conversation_id = None

        # 80% existing users login, 20% new signups
        if random.random() < 0.8:
            self.login()
        else:
            self.signup()

        if not self.access_token:
            # Auth failed, stop this user
            raise StopUser()

    def signup(self):
        """Create a new user account."""
        email = f"loadtest_{random.randint(1, 1000000)}@example.com"
        password = "TestPassword123!"
        business_name = random.choice(BUSINESS_NAMES)
        currency = random.choice(CURRENCIES)

        response = self.client.post(
            "/api/auth/signup",
            json={
                "email": email,
                "password": password,
                "business_name": business_name,
                "base_currency": currency,
            },
            name="/api/auth/signup",
        )

        if response.status_code == 201:
            data = response.json()
            self.access_token = data["access_token"]
            self.user_id = data["user"]["id"]
            self.business_id = data["business"]["id"]
        elif response.status_code == 409:
            # Email collision, try login instead
            self.login()

    def login(self):
        """Login with existing credentials."""
        # In real load test, you'd have a pool of pre-created accounts
        # For this test, we'll just track failed logins
        email = f"loadtest_{random.randint(1, 100)}@example.com"
        password = "TestPassword123!"

        response = self.client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
            name="/api/auth/login",
        )

        if response.status_code == 200:
            data = response.json()
            self.access_token = data["access_token"]
            self.user_id = data["user"]["id"]
            self.business_id = data["business"]["id"]

    @property
    def headers(self):
        """Authorization headers for authenticated requests."""
        if self.access_token:
            return {"Authorization": f"Bearer {self.access_token}"}
        return {}

    @task(10)
    def view_dashboard(self):
        """Load business overview (most common action)."""
        if not self.business_id:
            return

        self.client.get(
            f"/api/businesses/{self.business_id}/overview",
            headers=self.headers,
            name="/api/businesses/[id]/overview",
        )

    @task(8)
    def view_transactions(self):
        """View transaction list."""
        if not self.business_id:
            return

        self.client.get(
            f"/api/businesses/{self.business_id}/transactions",
            headers=self.headers,
            name="/api/businesses/[id]/transactions",
        )

    @task(5)
    def view_accounts(self):
        """View chart of accounts."""
        if not self.business_id:
            return

        self.client.get(
            f"/api/businesses/{self.business_id}/accounts",
            headers=self.headers,
            name="/api/businesses/[id]/accounts",
        )

    @task(6)
    def chat_with_ai(self):
        """Send AI chat message (expensive operation)."""
        if not self.business_id:
            return

        # Mix of Persian and English messages
        if random.random() < 0.6:
            message = random.choice(PERSIAN_EXPENSES)
        else:
            message = random.choice(ENGLISH_EXPENSES)

        response = self.client.post(
            "/api/chat",
            headers=self.headers,
            json={
                "business_id": self.business_id,
                "message": message,
                "conversation_id": self.conversation_id,
            },
            name="/api/chat",
        )

        # Track conversation for multi-turn conversations
        if response.status_code == 200:
            data = response.json()
            self.conversation_id = data.get("conversation_id")

    @task(3)
    def create_manual_transaction(self):
        """Create a journal entry manually."""
        if not self.business_id:
            return

        # Get accounts first
        accounts_response = self.client.get(
            f"/api/businesses/{self.business_id}/accounts",
            headers=self.headers,
            name="/api/businesses/[id]/accounts",
        )

        if accounts_response.status_code != 200:
            return

        accounts = accounts_response.json()
        if len(accounts) < 2:
            return

        # Create a simple expense transaction
        debit_account = next((a for a in accounts if a["account_type"] == "expense"), None)
        credit_account = next((a for a in accounts if a["account_type"] == "asset"), None)

        if not debit_account or not credit_account:
            return

        amount = random.randint(100, 10000)

        self.client.post(
            "/api/journal-entries",
            headers=self.headers,
            json={
                "business_id": self.business_id,
                "description": "Load test transaction",
                "currency": "IRR",
                "lines": [
                    {
                        "account_id": debit_account["id"],
                        "debit": amount,
                        "credit": 0,
                        "description": "Expense",
                    },
                    {
                        "account_id": credit_account["id"],
                        "debit": 0,
                        "credit": amount,
                        "description": "Payment",
                    },
                ],
            },
            name="/api/journal-entries",
        )

    @task(2)
    def export_report(self):
        """Generate and download a report (expensive)."""
        if not self.business_id:
            return

        report_types = ["income-statement", "balance-sheet", "cash-flow"]
        report = random.choice(report_types)
        format = random.choice(["pdf", "csv", "xlsx"])

        self.client.post(
            f"/api/businesses/{self.business_id}/reports/export",
            headers=self.headers,
            json={
                "report": report,
                "format": format,
                "period": "this month",
            },
            name="/api/businesses/[id]/reports/export",
        )

    @task(4)
    def list_conversations(self):
        """List AI chat conversations."""
        if not self.business_id:
            return

        self.client.get(
            f"/api/businesses/{self.business_id}/conversations",
            headers=self.headers,
            name="/api/businesses/[id]/conversations",
        )

    @task(1)
    def switch_business(self):
        """Switch to another business (multi-business users)."""
        if not self.access_token:
            return

        # Get business list
        response = self.client.get(
            "/api/businesses",
            headers=self.headers,
            name="/api/businesses",
        )

        if response.status_code == 200:
            businesses = response.json()
            if len(businesses) > 1:
                # Switch to a different business
                other_business = random.choice([b for b in businesses if b["id"] != self.business_id])
                self.client.post(
                    "/api/auth/switch-business",
                    headers=self.headers,
                    json={"business_id": other_business["id"]},
                    name="/api/auth/switch-business",
                )
                self.business_id = other_business["id"]


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Setup test environment."""
    print("=" * 60)
    print("RIVA Production Scalability Load Test")
    print("=" * 60)
    print("Simulating 1000 concurrent users with realistic behavior")
    print("- Auth: login/signup")
    print("- Dashboard: overview, transactions, accounts")
    print("- AI: chat messages (rate limited)")
    print("- Transactions: manual entry")
    print("- Reports: PDF/CSV/XLSX export")
    print("=" * 60)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Generate test report."""
    print("=" * 60)
    print("Load Test Complete")
    print("=" * 60)
    print(f"Total requests: {environment.stats.total.num_requests}")
    print(f"Failed requests: {environment.stats.total.num_failures}")
    print(f"Average response time: {environment.stats.total.avg_response_time:.2f}ms")
    print(f"Requests/sec: {environment.stats.total.total_rps:.2f}")
    print("=" * 60)
