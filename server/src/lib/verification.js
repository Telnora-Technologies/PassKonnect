import { prisma } from "../prisma.js";

// A business is "verified" once it has an approved document for every
// required type. Any document at all (even pending/rejected) moves it out
// of "unverified" into "pending" so owners see progress.
export const REQUIRED_DOC_TYPES = ["business_registration", "tax_id"];

export const DOCUMENT_TYPES = [
  { value: "business_registration", label: "Business registration certificate" },
  { value: "tax_id", label: "Tax Identification Number (TIN) proof" },
  { value: "other", label: "Other supporting document" },
];

export async function recomputeVerificationStatus(businessId) {
  const documents = await prisma.document.findMany({ where: { businessId } });

  const approvedTypes = new Set(documents.filter((d) => d.status === "approved").map((d) => d.type));
  const isVerified = REQUIRED_DOC_TYPES.every((type) => approvedTypes.has(type));

  const status = isVerified ? "verified" : documents.length > 0 ? "pending" : "unverified";

  await prisma.business.update({
    where: { id: businessId },
    data: { verificationStatus: status },
  });

  return status;
}
