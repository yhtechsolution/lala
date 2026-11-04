/** Draft/hidden status: the helper rules, validation, the form selector and the listing actions. */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const save = vi.fn();
vi.mock("@/lib/guesthouses", async () => {
  const actual = await vi.importActual<typeof import("@/lib/guesthouses")>("@/lib/guesthouses");
  return { ...actual, saveGuesthouse: (...args: unknown[]) => save(...args) };
});

import { GuesthouseForm } from "@/components/guesthouse-form";
import {
  GUESTHOUSE_STATUSES,
  statusOf,
  validateGuesthouse,
  type Guesthouse,
  type GuesthouseInput,
} from "@/lib/guesthouses";

const base: GuesthouseInput = {
  name: "River Lodge",
  logoUrl: "https://example.com/logo.png",
  galleryUrls: ["https://example.com/1.jpg"],
  description: "A calm lodge.",
  amenities: ["WiFi"],
  location: { lat: -19.98, lng: 23.41 },
  pricePerNight: 900,
  city: "Maun",
  country: "Botswana",
  contact: { phone: "+267 71 000 000", email: "info@example.com" },
};

describe("statusOf", () => {
  it("treats a missing status as published so older listings stay visible", () => {
    expect(statusOf({})).toBe("published");
    expect(statusOf({ status: "published" })).toBe("published");
  });

  it("reads the older active and suspended values as published and hidden", () => {
    expect(statusOf({ status: "active" })).toBe("published");
    expect(statusOf({ status: "suspended" })).toBe("hidden");
  });

  it("recognises draft and hidden, and treats anything else as hidden", () => {
    expect(statusOf({ status: "draft" })).toBe("draft");
    expect(statusOf({ status: "hidden" })).toBe("hidden");
    expect(statusOf({ status: "archived" })).toBe("hidden");
  });
});

describe("validateGuesthouse status", () => {
  it("accepts every allowed status and none at all", () => {
    for (const status of GUESTHOUSE_STATUSES)
      expect(() => validateGuesthouse({ ...base, status })).not.toThrow();
    expect(() => validateGuesthouse(base)).not.toThrow();
  });

  it("rejects an unknown status", () => {
    expect(() => validateGuesthouse({ ...base, status: "archived" as never })).toThrow(
      /published, draft or hidden/,
    );
  });
});

describe("GuesthouseForm visibility", () => {
  beforeEach(() => {
    save.mockReset();
    save.mockResolvedValue(undefined);
  });

  const fillAll = () => {
    const set = (label: RegExp | string, value: string) =>
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    set(/Guesthouse name/, base.name);
    set(/^City/, base.city);
    set(/Price per night/, "900");
    set(/Latitude/, "-19.98");
    set(/Longitude/, "23.41");
    set(/Contact phone/, "+267 71 000 000");
    set(/Contact email/, "info@example.com");
    set(/logo URL/, base.logoUrl);
    set(/Gallery URLs/, "https://example.com/1.jpg");
    set(/Amenities/, "WiFi");
    set(/^Description/, "A calm lodge.");
  };

  it("defaults a new listing to published and saves the chosen status", async () => {
    render(<GuesthouseForm close={() => {}} />);
    const select = screen.getByLabelText(/Visibility in the app/) as HTMLSelectElement;
    expect(select.value).toBe("published");
    fillAll();
    fireEvent.change(select, { target: { value: "draft" } });
    fireEvent.click(screen.getByRole("button", { name: /^Save/ }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0]?.[0]).toMatchObject({ status: "draft" });
  });

  it("opens an older listing without a status as published", () => {
    const old = {
      ...base,
      id: "x",
      averageRating: 0,
      ratingCount: 0,
      ratingSum: 0,
      createdBy: "a",
    } as Guesthouse;
    render(<GuesthouseForm item={old} close={() => {}} />);
    expect((screen.getByLabelText(/Visibility in the app/) as HTMLSelectElement).value).toBe(
      "published",
    );
  });

  it("opens a hidden listing as hidden", () => {
    const hidden = {
      ...base,
      id: "x",
      status: "hidden",
      averageRating: 0,
      ratingCount: 0,
      ratingSum: 0,
      createdBy: "a",
    } as Guesthouse;
    render(<GuesthouseForm item={hidden} close={() => {}} />);
    expect((screen.getByLabelText(/Visibility in the app/) as HTMLSelectElement).value).toBe(
      "hidden",
    );
  });
});
