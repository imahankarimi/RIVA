import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/landing/BrandMark";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Application preview", href: "#preview" },
      { label: "Ask RIVA", href: "#ask" },
      { label: "Capabilities", href: "#capabilities" },
      { label: "How it works", href: "#how-it-works" },
    ],
  },
  {
    title: "Access",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create an account", href: "/login" },
      { label: "Reset password", href: "/reset-password" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help & support", href: "/help" },
      { label: "Back to top", href: "#top" },
    ],
  },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto w-full max-w-[1200px] px-5 pb-28 pt-12 sm:px-6 sm:pt-14 md:pb-14 lg:px-10 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Link href="/" aria-label="RIVA — home" className="inline-flex">
              <BrandMark width={108} />
            </Link>
            <p className="mt-4 max-w-sm text-[13.5px] leading-[1.7] text-ink-soft">
              The intelligence layer behind better business decisions. RIVA Web
              turns your financial data into a live, conversational model of the
              business — in your pocket.
            </p>
            <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
              Beyond Accounting. Into Intelligence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  {column.title}
                </h2>
                <ul className="mt-3.5 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("#") ? (
                        <a
                          href={link.href}
                          className="group inline-flex items-center gap-1 text-[12.5px] text-ink-soft transition-colors hover:text-ink"
                        >
                          {link.label}
                          <ArrowUpRight
                            size={11}
                            className="opacity-0 transition-opacity group-hover:opacity-60"
                            aria-hidden
                          />
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="group inline-flex items-center gap-1 text-[12.5px] text-ink-soft transition-colors hover:text-ink"
                        >
                          {link.label}
                          <ArrowUpRight
                            size={11}
                            className="opacity-0 transition-opacity group-hover:opacity-60"
                            aria-hidden
                          />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-hairline mt-10" />

        <div className="mt-5 flex flex-col gap-2.5 text-[11px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} RIVA. All rights reserved.</p>
          <p className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-moss-500" />
            AI-powered financial intelligence OS
          </p>
        </div>
      </div>
    </footer>
  );
}
