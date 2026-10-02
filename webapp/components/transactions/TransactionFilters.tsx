"use client";

import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Chip } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function TransactionFilters({
  search,
  onSearch,
  categories,
  activeCategory,
  onCategoryChange,
}: {
  search: string;
  onSearch: (v: string) => void;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (c: string | null) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("transactions.searchPlaceholder")}
          className="h-11 ps-9 pe-3 text-[13.5px]"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip active={activeCategory === null} onClick={() => onCategoryChange(null)}>
          {t("transactions.allCategories")}
        </Chip>
        {categories.map((c) => (
          <Chip key={c} active={activeCategory === c} onClick={() => onCategoryChange(c)}>
            {c}
          </Chip>
        ))}
      </div>
    </div>
  );
}
