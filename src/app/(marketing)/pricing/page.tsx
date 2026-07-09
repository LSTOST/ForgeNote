// ForgeNote M2-16 — 定价页（laper /pricing 骨架，两档 + 月/年切换）。导航/页脚在 (marketing)/layout。

import type { Metadata } from "next";

import { PricingPlans } from "@/components/marketing/PricingPlans";
import { Reveal } from "@/components/marketing/Reveal";
import { Container } from "@/components/marketing/shared";

export const metadata: Metadata = {
  title: "定价 — ForgeNote",
  description: "公测期全部功能免费，注册即用；正式定价预告与早鸟折扣。",
};

export default function PricingPage() {
  return (
    <section className="pt-16 pb-20 sm:pt-20 sm:pb-28">
      <Container>
        <div className="mb-10 text-center">
          <h1 className="mkt-rise mkt-serif text-[26px] leading-normal font-semibold sm:text-[34px]">
            公测期免费，先看判断准不准
          </h1>
          <p
            className="mkt-rise mx-auto mt-3 max-w-lg text-[14.5px] leading-7 text-muted-foreground"
            style={{ animationDelay: "90ms" }}
          >
            现在注册即用全部功能。正式定价启用前会提前通知，公测用户享早鸟折扣。
          </p>
        </div>
        <Reveal delay={120}>
          <PricingPlans />
        </Reveal>
      </Container>
    </section>
  );
}
