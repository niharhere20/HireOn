"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
                        <a href="#" className={styles.forgot}>Forgot password?</a>
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
