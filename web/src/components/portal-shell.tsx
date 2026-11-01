/** Branded admin shell. Firebase authenticates users; Firestore rules enforce write permissions. */
import { requestPasswordReset } from "@/lib/account";
import React, { useState } from "react";
import { useAdmin } from "@/lib/admin-auth";
import { firebaseError } from "@/lib/firebase";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Home,
  Users,
  MessageSquare,
  BarChart3,
  Search,
  Plus,
  MapPin,
  UserCircle,
  LogOut,
} from "lucide-react";

/** Only implemented routes appear in navigation; each entry has an accessible text label. */
const navItems = [
  { name: "Discovery map", path: "/discovery", icon: MapPin },
  { name: "My account", path: "/account", icon: UserCircle },
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Guesthouses", path: "/listings", icon: Home },
  { name: "Administrators", path: "/users", icon: Users },
  { name: "Communications", path: "/communications", icon: MessageSquare },
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
];

/** Shows the login form until authenticated, then the layout with supplied children. Header search/Add controls are placeholders. */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const { user, displayName, ready, isAdmin, error, login, logout } = useAdmin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [remember, setRemember] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setAuthError("");
    try {
      await login(username, password, remember);
      setPassword("");
    } catch (failure) {
      setAuthError(firebaseError(failure));
    } finally {
      setBusy(false);
    }
  }
  async function resetPassword() {
    setBusy(true);
    setAuthError("");
    setNotice("");
    try {
      await requestPasswordReset(username);
      setNotice(
        "If an account exists for that email, a reset link will be sent. Check your inbox and spam folder.",
      );
    } catch (failure) {
      setAuthError(firebaseError(failure));
    } finally {
      setBusy(false);
    }
  }
  async function handleLogout() {
    setAuthError("");
    try {
      await logout();
      setPassword("");
    } catch (failure) {
      setAuthError(firebaseError(failure));
    }
  }
  if (!ready)
    return (
      <div className="min-h-screen grid place-items-center bg-background" role="status">
        Checking your session…
      </div>
    );

  // --- LOGIN SCREEN RENDER (If not authenticated) ---
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <BrandLogo large />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-stone-800 tracking-tight">
            Lala Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-stone-500 font-medium">
            Guesthouse management, thoughtfully simple.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm border border-stone-200 sm:rounded-lg sm:px-10">
            <p className="mb-6 text-xs text-muted-foreground">
              Sign in with your Firebase admin email and password.
            </p>
            {notice && (
              <p role="status" className="mb-4 text-sm text-green-800">
                {notice}
              </p>
            )}
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-stone-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    autoComplete="username"
                    type="email"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm placeholder-stone-400 focus:outline-none focus:ring-stone-800 focus:border-stone-800 sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    autoComplete="current-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm placeholder-stone-400 focus:outline-none focus:ring-stone-800 focus:border-stone-800 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me on this device
              </label>
              <p className="text-xs text-muted-foreground">
                Unchecked: sign-in lasts for this browser tab session. Sign out when using a shared
                computer.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={resetPassword}
                className="text-sm underline"
              >
                Forgot password? Send reset email
              </button>
              {(authError || error) && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md text-center font-medium">
                  {authError || error}
                </div>
              )}

              <div>
                <button
                  disabled={busy}
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-stone-800 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-800 transition-colors"
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </div>
            </form>
            {user && (
              <button onClick={handleLogout} className="mt-4 underline text-sm">
                Sign out / use another account
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- STANDARD ADMIN SHELL RENDER (If authenticated) ---
  return (
    <div className="flex h-screen w-full bg-background text-stone-800 font-sans">
      {/* MANAGEMENT RAIL (SIDEBAR) */}
      <aside className="w-[260px] bg-white border-r border-stone-200 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="h-24 flex items-center px-6 border-b border-stone-100">
            <Link to="/" aria-label="Lala dashboard">
              <BrandLogo />
            </Link>
          </div>

          <nav aria-label="Main navigation" className="p-4 space-y-1">
            <p className="text-xs font-semibold text-stone-400 mb-4 px-2 uppercase tracking-wider">
              Workspace
            </p>
            {navItems.map((item) => {
              /* Highlight only an exact pathname match; no nested-path matching is performed. */
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                    isActive
                      ? "bg-stone-800 text-white"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-800"
                  }`}
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <div className="text-xs text-stone-500">
              <p className="font-semibold text-stone-700">Firebase workspace</p>
              <p>Live guesthouse data</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP HEADER */}
        <header className="min-h-16 bg-white border-b border-stone-200 flex flex-wrap gap-3 items-center justify-between px-4 py-3 md:px-8 z-10">
          <Link to="/listings" className="text-sm text-muted-foreground">
            Guesthouse workspace
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/listings"
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm"
            >
              Manage guesthouses
            </Link>
            <div className="h-8 w-px bg-stone-200"></div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-stone-800 leading-none mb-1">
                    {displayName}
                  </p>
                  <p className="text-xs text-stone-500 leading-none">Administrator</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-600 border border-stone-300">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile navigation exposes the same routes when the desktop sidebar is hidden. */}
        <nav
          aria-label="Mobile navigation"
          className="md:hidden flex gap-2 overflow-x-auto border-b border-border bg-card p-3"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              aria-current={location.pathname === item.path ? "page" : undefined}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${location.pathname === item.path ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

/** Displays the supplied artwork unchanged; CSS frames its central wordmark without stretching it. */
function BrandLogo({ large = false }: { large?: boolean }) {
  return (
    <span className={`lala-logo ${large ? "lala-logo-large" : ""}`}>
      <img src="/lala-logo.png" alt="lala guesthouse platform" />
    </span>
  );
}

/** Shared page title used by communications and analytics; callers own their page content. */
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
      <h1 className="font-display text-3xl text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
