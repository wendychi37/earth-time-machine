import Link from "next/link";
import { messages } from "@/messages/zh-Hant";

export function AppHeader() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 sm:p-6">
      <div className="pointer-events-auto" data-label-avoid>
        <h1 className="text-xl font-semibold tracking-wide sm:text-2xl">
          {messages.app.title}
        </h1>
        <p className="text-xs text-muted sm:text-sm">
          {messages.app.subtitle}
          {" · "}
          <Link href="/about" className="underline hover:text-foreground">
            {messages.nav.about}
          </Link>
        </p>
      </div>
    </header>
  );
}
