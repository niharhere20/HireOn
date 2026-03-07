"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../login/auth.module.css";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await authService.register(name, email, password, "CANDIDATE");
            setAuth(data.user, data.token);
            router.push("/candidate");
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setError(msg || "Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.card}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>✦</div>
                    <span className={styles.logoText}>HireOn</span>
                </div>

                <h1 className={styles.title}>Create your account</h1>
                <p className={styles.sub}>Apply to positions and track your hiring journey</p>

                {error && (
                    <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", marginBottom: "12px" }}>
                        {error}
                    </p>
                )}

                <form onSubmit={handleRegister} className={styles.form}>
                    <label className={styles.label}>
                        Full Name
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jane Doe"
                            className={styles.input}
                            required
                        />
                    </label>

                    <label className={styles.label}>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@email.com"
                            className={styles.input}
                            required
                        />
                    </label>

                    <label className={styles.label}>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 8 characters"
                            className={styles.input}
                            required
                            minLength={8}
                        />
                    </label>

                    <button type="submit" className={styles.btn} disabled={loading}>
                        {loading ? "Creating account..." : "Create Account →"}
                    </button>
                </form>

                <p className={styles.foot}>
                    Already have an account?{" "}
                    <Link href="/login" className={styles.link}>Sign in →</Link>
                </p>

                <p style={{ fontSize: "12px", color: "var(--text-lite, #9689bb)", textAlign: "center", marginTop: "16px" }}>
                    Are you HR or an Interviewer?{" "}
                    <span style={{ fontWeight: 600 }}>Contact your HR admin for access.</span>
                </p>
            </div>
        </div>
    );
}
