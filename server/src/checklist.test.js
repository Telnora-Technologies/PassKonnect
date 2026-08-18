import { describe, it, expect } from "vitest";
import { generateChecklist, KNOWN_CATEGORIES } from "./checklist.js";

describe("generateChecklist", () => {
  it("always includes the baseline required documents", () => {
    const checklist = generateChecklist({ productCategory: "general_merchandise", destinationCountry: "Ghana" });
    const items = checklist.map((c) => c.item);

    expect(items).toContain("Valid business registration certificate");
    expect(items).toContain("Tax Identification Number (TIN)");
    expect(items).toContain("Commercial invoice for the shipment");
    expect(checklist.every((c) => c.status === "pending")).toBe(true);
  });

  it("adds category-specific items for a known category", () => {
    const checklist = generateChecklist({ productCategory: "food_and_beverage", destinationCountry: "Kenya" });
    const items = checklist.map((c) => c.item);

    expect(items).toContain("Health/food safety certification from a recognized national authority");
    expect(items).toContain("Ingredient list with country of origin for each ingredient");
  });

  it("falls back to general_merchandise rules for an unrecognized category", () => {
    const checklist = generateChecklist({ productCategory: "something-made-up", destinationCountry: "Egypt" });
    const items = checklist.map((c) => c.item);

    // general_merchandise adds no category-specific items — checklist is
    // just the always-required set plus the certificate line.
    expect(items).toHaveLength(6);
  });

  it("mentions the destination country in the final checklist item", () => {
    const checklist = generateChecklist({ productCategory: "textiles_and_fashion", destinationCountry: "Rwanda" });
    expect(checklist.at(-1).item).toContain("Rwanda");
  });

  it("exports every category key used in the rules table", () => {
    expect(KNOWN_CATEGORIES).toContain("food_and_beverage");
    expect(KNOWN_CATEGORIES).toContain("general_merchandise");
  });
});
