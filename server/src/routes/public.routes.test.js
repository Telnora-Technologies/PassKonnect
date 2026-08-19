import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../prisma.js", () => ({
  prisma: {
    business: { findUnique: vi.fn(), findMany: vi.fn() },
  },
}));

const { app } = await import("../app.js");
const { prisma } = await import("../prisma.js");

const business = {
  id: "biz-1",
  name: "Acme Textiles",
  country: "Nigeria",
  productCategory: "textiles_and_fashion",
  productDescription: "Handmade bags",
  verificationStatus: "verified",
  createdAt: new Date(),
  isPublic: true,
  // Fields that must NOT leak into the public response.
  contactEmail: "owner@example.com",
  contactPhone: "+234000000",
  registrationNumber: "RC123456",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/public/businesses/:id", () => {
  it("returns public-safe fields for a public business", async () => {
    prisma.business.findUnique.mockResolvedValue(business);

    const res = await request(app).get("/api/public/businesses/biz-1");

    expect(res.status).toBe(200);
    expect(res.body.business.name).toBe("Acme Textiles");
    expect(res.body.business.contactEmail).toBeUndefined();
    expect(res.body.business.contactPhone).toBeUndefined();
    expect(res.body.business.registrationNumber).toBeUndefined();
  });

  it("returns 404 for a business that opted out of public listing", async () => {
    prisma.business.findUnique.mockResolvedValue({ ...business, isPublic: false });
    const res = await request(app).get("/api/public/businesses/biz-1");
    expect(res.status).toBe(404);
  });

  it("returns 404 for a business that doesn't exist", async () => {
    prisma.business.findUnique.mockResolvedValue(null);
    const res = await request(app).get("/api/public/businesses/missing");
    expect(res.status).toBe(404);
  });

  it("resolves regardless of verification status (a QR scan always resolves)", async () => {
    prisma.business.findUnique.mockResolvedValue({ ...business, verificationStatus: "unverified" });
    const res = await request(app).get("/api/public/businesses/biz-1");
    expect(res.status).toBe(200);
    expect(res.body.business.verificationStatus).toBe("unverified");
  });
});

describe("GET /api/public/directory", () => {
  it("lists verified, public businesses", async () => {
    prisma.business.findMany.mockResolvedValue([business]);

    const res = await request(app).get("/api/public/directory");

    expect(res.status).toBe(200);
    expect(res.body.businesses).toHaveLength(1);
    expect(prisma.business.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublic: true, verificationStatus: "verified" }),
      })
    );
  });

  it("filters by country when provided", async () => {
    prisma.business.findMany.mockResolvedValue([]);

    await request(app).get("/api/public/directory?country=Kenya");

    expect(prisma.business.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ country: "Kenya" }) })
    );
  });

  it("filters by search query across name and description", async () => {
    prisma.business.findMany.mockResolvedValue([]);

    await request(app).get("/api/public/directory?q=leather");

    const call = prisma.business.findMany.mock.calls[0][0];
    expect(call.where.OR).toEqual([
      { name: { contains: "leather", mode: "insensitive" } },
      { productDescription: { contains: "leather", mode: "insensitive" } },
    ]);
  });
});
