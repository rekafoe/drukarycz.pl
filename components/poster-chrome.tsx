import Link from "next/link";
import type { ReactNode } from "react";
import { productPaths } from "@/lib/catalog";
import { seller } from "@/lib/seller";

const [brandName, brandTld] = seller.brand.split(".");

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-poster text-[17px] font-extrabold md:text-[20px] ${className}`}>
      {brandName}
      <span className="text-(--a-pop)">.</span>
      {brandTld}
    </span>
  );
}

export function PosterHeader({
  account,
  extra,
  current,
}: {
  account?: ReactNode;
  extra?: ReactNode;
  current?: "home" | "tshirt" | "mug" | "wzory";
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 bg-[#16130F] px-4 text-[#F3EEE4] md:h-[68px] md:gap-4 md:px-8">
      <Link href="/" aria-label={seller.brand} className={current === "home" ? "text-[#F3EEE4]" : ""}>
        <Wordmark />
      </Link>
      <Link
        href="/wzory"
        className={`text-sm font-bold md:hidden ${current === "wzory" ? "text-[#F3EEE4]" : "text-[#F3EEE4]/70"}`}
      >
        Wzory
      </Link>
      <nav className="ml-4 hidden items-center gap-6 text-[15px] font-bold md:ml-8 md:flex">
        <HeaderLink href={productPaths.tshirt} active={current === "tshirt"}>
          Koszulka
        </HeaderLink>
        <HeaderLink href={productPaths.mug} active={current === "mug"}>
          Kubek
        </HeaderLink>
        <HeaderLink href="/wzory" active={current === "wzory"}>
          Wzory
        </HeaderLink>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        {extra}
        {account}
      </div>
    </header>
  );
}

function HeaderLink({ href, active, children }: { href: string; active?: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "relative text-[#F3EEE4] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[3px] after:rounded-full after:bg-(--a-badge)"
          : "text-[#F3EEE4]/60 hover:text-[#F3EEE4]"
      }
    >
      {children}
    </Link>
  );
}
