import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Route tests are unit-level: Prisma, PDF generation, and blob storage are
// all mocked so these run anywhere (including CI) with no live database,
// no filesystem writes, and no PDF rendering — the thing under test is the
// route/middleware logic itself (auth, ownership checks, status codes,
// response shapes), not the persistence layer.
vi.mock("../prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    business: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    certificate: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    document: { findMany: vi.fn(), deleteMany: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

vi.mock("../certificate.js", () => ({
  generateCertificatePdf: vi.fn().mockResolvedValue("certificates/fake-id.pdf"),
}));

vi.mock("../lib/blobStorage.js", () => ({
  putBlob: vi.fn().mockResolvedValue("fake-key"),
  getBlob: vi.fn().mockResolvedValue(null),
  deleteBlob: vi.fn().mockResolvedValue(undefined),
}));

const { app } = await import("../app.js");
const { prisma } = await import("../prisma.js");
const { signToken, AUTH_COOKIE } = await import("../lib/auth.js");

const owner = { id: "user-1", email: "owner@example.com", isAdmin: false };

function asOwner(req, user = owner) {
  return req.set("Cookie", `${AUTH_COOKIE}=${signToken(user)}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  prisma.user.findUnique.mockResolvedValue(owner);
});

describe("POST /api/businesses", () => {
  const validPayload = {
    name: "Acme Textiles",
    country: "Nigeria",
    productCategory: "textiles_and_fashion",
    productDescription: "Handmade bags",
    inputsOrigin: "Locally sourced leather",
    contactEmail: "acme@example.com",
  };

  it("creates a business owned by the authenticated user", async () => {
    const created = { id: "biz-1", ownerId: owner.id, ...validPayload, isPublic: true, verificationStatus: "unverified" };
    prisma.business.create.mockResolvedValue(created);

    const res = await asOwner(request(app).post("/api/businesses")).send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.business.id).toBe("biz-1");
    expect(prisma.business.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ownerId: owner.id, name: "Acme Textiles" }) })
    );
  });

  it("rejects requests missing required fields", async () => {
    const res = await asOwner(request(app).post("/api/businesses")).send({ name: "Acme" });
    expect(res.status).toBe(400);
    expect(prisma.business.create).not.toHaveBeenCalled();
  });

  it("rejects a malformed contact email with a validation error", async () => {
    const res = await asOwner(request(app).post("/api/businesses")).send({
      ...validPayload,
      contactEmail: "not-an-email",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid contact email/i);
    expect(prisma.business.create).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/businesses").send(validPayload);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/businesses/:id", () => {
  it("returns 404 for a business that doesn't exist", async () => {
    prisma.business.findUnique.mockResolvedValue(null);
    const res = await asOwner(request(app).get("/api/businesses/missing"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when the business belongs to a different owner", async () => {
    prisma.business.findUnique.mockResolvedValue({ id: "biz-2", ownerId: "someone-else" });
    const res = await asOwner(request(app).get("/api/businesses/biz-2"));
    expect(res.status).toBe(403);
  });

  it("returns the business with certificates and documents for the owner", async () => {
    prisma.business.findUnique.mockResolvedValue({ id: "biz-1", ownerId: owner.id, name: "Acme" });
    prisma.certificate.findMany.mockResolvedValue([]);
    prisma.document.findMany.mockResolvedValue([]);

    const res = await asOwner(request(app).get("/api/businesses/biz-1"));

    expect(res.status).toBe(200);
    expect(res.body.business.id).toBe("biz-1");
    expect(res.body.business.certificates).toEqual([]);
  });
});

describe("PATCH /api/businesses/:id", () => {
  it("updates isPublic for the owner", async () => {
    prisma.business.findUnique.mockResolvedValue({ id: "biz-1", ownerId: owner.id, isPublic: true });
    prisma.business.update.mockResolvedValue({ id: "biz-1", ownerId: owner.id, isPublic: false });

    const res = await asOwner(request(app).patch("/api/businesses/biz-1")).send({ isPublic: false });

    expect(res.status).toBe(200);
    expect(res.body.business.isPublic).toBe(false);
  });

  it("rejects a non-boolean isPublic value", async () => {
    prisma.business.findUnique.mockResolvedValue({ id: "biz-1", ownerId: owner.id });
    const res = await asOwner(request(app).patch("/api/businesses/biz-1")).send({ isPublic: "yes" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/businesses/:id", () => {
  it("deletes an unverified business without writing an audit log entry", async () => {
    prisma.business.findUnique.mockResolvedValue({ id: "biz-1", ownerId: owner.id, verificationStatus: "unverified" });
    prisma.certificate.findMany.mockResolvedValue([]);
    prisma.document.findMany.mockResolvedValue([]);

    const res = await asOwner(request(app).delete("/api/businesses/biz-1"));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("writes an audit log entry when deleting a verified business", async () => {
    prisma.business.findUnique.mockResolvedValue({
      id: "biz-1",
      ownerId: owner.id,
      name: "Acme",
      contactEmail: "acme@example.com",
      verificationStatus: "verified",
    });
    prisma.certificate.findMany.mockResolvedValue([]);
    prisma.document.findMany.mockResolvedValue([]);

    const res = await asOwner(request(app).delete("/api/businesses/biz-1"));

    expect(res.status).toBe(200);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "business.deleted", businessId: "biz-1" }) })
    );
  });

  it("rejects deletion by a non-owner", async () => {
    prisma.business.findUnique.mockResolvedValue({ id: "biz-1", ownerId: "someone-else", verificationStatus: "unverified" });
    const res = await asOwner(request(app).delete("/api/businesses/biz-1"));
    expect(res.status).toBe(403);
  });
});

describe("POST /api/businesses/:id/certificates", () => {
  it("generates a checklist and draft certificate", async () => {
    prisma.business.findUnique.mockResolvedValue({
      id: "biz-1",
      ownerId: owner.id,
      productCategory: "general_merchandise",
    });
    prisma.certificate.create.mockResolvedValue({ id: "cert-1", businessId: "biz-1" });
    prisma.certificate.update.mockResolvedValue({ id: "cert-1", pdfPath: "certificates/fake-id.pdf" });

    const res = await asOwner(request(app).post("/api/businesses/biz-1/certificates")).send({
      destinationCountry: "Ghana",
    });

    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.certificate.checklist)).toBe(true);
    expect(res.body.certificate.checklist.length).toBeGreaterThan(0);
  });

  it("requires a destinationCountry", async () => {
    prisma.business.findUnique.mockResolvedValue({ id: "biz-1", ownerId: owner.id });
    const res = await asOwner(request(app).post("/api/businesses/biz-1/certificates")).send({});
    expect(res.status).toBe(400);
  });
});
