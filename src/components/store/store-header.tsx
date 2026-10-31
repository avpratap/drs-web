import { SunriseIcon } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "./engagement";
import { AccountButton, CartButton, MobileMenu, SearchForm, SearchToggle } from "./header-actions";
import { StoreLogo } from "./logo";
import { STORE_NAV } from "./nav";

export function StoreHeader() {
  return (
    <header className="relative z-40 shrink-0">
      <div className="on-dark bg-drs-green text-drs-cream">
        <p className="mx-auto flex min-h-9 max-w-7xl items-center justify-center gap-2 px-4 text-center text-xs font-medium tracking-wide md:text-[0.8125rem]">
          <SunriseIcon aria-hidden className="size-4 shrink-0 text-drs-gold" strokeWidth={1.75} />
          <span className="sm:hidden">Fresh before 7&nbsp;am · Pause anytime</span>
          <span className="hidden sm:inline">Delivered fresh before 7&nbsp;am · Pause or skip any day</span>
        </p>
      </div>
      <div className="border-b border-drs-ink/10 bg-drs-cream/95 backdrop-blur supports-[backdrop-filter]:bg-drs-cream/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 md:h-[4.5rem] md:gap-4 md:px-6">
          <MobileMenu />
          <StoreLogo className="mr-auto md:mr-3 lg:mr-6" />
          {/* Inline from md (tablets get the nav too; only phones use the menu). */}
          <nav aria-label="Store" className="hidden items-center gap-0.5 md:flex lg:gap-1">
            {STORE_NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="relative flex min-h-11 items-center rounded-full px-3 text-[0.9375rem] font-medium text-drs-ink transition-colors hover:text-drs-green lg:px-4"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <SearchForm className="ml-auto hidden w-64 lg:block xl:w-80" />
          <div className="flex items-center gap-0.5 md:ml-auto lg:ml-2">
            <SearchToggle />
            <NotificationBell />
            <AccountButton />
            <CartButton />
          </div>
        </div>
      </div>
    </header>
  );
}
