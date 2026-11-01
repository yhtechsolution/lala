import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  firestore: {},
  setDoc: vi.fn(),
  getFirebase: vi.fn(),
}));

vi.mock("../config/firebase", () => ({ firestore: mocks.firestore }));
vi.mock("../lib/firebase", () => ({ getFirebase: mocks.getFirebase }));
vi.mock("firebase/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase/firestore")>()),
  doc: (_database: unknown, ...segments: string[]) => segments.join("/"),
  serverTimestamp: () => "server-timestamp",
  setDoc: mocks.setDoc,
}));

import { addFavourite, createAdmin, createCustomerProfile } from "../services/firestore";
import { addGuesthouse } from "../services/guesthouseService";

describe("services retained from main", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setDoc.mockResolvedValue(undefined);
  });

  it("saves a favourite under the guesthouse ID", async () => {
    await addFavourite("customer-1", "house-1");
    expect(mocks.setDoc).toHaveBeenCalledWith(
      "customers/customer-1/favourites/house-1",
      { guesthouseId: "house-1", addedAt: "server-timestamp" },
      { merge: true },
    );
  });

  it("saves customer and admin profiles under their account UIDs", async () => {
    await createCustomerProfile("customer-1", "customer@example.com", "Customer");
    await createAdmin("admin-1", "admin@example.com", "Admin", "owner-1");
    expect(mocks.setDoc).toHaveBeenNthCalledWith(
      1, "customers/customer-1",
      { email: "customer@example.com", displayName: "Customer", createdAt: "server-timestamp" },
      { merge: true },
    );
    expect(mocks.setDoc).toHaveBeenNthCalledWith(
      2, "admins/admin-1",
      { email: "admin@example.com", displayName: "Admin", createdAt: "server-timestamp", createdBy: "owner-1" },
      { merge: true },
    );
  });

  it("propagates a denied write without retrying under another document ID", async () => {
    const denied = new Error("permission-denied");
    mocks.setDoc.mockRejectedValueOnce(denied);
    await expect(addFavourite("customer-1", "house-1")).rejects.toBe(denied);
    expect(mocks.setDoc).toHaveBeenCalledTimes(1);
  });

  it("initializes the shared web service lazily and requires a signed-in user", async () => {
    expect(mocks.getFirebase).not.toHaveBeenCalled();
    mocks.getFirebase.mockReturnValue({ auth: { currentUser: null }, db: {} });
    await expect(addGuesthouse({} as Parameters<typeof addGuesthouse>[0])).rejects.toThrow(
      "You must be logged in as an admin",
    );
    expect(mocks.getFirebase).toHaveBeenCalledTimes(1);
  });
});
