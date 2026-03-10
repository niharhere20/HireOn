"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "../hr.module.css";
import { authService } from "@/services/auth.service";
import api from "@/lib/api";

export default function SettingsPage() {
    const qc = useQueryClient();

    // Team Members
    const { data: team = [], isLoading: teamLoading } = useQuery({
        queryKey: ["team"],
        queryFn: () => authService.getTeam(),
    });

    // Google Calendar status
    const { data: googleStatus } = useQuery({
        queryKey: ["google-status"],
        queryFn: () => api.get<{ connected: boolean }>("/api/auth/google/status").then((r) => r.data),
    });

    // Add Member form state
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "INTERVIEWER" as "HR" | "INTERVIEWER" });
    const [addMsg, setAddMsg] = useState("");
    const [addErr, setAddErr] = useState("");

    const addMember = useMutation({
        mutationFn: () => authService.createMember(form.name, form.email, form.password, form.role),
        onSuccess: () => {
            setAddMsg(`${form.role === "HR" ? "HR Manager" : "Interviewer"} "${form.name}" added!`);
            setAddErr("");
            setForm({ name: "", email: "", password: "", role: "INTERVIEWER" });
            qc.invalidateQueries({ queryKey: ["team"] });
            setTimeout(() => setAddMsg(""), 4000);
        },
        onError: (err: any) => {
            setAddErr(err?.response?.data?.error || "Failed to add member.");
        },
    });

    function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setAddErr("");
        if (!form.name || !form.email || !form.password) {
            setAddErr("All fields are required.");
            return;
        }
        if (form.password.length < 8) {
            setAddErr("Password must be at least 8 characters.");
            return;
        }
        addMember.mutate();
    }

    const hrs = team.filter((m) => m.role === "HR");
    const interviewers = team.filter((m) => m.role === "INTERVIEWER");

    const AV_COLORS = ["#7c3aed", "#ec4899", "#059669", "#d97706", "#4f46e5", "#9333ea"];

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Settings</h1>
                <p className={styles.pageSub}>Manage your team, access, and integrations.</p>
            </div>

            <div className={styles.grid2}>
                {/* Left: Team management */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Add Member */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>➕ Add Team Member</div>
                        <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Full Name</label>
                                <input
                                    className={styles.formInput}
                                    placeholder="e.g. Priya Sharma"
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email</label>
                                <input
                                    className={styles.formInput}
                                    type="email"
                                    placeholder="priya@company.com"
                                    value={form.email}
                                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Temporary Password</label>
                                <input
                                    className={styles.formInput}
                                    type="password"
                                    placeholder="Min. 8 characters"
                                    value={form.password}
                                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Role</label>
                                <div style={{ display: "flex", gap: 10 }}>
                                    {(["INTERVIEWER", "HR"] as const).map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, role: r }))}
                                            style={{
                                                flex: 1,
                                                padding: "9px 0",
                                                borderRadius: 10,
                                                fontWeight: 700,
                                                fontSize: 12,
                                                cursor: "pointer",
                                                border: form.role === r
                                                    ? "2px solid var(--violet)"
                                                    : "1px solid var(--card-border)",
                                                background: form.role === r
                                                    ? "rgba(108,71,255,0.10)"
                                                    : "var(--kpi-bg)",
                                                color: form.role === r ? "var(--violet)" : "var(--text-mid)",
                                                transition: "all 0.15s",
                                            }}
                                        >
                                            {r === "INTERVIEWER" ? "🎙 Interviewer" : "👔 HR Manager"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {addMsg && (
                                <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>
                                    ✅ {addMsg}
                                </div>
                            )}
                            {addErr && (
                                <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
                                    ⚠️ {addErr}
                                </div>
                            )}

                            <button
                                type="submit"
                                className={styles.addBtn}
                                style={{ justifyContent: "center", marginTop: 4 }}
                                disabled={addMember.isPending}
                            >
                                {addMember.isPending ? "Adding…" : "Add Member"}
                            </button>
                        </form>
                    </div>

                    {/* Google Calendar */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>📅 Google Calendar Integration</div>
                        <div style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.7, marginBottom: 16 }}>
                            Connect Google Calendar to automatically generate real Google Meet links
                            when interviews are scheduled.
                        </div>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "14px 16px", borderRadius: 12,
                            background: googleStatus?.connected
                                ? "rgba(16,185,129,0.06)"
                                : "rgba(108,71,255,0.05)",
                            border: `1px solid ${googleStatus?.connected ? "rgba(16,185,129,0.2)" : "rgba(108,71,255,0.15)"}`,
                            marginBottom: 16,
                        }}>
                            <span style={{ fontSize: 22 }}>
                                {googleStatus?.connected ? "✅" : "📵"}
                            </span>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                                    {googleStatus?.connected ? "Google Calendar Connected" : "Not Connected"}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-lite)", marginTop: 2 }}>
                                    {googleStatus?.connected
                                        ? "Real Meet links will be generated for all interviews."
                                        : "Connect to enable real Google Meet links."}
                                </div>
                            </div>
                        </div>
                        {!googleStatus?.connected && (
                            <a
                                href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/google`}
                                className={styles.addBtn}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 8,
                                    textDecoration: "none", justifyContent: "center", width: "100%",
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Connect Google Calendar
                            </a>
                        )}
                        {googleStatus?.connected && (
                            <div style={{ fontSize: 12, color: "var(--text-lite)", textAlign: "center" }}>
                                To disconnect, revoke access in your Google Account settings.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Current team */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* HR Managers */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>
                            👔 HR Managers
                            <span style={{
                                fontSize: 11, fontWeight: 700, padding: "2px 8px",
                                borderRadius: 20, background: "rgba(108,71,255,0.1)", color: "var(--violet)",
                            }}>{hrs.length}</span>
                        </div>
                        {teamLoading ? (
                            <p style={{ fontSize: 13, color: "var(--text-lite)" }}>Loading…</p>
                        ) : hrs.length === 0 ? (
                            <p style={{ fontSize: 13, color: "var(--text-lite)" }}>No HR managers yet.</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {hrs.map((m, idx) => (
                                    <div key={m.id} style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "12px 14px", borderRadius: 12,
                                        background: "var(--kpi-bg)", border: "1px solid var(--card-border)",
                                    }}>
                                        <div style={{
                                            width: 38, height: 38, borderRadius: "50%",
                                            background: AV_COLORS[idx % AV_COLORS.length],
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0,
                                        }}>
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{m.name}</div>
                                            <div style={{ fontSize: 11, color: "var(--text-lite)", marginTop: 1 }}>{m.email}</div>
                                        </div>
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, padding: "2px 8px",
                                            borderRadius: 20, background: "rgba(108,71,255,0.1)", color: "var(--violet)",
                                        }}>HR</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Interviewers */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>
                            🎙 Interviewers
                            <span style={{
                                fontSize: 11, fontWeight: 700, padding: "2px 8px",
                                borderRadius: 20, background: "rgba(0,212,200,0.12)", color: "var(--teal)",
                            }}>{interviewers.length}</span>
                        </div>
                        {teamLoading ? (
                            <p style={{ fontSize: 13, color: "var(--text-lite)" }}>Loading…</p>
                        ) : interviewers.length === 0 ? (
                            <p style={{ fontSize: 13, color: "var(--text-lite)" }}>No interviewers yet. Add one using the form.</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {interviewers.map((m, idx) => (
                                    <div key={m.id} style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "12px 14px", borderRadius: 12,
                                        background: "var(--kpi-bg)", border: "1px solid var(--card-border)",
                                    }}>
                                        <div style={{
                                            width: 38, height: 38, borderRadius: "50%",
                                            background: AV_COLORS[(idx + 2) % AV_COLORS.length],
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0,
                                        }}>
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{m.name}</div>
                                            <div style={{ fontSize: 11, color: "var(--text-lite)", marginTop: 1 }}>{m.email}</div>
                                        </div>
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, padding: "2px 8px",
                                            borderRadius: 20, background: "rgba(0,212,200,0.12)", color: "var(--teal)",
                                        }}>INTERVIEWER</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
