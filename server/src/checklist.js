// Rule-based export-readiness checklist generator.
//
// This is intentionally simple for v0: a set of always-required items plus a
// few conditional ones based on product category and destination. It is NOT
// a substitute for real customs/legal advice — see the disclaimer baked into
// every generated certificate. The goal is to give a business owner a clear,
// plain-language "here is what you still need" list, not a legally binding
// customs determination.

const ALWAYS_REQUIRED = [
  "Valid business registration certificate",
  "Tax Identification Number (TIN)",
  "Proof of product origin (invoices/receipts for raw materials or manufacturing records)",
  "Commercial invoice for the shipment",
  "Packing list",
];

const CATEGORY_RULES = {
  food_and_beverage: [
    "Health/food safety certification from a recognized national authority",
    "Ingredient list with country of origin for each ingredient",
  ],
  textiles_and_fashion: [
    "Fabric/material sourcing documentation",
    "Labeling compliant with destination country requirements",
  ],
  electronics: [
    "Product safety/compliance certification (e.g. relevant standards body)",
    "Serial number or batch tracking documentation",
  ],
  agriculture: [
    "Phytosanitary certificate",
    "Proof of farm/origin location",
  ],
  handicrafts_and_art: [
    "Description of materials used and their origin",
  ],
  general_merchandise: [],
};

export function generateChecklist({ productCategory, destinationCountry }) {
  const categoryKey = (productCategory || "general_merchandise")
    .toLowerCase()
    .replace(/[^a-z]+/g, "_");

  const categoryItems = CATEGORY_RULES[categoryKey] || CATEGORY_RULES.general_merchandise;

  const items = [
    ...ALWAYS_REQUIRED,
    ...categoryItems,
    `AfCFTA Certificate of Origin (draft generated below) for export to ${destinationCountry}`,
  ];

  return items.map((item) => ({ item, status: "pending" }));
}

export const KNOWN_CATEGORIES = Object.keys(CATEGORY_RULES);
