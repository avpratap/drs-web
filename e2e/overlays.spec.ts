import type { Locator } from "@playwright/test";
import { choose, expect, test } from "./fixtures";

const align = (el: Locator) => el.evaluate((n) => getComputedStyle(n).textAlign);

test("dialogs and menus opened from right-aligned actions columns render left-aligned", async ({
  admin: page,
}) => {
  // ActionDialog from the Users actions column.
  await page.goto("/users");
  await page
    .getByRole("button", { name: /^Edit / })
    .first()
    .click();
  let dialog = page.getByRole("dialog");
  for (const el of [
    dialog.getByRole("heading").first(),
    dialog.locator("p").first(),
    dialog.getByText("Role", { exact: true }),
  ])
    expect(await align(el)).toBe("left");
  // A Select list opened inside that dialog.
  await dialog.getByRole("combobox", { name: /Role/ }).click();
  expect(await align(page.getByRole("listbox"))).toBe("left");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  // ConfirmDialog from the Gift cards actions column.
  await page.goto("/gift-cards");
  await page
    .getByRole("button", { name: /^Void gift card/ })
    .first()
    .click();
  dialog = page.getByRole("dialog");
  expect(await align(dialog.getByRole("heading"))).toBe("left");
  expect(await align(dialog.locator("p").first())).toBe("left");
  await dialog.getByRole("button", { name: "Cancel" }).click();

  // ActionDialog with fields from the Loyalty actions column; DatePicker inside Gift-card issue.
  await page.goto("/loyalty");
  await page
    .getByRole("button", { name: /^Adjust points for/ })
    .first()
    .click();
  dialog = page.getByRole("dialog");
  expect(await align(dialog.getByText(/Points \(\+\/−\)/))).toBe("left");
  await page.keyboard.press("Escape");

  await page.goto("/gift-cards");
  await page.getByRole("button", { name: "Issue gift card" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Expires on/ })
    .click();
  const cal = page.getByRole("dialog", { name: "Choose date" });
  expect(await align(cal)).toBe("left");
  await page.keyboard.press("Escape");

  // Driver unassign confirm from the assignments actions column; a filter Select.
  await page.goto("/delivery-assignments");
  await page
    .getByRole("button", { name: /^Unassign / })
    .first()
    .click();
  dialog = page.getByRole("dialog");
  expect(await align(dialog.getByRole("heading"))).toBe("left");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await choose(page.locator("#f-active"), { label: "Removed" });
});
