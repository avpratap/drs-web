import { describe, expect, it } from "vitest";
import { bannerHref } from "@/components/marketing/promo-banners";
import { htmlToText, sanitizeCmsHtml } from "@/lib/sanitize";

describe("CMS HTML sanitizing", () => {
  it("strips scripts, styles, iframes, forms and event handlers", () => {
    const out = sanitizeCmsHtml(
      '<p onclick="steal()">Hi</p><script>alert(1)</script><style>p{}</style><iframe src="https://x"></iframe>' +
        '<form><input name="pin"></form><img src="javascript:alert(1)"><a href="javascript:alert(1)">x</a>',
    );
    expect(out).toBe("<p>Hi</p><a>x</a>");
  });

  it("keeps editorial markup, demotes h1, and hardens links and images", () => {
    const out = sanitizeCmsHtml(
      '<h1>Title</h1><h2>Sub</h2><ul><li><strong>A2</strong></li></ul><a href="https://example.org">ext</a>' +
        '<a href="/products">int</a><img src="https://cdn.example/a.jpg"><img src="http://insecure/a.jpg">',
    );
    expect(out).toContain("<h2>Title</h2><h2>Sub</h2>");
    expect(out).toContain("<ul><li><strong>A2</strong></li></ul>");
    expect(out).toContain(
      '<a href="https://example.org" target="_blank" rel="noopener noreferrer nofollow">ext</a>',
    );
    expect(out).toContain('<a href="/products">int</a>');
    expect(out).toContain('<img src="https://cdn.example/a.jpg" loading="lazy" alt="" />');
    expect(out).not.toContain("insecure");
  });

  it("extracts plain text for meta descriptions", () => {
    expect(htmlToText("<p>Hello <b>world</b></p><script>x</script>")).toBe("Hello world");
    expect(htmlToText(`<p>${"a".repeat(200)}</p>`, 20)).toHaveLength(20);
  });
});

describe("banner links", () => {
  it("follows site paths and https only", () => {
    expect(bannerHref("/products?category=ghee")).toEqual({
      href: "/products?category=ghee",
      external: false,
    });
    expect(bannerHref("https://drs.co.in/offer")).toEqual({
      href: "https://drs.co.in/offer",
      external: true,
    });
    expect(bannerHref("//evil.example")).toBeNull();
    expect(bannerHref("javascript:alert(1)")).toBeNull();
    expect(bannerHref("http://insecure.example")).toBeNull();
    expect(bannerHref(null)).toBeNull();
  });
});
