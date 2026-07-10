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
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-black/25" />

      <div className="absolute left-10 top-10 z-10">
        <ForgeLogo
          href="/"
          className="[&>div:first-child]:bg-white/95 [&>div:first-child]:text-primary [&_span]:text-white"
        />
      </div>
    </section>
  );
}
