import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom has <dialog> but not its modal API.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

// Next's router hooks, controllable per test via `nav`.
export const nav = {
  params: {} as Record<string, string>,
  search: new URLSearchParams(),
  pathname: "/",
  push: vi.fn(),
  replace: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useParams: () => nav.params,
  useSearchParams: () => nav.search,
  usePathname: () => nav.pathname,
  useRouter: () => ({
    push: nav.push,
    replace: nav.replace,
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  nav.params = {};
  nav.search = new URLSearchParams();
  nav.pathname = "/";
  nav.push.mockReset();
  nav.replace.mockReset();
  vi.unstubAllGlobals();
});
