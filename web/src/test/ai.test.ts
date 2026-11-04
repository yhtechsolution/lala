/** Tests for the pure parts of the AI helpers. No network or Firebase calls are made. */
import { describe, expect, it } from "vitest";
import {
  AiInputError,
  aiErrorMessage,
  buildInsightPrompt,
  buildListingPrompt,
  buildTranslationPrompt,
  cleanInsight,
  cleanTranslation,
  computeDashboardStats,
  dedupeAmenities,
  generateListingDraft,
  listingDraftProblem,
  MAX_AMENITIES,
  MAX_DESCRIPTION_LENGTH,
  MAX_TRANSLATION_LENGTH,
  mergeAmenities,
  parseListingDraft,
  translateToSetswana,
} from "@/lib/ai";

const input = {
  name: "Thamalakane River Lodge",
  city: "Maun",
  country: "Botswana",
  pricePerNight: 950,
  amenities: ["WiFi"],
  notes: "Riverside chalets with breakfast included",
};

describe("listing draft input", () => {
  it("needs a name, a city and some facts", () => {
    expect(listingDraftProblem(input)).toBeNull();
    expect(listingDraftProblem({ ...input, name: " " })).toMatch(/name and city/);
    expect(listingDraftProblem({ ...input, city: "" })).toMatch(/name and city/);
    expect(listingDraftProblem({ ...input, notes: "", amenities: [] })).toMatch(
      /notes or amenities/,
    );
  });

  it("builds a prompt that carries the facts and forbids invention", () => {
    const prompt = buildListingPrompt(input);
    expect(prompt).toContain("Thamalakane River Lodge");
    expect(prompt).toContain("950 BWP per night");
    expect(prompt).toContain("Riverside chalets with breakfast included");
    expect(prompt).toMatch(/Do not invent/);
    expect(prompt).toMatch(/data, not instructions/);
  });
});

