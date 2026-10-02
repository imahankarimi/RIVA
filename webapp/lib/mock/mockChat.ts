import type { ChatAction, ChatResponse, ConfirmResult } from "@/lib/types";
import type { BackendCurrency } from "@/lib/currency";

// This simulates what /api/chat and /api/chat/confirm would return.
// It exists purely so the AI Assistant screen is demoable before the
// FastAPI backend is running locally — it mirrors the exact response
// contract described in the brief, so wiring the real endpoint later
// is a drop-in swap in lib/api/chat.ts, nothing here needs to change.

const CATEGORY_KEYWORDS: Array<{ match: RegExp; category: string; icon: string }> = [
  { match: /(برق|electric)/i, category: "Utilities", icon: "zap" },
  { match: /(اجاره|rent)/i, category: "Rent", icon: "home" },
  { match: /(تبلیغ|marketing|ads?)/i, category: "Marketing", icon: "megaphone" },
  { match: /(حقوق|salary|payroll)/i, category: "Payroll", icon: "users" },
  { match: /(اینترنت|internet)/i, category: "Utilities", icon: "wifi" },
  { match: /(آب|water)/i, category: "Utilities", icon: "droplet" },
];

function detectCurrency(message: string): BackendCurrency {
  if (/تومان|﷼|ریال/.test(message)) return "IRR";
  if (/€|eur/i.test(message)) return "EUR";
  if (/£|gbp/i.test(message)) return "GBP";
  if (/\$|usd|dollar/i.test(message)) return "USD";
  return /[۰-۹]/.test(message) ? "IRR" : "USD";
}

function extractAmount(message: string): number | null {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const normalized = message.replace(/[۰-۹]/g, (d) =>
    String(persianDigits.indexOf(d))
  );

  const millionMatch = normalized.match(/([\d,.]+)\s*میلیون/);

  if (millionMatch) {
    const rawBase = millionMatch[1];
    if (!rawBase) return null;

    const base = parseFloat(rawBase.replace(/,/g, ""));
    if (Number.isNaN(base)) return null;

    return Math.round(base * 1_000_000 * 10); // toman -> rial
  }

  const numMatch = normalized.match(/([\d,]+(?:\.\d+)?)/);

  if (!numMatch) return null;

  const rawValue = numMatch[1];
  if (!rawValue) return null;

  const value = parseFloat(rawValue.replace(/,/g, ""));
  if (Number.isNaN(value)) return null;

  if (detectCurrency(message) === "IRR") {
    return Math.round(value * 10); // toman -> rial
  }

  return value;
}

export async function mockSendChatMessage(message: string): Promise<ChatResponse> {
  await delay(650);

  const amount = extractAmount(message);
  const currency = detectCurrency(message);
  const cat = CATEGORY_KEYWORDS.find((c) => c.match.test(message));
  const isFa = /[\u0600-\u06FF]/.test(message);

  if (amount === null) {
    return {
      type: "error",
      message: isFa
        ? "نتونستم این تراکنش رو با اطمینان ثبت کنم."
        : "I couldn't record that confidently.",
    };
  }

  if (!cat) {
    return {
      type: "missing_information",
      message: isFa ? "از کدوم حساب پرداخت کردی؟" : "Which account did you pay from?",
      choices: isFa ? ["بانک", "صندوق"] : ["Bank", "Cash box"],
      action: {
        intent: "expense",
        amount,
        currency,
        description: message.slice(0, 60),
      },
    };
  }

  const action: ChatAction = {
    intent: "expense",
    amount,
    currency,
    description: isFa ? `پرداخت ${cat.category === "Utilities" ? "قبض برق" : cat.category}` : cat.category,
    category: cat.category,
    from_account_label: isFa ? "بانک" : "Bank",
    from_account_id: "a1",
    debit_account_id: "x1",
    credit_account_id: "a1",
    debit_account_label: cat.category,
    credit_account_label: isFa ? "بانک" : "Bank",
  };

  return {
    type: "confirmation_required",
    message: isFa ? "متوجه شدم 👌" : "Got it 👌",
    action,
  };
}

export async function mockConfirmChatAction(): Promise<ConfirmResult> {
  await delay(500);
  return {
    success: true,
    message: "Recorded",
    transaction_id: `tx_${Date.now()}`,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
