import type { BackendCurrency } from "@/lib/currency";

export interface Business {
  id: string;
  name: string;
  currency: BackendCurrency;
  isCurrent?: boolean;
}

export interface ChatAction {
  intent: string;
  amount: number;
  currency: BackendCurrency;
  description: string;
  category?: string;
  from_account_label?: string;
  from_account_id?: string;
  debit_account_id?: string;
  credit_account_id?: string;
  debit_account_label?: string;
  credit_account_label?: string;
}

export interface ReportExport {
  filename: string;
  format: string;
  download_path?: string;
}

export interface ChatResponse {
  type: ChatResponseType;
  message: string;
  action?: ChatAction;
  transactions?: ChatAction[];
  choices?: string[];
  conversation_id?: string;
  exports?: ReportExport[];
}


export interface ConfirmResult {
  success: boolean;
  message: string;
  transaction_id?: string | null;
  transaction_ids?: string[];
}

export type ChatResponseType =
  | "message"
  | "confirmation_required"
  | "missing_information"
  | "answer"
  | "error";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  kind: "text" | "transaction" | "success" | "error" | "choices" | "thinking";
  text?: string;
  action?: ChatAction;
  choices?: string[];
  /** Report exports the assistant produced (downloadable files). */
  exports?: ReportExport[];
  /** Once a "choices" message has been answered, the option the user picked — the buttons then render as resolved instead of staying live. */
  selectedChoice?: string;
  status?: "pending" | "confirmed" | "cancelled";
}

export interface Account {
  id: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  balance: number;
}

export interface Transaction {
  id: string;
  description: string;
  category: string;
  date: string; // ISO
  amount: number; // negative = outflow
  currency: BackendCurrency;
  status: "posted" | "pending";
  icon?: string;
}
