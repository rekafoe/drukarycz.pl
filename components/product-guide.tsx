import Link from "next/link";
import type { ProductId } from "@/lib/catalog";
import { productGuides } from "@/lib/landings";

/** Widoczny opis produktu pod ławką: ten sam zestaw faktów, co JSON-LD i FAQ. */
export function ProductGuide({ product }: { product: ProductId }) {
  const guide = productGuides[product];
  return (
    <article className="border-t border-[#16130F]/10 bg-[#F3EEE4] px-5 py-12 md:px-8 md:py-16" aria-labelledby="opis-produktu">
      <div className="mx-auto grid max-w-3xl gap-8">
        <header>
          <h2 id="opis-produktu" className="font-poster text-[32px] leading-[0.95] font-black tracking-tight md:text-[44px]">
            {guide.h2}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[#16130F]/85">{guide.intro}</p>
        </header>
        {guide.sections.map((section) => (
          <section key={section.h2}>
            <h3 className="text-[20px] font-extrabold tracking-tight">{section.h2}</h3>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mt-3 text-[16px] leading-relaxed text-[#16130F]/85">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        <section aria-labelledby="faq-produktu">
          <h3 id="faq-produktu" className="text-[20px] font-extrabold tracking-tight">
            Pytania o ten produkt
          </h3>
          <dl className="mt-4 grid gap-3">
            {guide.faq.map((item) => (
              <div key={item.q} className="rounded-2xl border border-[#16130F]/10 bg-white/70 px-4 py-4">
                <dt className="font-extrabold">{item.q}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-[#16130F]/80">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
        <nav aria-label="Więcej o ofercie" className="flex flex-wrap gap-2">
          {guide.seeAlso.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-[#16130F]/15 bg-white px-4 py-2 text-sm font-bold text-[#2F5BFF] hover:border-[#2F5BFF]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </article>
  );
}
