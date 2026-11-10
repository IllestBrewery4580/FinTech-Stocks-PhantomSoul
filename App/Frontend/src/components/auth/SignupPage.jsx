import { useState } from "react";

const API_URL = "http://localhost:5001";

export default function SignupPage({ onSignup, onSwitchToLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error || "Account creation failed."
                );
            }

            onSignup(result);
        } catch (err) {
            setError(
                err.message || "Unable to create account."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#050706",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                fontFamily: "monospace",
                position: "relative",
                overflow: "hidden",
                boxSizing: "border-box",
            }}
        >
            {/* Ambient terminal glow */}
            <div
                style={{
                    position: "absolute",
                    width: "500px",
                    height: "500px",
                    bottom: "-250px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background:
                        "radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)",
                    pointerEvents: "none",
                }}
            />

            <div
                style={{
                    width: "100%",
                    maxWidth: "430px",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* BRAND */}
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "28px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "0.75rem",
                            letterSpacing: "3px",
                            color: "#047857",
                            marginBottom: "10px",
                        }}
                    >
                        PHANTOM_SOUL // OS_v1.0
                    </div>

                    <h1
                        style={{
                            fontSize: "1.7rem",
                            margin: 0,
                            fontWeight: "bold",
                            letterSpacing: "1px",
                        }}
                    >
                        CREATE ACCESS
                    </h1>

                    <p
                        style={{
                            color: "#047857",
                            fontSize: "0.7rem",
                            marginTop: "8px",
                            letterSpacing: "1px",
                        }}
                    >
                        INITIALIZE INVESTMENT INTELLIGENCE PROFILE
                    </p>
                </div>

                {/* SIGNUP PANEL */}
                <div
                    style={{
                        backgroundColor: "#080d0a",
                        border: "1px solid #0f3822",
                        padding: "24px",
                        boxShadow:
                            "0 0 30px rgba(16,185,129,0.06)",
                    }}
                >
                    {/* PANEL HEADER */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            borderBottom: "1px solid #0f3822",
                            paddingBottom: "14px",
                            marginBottom: "20px",
                        }}
                    >
                        <div
                            style={{
                                width: "7px",
                                height: "7px",
                                backgroundColor: "#38BDF8",
                                boxShadow:
                                    "0 0 8px #38BDF8",
                            }}
                        />

                        <span
                            style={{
                                fontSize: "0.7rem",
                                color: "#047857",
                                letterSpacing: "1px",
                            }}
                        >
                            OPERATIVE REGISTRATION
                        </span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* EMAIL */}
                        <div style={{ marginBottom: "18px" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.65rem",
                                    color: "#047857",
                                    marginBottom: "7px",
                                    letterSpacing: "1px",
                                }}
                            >
                                OPERATOR EMAIL
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="operator@firm.com"
                                autoComplete="email"
                                required
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    backgroundColor: "#02180e",
                                    border: "1px solid #0f3822",
                                    color: "#10b981",
                                    padding: "11px",
                                    fontFamily: "monospace",
                                    fontSize: "0.75rem",
                                    outline: "none",
                                }}
                            />
                        </div>

                        {/* PASSWORD */}
                        <div style={{ marginBottom: "18px" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.65rem",
                                    color: "#047857",
                                    marginBottom: "7px",
                                    letterSpacing: "1px",
                                }}
                            >
                                ACCESS KEY
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="Minimum 8 characters"
                                autoComplete="new-password"
                                required
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    backgroundColor: "#02180e",
                                    border: "1px solid #0f3822",
                                    color: "#10b981",
                                    padding: "11px",
                                    fontFamily: "monospace",
                                    fontSize: "0.75rem",
                                    outline: "none",
                                }}
                            />
                        </div>

                        {/* CONFIRM PASSWORD */}
                        <div style={{ marginBottom: "18px" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.65rem",
                                    color: "#047857",
                                    marginBottom: "7px",
                                    letterSpacing: "1px",
                                }}
                            >
                                CONFIRM ACCESS KEY
                            </label>

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="Re-enter access key"
                                autoComplete="new-password"
                                required
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    backgroundColor: "#02180e",
                                    border: "1px solid #0f3822",
                                    color: "#10b981",
                                    padding: "11px",
                                    fontFamily: "monospace",
                                    fontSize: "0.75rem",
                                    outline: "none",
                                }}
                            />
                        </div>

                        {/* PASSWORD REQUIREMENT */}
                        <div
                            style={{
                                fontSize: "0.6rem",
                                color: "#047857",
                                marginBottom: "16px",
                            }}
                        >
                            SECURITY REQUIREMENT: MINIMUM 8 CHARACTERS
                        </div>

                        {/* ERROR */}
                        {error && (
                            <div
                                style={{
                                    border: "1px solid #7f1d1d",
                                    backgroundColor: "#1a0808",
                                    color: "#ef4444",
                                    padding: "10px",
                                    fontSize: "0.7rem",
                                    marginBottom: "16px",
                                }}
                            >
                                [REGISTRATION ERROR] {error}
                            </div>
                        )}

                        {/* CREATE ACCOUNT BUTTON */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "12px",
                                backgroundColor: loading
                                    ? "#047857"
                                    : "#10b981",
                                color: "#020604",
                                border: "1px solid #10b981",
                                fontFamily: "monospace",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                letterSpacing: "1px",
                                cursor: loading
                                    ? "not-allowed"
                                    : "pointer",
                                boxShadow: loading
                                    ? "none"
                                    : "0 0 15px rgba(16,185,129,0.12)",
                            }}
                        >
                            {loading
                                ? "INITIALIZING ACCOUNT..."
                                : "CREATE OPERATIVE ACCOUNT"}
                        </button>
                    </form>

                    {/* RETURN TO LOGIN */}
                    <div
                        style={{
                            borderTop: "1px solid #0f3822",
                            marginTop: "20px",
                            paddingTop: "18px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                color: "#047857",
                                fontSize: "0.65rem",
                                marginBottom: "10px",
                            }}
                        >
                            ALREADY AUTHORIZED?
                        </div>

                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            style={{
                                width: "100%",
                                padding: "11px",
                                backgroundColor: "transparent",
                                border: "1px solid #38BDF8",
                                color: "#38BDF8",
                                fontFamily: "monospace",
                                fontSize: "0.7rem",
                                fontWeight: "bold",
                                cursor: "pointer",
                                letterSpacing: "1px",
                                boxShadow:
                                    "0 0 10px rgba(56,189,248,0.06)",
                            }}
                        >
                            RETURN TO LOGIN →
                        </button>
                    </div>
                </div>

                {/* SYSTEM STATUS */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "14px",
                        fontSize: "0.6rem",
                        color: "#047857",
                    }}
                >
                    <span>SYSTEM: ONLINE</span>

                    <span style={{ color: "#34d399" }}>
                        REGISTRATION: OPEN
                    </span>
                </div>

                <div
                    style={{
                        textAlign: "center",
                        marginTop: "18px",
                        fontSize: "0.55rem",
                        color: "#047857",
                        letterSpacing: "1px",
                    }}
                >
                    CLIENT ACCESS // SECURE BY DESIGN
                </div>
            </div>
        </div>
    );
}
