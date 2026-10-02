export const DATE_RANGES = ["all", "30d", "90d", "ytd"] as const;
export type DateRange = (typeof DATE_RANGES)[number];

export const DATE_RANGE_LABEL_KEY: Record<DateRange, string> = {
  all: "transactions.allTime",
  "30d": "transactions.last30Days",
  "90d": "transactions.last90Days",
  ytd: "transactions.yearToDate",
};

export function withinDateRange(dateIso: string, range: DateRange): boolean {
  if (range === "all") return true;
  const date = new Date(dateIso);
  const now = new Date();
  if (range === "ytd") return date.getFullYear() === now.getFullYear();
  const days = range === "30d" ? 30 : 90;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}
