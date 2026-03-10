"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";

// ── Forgot-password modal steps ────────────────────────────────────────
type ResetStep = "email" | "code" | "newpass" | "done";

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState<ResetStep>("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const inputSt: React.CSSProperties = {
        padding: "12px 16px",
        border: "1.5px solid var(--input-border)",
        borderRadius: "var(--r-sm)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 14,
        color: "var(--text)",
        background: "var(--input-bg)",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        marginTop: 6,
    };

    async function submitEmail(e: React.FormEvent) {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            await api.post("/api/auth/forgot-password", { email });
            setStep("code");
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setError(msg || "Something went wrong. Please try again.");
        } finally { setLoading(false); }
    }

    async function submitCode(e: React.FormEvent) {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const res = await api.post("/api/auth/verify-reset-code", { email, code });
            setResetToken(res.data.resetToken);
            setStep("newpass");
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setError(msg || "Invalid code. Please try again.");
        } finally { setLoading(false); }
    }

    async function submitNewPassword(e: React.FormEvent) {
        e.preventDefault();
        if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
        setError(""); setLoading(true);
        try {
            await api.post("/api/auth/reset-password", { resetToken, newPassword });
            setStep("done");
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setError(msg || "Failed to reset password.");
        } finally { setLoading(false); }
    }

    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 2000,
                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "var(--glass-b)", border: "1px solid var(--card-border)",
                    borderRadius: "var(--r-lg)", padding: "40px 36px",
                    maxWidth: 420, width: "100%",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>
                            {step === "email" && "Reset Password"}
                            {step === "code" && "Enter Verification Code"}
                            {step === "newpass" && "Set New Password"}
                            {step === "done" && "Password Reset!"}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 4 }}>
                            {step === "email" && "We'll send a 6-digit code to your email"}
                            {step === "code" && `Code sent to ${email}`}
                            {step === "newpass" && "Choose a strong new password"}
                            {step === "done" && "You can now sign in with your new password"}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-lite)", lineHeight: 1, flexShrink: 0 }}
                    >✕</button>
                </div>

                {/* Step indicators */}
                {step !== "done" && (
                    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
                        {(["email", "code", "newpass"] as ResetStep[]).map((s, i) => {
                            const steps: ResetStep[] = ["email", "code", "newpass"];
                            const current = steps.indexOf(step);
                            const isDone = i < current;
                            const isActive = i === current;
                            return (
                                <div key={s} style={{
                                    flex: 1, height: 4, borderRadius: 4,
                                    background: isDone ? "var(--violet)" : isActive ? "rgba(108,71,255,0.5)" : "var(--card-border)",
                                    transition: "background 0.3s",
                                }} />
                            );
                        })}
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: "10px 14px", borderRadius: 10, marginBottom: 18,
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                        color: "#ef4444", fontSize: 13,
                    }}>{error}</div>
                )}

                {/* STEP 1: Email */}
                {step === "email" && (
                    <form onSubmit={submitEmail} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                            Email Address
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                style={inputSt}
                                required
                                autoFocus
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: "13px", background: "linear-gradient(135deg,var(--violet),var(--violet-mid))",
                                color: "#fff", border: "none", borderRadius: "var(--r-sm)",
                                fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 700,
                                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? "Sending…" : "Send Code →"}
                        </button>
                    </form>
                )}

                {/* STEP 2: Code */}
                {step === "code" && (
                    <form onSubmit={submitCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                            6-Digit Code
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="123456"
                                style={{ ...inputSt, fontSize: 24, fontWeight: 800, letterSpacing: 8, textAlign: "center" }}
                                maxLength={6}
                                required
                                autoFocus
                            />
                        </label>
                        <div style={{ fontSize: 12, color: "var(--text-lite)", textAlign: "center" }}>
                            Didn&apos;t receive it?{" "}
                            <button
                                type="button"
                                onClick={() => { setStep("email"); setCode(""); setError(""); }}
                                style={{ background: "none", border: "none", color: "var(--violet)", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                            >
                                Resend
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || code.length < 6}
                            style={{
                                padding: "13px", background: "linear-gradient(135deg,var(--violet),var(--violet-mid))",
                                color: "#fff", border: "none", borderRadius: "var(--r-sm)",
                                fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 700,
                                cursor: (loading || code.length < 6) ? "not-allowed" : "pointer",
                                opacity: (loading || code.length < 6) ? 0.7 : 1,
                            }}
                        >
                            {loading ? "Verifying…" : "Verify Code →"}
                        </button>
                    </form>
                )}

                {/* STEP 3: New password */}
                {step === "newpass" && (
                    <form onSubmit={submitNewPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                            New Password
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                style={inputSt}
                                required
                                minLength={8}
                                autoFocus
                            />
                        </label>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                            Confirm Password
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                style={inputSt}
                                required
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={loading || newPassword.length < 8}
                            style={{
                                padding: "13px", background: "linear-gradient(135deg,var(--violet),var(--violet-mid))",
                                color: "#fff", border: "none", borderRadius: "var(--r-sm)",
                                fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 700,
                                cursor: (loading || newPassword.length < 8) ? "not-allowed" : "pointer",
                                opacity: (loading || newPassword.length < 8) ? 0.7 : 1,
                            }}
                        >
                            {loading ? "Saving…" : "Set New Password →"}
                        </button>
                    </form>
                )}

                {/* STEP 4: Done */}
                {step === "done" && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
                        <div style={{ fontSize: 15, color: "var(--text-mid)", marginBottom: 24, lineHeight: 1.6 }}>
                            Your password has been updated successfully.
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                padding: "13px 32px", background: "linear-gradient(135deg,var(--violet),var(--violet-mid))",
                                color: "#fff", border: "none", borderRadius: "var(--r-sm)",
                                fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 700,
                                cursor: "pointer", width: "100%",
                            }}
                        >
                            Back to Sign In
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main login page ─────────────────────────────────────────────────────
export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showReset, setShowReset] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await authService.login(email, password);
            setAuth(data.user, data.token);

            switch (data.user.role) {
                case "HR": router.push("/hr"); break;
                case "INTERVIEWER": router.push("/interviewer"); break;
                case "CANDIDATE": router.push("/candidate"); break;
                default: router.push("/");
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setError(msg || "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrap}>
            {showReset && <ForgotPasswordModal onClose={() => setShowReset(false)} />}

            <div className={styles.card}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>✦</div>
                    <span className={styles.logoText}>HireOn</span>
                </div>

                <h1 className={styles.title}>Welcome back</h1>
                <p className={styles.sub}>Sign in to your HireOn hiring dashboard</p>

                {error && (
                    <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", marginBottom: "12px" }}>
                        {error}
                    </p>
                )}

                <form onSubmit={handleLogin} className={styles.form}>
                    <label className={styles.label}>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            className={styles.input}
                            required
                        />
                    </label>

                    <label className={styles.label}>
                        Password
                        <div className={styles.passRow}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className={styles.input}
                                required
                            />
                        </div>
                    </label>

                    <div className={styles.extras}>
                        <label className={styles.check}>
                            <input type="checkbox" /> Remember me
                        </label>
                        <button
                            type="button"
                            className={styles.forgot}
                            onClick={() => setShowReset(true)}
                            style={{ background: "none", border: "none", cursor: "pointer" }}
                        >
                            Forgot password?
                        </button>
                    </div>

                    <button type="submit" className={styles.btn} disabled={loading}>
                        {loading ? "Signing in..." : "Sign In →"}
                    </button>
                </form>

                <p className={styles.foot}>
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className={styles.link}>Create one →</Link>
                </p>
            </div>
        </div>
    );
}
