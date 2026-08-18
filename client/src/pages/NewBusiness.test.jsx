import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NewBusiness from "./NewBusiness";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

function renderNewBusiness() {
  return render(
    <MemoryRouter>
      <NewBusiness />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ categories: ["textiles_and_fashion", "food_and_beverage"] });
});

describe("NewBusiness", () => {
  it("loads categories from the API into the select", async () => {
    renderNewBusiness();

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/categories"));
    expect(await screen.findByRole("option", { name: "textiles and fashion" })).toBeInTheDocument();
  });

  it("submits the filled-out profile", async () => {
    api.post.mockResolvedValue({ business: { id: "biz-1" } });
    const user = userEvent.setup();

    renderNewBusiness();
    await screen.findByRole("option", { name: "textiles and fashion" });

    await user.type(screen.getByLabelText(/business name/i), "Acme Textiles");
    await user.selectOptions(screen.getByLabelText(/^country/i), "Nigeria");
    await user.selectOptions(screen.getByLabelText(/product category/i), "textiles_and_fashion");
    await user.type(screen.getByLabelText(/what do you make or sell/i), "Handmade bags");
    await user.type(screen.getByLabelText(/where do your materials/i), "Local leather");
    await user.type(screen.getByLabelText(/contact email/i), "acme@example.com");

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/businesses",
        expect.objectContaining({
          name: "Acme Textiles",
          country: "Nigeria",
          productCategory: "textiles_and_fashion",
          contactEmail: "acme@example.com",
        })
      )
    );
  });

  it("shows an error message when submission fails", async () => {
    api.post.mockRejectedValue(new Error("Missing required fields."));
    const user = userEvent.setup();

    renderNewBusiness();
    await screen.findByRole("option", { name: "textiles and fashion" });

    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Native `required` validation blocks jsdom form submission before our
    // handler runs unless every required field is filled; fill the minimum
    // set so the submit handler actually executes and hits the API.
    await user.type(screen.getByLabelText(/business name/i), "Acme");
    await user.selectOptions(screen.getByLabelText(/^country/i), "Nigeria");
    await user.selectOptions(screen.getByLabelText(/product category/i), "textiles_and_fashion");
    await user.type(screen.getByLabelText(/what do you make or sell/i), "Bags");
    await user.type(screen.getByLabelText(/where do your materials/i), "Leather");
    await user.type(screen.getByLabelText(/contact email/i), "acme@example.com");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText("Missing required fields.")).toBeInTheDocument();
  });
});
