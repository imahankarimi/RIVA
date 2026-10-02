"""AI Tools / Function Calling for RIVA AI.

Defines the tools that the AI can invoke to access financial data.
Each tool maps to a deterministic analytics service function that
returns structured data — the AI interprets these results but never
performs the raw calculations.

CRITICAL SECURITY RULES:
- Tools enforce business_id from the authenticated request (never trust LLM-provided IDs)
- Tools only read data or create safe records with explicit user confirmation
- No SQL injection possible — all queries use SQLAlchemy ORM
- Sensitive actions require confirmation before execution
"""

import json
from decimal import Decimal
from sqlalchemy.orm import Session

from models import Account, Business
from financial_periods import Period, parse_period, default_period
from analytics_service import (
    get_full_analytics,
    get_account_balances,
    get_period_totals,
    get_expense_breakdown,
    get_revenue_breakdown,
    get_top_expense_categories,
    get_transactions,
)
from report_service import build_report_data, resolve_report_key
from transaction_recorder import resolve_action


# ---------------------------------------------------------------------------
# Tool definitions (for OpenAI function calling)
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_financial_analytics",
            "description": "Get comprehensive financial analytics for the business. Use this for general financial questions like 'how are we doing?', 'what's our financial situation?', 'summarize this month'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "Natural language period: 'last month', 'this year', 'last 30 days', 'Q2 2026', 'yesterday', etc. Default: last 30 days if not specified."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_account_balances",
            "description": "Get current balances for all accounts. Use this when asking about account balances, cash on hand, bank balance, receivables, payables, etc.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_revenue",
            "description": "Get revenue for a period. Use when asking about revenue, sales, income, or money coming in.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "Period: 'last month', 'this quarter', 'last 30 days', etc."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_expenses",
            "description": "Get expenses for a period, optionally filtered by category. Use when asking about expenses, costs, spending, or money going out.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "Period: 'last month', 'this quarter', 'last 30 days', etc."
                    },
                    "category": {
                        "type": "string",
                        "description": "Optional category filter: 'marketing', 'rent', 'utilities', etc."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_expense_breakdown",
            "description": "Get expenses broken down by category. Use when asking about expense categories, biggest expenses, where money is going, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "Period: 'last month', 'this year', 'last 90 days', etc."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_transactions",
            "description": "Get a list of recent transactions. Use when asking to see transactions, transaction history, or specific transaction details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "Period: 'last month', 'this week', 'last 7 days', etc."
                    },
                    "category": {
                        "type": "string",
                        "description": "Optional category filter"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max transactions to return (default 10, max 50)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_profit_loss",
            "description": "Get profit and loss summary for a period. Use when asking about profit, loss, net income, or profitability.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "Period: 'last month', 'this year', 'Q2', etc."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compare_periods",
            "description": "Compare two periods side by side. Use when asking to compare this month vs last month, this quarter vs last quarter, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "current_period": {
                        "type": "string",
                        "description": "Current period: 'this month', 'this quarter', etc."
                    },
                    "previous_period": {
                        "type": "string",
                        "description": "Previous period: 'last month', 'last quarter', etc."
                    }
                },
                "required": ["current_period", "previous_period"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_recommendations",
            "description": "Get AI-powered business recommendations. Use when asking for suggestions, advice, what to improve, or how to optimize.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "Period to analyze: 'last month', 'last 30 days', etc."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_revenue_breakdown",
            "description": "Get revenue broken down by revenue source/account (e.g. per product line). Use when asking what is driving revenue, best-selling sources, revenue share, or per-product revenue.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "Period: 'last month', 'this year', 'last 90 days', etc."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_top_expenses",
            "description": "Get the top expense categories by amount for a period. Use when asking about the biggest expenses, largest cost categories, or where the most money is going.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "Period: 'last month', 'this year', etc."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "record_transactions",
            "description": "Record one or more income/expense transactions the user explicitly requested. Use when the user says they earned/received money or spent/paid money with an amount. RIVA resolves real accounts, shows a preview, and asks for confirmation before saving. You may pass the account ids from the business context; if unknown, omit them and RIVA will ask.",
            "parameters": {
                "type": "object",
                "properties": {
                    "transactions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "intent": {"type": "string", "enum": ["income", "expense"], "description": "income = money received; expense = money spent"},
                                "amount": {"type": "number", "description": "Amount in the business's base currency"},
                                "description": {"type": "string", "description": "Short description, e.g. 'electricity bill' or 'cafe revenue'"},
                                "debit_account_id": {"type": "string", "description": "Optional account id"},
                                "credit_account_id": {"type": "string", "description": "Optional account id"}
                            },
                            "required": ["intent", "amount", "description"]
                        }
                    }
                },
                "required": ["transactions"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_report",
            "description": "Generate a financial report (Profit & Loss, Cash Flow, Expense Report, Transaction Report, Balance Sheet, Trial Balance) for a period. Use when the user asks for a report, an export, P&L, cash flow statement, balance sheet, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "report": {
                        "type": "string",
                        "description": "Report name: 'profit_loss', 'cash_flow', 'expense_report', 'transaction_report', 'balance_sheet', 'trial_balance', 'account_statement'"
                    },
                    "period": {
                        "type": "string",
                        "description": "Period: 'last month', 'this month', 'last 30 days', 'this year', 'Q2 2026', etc."
                    },
                    "format": {
                        "type": "string",
                        "description": "Optional export format: 'csv', 'xlsx', 'pdf'. If omitted, return structured data (no file)."
                    }
                },
                "required": ["report"]
            }
        }
    },
]


