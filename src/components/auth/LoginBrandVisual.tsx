import Image from "next/image";

import { ForgeLogo } from "@/components/forge/ForgeLogo";

export function LoginBrandVisual() {
  return (
    <section className="relative hidden w-[56%] overflow-hidden lg:block">
      <Image
        src="/images/forge-visual.png"
        alt="ForgeNote 品牌视觉：暮色星空下的草坡上，有人安静地书写创作"
        fill
        priority
        quality={90}
        sizes="56vw"
        className="object-cover"
      />
      <div className="absolute left-10 top-10 z-10 rounded-md bg-bg-card p-2 shadow-[var(--shadow-popover)]">
        <ForgeLogo href="/" />
      </div>
    </section>
  );
}
