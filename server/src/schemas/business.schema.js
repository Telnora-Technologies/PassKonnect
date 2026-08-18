import { z } from "zod";

// Matches the fields businesses.routes.js's POST / handler previously
// checked by hand (`if (!name || !country || ...)`). Optional fields accept
// an empty string too, since the client sends "" rather than omitting the
// key for blank optional inputs.
export const createBusinessSchema = z.object({
  name: z.string().trim().min(1, "Business name is required."),
  country: z.string().trim().min(1, "Country is required."),
  productCategory: z.string().trim().min(1, "Product category is required."),
  productDescription: z.string().trim().min(1, "Product description is required."),
  inputsOrigin: z.string().trim().min(1, "Origin of inputs/materials is required."),
  contactEmail: z.string().trim().email("A valid contact email is required."),
  registrationNumber: z.string().trim().optional().nullable(),
  registrationCountry: z.string().trim().optional().nullable(),
  contactPhone: z.string().trim().optional().nullable(),
});
