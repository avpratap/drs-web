import { expect, test, visit } from "./fixtures";

test("about: the DRS heritage story with Organization structured data", async ({ page }) => {
  await visit(page, "/about", "A name we carry with pride.");
  await expect(page.getByText("Dhanna Ram Sherawat", { exact: true }).first()).toBeVisible();
  for (const h of ["Our values", "Licensed, tested and traceable", "From the farm to your door, before 7 am"])
    await expect(page.getByRole("heading", { level: 2, name: h })).toBeVisible();
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent())!);
  expect(ld).toMatchObject({ "@type": "Organization", name: "DRS Dairy" });
  await expect(page).toHaveTitle(/^Our story · DRS Dairy$/);
});

test("journal: list → article with sanitized body, Article JSON-LD and SEO metadata", async ({ page }) => {
  await visit(page, "/journal", "The DRS Journal");
  const list = page.getByRole("list", { name: "Articles" });
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await list.getByRole("link", { name: "A2 milk, explained" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "A2 milk, explained" })).toBeVisible();
  await expect(page).toHaveTitle("A2 milk, explained | DRS Journal");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /A2 milk/);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  // The CMS body's <script> and onclick never reach the page; external links are hardened.
  const body = page.locator(".cms-prose");
  await expect(body.getByRole("heading", { level: 2, name: "Why some people prefer it" })).toBeVisible();
  expect(await body.innerHTML()).not.toMatch(/script|onclick/);
  await expect(body.getByRole("link", { name: "research summary" })).toHaveAttribute(
    "rel",
    "noopener noreferrer nofollow",
  );
  const lds = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(lds.map((t) => JSON.parse(t)["@type"])).toContain("Article");
  await visit(page, "/journal/a2-milk-explained", "A2 milk, explained");
});

test("CMS pages: published content renders; unpublished slugs show 'coming soon'", async ({ page }) => {
  await visit(page, "/faq", "Frequently asked questions");
  await expect(page.getByRole("heading", { level: 2, name: "When do you deliver?" })).toBeVisible();
  await expect(page).toHaveTitle("FAQs · DRS Dairy");

  await visit(page, "/delivery-areas", "Delivery areas");
  await expect(page.getByRole("heading", { name: "We're writing this page" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ask us a question/ })).toHaveAttribute(
    "href",
    "/account/support",
  );
  await visit(page, "/contact", "Contact us");
  await visit(page, "/terms", "Terms of service");
  await visit(page, "/privacy", "Privacy policy");
});

test("home shows active promo banners linking into the shop", async ({ page }) => {
  await visit(page, "/", /Pure milk at your door/);
  const offers = page.getByRole("region", { name: "Offers" });
  await expect(offers.getByRole("link")).toHaveCount(2);
  await expect(offers.getByRole("link", { name: /Ghee week/ })).toHaveAttribute(
    "href",
    "/products?category=ghee",
  );
});

test("footer links reach every marketing page", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  for (const [name, href] of [
    ["About DRS", "/about"],
    ["Journal", "/journal"],
    ["Contact us", "/contact"],
    ["FAQs", "/faq"],
    ["Delivery areas", "/delivery-areas"],
    ["Terms of service", "/terms"],
    ["Privacy policy", "/privacy"],
  ])
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
});

test("SEO plumbing: sitemap from the backend, robots, and old /blog + /shop URLs redirect", async ({
  page,
  request,
}) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("<urlset");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/admin/);
  expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
  await page.goto("/blog/a2-milk-explained");
  await expect(page).toHaveURL(/\/journal\/a2-milk-explained$/);
  await page.goto("/shop");
  await expect(page).toHaveURL(/\/products$/);
});
