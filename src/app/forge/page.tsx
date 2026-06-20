import { ForgeWorkbench } from "@/components/forge/ForgeWorkbench";
import { TopNav } from "@/components/layout/TopNav";
import { PRODUCT_NAME, SLOGAN } from "@/lib/constants";

export default function ForgePage() {
  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <header className="mb-8 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {PRODUCT_NAME}
          </h1>
          <p className="text-muted-foreground">{SLOGAN}</p>
        </header>

        <ForgeWorkbench />
      </main>
    </>
  );
}
