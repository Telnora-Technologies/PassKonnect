import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import BusinessDetail from "./BusinessDetail";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const business = {
  id: "biz-1",
  name: "Acme Textiles",
  country: "Nigeria",
  productCategory: "textiles_and_fashion",
  productDescription: "Handmade bags",
  verificationStatus: "unverified",
  isPublic: true,
  documents: [],
  certificates: [],
};

function renderBusinessDetail() {
  return render(
    <MemoryRouter initialEntries={["/businesses/biz-1"]}>
      <Routes>
        <Route path="/businesses/:id" element={<BusinessDetail />} />
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("BusinessDetail", () => {
  it("renders the business once loaded", async () => {
    api.get.mockResolvedValue({ business });

    renderBusinessDetail();

    expect(await screen.findByText("Acme Textiles")).toBeInTheDocument();
    expect(screen.getByText("Handmade bags")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/businesses/biz-1");
  });

  it("toggles public listing", async () => {
    api.get.mockResolvedValue({ business });
    api.patch.mockResolvedValue({ business: { ...business, isPublic: false } });
    const user = userEvent.setup();

    renderBusinessDetail();
    await screen.findByText("Acme Textiles");

    await user.click(screen.getByRole("checkbox"));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/businesses/biz-1", { isPublic: false })
    );
  });

  it("deletes the business and navigates back to the dashboard", async () => {
    api.get.mockResolvedValue({ business });
    api.delete.mockResolvedValue({ ok: true });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();

    renderBusinessDetail();
    await screen.findByText("Acme Textiles");

    await user.click(screen.getByRole("button", { name: /delete this business/i }));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/businesses/biz-1"));
    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
  });

  it("lists uploaded documents with their status", async () => {
    api.get.mockResolvedValue({
      business: {
        ...business,
        documents: [
          { id: "doc-1", type: "business_registration", originalName: "reg.pdf", status: "pending" },
        ],
      },
    });

    renderBusinessDetail();

    expect(await screen.findByText("reg.pdf")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });
});
