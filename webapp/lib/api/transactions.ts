import { apiRequest } from "./client";
import type { BackendCurrency } from "@/lib/currency";

export interface BackendTransaction {
  id: string;
  description: string;
  category: string;
  date: string;
  amount: string | number;
  currency: BackendCurrency;
  status: "posted" | "pending";
}

export function getBusinessTransactions(
  businessId: string,
  token?: string
) {
  return apiRequest<BackendTransaction[]>(
    `/api/businesses/${businessId}/transactions`,
    { token }
  );
}
