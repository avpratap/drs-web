import { afterEach, describe, expect, it, vi } from "vitest";
import { siteUrl } from "@/lib/site";

describe("siteUrl", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("uses NEXT_PUBLIC_SITE_URL without a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://drsdairy.in/");
    expect(siteUrl()).toBe("https://drsdairy.in");
  });
  it("defaults to the local dev server on port 3100", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(siteUrl()).toBe("http://localhost:3100");
  });
});
