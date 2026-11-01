/** The Add administrator form passes clean values on and reports what happened. */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();

vi.mock("@/lib/admin-users", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin-users")>("@/lib/admin-users");
  return { ...actual, createAdminAccount: (...args: unknown[]) => create(...args) };
});

import { AddAdminForm } from "@/components/add-admin-form";

const fill = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("AddAdminForm", () => {
  beforeEach(() => {
    create.mockReset();
  });

  it("submits the entered details and confirms success", async () => {
    create.mockResolvedValue({ uid: "u1", reusedExisting: false, resetEmailSent: true });
    render(<AddAdminForm />);
    fill(/^Email$/, "new@example.com");
    fill(/Display name/, "New Admin");
    fill(/Temporary password/, "a-long-temporary-password");
    fireEvent.click(screen.getByRole("button", { name: "Create administrator" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/reset link was emailed/),
    );
    expect(create).toHaveBeenCalledWith({
      email: "new@example.com",
      displayName: "New Admin",
      password: "a-long-temporary-password",
      sendReset: true,
    });
    // The form is cleared after success so the password is not left on screen.
    expect((screen.getByLabelText(/Temporary password/) as HTMLInputElement).value).toBe("");
  });

  it("tells the admin to share the password when no reset email is sent", async () => {
    create.mockResolvedValue({ uid: "u1", reusedExisting: false, resetEmailSent: false });
    render(<AddAdminForm />);
    fill(/^Email$/, "new@example.com");
    fill(/Display name/, "New Admin");
    fill(/Temporary password/, "a-long-temporary-password");
    fireEvent.click(screen.getByLabelText(/Email them a link/));
    fireEvent.click(screen.getByRole("button", { name: "Create administrator" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/Share the temporary password/);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ sendReset: false }));
  });

  it("shows the error and keeps what was typed when creation fails", async () => {
    create.mockRejectedValue(new Error("That email already has an account."));
    render(<AddAdminForm />);
    fill(/^Email$/, "new@example.com");
    fill(/Display name/, "New Admin");
    fill(/Temporary password/, "a-long-temporary-password");
    fireEvent.click(screen.getByRole("button", { name: "Create administrator" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/already has an account/);
    expect((screen.getByLabelText(/^Email$/) as HTMLInputElement).value).toBe("new@example.com");
  });

  it("generates a long password and reveals it", () => {
    render(<AddAdminForm />);
    fireEvent.click(screen.getByRole("button", { name: "Generate password" }));
    const field = screen.getByLabelText(/Temporary password/) as HTMLInputElement;
    expect(field.value.length).toBeGreaterThanOrEqual(16);
    expect(field.type).toBe("text");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(field.type).toBe("password");
  });
});
