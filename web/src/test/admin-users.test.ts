/** Admin creation: validation, the success and failure paths of the flow, and the password generator. */
import { describe, expect, it, vi } from "vitest";
import {
  generatePassword,
  MIN_ADMIN_PASSWORD_LENGTH,
  provisionAdmin,
  validateNewAdmin,
  type AdminProvisioner,
  type NewAdminInput,
} from "@/lib/admin-users";

const input: NewAdminInput = {
  email: "  New.Admin@Example.com ",
  displayName: "  New Admin ",
  password: "a-long-temporary-password",
  sendReset: true,
};

function provisioner(overrides: Partial<AdminProvisioner> = {}) {
  const deps = {
    createAccount: vi.fn().mockResolvedValue("uid-new"),
    signInExisting: vi.fn().mockResolvedValue("uid-existing"),
    saveProfile: vi.fn().mockResolvedValue(undefined),
    sendResetEmail: vi.fn().mockResolvedValue(undefined),
    finish: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return deps satisfies AdminProvisioner;
}

describe("validateNewAdmin", () => {
  it("trims and lowercases the email and trims the name", () => {
    const clean = validateNewAdmin(input);
    expect(clean.email).toBe("new.admin@example.com");
    expect(clean.displayName).toBe("New Admin");
  });

  it("rejects a bad email, empty or long name, and a short password", () => {
    expect(() => validateNewAdmin({ ...input, email: "nope" })).toThrow(/valid email/);
    expect(() => validateNewAdmin({ ...input, displayName: "  " })).toThrow(/display name/);
    expect(() => validateNewAdmin({ ...input, displayName: "x".repeat(81) })).toThrow(
      /display name/,
    );
    expect(() => validateNewAdmin({ ...input, password: "short" })).toThrow(
      new RegExp(String(MIN_ADMIN_PASSWORD_LENGTH)),
    );
  });
});

describe("provisionAdmin", () => {
  it("creates the login, grants admin access, emails a reset link and cleans up", async () => {
    const deps = provisioner();
    const result = await provisionAdmin(deps, input);
    expect(result).toEqual({ uid: "uid-new", reusedExisting: false, resetEmailSent: true });
    expect(deps.createAccount).toHaveBeenCalledWith("new.admin@example.com", input.password);
    expect(deps.saveProfile).toHaveBeenCalledWith("uid-new", {
      email: "new.admin@example.com",
      displayName: "New Admin",
    });
    expect(deps.sendResetEmail).toHaveBeenCalledWith("new.admin@example.com");
    expect(deps.finish).toHaveBeenCalledTimes(1);
  });

  it("skips the reset email when not requested", async () => {
    const deps = provisioner();
    const result = await provisionAdmin(deps, { ...input, sendReset: false });
    expect(result.resetEmailSent).toBe(false);
    expect(deps.sendResetEmail).not.toHaveBeenCalled();
  });

  it("still succeeds when the reset email cannot be sent", async () => {
    const deps = provisioner({ sendResetEmail: vi.fn().mockRejectedValue(new Error("mail down")) });
    const result = await provisionAdmin(deps, input);
    expect(result).toEqual({ uid: "uid-new", reusedExisting: false, resetEmailSent: false });
  });

  it("promotes an existing login when the password matches, without emailing", async () => {
    const deps = provisioner({
      createAccount: vi.fn().mockRejectedValue({ code: "auth/email-already-in-use" }),
    });
    const result = await provisionAdmin(deps, input);
    expect(result).toEqual({ uid: "uid-existing", reusedExisting: true, resetEmailSent: false });
    expect(deps.saveProfile).toHaveBeenCalledWith("uid-existing", expect.any(Object));
    expect(deps.sendResetEmail).not.toHaveBeenCalled();
  });

  it("refuses to take over an existing login when the password is wrong", async () => {
    const deps = provisioner({
      createAccount: vi.fn().mockRejectedValue({ code: "auth/email-already-in-use" }),
      signInExisting: vi.fn().mockRejectedValue({ code: "auth/invalid-credential" }),
    });
    await expect(provisionAdmin(deps, input)).rejects.toThrow(/already has an account/);
    expect(deps.saveProfile).not.toHaveBeenCalled();
    expect(deps.finish).toHaveBeenCalledTimes(1);
  });

  it("explains a half-finished creation and tells the admin how to retry", async () => {
    const deps = provisioner({
      saveProfile: vi.fn().mockRejectedValue({ code: "permission-denied" }),
    });
    await expect(provisionAdmin(deps, input)).rejects.toThrow(
      /login exists but admin access was not granted.*Try again/,
    );
    expect(deps.sendResetEmail).not.toHaveBeenCalled();
    expect(deps.finish).toHaveBeenCalledTimes(1);
  });

  it("passes other sign-up failures through and still cleans up", async () => {
    const deps = provisioner({
      createAccount: vi
        .fn()
        .mockRejectedValue({ code: "auth/weak-password", message: "Password is too weak" }),
    });
    await expect(provisionAdmin(deps, input)).rejects.toMatchObject({ code: "auth/weak-password" });
    expect(deps.finish).toHaveBeenCalledTimes(1);
  });

  it("never touches Firebase when the form is invalid", async () => {
    const deps = provisioner();
    await expect(provisionAdmin(deps, { ...input, email: "bad" })).rejects.toThrow(/valid email/);
    expect(deps.createAccount).not.toHaveBeenCalled();
    expect(deps.finish).not.toHaveBeenCalled();
  });

  it("does not fail if cleanup fails", async () => {
    const deps = provisioner({
      finish: vi.fn().mockRejectedValue(new Error("app already deleted")),
    });
    await expect(provisionAdmin(deps, input)).resolves.toMatchObject({ uid: "uid-new" });
  });
});

describe("generatePassword", () => {
  it("has the requested length and one character from every group", () => {
    for (let run = 0; run < 25; run++) {
      const password = generatePassword(16);
      expect(password).toHaveLength(16);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[!@#$%^&*?_-]/);
    }
  });

  it("never returns fewer characters than there are groups", () => {
    expect(generatePassword(2)).toHaveLength(4);
  });

  it("uses the random source it is given, so output is not fixed", () => {
    const first = generatePassword(16, () => 0);
    const second = generatePassword(16, (max) => max - 1);
    expect(first).not.toBe(second);
    expect(generatePassword(16)).not.toBe(generatePassword(16));
  });

  it("produces passwords long enough for the admin rule", () => {
    expect(generatePassword().length).toBeGreaterThanOrEqual(MIN_ADMIN_PASSWORD_LENGTH);
  });
});
