import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    document: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    business: { update: vi.fn() },
    auditLog: { findMany: vi.fn() },
  },
}));

const { app } = await import("../app.js");
const { prisma } = await import("../prisma.js");
const { signToken, AUTH_COOKIE } = await import("../lib/auth.js");

const admin = { id: "admin-1", email: "admin@passkonnect.dev", isAdmin: true };
const nonAdmin = { id: "user-1", email: "owner@example.com", isAdmin: false };

function asUser(req, user) {
  return req.set("Cookie", `${AUTH_COOKIE}=${signToken(user)}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("admin routes access control", () => {
  it("rejects a non-admin user with 403", async () => {
    prisma.user.findUnique.mockResolvedValue(nonAdmin);
    const res = await asUser(request(app).get("/api/admin/documents"), nonAdmin);
    expect(res.status).toBe(403);
  });

  it("rejects an unauthenticated request with 401", async () => {
    const res = await request(app).get("/api/admin/documents");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/documents", () => {
  it("returns pending documents with business/owner context", async () => {
    prisma.user.findUnique.mockResolvedValue(admin);
    prisma.document.findMany.mockResolvedValue([
      {
        id: "doc-1",
        type: "business_registration",
        originalName: "reg.pdf",
        status: "pending",
        reviewNote: null,
        createdAt: new Date(),
        reviewedAt: null,
        business: { id: "biz-1", name: "Acme", owner: { email: "owner@example.com" } },
      },
    ]);

    const res = await asUser(request(app).get("/api/admin/documents"), admin);

    expect(res.status).toBe(200);
    expect(res.body.documents).toHaveLength(1);
    expect(res.body.documents[0].business.ownerEmail).toBe("owner@example.com");
  });
});

describe("POST /api/admin/documents/:id/review", () => {
  it("approves a document and recomputes verification status", async () => {
    prisma.user.findUnique.mockResolvedValue(admin);
    prisma.document.findUnique.mockResolvedValue({ id: "doc-1", businessId: "biz-1" });
    prisma.document.findMany.mockResolvedValue([
      { type: "business_registration", status: "approved" },
      { type: "tax_id", status: "approved" },
    ]);

    const res = await asUser(
      request(app).post("/api/admin/documents/doc-1/review").send({ status: "approved", note: "Looks good" }),
      admin
    );

    expect(res.status).toBe(200);
    expect(res.body.verificationStatus).toBe("verified");
    expect(prisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "doc-1" },
        data: expect.objectContaining({ status: "approved", reviewedById: admin.id }),
      })
    );
  });

  it("rejects an invalid status value", async () => {
    prisma.user.findUnique.mockResolvedValue(admin);
    const res = await asUser(
      request(app).post("/api/admin/documents/doc-1/review").send({ status: "maybe" }),
      admin
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 for a document that doesn't exist", async () => {
    prisma.user.findUnique.mockResolvedValue(admin);
    prisma.document.findUnique.mockResolvedValue(null);

    const res = await asUser(
      request(app).post("/api/admin/documents/missing/review").send({ status: "approved" }),
      admin
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /api/admin/audit-log", () => {
  it("returns audit log entries for an admin", async () => {
    prisma.user.findUnique.mockResolvedValue(admin);
    prisma.auditLog.findMany.mockResolvedValue([{ id: "audit-1", action: "business.deleted" }]);

    const res = await asUser(request(app).get("/api/admin/audit-log"), admin);

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(1);
  });
});
