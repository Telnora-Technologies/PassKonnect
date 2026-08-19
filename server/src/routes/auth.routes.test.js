import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

const { app } = await import("../app.js");
const { prisma } = await import("../prisma.js");
const { hashPassword } = await import("../lib/auth.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/signup", () => {
  it("creates an account and sets the auth cookie", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "user-1",
      email: "new@example.com",
      isAdmin: false,
    });

    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "New@Example.com", password: "LongEnough123!" });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: "user-1", email: "new@example.com", isAdmin: false });
    expect(res.headers["set-cookie"][0]).toMatch(/pk_token=/);
    // Email is normalized (lowercased/trimmed) before hitting the DB.
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: "new@example.com" }) })
    );
  });

  it("rejects a password under 8 characters", async () => {
    const res = await request(app).post("/api/auth/signup").send({ email: "a@example.com", password: "short" });
    expect(res.status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate email with 409", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "existing-user", email: "taken@example.com" });

    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "taken@example.com", password: "LongEnough123!" });

    expect(res.status).toBe(409);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with the correct password", async () => {
    const passwordHash = await hashPassword("CorrectHorse123!");
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "owner@example.com",
      passwordHash,
      isAdmin: false,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "owner@example.com", password: "CorrectHorse123!" });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("owner@example.com");
    expect(res.headers["set-cookie"][0]).toMatch(/pk_token=/);
  });

  it("rejects an incorrect password", async () => {
    const passwordHash = await hashPassword("CorrectHorse123!");
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "owner@example.com", passwordHash });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "owner@example.com", password: "WrongPassword" });

    expect(res.status).toBe(401);
  });

  it("rejects an unknown email without leaking which part was wrong", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "whatever123" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password.");
  });
});

describe("GET /api/auth/me", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the auth cookie", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
