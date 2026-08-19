import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../prisma.js", () => ({
  prisma: {
    document: { findMany: vi.fn() },
    business: { update: vi.fn() },
  },
}));

const { recomputeVerificationStatus, REQUIRED_DOC_TYPES } = await import("./verification.js");
const { prisma } = await import("../prisma.js");

beforeEach(() => {
  vi.clearAllMocks();
  prisma.business.update.mockResolvedValue({});
});

describe("recomputeVerificationStatus", () => {
  it("is unverified with no documents at all", async () => {
    prisma.document.findMany.mockResolvedValue([]);

    const status = await recomputeVerificationStatus("biz-1");

    expect(status).toBe("unverified");
    expect(prisma.business.update).toHaveBeenCalledWith({
      where: { id: "biz-1" },
      data: { verificationStatus: "unverified" },
    });
  });

  it("is pending once any document exists but not all required types are approved", async () => {
    prisma.document.findMany.mockResolvedValue([{ type: "business_registration", status: "pending" }]);

    const status = await recomputeVerificationStatus("biz-1");
    expect(status).toBe("pending");
  });

  it("stays pending when only one of the two required types is approved", async () => {
    prisma.document.findMany.mockResolvedValue([
      { type: "business_registration", status: "approved" },
      { type: "tax_id", status: "rejected" },
    ]);

    const status = await recomputeVerificationStatus("biz-1");
    expect(status).toBe("pending");
  });

  it("is verified once every required type has an approved document", async () => {
    prisma.document.findMany.mockResolvedValue([
      { type: "business_registration", status: "approved" },
      { type: "tax_id", status: "approved" },
      { type: "other", status: "pending" },
    ]);

    const status = await recomputeVerificationStatus("biz-1");
    expect(status).toBe("verified");
  });

  it("requires business_registration and tax_id specifically", () => {
    expect(REQUIRED_DOC_TYPES).toEqual(["business_registration", "tax_id"]);
  });
});
