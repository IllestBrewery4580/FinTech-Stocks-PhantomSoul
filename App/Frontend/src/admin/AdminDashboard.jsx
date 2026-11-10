import { useEffect, useState } from "react";

const API_URL = "http://localhost:5001";

export default function AdminDashboard({ admin, onLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccounts() {
      try {
        const token = sessionStorage.getItem("phantomSoulAdminToken");

        if (!token) {
          throw new Error("Admin session not found. Please sign in again.");
        }

        const response = await fetch(`${API_URL}/api/admin/accounts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const result = await response.json();

        if (response.status === 401 || response.status === 403) {
          throw new Error("Admin session expired or access denied.");
        }

        if (!response.ok) {
          throw new Error(result.error || "Unable to load accounts.");
        }

        setAccounts(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load admin dashboard.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadAccounts();

    return () => controller.abort();
  }, []);

  function handleLogout() {
    sessionStorage.removeItem("phantomSoulAdminToken");
    sessionStorage.removeItem("PHANTOM_SOUL_ADMIN");
    onLogout?.();
  }

  return (
    <main className="min-h-screen bg-[#08090D] text-[#E7E9EF]">
      {/* Admin identity header */}
      <header className="border-b border-[#393044] bg-[#0D0B13] px-6 py-5 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Shield icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-400/40 bg-purple-500/10">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-7 w-7 text-purple-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9 12 2 2 4-4"
                />
              </svg>
            </div>

            <div>
              <p className="text-xs tracking-[0.3em] text-purple-300">
                PHANTOM_SOUL // ADMIN_OS
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold">
                  Admin Control Center
                </h1>

                <span className="rounded-md border border-purple-400/40 bg-purple-500/15 px-2.5 py-1 text-xs font-bold tracking-widest text-purple-200">
                  ADMIN
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Session status indicator */}
            <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">
                  ADMIN SESSION
                </span>
              </div>

              <p className="mt-1 text-xs text-[#A7A2B2]">
                Signed in as {admin?.email || "Administrator"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-[#393D49] px-4 py-2 text-sm transition hover:border-red-400 hover:text-red-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Account management */}
      <section className="p-6 md:p-10">
        <div className="mb-8">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <span className="text-purple-300">01 //</span>
            Account Management
          </h2>

          <p className="mt-2 text-sm text-[#8B91A1]">
            Review registered accounts and their assigned roles.
          </p>
        </div>

        {loading && (
          <p className="text-sm text-[#8B91A1]">
            Loading accounts...
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-400/30 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-xl border border-[#252936]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0F1118] text-[#8B91A1]">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account._id || account.id}
                    className="border-t border-[#252936]"
                  >
                    <td className="px-5 py-4">
                      {account.name || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {account.email}
                    </td>

                    <td className="px-5 py-4">
                      {account.role}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          account.isActive === false
                            ? "text-red-300"
                            : "text-emerald-300"
                        }
                      >
                        {account.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}

                {accounts.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-[#8B91A1]"
                    >
                      No accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
