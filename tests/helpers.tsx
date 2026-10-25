import { Refine, type DataProvider } from "@refinedev/core";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import { createDataProvider } from "@/providers/data-provider";
import { handlers } from "@/modules/registry";
import { notificationProvider } from "@/providers/notification-provider";
import { resources } from "@/modules/resources";
import { Toaster } from "@/components/layout/toaster";

export type Recorded = {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
  headers: Headers;
};

type Route = {
  method?: string;
  path: string | RegExp;
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * Stub global fetch with a tiny router; every call is recorded. Unmatched calls 404.
 * The typed client hits `/api/backend/api/v1/...` (the BFF); paths here omit the BFF prefix.
 */
export function mockApi(routes: Route[]) {
  const calls: Recorded[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const req =
      input instanceof Request ? input : new Request(new URL(String(input), "http://localhost"), init);
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname.replace(/^\/api\/backend/, "");
    const text = req.method === "GET" || req.method === "HEAD" ? "" : await req.clone().text();
    let body: unknown = undefined;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }
    calls.push({ method: req.method, path, query: url.searchParams, body, headers: req.headers });
    const route = routes.find(
      (r) =>
        (r.method ?? "GET") === req.method &&
        (typeof r.path === "string" ? r.path === path : r.path.test(path)),
    );
    if (!route)
      return new Response(JSON.stringify({ detail: `No mock for ${req.method} ${path}` }), { status: 404 });
    const status = route.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(route.body ?? {}), {
      status,
      headers: { "content-type": "application/json", ...route.headers },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    calls,
    fetchMock,
    last: (method: string, path: string) =>
      [...calls].reverse().find((c) => c.method === method && c.path === path),
  };
}

export const dataProvider = createDataProvider(handlers);

export function renderWithRefine(ui: React.ReactNode, dp: DataProvider = dataProvider) {
  return render(
    <Refine
      dataProvider={dp}
      notificationProvider={notificationProvider}
      resources={resources}
      options={{
        disableTelemetry: true,
        syncWithLocation: false,
        reactQuery: { clientConfig: { defaultOptions: { queries: { retry: false, gcTime: 0 } } } },
      }}
    >
      {ui}
      <Toaster />
    </Refine>,
  );
}

/** Open a custom Select and choose the option with this value (or accessible name). */
export async function pick(
  user: { click: (el: Element) => Promise<void> },
  trigger: HTMLElement,
  value: string | RegExp,
) {
  await user.click(trigger);
  const list = document.getElementById(trigger.getAttribute("aria-controls") ?? "");
  if (!list) throw new Error("Select listbox did not open");
  const option =
    typeof value === "string"
      ? list.querySelector<HTMLElement>(`[role="option"][data-value="${CSS.escape(value)}"]`)
      : Array.from(list.querySelectorAll<HTMLElement>('[role="option"]')).find((o) =>
          value.test(o.textContent ?? ""),
        );
  if (!option) throw new Error(`No option ${String(value)}`);
  await user.click(option);
}

/** Labels of a custom Select's options (opens it, reads them, closes it again). */
export async function optionLabels(
  user: { click: (el: Element) => Promise<void>; keyboard: (k: string) => Promise<void> },
  trigger: HTMLElement,
) {
  await user.click(trigger);
  const list = document.getElementById(trigger.getAttribute("aria-controls") ?? "");
  const labels = Array.from(list?.querySelectorAll('[role="option"]') ?? []).map((o) => o.textContent ?? "");
  await user.keyboard("{Escape}");
  return labels;
}
