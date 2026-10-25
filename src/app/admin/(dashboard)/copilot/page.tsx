"use client";

import { SparklesIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { useApiAction } from "@/lib/use-api-action";
import { insightsActions } from "@/modules/insights/handlers";

type Turn = { q: string; a: string; live: boolean };

const SUGGESTIONS = [
  "Which products sold most in the last 7 days?",
  "Which accounts are at high churn risk?",
  "What should we produce for tomorrow?",
  "Which items are below their reorder point?",
];

export default function CopilotPage() {
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const { run, pending } = useApiAction();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (turns.length && typeof endRef.current?.scrollIntoView === "function")
      endRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turns.length]);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || pending) return;
    const r = await run(() => insightsActions.askCopilot(text)).catch(() => undefined);
    if (r) {
      setTurns((t) => [...t, { q: text, a: r.answer, live: r.ai_live }]);
      setMessage("");
    }
  };

  return (
    <>
      <PageHeader
        title="AI copilot"
        description="Ask about sales, stock, deliveries and customers in plain language. Answers use live DRS data."
      />
      <Card className="flex flex-col gap-5">
        <div aria-live="polite" aria-busy={pending || undefined} className="flex flex-col gap-4">
          {turns.length === 0 && (
            <div>
              <p className="text-sm text-drs-ink/75">Try one of these:</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => ask(s)}
                      className="min-h-11 rounded-full border border-drs-green/25 bg-drs-white px-4 text-left text-sm text-drs-green transition-colors hover:border-drs-green hover:bg-drs-green/5"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {turns.map((t, i) => (
            <article key={i} className="flex flex-col gap-2" aria-label={`Question ${i + 1}`}>
              <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-drs-green px-4 py-2.5 text-sm text-drs-cream">
                {t.q}
              </p>
              <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-drs-ink/10 bg-drs-cream/50 px-4 py-3 text-sm whitespace-pre-wrap text-drs-ink">
                <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-drs-green">
                  <SparklesIcon aria-hidden className="size-3.5" /> Copilot
                  {!t.live && <Badge>Offline answer</Badge>}
                </span>
                {t.a}
              </div>
            </article>
          ))}
          {pending && (
            <p role="status" className="text-sm text-drs-ink/70">
              Thinking…
            </p>
          )}
          <div ref={endRef} />
        </div>
        <form
          className="flex flex-col gap-2 border-t border-drs-ink/10 pt-4 md:flex-row md:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(message);
          }}
        >
          <div className="flex-1">
            <label htmlFor="copilot-q" className="mb-1.5 block text-sm font-medium">
              Your question
            </label>
            <textarea
              id="copilot-q"
              rows={2}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask(message);
                }
              }}
              placeholder="e.g. How did buttermilk sales change this week?"
              className={cn(inputClass, "min-h-11 resize-none")}
            />
          </div>
          <Button type="submit" loading={pending} disabled={!message.trim()}>
            Ask
          </Button>
        </form>
      </Card>
    </>
  );
}