# ---------------------------------------------------------------------------
# Tool execution
# ---------------------------------------------------------------------------

def _parse_period_or_default(period_str: str | None, default: Period | None = None) -> Period:
    """Parse a period string or return the default."""
    if period_str:
        period = parse_period(period_str)
        if period:
            return period
    return default or default_period()


def execute_tool(
    tool_name: str,
    arguments: dict,
    db: Session,
    business_id: str,
    business_name: str,
    base_currency: str,
) -> dict:
    """Execute a tool and return structured results.

    All tools enforce business_id from the authenticated request.
    Never trust business_id from the LLM.
    """
    try:
        if tool_name == "get_financial_analytics":
            period = _parse_period_or_default(arguments.get("period"))
            analytics = get_full_analytics(db, business_id, business_name, base_currency, period)
            return {"success": True, "data": analytics.to_dict()}

        elif tool_name == "get_account_balances":
            balances = get_account_balances(db, business_id)
            return {
                "success": True,
                "data": {
                    "balances": [b.to_dict() for b in balances],
                    "currency": base_currency,
                }
            }

        elif tool_name == "get_revenue":
            period = _parse_period_or_default(arguments.get("period"))
            totals = get_period_totals(db, business_id, period)
            return {
                "success": True,
                "data": {
                    "revenue": str(totals.revenue),
                    "period": period.to_dict(),
                    "currency": base_currency,
                }
            }

        elif tool_name == "get_expenses":
            period = _parse_period_or_default(arguments.get("period"))
            category = arguments.get("category")
            expenses = get_expense_breakdown(db, business_id, period)
            if category:
                expenses = [e for e in expenses if category.lower() in e.category.lower()]
            totals = get_period_totals(db, business_id, period)
            return {
                "success": True,
                "data": {
                    "total_expenses": str(totals.expenses),
                    "breakdown": [e.to_dict() for e in expenses],
                    "period": period.to_dict(),
                    "currency": base_currency,
                }
            }

        elif tool_name == "get_expense_breakdown":
            period = _parse_period_or_default(arguments.get("period"))
            breakdown = get_expense_breakdown(db, business_id, period)
            return {
                "success": True,
                "data": {
                    "breakdown": [e.to_dict() for e in breakdown],
                    "period": period.to_dict(),
                    "currency": base_currency,
                }
            }

        elif tool_name == "get_transactions":
            period = _parse_period_or_default(arguments.get("period"))
            category = arguments.get("category")
            limit = min(arguments.get("limit", 10), 50)
            transactions = get_transactions(db, business_id, period, category, limit)
            return {
                "success": True,
                "data": {
                    "transactions": [t.to_dict() for t in transactions],
                    "period": period.to_dict(),
                    "currency": base_currency,
                }
            }

        elif tool_name == "get_profit_loss":
            period = _parse_period_or_default(arguments.get("period"))
            totals = get_period_totals(db, business_id, period)
            return {
                "success": True,
                "data": {
                    "revenue": str(totals.revenue),
                    "expenses": str(totals.expenses),
                    "net_income": str(totals.net_income),
                    "period": period.to_dict(),
                    "currency": base_currency,
                }
            }

        elif tool_name == "compare_periods":
            current_period = _parse_period_or_default(arguments.get("current_period"))
            previous_period = _parse_period_or_default(arguments.get("previous_period"))
            from analytics_service import get_period_comparison
            comparison = get_period_comparison(db, business_id, current_period, previous_period)
            return {
                "success": True,
                "data": comparison.to_dict()
            }

        elif tool_name == "get_recommendations":
            period = _parse_period_or_default(arguments.get("period"))
            from analytics_service import generate_recommendations
            recs = generate_recommendations(db, business_id, period)
            return {
                "success": True,
                "data": {
                    "recommendations": [r.to_dict() for r in recs],
                    "period": period.to_dict(),
                }
            }

        elif tool_name == "get_revenue_breakdown":
            period = _parse_period_or_default(arguments.get("period"))
            breakdown = get_revenue_breakdown(db, business_id, period)
            return {
                "success": True,
                "data": {
                    "breakdown": [r.to_dict() for r in breakdown],
                    "period": period.to_dict(),
                    "currency": base_currency,
                }
            }

        elif tool_name == "get_top_expenses":
            period = _parse_period_or_default(arguments.get("period"))
            top = get_top_expense_categories(db, business_id, period, limit=5)
            return {
                "success": True,
                "data": {
                    "top_categories": [t.to_dict() for t in top],
                    "period": period.to_dict(),
                    "currency": base_currency,
                }
            }

        elif tool_name == "record_transactions":
            # The tool only builds the preview — actual recording happens via
            # /api/chat/confirm with the SAME resolved action dict, tied to the
            # authenticated business/conversation.
            rows = arguments.get("transactions") or []
            if not isinstance(rows, list) or not rows:
                return {"success": False, "error": "No transactions provided."}

            resolved = []
            for row in rows:
                if not isinstance(row, dict):
                    continue
                intent = str(row.get("intent") or "").lower().strip()
                if intent not in {"income", "expense"}:
                    continue
                try:
                    amount = Decimal(str(row.get("amount")))
                except Exception:
                    continue
                entry = resolve_action(
                    db=db,
                    business_id=business_id,
                    base_currency=base_currency,
                    intent=intent,
                    amount=amount,
                    description=str(row.get("description") or ""),
                    debit_account_id=row.get("debit_account_id"),
                    credit_account_id=row.get("credit_account_id"),
                )
                if entry.error:
                    return {"success": False, "error": entry.error}
                resolved.append(entry.to_action_dict())

            if not resolved:
                return {"success": False, "error": "Could not interpret any transaction from the request."}

            return {
                "success": True,
                "data": {"transactions": resolved, "currency": base_currency},
            }

        elif tool_name == "get_report":
            report_key = resolve_report_key(arguments.get("report") or "")
            if not report_key:
                return {"success": False, "error": f"Unknown report: {arguments.get('report')}"}
            period = _parse_period_or_default(arguments.get("period"))
            report_data = build_report_data(
                db=db,
                report_key=report_key,
                business_id=business_id,
                business_name=business_name,
                base_currency=base_currency,
                period=period,
                account_name=arguments.get("account"),
            )
            fmt = (arguments.get("format") or "").lower()
            if fmt in {"csv", "xlsx", "pdf"}:
                # The file itself is generated by the authenticated export
                # endpoint (deterministic, never faked). The tool hands back a
                # download URL the frontend can open with the auth token.
                from urllib.parse import quote
                from report_service import default_filename

                filename = default_filename(report_data, fmt)
                download_path = (
                    f"/api/businesses/{business_id}/reports/export/"
                    f"{report_key}?period={quote(period.label)}&format={fmt}"
                )
                return {
                    "success": True,
                    "data": report_data,
                    "export": {
                        "filename": filename,
                        "format": fmt,
                        "download_path": download_path,
                    },
                }
            return {
                "success": True,
                "data": report_data,
            }

        else:
            return {"success": False, "error": f"Unknown tool: {tool_name}"}

    except Exception as e:
        return {"success": False, "error": str(e)}