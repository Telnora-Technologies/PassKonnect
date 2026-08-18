import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: { get: vi.fn(), delete: vi.fn() },
}));

const businesses = [
  { id: "biz-1", name: "Acme Textiles", country: "Nigeria", productCategory: "textiles_and_fashion", verificationStatus: "verified" },
  { id: "biz-2", name: "Savannah Spices", country: "Kenya", productCategory: "food_and_beverage", verificationStatus: "unverified" },
];

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Dashboard", () => {
  it("renders the owner's businesses once loaded", async () => {
    api.get.mockResolvedValue({ businesses });

    renderDashboard();

    expect(await screen.findByText("Acme Textiles")).toBeInTheDocument();
    expect(screen.getByText("Savannah Spices")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/businesses");
  });

  it("shows an empty state when there are no businesses", async () => {
    api.get.mockResolvedValue({ businesses: [] });

    renderDashboard();

    expect(await screen.findByText(/haven't added a business profile/i)).toBeInTheDocument();
  });

  it("shows an error message when loading fails", async () => {
    api.get.mockRejectedValue(new Error("Network down"));

    renderDashboard();

    expect(await screen.findByText("Network down")).toBeInTheDocument();
  });

  it("deletes a business after confirmation", async () => {
    api.get.mockResolvedValueOnce({ businesses }).mockResolvedValueOnce({ businesses: [businesses[1]] });
    api.delete.mockResolvedValue({ ok: true });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderDashboard();
    await screen.findByText("Acme Textiles");

    const user = userEvent.setup();
    await user.click(screen.getByTitle("Delete Acme Textiles"));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/businesses/biz-1"));
  });

  it("does not delete when the confirmation is dismissed", async () => {
    api.get.mockResolvedValue({ businesses });
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderDashboard();
    await screen.findByText("Acme Textiles");

    const user = userEvent.setup();
    await user.click(screen.getByTitle("Delete Acme Textiles"));

    expect(api.delete).not.toHaveBeenCalled();
  });
});
