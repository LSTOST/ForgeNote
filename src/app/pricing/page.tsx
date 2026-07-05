// ForgeNote M2-16 — 定价页（laper /pricing 骨架，两档 + 月/年切换）。

import type { Metadata } from "next";

import { SiteNav } from "@/components/marketing/SiteNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { Container } from "@/components/marketing/shared";

export const metadata: Metadata = {
  title: "定价 — ForgeNote",
  description: "公测期全部功能免费，注册即用；正式定价预告与早鸟折扣。",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteNav />
      <main className="flex-1">
        <section className="pt-16 pb-20 sm:pt-20">
          <Container>
            <div className="mb-10 text-center">
              <h1 className="font-serif text-[30px] leading-snug font-medium sm:text-[40px]">
                公测期免费，先看判断准不准
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-[15px] leading-7 text-muted-foreground">
                现在注册即用全部功能。正式定价启用前会提前通知，公测用户享早鸟折扣。
              </p>
            </div>
            <PricingPlans />
          </Container>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
