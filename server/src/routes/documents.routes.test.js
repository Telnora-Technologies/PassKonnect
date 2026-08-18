import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    business: { findUnique: vi.fn(), update: vi.fn() },
    document: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("../lib/blobStorage.js", () => ({
  putBlob: vi.fn().mockResolvedValue("documents/biz-1/fake-key.pdf"),
  getBlob: vi.fn(),
  deleteBlob: vi.fn().mockResolvedValue(undefined),
}));

const { app } = await import("../app.js");
const { prisma } = await import("../prisma.js");
const { getBlob } = await import("../lib/blobStorage.js");
const { signToken, AUTH_COOKIE } = await import("../lib/auth.js");

const owner = { id: "user-1", email: "owner@example.com", isAdmin: false };

function asOwner(req, user = owner) {
  return req.set("Cookie", `${AUTH_COOKIE}=${signToken(user)}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  prisma.user.findUnique.mockResolvedValue(owner);
  prisma.business.findUnique.mockResolvedValue({ id: "biz-1", ownerId: owner.id });
  prisma.document.findMany.mockResolvedValue([]);
  prisma.business.update.mockResolvedValue({ id: "biz-1", verificationStatus: "pending" });
});

describe("POST /api/businesses/:id/documents", () => {
  it("uploads a document and recomputes verification status", async () => {
    prisma.document.create.mockResolvedValue({
      id: "doc-1",
      businessId: "biz-1",
      type: "business_registration",
      status: "pending",
    });

    const res = await asOwner(request(app).post("/api/businesses/biz-1/documents"))
      .field("type", "business_registration")
      .attach("file", Buffer.from("%PDF-1.3 fake"), { filename: "reg.pdf", contentType: "application/pdf" });

    expect(res.status).toBe(201);
    expect(res.body.document.id).toBe("doc-1");
    expect(prisma.business.update).toHaveBeenCalled();
  });

  it("rejects an invalid document type", async () => {
    const res = await asOwner(request(app).post("/api/businesses/biz-1/documents"))
      .field("type", "not_a_real_type")
      .attach("file", Buffer.from("%PDF-1.3 fake"), { filename: "reg.pdf", contentType: "application/pdf" });

    expect(res.status).toBe(400);
    expect(prisma.document.create).not.toHaveBeenCalled();
  });

  it("rejects a request with no file attached", async () => {
    const res = await asOwner(request(app).post("/api/businesses/biz-1/documents")).field(
      "type",
      "business_registration"
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/documents/:id", () => {
  it("removes a pending document", async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: "doc-1",
      businessId: "biz-1",
      status: "pending",
      filePath: "documents/biz-1/fake-key.pdf",
    });

    const res = await asOwner(request(app).delete("/api/documents/doc-1"));

    expect(res.status).toBe(200);
    expect(prisma.document.delete).toHaveBeenCalledWith({ where: { id: "doc-1" } });
  });

  it("blocks the owner from removing an already-approved document", async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: "doc-1",
      businessId: "biz-1",
      status: "approved",
      filePath: "documents/biz-1/fake-key.pdf",
    });

    const res = await asOwner(request(app).delete("/api/documents/doc-1"));

    expect(res.status).toBe(409);
    expect(prisma.document.delete).not.toHaveBeenCalled();
  });
});

describe("GET /api/documents/:id/file", () => {
  it("streams the file back with the right content type", async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: "doc-1",
      businessId: "biz-1",
      filePath: "documents/biz-1/fake-key.pdf",
      originalName: "reg.pdf",
    });
    getBlob.mockResolvedValue(Buffer.from("%PDF-1.3 fake"));

    const res = await asOwner(request(app).get("/api/documents/doc-1/file"));

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
  });

  it("returns 404 when the blob is missing", async () => {
    prisma.document.findUnique.mockResolvedValue({
      id: "doc-1",
      businessId: "biz-1",
      filePath: "documents/biz-1/gone.pdf",
      originalName: "reg.pdf",
    });
    getBlob.mockResolvedValue(null);

    const res = await asOwner(request(app).get("/api/documents/doc-1/file"));
    expect(res.status).toBe(404);
  });
});
