import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminQueue from "./AdminQueue";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const pendingDoc = {
  id: "doc-1",
  type: "business_registration",
  originalName: "reg.pdf",
  status: "pending",
  business: { id: "biz-1", name: "Acme Textiles", ownerEmail: "owner@example.com" },
};

const auditEntry = {
  id: "audit-1",
  createdAt: "2026-08-01T12:00:00.000Z",
  action: "business.deleted",
  businessName: "Old Co.",
  ownerEmail: "owner@example.com",
  performedByEmail: "admin@passkonnect.dev",
};

function mockLoads({ documents = [], entries = [] } = {}) {
  api.get.mockImplementation((path) => {
    if (path.startsWith("/admin/documents")) return Promise.resolve({ documents });
    if (path === "/admin/audit-log") return Promise.resolve({ entries });
    return Promise.reject(new Error(`Unexpected path: ${path}`));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminQueue", () => {
  it("shows an empty state when nothing is pending", async () => {
    mockLoads();
    render(<AdminQueue />);
    expect(await screen.findByText(/nothing pending review/i)).toBeInTheDocument();
  });

  it("renders pending documents with business context", async () => {
    mockLoads({ documents: [pendingDoc] });
    render(<AdminQueue />);

    expect(await screen.findByText("reg.pdf")).toBeInTheDocument();
    expect(screen.getByText("Acme Textiles")).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
  });

  it("approves a document and refreshes the queue", async () => {
    mockLoads({ documents: [pendingDoc] });
    api.post.mockResolvedValue({ ok: true, verificationStatus: "pending" });
    const user = userEvent.setup();

    render(<AdminQueue />);
    await screen.findByText("reg.pdf");

    await user.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/admin/documents/doc-1/review", { status: "approved", note: "" })
    );
  });

  it("renders audit log entries", async () => {
    mockLoads({ entries: [auditEntry] });
    render(<AdminQueue />);

    expect(await screen.findByText("Old Co.")).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByText("admin@passkonnect.dev")).toBeInTheDocument();
  });

  it("shows an empty state for the audit log when there are no entries", async () => {
    mockLoads();
    render(<AdminQueue />);
    expect(await screen.findByText(/no entries yet/i)).toBeInTheDocument();
  });
});