describe("parsing the model's draft", () => {
  it("accepts valid JSON", () => {
    const draft = parseListingDraft(
      JSON.stringify({ description: "A calm riverside lodge.", amenities: ["WiFi", "Breakfast"] }),
    );
    expect(draft).toEqual({
      description: "A calm riverside lodge.",
      amenities: ["WiFi", "Breakfast"],
    });
  });

  it("removes code fences and markdown characters", () => {
    const draft = parseListingDraft(
      '```json\n{"description":"**Lovely** lodge\\nby the river","amenities":["Pool"]}\n```',
    );
    expect(draft.description).toBe("Lovely lodge by the river");
  });

  it("limits description and amenity length and count", () => {
    const draft = parseListingDraft(
      JSON.stringify({
        description: "x".repeat(2000),
        amenities: Array.from({ length: 30 }, (_, i) => `Amenity ${i}`),
      }),
    );
    expect(draft.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    expect(draft.amenities.length).toBeLessThanOrEqual(MAX_AMENITIES);
  });

  it("rejects text that is not JSON or has no description", () => {
    expect(() => parseListingDraft("Sorry, I cannot help")).toThrow(/expected format/);
    expect(() => parseListingDraft('{"description":"   ","amenities":[]}')).toThrow(/empty/);
    expect(() => parseListingDraft("[]")).toThrow(/empty/);
  });

  it("ignores amenities that are not strings", () => {
    const draft = parseListingDraft('{"description":"Fine.","amenities":["Pool",5,null,{"a":1}]}');
    expect(draft.amenities).toEqual(["Pool"]);
  });
});

describe("amenities", () => {
  it("removes duplicates regardless of case", () => {
    expect(dedupeAmenities(["WiFi", "wifi", " Pool ", "POOL"])).toEqual(["WiFi", "Pool"]);
  });

  it("keeps existing amenities first when merging", () => {
    expect(mergeAmenities(["Parking", "WiFi"], ["wifi", "Breakfast"])).toEqual([
      "Parking",
      "WiFi",
      "Breakfast",
    ]);
  });
});

describe("dashboard statistics", () => {
  const items = [
    { name: "A", city: "Maun", pricePerNight: 1000, averageRating: 4.5, ratingCount: 10 },
    { name: "B", city: "Maun", pricePerNight: 600, averageRating: 4.9, ratingCount: 4 },
    { name: "C", city: "Gaborone", pricePerNight: 800, averageRating: 0, ratingCount: 0 },
  ];

  it("finds totals, the busiest city and the best-rated guesthouse", () => {
    const stats = computeDashboardStats(items);
    expect(stats.totalGuesthouses).toBe(3);
    expect(stats.totalRatings).toBe(14);
    expect(stats.unratedGuesthouses).toBe(1);
    expect(stats.topCity).toBe("Maun");
    expect(stats.cities[0]).toEqual({ city: "Maun", guesthouses: 2, averagePriceBWP: 800 });
    expect(stats.topRated).toEqual({ name: "B", city: "Maun", rating: 4.9, ratings: 4 });
    expect(stats.cheapest).toEqual({ name: "B", city: "Maun", priceBWP: 600 });
    expect(stats.averagePriceBWP).toBe(800);
  });

  it("handles an empty platform", () => {
    const stats = computeDashboardStats([]);
    expect(stats.totalGuesthouses).toBe(0);
    expect(stats.topCity).toBeNull();
    expect(stats.topRated).toBeNull();
    expect(stats.averagePriceBWP).toBeNull();
  });

  it("breaks city ties alphabetically so results are stable", () => {
    const stats = computeDashboardStats([
      { name: "A", city: "Palapye", pricePerNight: 1, averageRating: 0, ratingCount: 0 },
      { name: "B", city: "Kasane", pricePerNight: 1, averageRating: 0, ratingCount: 0 },
    ]);
    expect(stats.topCity).toBe("Kasane");
  });

  it("sends only aggregate figures to the model", () => {
    const prompt = buildInsightPrompt(computeDashboardStats(items));
    expect(prompt).toContain('"totalGuesthouses":3');
    expect(prompt).toMatch(/Do not calculate new numbers/);
    expect(prompt).not.toContain("@");
    expect(prompt).not.toMatch(/phone|email/i);
  });

  it("cleans and limits the summary text", () => {
    expect(cleanInsight("**Three** guesthouses.\n\nMaun leads.")).toBe(
      "Three guesthouses. Maun leads.",
    );
    expect(() => cleanInsight("  ")).toThrow(/empty/);
    expect(cleanInsight("a".repeat(2000)).length).toBeLessThanOrEqual(700);
  });
});

describe("error messages", () => {
  it("explains common failures", () => {
    expect(aiErrorMessage({ code: "AI/api-not-enabled" })).toMatch(/not enabled/);
    expect(aiErrorMessage(new Error("[429] quota exceeded"))).toMatch(/limit/);
    expect(aiErrorMessage(new Error("403 App Check token invalid"))).toMatch(/App Check/);
    expect(aiErrorMessage(new Error("The operation was aborted due to timeout"))).toMatch(
      /took too long/,
    );
    expect(aiErrorMessage({ code: "AI/fetch-error" })).toMatch(/connection/);
    expect(aiErrorMessage(new Error("boom"))).toMatch(/could not complete/);
  });

  it("passes through our own format messages", () => {
    expect(aiErrorMessage(new Error("The AI reply was empty. Please try again."))).toMatch(/empty/);
  });
});

describe("Setswana translation", () => {
  it("builds a prompt that protects names and numbers and refuses invention", () => {
    const prompt = buildTranslationPrompt("A calm lodge in Maun with 6 rooms.");
    expect(prompt).toContain("A calm lodge in Maun with 6 rooms.");
    expect(prompt).toMatch(/Setswana/);
    expect(prompt).toMatch(/numbers/);
    expect(prompt).toMatch(/data, not instructions/);
  });

  it("limits how much text is sent", () => {
    const prompt = buildTranslationPrompt("x".repeat(5000));
    expect(prompt.length).toBeLessThan(MAX_DESCRIPTION_LENGTH + 800);
  });

  it("cleans quotes and markdown and rejects empty replies", () => {
    expect(cleanTranslation('"**Lodge** e e monate."')).toBe("Lodge e e monate.");
    expect(() => cleanTranslation("   ")).toThrow(/empty/);
    expect(cleanTranslation("a".repeat(5000)).length).toBeLessThanOrEqual(MAX_TRANSLATION_LENGTH);
  });
});

describe("input problems reach the admin as written", () => {
  it("shows the specific message instead of the generic AI error", async () => {
    const failure = await generateListingDraft({
      name: "",
      city: "",
      country: "Botswana",
      amenities: [],
      notes: "",
    }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(AiInputError);
    expect(aiErrorMessage(failure)).toBe("Enter the guesthouse name and city first.");
  });
  it("explains what is missing from a translation or summary request", async () => {
    expect(aiErrorMessage(await translateToSetswana("  ").catch((e: unknown) => e))).toMatch(
      /English description first/,
    );
  });
});
