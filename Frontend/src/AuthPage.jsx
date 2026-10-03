import React, { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (!email.trim()) {
        setError("Please enter your email.");
        return;
      }

      if (!password) {
        setError("Please enter your password.");
        return;
      }

      // ==================================================
      // SIGN UP
      // ==================================================

      if (mode === "signup") {
        if (password.length < 12) {
          setError("Password must be at least 12 characters.");
          return;
        }

        const response = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            role: "client",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to create your account."
          );
        }

        setMessage(
          "Account created. Please verify your email before continuing."
        );

        setShowVerification(true);

        return;
      }

      // ==================================================
      // LOGIN
      // ==================================================

      const formData = new URLSearchParams();

      formData.append("username", email.trim().toLowerCase());
      formData.append("password", password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Invalid email or password."
        );
      }

      /*
       * IMPORTANT:
       *
       * This token is temporary for development.
       *
       * For production, we should move authentication to
       * secure HttpOnly cookies rather than localStorage.
       */

      sessionStorage.setItem(
        "phantomsoulAccessToken",
        data.access_token
      );

      // Get the authoritative user identity from the backend.
      const userResponse = await fetch(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      const user = await userResponse.json();

      if (!userResponse.ok) {
        sessionStorage.removeItem("phantomsoulAccessToken");

        throw new Error(
          "Unable to retrieve your account information."
        );
      }

      /*
       * The backend determines the user's role.
       *
       * We NEVER allow the frontend to decide:
       *
       * role = "admin"
       *
       * The server is authoritative.
       */

      if (onAuthenticated) {
        onAuthenticated(user);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    /*
     * Email verification should eventually happen through
     * the backend.
     *
     * DO NOT keep:
     *
     * if (verificationCode === "123456")
     *
     * in production.
     */

    if (!verificationCode.trim()) {
      setError("Enter your verification code.");
      return;
    }

    setError(
      "Email verification backend is not connected yet."
    );
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");

    setError("");
    setMessage("");
    setShowVerification(false);
    setVerificationCode("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        color: "#00FF66",
        padding: "24px",
        boxSizing: "border-box",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#000804",
          border: "1px solid #003311",
          padding: "36px",
          boxSizing: "border-box",
          boxShadow:
            "0 0 40px rgba(0, 255, 102, 0.08)",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "54px",
              height: "54px",
              border: "1px solid #00FF66",
              color: "#00FF66",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
              fontSize: "24px",
              fontWeight: "800",
              boxShadow:
                "0 0 15px rgba(0,255,102,0.2)",
            }}
          >
            P
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              letterSpacing: "0.16em",
            }}
          >
            PHANTOMSOUL
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "#33774D",
              fontSize: "11px",
              letterSpacing: "0.08em",
            }}
          >
            INVESTMENT INTELLIGENCE OPERATING SYSTEM
          </p>
        </div>

        {!showVerification ? (
          <>
            {/* MODE SWITCH */}

            <div
              style={{
                display: "flex",
                border: "1px solid #003311",
                marginBottom: "24px",
              }}
            >
              <button
                type="button"
                onClick={() => setMode("login")}
                style={{
                  flex: 1,
                  padding: "11px",
                  border: "none",
                  background:
                    mode === "login"
                      ? "#00FF66"
                      : "transparent",
                  color:
                    mode === "login"
                      ? "#000000"
                      : "#33774D",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                LOGIN
              </button>

              <button
                type="button"
                onClick={() => setMode("signup")}
                style={{
                  flex: 1,
                  padding: "11px",
                  border: "none",
                  background:
                    mode === "signup"
                      ? "#00FF66"
                      : "transparent",
                  color:
                    mode === "signup"
                      ? "#000000"
                      : "#33774D",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                SIGN UP
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* EMAIL */}

              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "#4CAF70",
                  fontSize: "10px",
                  letterSpacing: "0.15em",
                }}
              >
                EMAIL
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px",
                  border: "1px solid #003311",
                  background: "#000000",
                  color: "#00FF66",
                  outline: "none",
                  fontFamily: "inherit",
                  marginBottom: "18px",
                }}
              />

              {/* PASSWORD */}

              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "#4CAF70",
                  fontSize: "10px",
                  letterSpacing: "0.15em",
                }}
              >
                PASSWORD
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete={
                  mode === "signup"
                    ? "new-password"
                    : "current-password"
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px",
                  border: "1px solid #003311",
                  background: "#000000",
                  color: "#00FF66",
                  outline: "none",
                  fontFamily: "inherit",
                  marginBottom: "20px",
                }}
              />

              {/* ERROR */}

              {error && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "11px",
                    border: "1px solid #552200",
                    color: "#FF7744",
                    fontSize: "11px",
                  }}
                >
                  {error}
                </div>
              )}

              {/* MESSAGE */}

              {message && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "11px",
                    border: "1px solid #005522",
                    color: "#00FF66",
                    fontSize: "11px",
                  }}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #00FF66",
                  background: loading
                    ? "#003311"
                    : "#00FF66",
                  color: loading
                    ? "#33774D"
                    : "#000000",
                  fontFamily: "inherit",
                  fontWeight: "700",
                  letterSpacing: "0.1em",
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {loading
                  ? "AUTHENTICATING..."
                  : mode === "login"
                    ? "AUTHENTICATE"
                    : "CREATE ACCOUNT"}
              </button>
            </form>

            <div
              style={{
                textAlign: "center",
                marginTop: "22px",
                color: "#33774D",
                fontSize: "10px",
              }}
            >
              {mode === "login" ? (
                <>
                  NO ACCOUNT?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#00FF66",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    CREATE ONE
                  </button>
                </>
              ) : (
                <>
                  HAVE AN ACCOUNT?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#00FF66",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    LOGIN
                  </button>
                </>
              )}
            </div>

            {/* SECURITY NOTICE */}

            <div
              style={{
                marginTop: "30px",
                paddingTop: "18px",
                borderTop: "1px solid #00220C",
                color: "#33774D",
                fontSize: "9px",
                lineHeight: 1.6,
              }}
            >
              <strong
                style={{
                  color: "#00AA44",
                  letterSpacing: "0.12em",
                }}
              >
                SECURITY BOUNDARY
              </strong>

              <p>
                Client accounts are isolated from internal
                research, employee records, compliance
                systems, and administrative functions.
              </p>
            </div>
          </>
        ) : (
          /* EMAIL VERIFICATION */

          <form onSubmit={handleVerification}>
            <div
              style={{
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  margin: "0 0 10px",
                  fontSize: "20px",
                }}
              >
                VERIFY IDENTITY
              </h2>

              <p
                style={{
                  color: "#33774D",
                  fontSize: "11px",
                  lineHeight: 1.6,
                }}
              >
                Enter the verification code sent to{" "}
                <strong style={{ color: "#00FF66" }}>
                  {email}
                </strong>
              </p>
            </div>

            <input
              type="text"
              value={verificationCode}
              onChange={(event) =>
                setVerificationCode(event.target.value)
              }
              placeholder="6-DIGIT CODE"
              maxLength={6}
              inputMode="numeric"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                border: "1px solid #003311",
                background: "#000000",
                color: "#00FF66",
                textAlign: "center",
                letterSpacing: "6px",
                fontFamily: "inherit",
                outline: "none",
                marginBottom: "16px",
              }}
            />

            {error && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "11px",
                  border: "1px solid #552200",
                  color: "#FF7744",
                  fontSize: "11px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px",
                border: "1px solid #00FF66",
                background: "#00FF66",
                color: "#000000",
                fontFamily: "inherit",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              VERIFY
            </button>

            <button
              type="button"
              onClick={() => {
                setShowVerification(false);
                setVerificationCode("");
                setError("");
                setMessage("");
              }}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "12px",
                border: "1px solid #003311",
                background: "transparent",
                color: "#33774D",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              BACK
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
