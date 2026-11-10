
import { useState } from "react";

const API_URL = "http://localhost:5001";

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/admin-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.token) {
        throw new Error(result.error || "Admin authentication failed.");
      }

      // Never accept a client-role token as an admin session.
      if (result.data?.role !== "admin") {
        throw new Error("Administrator access is required.");
      }

      sessionStorage.setItem("phantomSoulAdminToken", result.token);
      sessionStorage.setItem(
        "PHANTOM_SOUL_ADMIN",
        JSON.stringify(result.data)
      );

      onLogin?.(result);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08090D] text-[#E7E9EF] flex items-center justify-center px-6">
      <section className="w-full max-w-md">
        <header className="text-center mb-8">
          <p className="text-xs tracking-[0.35em] text-red-400 mb-3">
            PHANTOM_SOUL // RESTRICTED ACCESS
          </p>

          <h1 className="text-3xl font-semibold">
            Administrator sign-in
          </h1>

          <p className="text-sm text-[#8B91A1] mt-3">
            Authorized personnel only.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-[#0F1118] border border-[#252936] rounded-xl p-7 space-y-5"
        >
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs uppercase tracking-widest text-[#8B91A1] mb-2"
            >
              Admin email
            </label>

            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full bg-[#08090D] border border-[#252936] rounded-lg px-4 py-3 outline-none focus:border-red-400"
              placeholder="admin@yourfirm.com"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs uppercase tracking-widest text-[#8B91A1] mb-2"
            >
              Password
            </label>

            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full bg-[#08090D] border border-[#252936] rounded-lg px-4 py-3 outline-none focus:border-red-400"
              placeholder="Enter administrator password"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="border border-red-400/30 bg-red-400/5 rounded-lg p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING..." : "ENTER ADMIN CONTROL"}
          </button>

          <p className="text-xs text-center text-[#8B91A1]">
            Admin access is granted only to pre-authorized accounts.
          </p>
        </form>
      </section>
    </main>
  );
}
