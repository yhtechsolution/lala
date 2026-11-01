import { beforeEach, describe, it, expect, vi } from "vitest";
const m = vi.hoisted(() => ({
  reset: vi.fn(),
  reauth: vi.fn(),
  password: vi.fn(),
  update: vi.fn(),
  credential: vi.fn(),
  user: { uid: "a", email: "admin@example.com" },
}));
vi.mock("firebase/auth", () => ({
  sendPasswordResetEmail: m.reset,
  reauthenticateWithCredential: m.reauth,
  updatePassword: m.password,
  EmailAuthProvider: { credential: m.credential },
}));
vi.mock("firebase/firestore", () => ({ doc: vi.fn(() => "admins/a"), updateDoc: m.update }));
vi.mock("@/lib/firebase", () => ({
  getFirebase: () => ({ auth: { currentUser: m.user }, db: {} }),
}));
import { requestPasswordReset, changePassword, saveDisplayName } from "@/lib/account";
import { isMappableListing, popupContent } from "@/lib/discovery";
import type { Guesthouse } from "@/lib/guesthouses";
beforeEach(() => {
  vi.clearAllMocks();
  m.reset.mockResolvedValue(undefined);
  m.reauth.mockResolvedValue(undefined);
});
describe("Version 1.1", () => {
  it("validates reset email and trims the address", async () => {
    await expect(requestPasswordReset("bad")).rejects.toThrow();
    expect(m.reset).not.toHaveBeenCalled();
    await requestPasswordReset(" admin@example.com ");
    expect(m.reset).toHaveBeenCalledWith(expect.anything(), "admin@example.com");
  });
  it("does not disclose an unknown account", async () => {
    m.reset.mockRejectedValueOnce({ code: "auth/user-not-found" });
    await expect(requestPasswordReset("unknown@example.com")).resolves.toBeUndefined();
  });
  it("rejects mismatched passwords before reauthentication", async () => {
    await expect(changePassword("old", "newpass123", "different")).rejects.toThrow();
    expect(m.reauth).not.toHaveBeenCalled();
  });
  it("never updates a password when reauthentication fails", async () => {
    m.reauth.mockRejectedValueOnce(new Error("wrong password"));
    await expect(changePassword("old", "newpass123", "newpass123")).rejects.toThrow();
    expect(m.password).not.toHaveBeenCalled();
  });
  it("changes the password after successful reauthentication", async () => {
    await changePassword("old", "newpass123", "newpass123");
    expect(m.password).toHaveBeenCalledWith(m.user, "newpass123");
    expect(m.reauth.mock.invocationCallOrder[0]).toBeLessThan(
      m.password.mock.invocationCallOrder[0]!,
    );
  });
  it("updates only the profile display name", async () => {
    await saveDisplayName(" Simba ");
    expect(m.update).toHaveBeenCalledWith(expect.anything(), { displayName: "Simba" });
  });
  it("accepts world coordinates and rejects missing or invalid coordinates", () => {
    const item = { country: "France", location: { lat: 48.85, lng: 2.35 } } as Guesthouse;
    expect(isMappableListing(item)).toBe(true);
    expect(isMappableListing({ ...item, location: { lat: 0, lng: 0 } })).toBe(true);
    expect(isMappableListing({ ...item, location: { lat: 91, lng: 25 } })).toBe(false);
    expect(isMappableListing({ ...item, location: { lat: 0, lng: 181 } })).toBe(false);
    expect(isMappableListing({ ...item, location: { lat: NaN, lng: 25 } })).toBe(false);
    expect(isMappableListing({ ...item, location: undefined } as unknown as Guesthouse)).toBe(
      false,
    );
  });
  it("renders listing markup as text instead of executable HTML", () => {
    const node = popupContent({
      name: "<img src=x onerror=alert(1)>",
      city: "Paris",
      country: "France",
      pricePerNight: 20,
    } as Guesthouse);
    expect(node.querySelector("img")).toBeNull();
    expect(node.textContent).toContain("<img");
  });
});
