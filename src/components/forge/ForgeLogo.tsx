import Link from "next/link";
import { Feather } from "lucide-react";

import { cn } from "@/lib/utils";

export function ForgeLogo({
  className,
  showWordmark = true,
  href,
}: {
  className?: string;
  showWordmark?: boolean;
  href?: string;
}) {
  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
        <Feather className="size-[18px]" strokeWidth={2} aria-hidden />
      </div>
      {showWordmark ? (
        <span className="text-[17px] font-semibold tracking-tight text-foreground">ForgeNote</span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {content}
      </Link>
    );
  }

  return content;
}
