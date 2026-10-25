import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

/** Title block for an account page (h1, optional intro and a back link). */
export function AccountHeading({
  title,
  intro,
  back,
}: {
  title: string;
  intro?: string;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-6 md:mb-8">
      {back && (
        <Link
          href={back.href}
          className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-drs-ink/75 hover:text-drs-green hover:underline"
        >
          <ChevronLeftIcon aria-hidden className="size-4" /> {back.label}
        </Link>
      )}
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-drs-green md:text-4xl">
        {title}
      </h1>
      {intro && <p className="mt-1 text-sm text-drs-ink/75 md:text-base">{intro}</p>}
    </header>
  );
}
