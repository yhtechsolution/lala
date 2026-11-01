/** Contract tests guard the cross-team schema and prevent edits overwriting ratings. */
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  auth: { currentUser: { uid: "admin-1" } as { uid: string } | null },
}));
vi.mock("firebase/firestore", () => ({
  addDoc: mocks.addDoc,
  updateDoc: mocks.updateDoc,
  deleteDoc: mocks.deleteDoc,
  collection: (_: unknown, path: string) => path,
  doc: (_: unknown, path: string, id: string) => `${path}/${id}`,
  serverTimestamp: () => "SERVER_TIME",
}));
vi.mock("@/lib/firebase", () => ({ getFirebase: () => ({ db: {}, auth: mocks.auth }) }));
import { saveGuesthouse, validateGuesthouse, type GuesthouseInput } from "@/lib/guesthouses";
const input: GuesthouseInput = {
  name: " Palm House ",
  city: " Maun ",
  country: "Botswana",
  description: "A guesthouse",
  logoUrl: "https://example.com/logo.png",
  galleryUrls: ["https://example.com/photo.jpg"],
  amenities: ["WiFi"],
  location: { lat: -19.98, lng: 23.42 },
  pricePerNight: 850,
  contact: { phone: "+26712345678", email: "stay@example.com" },
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.currentUser = { uid: "admin-1" };
});
describe("Guesthouse writes", () => {
  it("creates numeric prices, lowercase search fields, creator metadata and zero rating totals", async () => {
    await saveGuesthouse(input);
    expect(mocks.addDoc).toHaveBeenCalledWith(
      "guesthouses",
      expect.objectContaining({
        name: "Palm House",
        city: "Maun",
        nameLower: "palm house",
        cityLower: "maun",
        pricePerNight: 850,
        averageRating: 0,
        ratingCount: 0,
        ratingSum: 0,
        createdBy: "admin-1",
        createdAt: "SERVER_TIME",
      }),
    );
  });
  it("updates editable fields without resetting rating aggregates or creator metadata", async () => {
    await saveGuesthouse(input, "g1");
    const [path, payload] = mocks.updateDoc.mock.calls[0]!;
    expect(path).toBe("guesthouses/g1");
    for (const field of ["averageRating", "ratingCount", "ratingSum", "createdAt", "createdBy"])
      expect(payload).not.toHaveProperty(field);
  });
  it("rejects invalid coordinates and non-HTTPS images", () => {
    expect(() => validateGuesthouse({ ...input, location: { lat: 91, lng: 0 } })).toThrow(
      "latitude",
    );
    expect(() => validateGuesthouse({ ...input, logoUrl: "javascript:alert(1)" })).toThrow("HTTPS");
  });
  it("does not write without an authenticated user", async () => {
    mocks.auth.currentUser = null;
    await expect(saveGuesthouse(input)).rejects.toThrow("Sign in");
    expect(mocks.addDoc).not.toHaveBeenCalled();
  });
});
