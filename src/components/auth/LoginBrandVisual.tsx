import Image from "next/image";

export function LoginBrandVisual() {
  return (
    <section
      className="relative hidden min-h-screen overflow-hidden bg-bg-app md:block"
      aria-hidden="true"
    >
      <Image
        src="/login-creator-doorway-panel.png"
        alt=""
        fill
        priority
        quality={100}
        sizes="50vw"
        className="object-cover object-left-top select-none [filter:contrast(1.04)_saturate(1.04)]"
      />
    </section>
  );
}
