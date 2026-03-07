"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, TeamMember } from "@/services/auth.service";
import api from "@/lib/api";

export default function TeamPage() {
    const qc = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "INTERVIEWER" as "HR" | "INTERVIEWER" });
    const [formError, setFormError] = useState("");

    const { data: members = [], isLoading } = useQuery({
        queryKey: ["team"],
        queryFn: authService.getTeam,
    });

    const createMember = useMutation({
        mutationFn: () => authService.createMember(form.name, form.email, form.password, form.role),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["team"] });
            setShowModal(false);
            setForm({ name: "", email: "", password: "", role: "INTERVIEWER" });
            setFormError("");
        },
        onError: (err: any) => {
            setFormError(err?.response?.data?.error || "Failed to create member");
        },
    });

    const { data: googleStatus } = useQuery({
        queryKey: ["google-status"],
        queryFn: () => api.get<{ connected: boolean }>('/api/auth/google/status').then((r) => r.data),
    });

    const hrs = members.filter((m) => m.role === "HR");
    const interviewers = members.filter((m) => m.role === "INTERVIEWER");

    return (
        <div style={{ maxWidth: 900 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Team Management</h1>
                    <p style={{ color: "var(--text-mid, #5a4e7a)", marginTop: 4, fontSize: 14 }}>
                        Add HR managers and interviewers to your hiring team.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        padding: "10px 20px", background: "linear-gradient(135deg,#6c47ff,#ff6bc6)",
                        color: "#fff", border: "none", borderRadius: 10, fontWeight: 700,
                        fontSize: 14, cursor: "pointer",
                    }}
                >
                    + Add Member
                </button>
            </div>

            {/* Google Calendar Integration Banner */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", borderRadius: 12, marginBottom: 28,
                background: googleStatus?.connected
                    ? "rgba(16,185,129,.08)"
                    : "rgba(108,71,255,.06)",
                border: `1px solid ${googleStatus?.connected ? "rgba(16,185,129,.25)" : "rgba(108,71,255,.2)"}`,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>📅</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                            Google Calendar {googleStatus?.connected ? "Connected" : "Not Connected"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-mid)", marginTop: 2 }}>
                            {googleStatus?.connected
                                ? "Real Google Meet links will be created automatically when scheduling interviews."
                                : "Connect to generate real Google Meet links for scheduled interviews."}
                        </div>
                    </div>
                </div>
                {!googleStatus?.connected && (
                    <a
                        href="http://localhost:5000/api/auth/google"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                            background: "linear-gradient(135deg,#6c47ff,#a78bfa)",
                            color: "#fff", textDecoration: "none", whiteSpace: "nowrap",
                        }}
                    >
                        Connect Google
                    </a>
                )}
                {googleStatus?.connected && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#059669", padding: "6px 14px", background: "rgba(16,185,129,.12)", borderRadius: 8 }}>
                        Active
                    </span>
                )}
            </div>

            {isLoading ? (
                <p style={{ color: "var(--text-mid)" }}>Loading team...</p>
            ) : (
                <>
                    <MemberTable title="HR Managers" emoji="🧑‍💼" members={hrs} />
                    <MemberTable title="Interviewers" emoji="💬" members={interviewers} />
                </>
            )}

            {showModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999,
                }}>
                    <div style={{
                        background: "var(--modal-bg, #fff)", borderRadius: 16, padding: 32,
                        width: "100%", maxWidth: 440, boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Add Team Member</h2>
                            <button onClick={() => { setShowModal(false); setFormError(""); }}
                                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-mid)" }}>✕</button>
                        </div>

                        {formError && (
                            <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 14, background: "#fef2f2", padding: "8px 12px", borderRadius: 8 }}>
                                {formError}
                            </p>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <Field label="Full Name">
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Jane Smith" style={inputStyle} />
                            </Field>
                            <Field label="Email">
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="jane@company.com" style={inputStyle} />
                            </Field>
                            <Field label="Temporary Password">
                                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="Min 8 characters" minLength={8} style={inputStyle} />
                            </Field>
                            <Field label="Role">
                                <div style={{ display: "flex", gap: 10 }}>
                                    {(["HR", "INTERVIEWER"] as const).map((r) => (
                                        <button key={r} type="button"
                                            onClick={() => setForm({ ...form, role: r })}
                                            style={{
                                                flex: 1, padding: "10px 0", borderRadius: 10, fontWeight: 700, fontSize: 13,
                                                cursor: "pointer", border: "2px solid",
                                                borderColor: form.role === r ? "#6c47ff" : "rgba(108,71,255,0.2)",
                                                background: form.role === r ? "rgba(108,71,255,0.1)" : "transparent",
                                                color: form.role === r ? "#6c47ff" : "var(--text-mid)",
                                            }}
                                        >
                                            {r === "HR" ? "🧑‍💼 HR Manager" : "💬 Interviewer"}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                        </div>

                        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                            <button onClick={() => { setShowModal(false); setFormError(""); }}
                                style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(108,71,255,0.2)", background: "transparent", fontWeight: 600, cursor: "pointer", color: "var(--text-mid)" }}>
                                Cancel
                            </button>
                            <button
                                onClick={() => createMember.mutate()}
                                disabled={createMember.isPending || !form.name || !form.email || !form.password}
                                style={{
                                    flex: 2, padding: "11px 0", borderRadius: 10, border: "none",
                                    background: "linear-gradient(135deg,#6c47ff,#ff6bc6)", color: "#fff",
                                    fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: createMember.isPending ? 0.7 : 1,
                                }}
                            >
                                {createMember.isPending ? "Creating..." : "Create Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MemberTable({ title, emoji, members }: { title: string; emoji: string; members: TeamMember[] }) {
    return (
        <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "var(--text)" }}>
                {emoji} {title} <span style={{ fontWeight: 400, color: "var(--text-mid)", fontSize: 14 }}>({members.length})</span>
            </h2>
            <div style={{ background: "var(--kpi-bg)", border: "1px solid var(--table-border)", borderRadius: 12, overflow: "hidden" }}>
                {members.length === 0 ? (
                    <p style={{ padding: "20px 18px", color: "var(--text-mid)", fontSize: 14, margin: 0 }}>No {title.toLowerCase()} added yet.</p>
                ) : (
                    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
                        <thead>
                            <tr style={{ background: "var(--table-head, rgba(248,245,255,0.85))" }}>
                                {["Name", "Email", "Role", "Added"].map((h) => (
                                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--text-lite)", borderBottom: "1px solid var(--table-border, rgba(108,71,255,0.07))" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((m) => (
                                <tr key={m.id} style={{ borderBottom: "1px solid var(--table-border, rgba(108,71,255,0.07))" }}>
                                    <td style={{ padding: "13px 16px", fontWeight: 600, fontSize: 14 }}>{m.name}</td>
                                    <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--text-mid)" }}>{m.email}</td>
                                    <td style={{ padding: "13px 16px" }}>
                                        <span style={{
                                            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                            background: m.role === "HR" ? "rgba(108,71,255,0.1)" : "rgba(20,184,166,0.1)",
                                            color: m.role === "HR" ? "#6c47ff" : "#0d9488",
                                        }}>{m.role}</span>
                                    </td>
                                    <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--text-mid)" }}>
                                        {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
            {label}
            {children}
        </label>
    );
}

const inputStyle: React.CSSProperties = {
    padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(108,71,255,0.2)",
    background: "rgba(108,71,255,0.05)", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
};
