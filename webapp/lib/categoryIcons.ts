import {
  Zap,
  Home,
  Megaphone,
  Users,
  Wifi,
  Droplet,
  ShoppingBag,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  zap: Zap,
  home: Home,
  megaphone: Megaphone,
  users: Users,
  wifi: Wifi,
  droplet: Droplet,
  "shopping-bag": ShoppingBag,
  package: Package,
  "arrow-down-left": ArrowDownLeft,
  "arrow-up-right": ArrowUpRight,
};

export function iconFor(key?: string): LucideIcon {
  if (!key) return Receipt;
  return ICONS[key] ?? Receipt;
}
