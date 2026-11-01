/** The form fills in AI text but never saves it on its own. */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const generate = vi.fn();
const translate = vi.fn();
const save = vi.fn();

vi.mock("@/lib/ai", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai")>("@/lib/ai");
  return {
    ...actual,
    generateListingDraft: (...args: unknown[]) => generate(...args),
    translateToSetswana: (...args: unknown[]) => translate(...args),
  };
});
vi.mock("@/lib/guesthouses", async () => {
  const actual = await vi.importActual<typeof import("@/lib/guesthouses")>("@/lib/guesthouses");
  return { ...actual, saveGuesthouse: (...args: unknown[]) => save(...args) };
});

import { GuesthouseForm } from "@/components/guesthouse-form";

function fill(label: RegExp | string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("AI description button", () => {
  beforeEach(() => {
    generate.mockReset();
    translate.mockReset();
    save.mockReset();
  });

  it("fills description and merges amenities without saving", async () => {
    generate.mockResolvedValue({
      description: "A calm riverside lodge.",
      amenities: ["Breakfast", "wifi"],
    });
    render(<GuesthouseForm close={() => {}} />);
    fill(/Guesthouse name/, "River Lodge");
    fill(/^City/, "Maun");
    fill(/Amenities/, "WiFi, Pool");
    fill(/Notes for the AI/, "riverside, breakfast included");
    fireEvent.click(screen.getByRole("button", { name: /Draft description with AI/ }));

    await waitFor(() =>
      expect((screen.getByLabelText(/^Description/) as HTMLTextAreaElement).value).toBe(
        "A calm riverside lodge.",
      ),
    );
    expect((screen.getByLabelText(/Amenities/) as HTMLInputElement).value).toBe(
      "WiFi, Pool, Breakfast",
    );
    expect(screen.getByRole("status")).toHaveTextContent(/AI-drafted/);
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "River Lodge",
        city: "Maun",
        notes: "riverside, breakfast included",
      }),
    );
    expect(save).not.toHaveBeenCalled();
  });

  it("shows a friendly error when the AI fails", async () => {
    generate.mockRejectedValue(new Error("[429] quota exceeded"));
    render(<GuesthouseForm close={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Draft description with AI/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/limit/);
    expect(save).not.toHaveBeenCalled();
  });

  it("translates the description into the Setswana box without saving", async () => {
    translate.mockResolvedValue("Lodge e e monate.");
    render(<GuesthouseForm close={() => {}} />);
    fill(/^Description/, "A calm lodge.");
    fireEvent.click(screen.getByRole("button", { name: /Translate to Setswana with AI/ }));
    await waitFor(() =>
      expect((screen.getByLabelText(/Setswana description/) as HTMLTextAreaElement).value).toBe(
        "Lodge e e monate.",
      ),
    );
    expect(translate).toHaveBeenCalledWith("A calm lodge.");
    expect(screen.getByRole("status")).toHaveTextContent(/Setswana speaker/);
    expect(save).not.toHaveBeenCalled();
  });

  it("shows an error when translation fails", async () => {
    translate.mockRejectedValue(new Error("[429] quota exceeded"));
    render(<GuesthouseForm close={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Translate to Setswana with AI/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/limit/);
  });
});
