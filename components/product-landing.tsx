import Image from "next/image";
import Link from "next/link";
import { PosterHeader } from "@/components/poster-chrome";
import { SiteFooter } from "@/components/site-footer";
import { finishes, productPaths, shirtColors, sizes } from "@/lib/catalog";
import { getLanding, type LandingId } from "@/lib/landings";
import { seller } from "@/lib/seller";

export function ProductLanding({ id }: { id: LandingId }) {
  const landing = getLanding(id);
  return (
    <main className="min-h-full bg-[#F3EEE4] text-[#16130F]">
      <PosterHeader current={landing.nav} />
      <article>
        <header className="bg-[#16130F] px-5 pt-8 pb-12 text-[#F3EEE4] md:px-8 md:pt-10 md:pb-16">
          <nav aria-label="Okruszki" className="flex flex-wrap gap-x-2 gap-y-1 text-[13px] font-bold text-[#F3EEE4]/55">
            {landing.crumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden>/</span> : null}
                {index === landing.crumbs.length - 1 ? (
                  <span className="text-[#F3EEE4]">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-[#F3EEE4]">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
          <p className="mt-6 text-[12px] font-extrabold tracking-[0.14em] text-[#C9D5FF] uppercase">{landing.kicker}</p>
          <h1 className="font-poster mt-3 max-w-4xl text-[40px] leading-[0.95] font-black tracking-tight md:text-[64px]">
            {landing.h1}
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#F3EEE4]/80 md:text-[18px]">{landing.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {landing.ctas.map((cta) => (
              <Link key={cta.href} href={cta.href} className={cta.primary ? "btn-kobalt" : "btn-ghost-on-dark"}>
                {cta.label}
              </Link>
            ))}
          </div>
        </header>

        {id === "warszawa" ? <WarszawaVisual /> : null}
        {id === "rozmiary" ? <RozmiaryVisual /> : null}
        {id === "materialy" ? <MaterialyVisual /> : null}

        <div className="mx-auto grid max-w-3xl gap-10 px-5 py-10 md:px-7 md:py-14">
          {landing.sections.map((section) => (
            <section key={section.h2}>
              <h2 className="font-poster text-[28px] leading-[1.05] font-black tracking-tight md:text-[34px]">{section.h2}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="mt-3 text-[16px] leading-relaxed text-[#16130F]/85">
                  {paragraph}
                </p>
              ))}
              {section.list ? (
                <ul className="mt-4 grid gap-2">
                  {section.list.map((item) => (
                    <li key={item.slice(0, 48)} className="rounded-2xl border border-[#16130F]/10 bg-white/70 px-4 py-3 text-[15px] leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="font-poster text-[28px] leading-[1.05] font-black tracking-tight md:text-[34px]">
              Pytania
            </h2>
            <dl className="mt-4 grid gap-3">
              {landing.faq.map((item) => (
                <div key={item.q} className="rounded-2xl border border-[#16130F]/10 bg-white/70 px-4 py-4">
                  <dt className="text-[16px] font-extrabold">{item.q}</dt>
                  <dd className="mt-2 text-[15px] leading-relaxed text-[#16130F]/80">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <nav aria-label="Powiązane strony" className="flex flex-wrap gap-2">
            {landing.seeAlso.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full border border-[#16130F]/15 bg-white px-4 py-2 text-sm font-bold hover:border-[#2F5BFF] hover:text-[#2F5BFF]">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}

function WarszawaVisual() {
  return (
    <div className="grid gap-3 bg-[#16130F] px-5 pb-8 md:grid-cols-2 md:px-8">
      <Link href={productPaths.tshirt} className="group relative overflow-hidden rounded-[28px] bg-[#231e18] p-6">
        <p className="text-[12px] font-extrabold tracking-[0.14em] text-[#C9D5FF] uppercase">Koszulka</p>
        <p className="font-poster mt-1 text-[28px] font-black text-[#F3EEE4]">Przód i tył</p>
        <Image
          src="/products/tee-black.webp"
          alt="Czarna koszulka z oferty drukarycz.pl"
          width={1117}
          height={1200}
          priority
          sizes="(max-width: 768px) 90vw, 40vw"
          className="mx-auto mt-4 h-[220px] w-auto md:h-[280px]"
        />
        <span className="mt-4 inline-block text-sm font-extrabold text-[#C9D5FF] group-hover:underline">Otwórz ławkę →</span>
      </Link>
      <Link href={productPaths.mug} className="group relative overflow-hidden rounded-[28px] bg-[#F3EEE4] p-6 text-[#16130F]">
        <p className="text-[12px] font-extrabold tracking-[0.14em] text-[#6b6358] uppercase">Kubek</p>
        <p className="font-poster mt-1 text-[28px] font-black">330 ml · obwód</p>
        <Image
          src="/products/mug-sand.webp"
          alt="Piaskowy kubek z oferty drukarycz.pl"
          width={1130}
          height={1129}
          priority
          sizes="(max-width: 768px) 90vw, 40vw"
          className="mx-auto mt-4 h-[220px] w-auto md:h-[280px]"
        />
        <span className="mt-4 inline-block text-sm font-extrabold text-[#2F5BFF] group-hover:underline">Otwórz ławkę →</span>
      </Link>
    </div>
  );
}

function RozmiaryVisual() {
  return (
    <div className="border-b border-[#16130F]/10 bg-[#F3EEE4] px-5 py-8 md:px-8">
      <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
        {sizes.map((size) => (
          <Link
            key={size}
            href={productPaths.tshirt}
            className="min-w-[72px] rounded-2xl border-2 border-[#16130F]/12 bg-white px-5 py-4 text-center text-[18px] font-extrabold hover:border-[#2F5BFF]"
          >
            {size}
          </Link>
        ))}
      </div>
      <p className="mx-auto mt-4 max-w-3xl text-sm text-[#6b6358]">
        Przyciski otwierają ławkę koszulki. Nadruk ma zawsze te same milimetry — rozmiar zmienia kroj, nie arkusz.
      </p>
    </div>
  );
}

function MaterialyVisual() {
  return (
    <div className="border-b border-[#16130F]/10 bg-[#F3EEE4] px-5 py-8 md:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
        <div>
          <p className="text-[12px] font-extrabold tracking-[0.14em] text-[#6b6358] uppercase">Kolor rzeczy</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {shirtColors.map((color) => (
              <figure key={color.id} className="rounded-2xl border border-[#16130F]/10 bg-white p-3">
                <span className="mx-auto block h-14 w-14 rounded-full border border-black/15" style={{ background: color.value }} />
                <figcaption className="mt-2 text-center text-sm font-extrabold">{color.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[12px] font-extrabold tracking-[0.14em] text-[#6b6358] uppercase">Wykończenie nadruku</p>
          <ul className="mt-3 grid gap-2">
            {finishes.map((item) => (
              <li key={item.id} className="rounded-2xl border border-[#16130F]/10 bg-white px-4 py-3 text-[15px] font-bold">
                {item.label}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-[#6b6358]">
            Tylko rodzaj. Szerokości rolki {seller.brand} na stronie klienta nie pokazuje.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-6 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-4">
        {shirtColors.map((color) => (
          <Image
            key={color.id}
            src={`/products/tee-${color.id}.webp`}
            alt={`Koszulka, kolor ${color.label.toLowerCase()}`}
            width={1117}
            height={1200}
            priority
            sizes="(max-width: 768px) 50vw, 25vw"
            className="h-auto w-full rounded-2xl bg-[#16130F]"
          />
        ))}
      </div>
    </div>
  );
}
