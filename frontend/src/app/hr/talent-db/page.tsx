"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate.service";
import styles from "../hr.module.css";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
    APPLIED: { label: "Applied", cls: "st-new" },
    SHORTLISTED: { label: "Shortlisted", cls: "st-short" },
    SCHEDULED: { label: "Scheduled", cls: "st-sched" },
    INTERVIEWED: { label: "Interviewed", cls: "st-sched" },
    HIRED: { label: "Hired", cls: "st-short" },
    REJECTED: { label: "Rejected", cls: "st-review" },
};

const AVATAR_COLORS = [
    "linear-gradient(135deg,#ddd6fe,#a78bfa)",
    "linear-gradient(135deg,#fce7f3,#f9a8d4)",
    "linear-gradient(135deg,#d1fae5,#6ee7b7)",
    "linear-gradient(135deg,#fef3c7,#fde68a)",
    "linear-gradient(135deg,#e0e7ff,#a5b4fc)",
];

export default function TalentDatabasePage() {
    const [search, setSearch] = useState("");
    const [skillFilter, setSkillFilter] = useState("");
    const [minScore, setMinScore] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");

    const { data: candidates = [], isLoading } = useQuery({
        queryKey: ["candidates"],
        queryFn: () => candidateService.getAll(),
    });

    // Collect all unique skills
    const allSkills = Array.from(new Set(
        candidates.flatMap((c) => (c.aiProfile?.extractedSkills ?? []) as string[])
    )).sort();

    const filtered = candidates.filter((c) => {
        const name = c.user.name.toLowerCase();
        const email = c.user.email.toLowerCase();
        const q = search.toLowerCase();
        if (q && !name.includes(q) && !email.includes(q)) return false;
        if (statusFilter && c.status !== statusFilter) return false;
        if (minScore > 0 && (c.aiProfile?.matchScore ?? 0) < minScore) return false;
        if (skillFilter && !(c.aiProfile?.extractedSkills as string[] ?? []).includes(skillFilter)) return false;
        return true;
    });

    const analyzed = filtered.filter((c) => c.aiProfile);

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Talent Database</h1>
                    <p className={styles.pageSub}>Search and re-match all historical candidates</p>
                </div>
                <div className={styles.headerActions}>
                    <span className="ctag">{filtered.length} candidates</span>
                </div>
            </div>

            {/* Filters */}
            <div style={{
                display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap",
                padding: "16px 18px",
                background: "var(--kpi-bg, #fff)",
                border: "1px solid var(--table-border)",
                borderRadius: 12,
            }}>
                <input
                    type="text"
                    placeholder="Search name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: 1, minWidth: 180, padding: "9px 14px",
                        borderRadius: 10, border: "1px solid rgba(108,71,255,.15)",
                        fontSize: 13, outline: "none", background: "var(--input-bg)",
                        color: "var(--text)",
                    }}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        padding: "9px 14px", borderRadius: 10,
                        border: "1px solid rgba(108,71,255,.15)", fontSize: 13,
                        background: "var(--input-bg)", color: "var(--text)", cursor: "pointer",
                    }}
                >
                    <option value="">All Statuses</option>
                    {Object.keys(STATUS_LABELS).map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s].label}</option>
                    ))}
                </select>
                <select
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                    style={{
                        padding: "9px 14px", borderRadius: 10,
                        border: "1px solid rgba(108,71,255,.15)", fontSize: 13,
                        background: "var(--input-bg)", color: "var(--text)", cursor: "pointer",
                    }}
                >
                    <option value="">All Skills</option>
                    {allSkills.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mid)", whiteSpace: "nowrap" }}>
                        Min Score: {minScore}%
                    </span>
                    <input
                        type="range" min={0} max={100} step={10}
                        value={minScore}
                        onChange={(e) => setMinScore(Number(e.target.value))}
                        style={{ width: 80, accentColor: "#6c47ff" }}
                    />
                </div>
                {(search || statusFilter || skillFilter || minScore > 0) && (
                    <button
                        onClick={() => { setSearch(""); setStatusFilter(""); setSkillFilter(""); setMinScore(0); }}
                        style={{
                            padding: "9px 14px", borderRadius: 10, fontSize: 12,
                            border: "1px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.06)",
                            color: "#ef4444", cursor: "pointer", fontWeight: 600,
                        }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Summary bar */}
            {analyzed.length > 0 && (
                <div style={{
                    display: "flex", gap: 16, marginBottom: 16,
                    padding: "10px 16px",
                    background: "rgba(108,71,255,0.05)",
                    borderRadius: 10, fontSize: 12, color: "var(--text-mid)",
                }}>
                    <span>
                        <strong style={{ color: "var(--violet)" }}>{analyzed.length}</strong> analyzed
                    </span>
                    <span>
                        Avg match: <strong style={{ color: "var(--violet)" }}>
                            {Math.round(analyzed.reduce((s, c) => s + (c.aiProfile?.matchScore ?? 0), 0) / analyzed.length)}%
                        </strong>
                    </span>
                    <span>
                        High quality (80%+): <strong style={{ color: "#10b981" }}>
                            {analyzed.filter((c) => (c.aiProfile?.matchScore ?? 0) >= 80).length}
                        </strong>
                    </span>
                </div>
            )}

            <div className={styles.card}>
                {isLoading ? (
                    <p style={{ color: "var(--text-lite)", fontSize: 14, padding: "20px 0" }}>Loading talent database...</p>
                ) : filtered.length === 0 ? (
                    <p style={{ color: "var(--text-lite)", fontSize: 14, padding: "20px 0" }}>No candidates match your filters.</p>
                ) : (
                    <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Candidate</th>
                                <th>AI Score</th>
                                <th>Skills</th>
                                <th>Experience</th>
                                <th>Requirement</th>
                                <th>Status</th>
                                <th>Applied</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c, idx) => {
                                const st = STATUS_LABELS[c.status] ?? { label: c.status, cls: "st-new" };
                                return (
                                    <tr key={c.id}>
                                        <td>
                                            <div className={styles.cCell}>
                                                <div className={styles.cAv} style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                                                    {c.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className={styles.cName}>{c.user.name}</div>
                                                    <div className={styles.cExp}>{c.user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {c.aiProfile ? (
                                                <div className={styles.scoreCell}>
                                                    <div className="match-bar-wrap">
                                                        <div className="match-bar-fill" style={{ width: `${c.aiProfile.matchScore}%` }} />
                                                    </div>
                                                    <span className={`${styles.scoreNum} ${c.aiProfile.matchScore >= 80 ? "sc-hi" : c.aiProfile.matchScore >= 60 ? "sc-md" : "sc-lo"}`}>
                                                        {c.aiProfile.matchScore}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 12, color: "var(--text-lite)" }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            {(c.aiProfile?.extractedSkills as string[] ?? []).slice(0, 3).map((s) => (
                                                <span className="skill-pill" key={s}>{s}</span>
                                            ))}
                                        </td>
                                        <td style={{ fontSize: 13, color: "var(--text-mid)" }}>
                                            {c.aiProfile ? `${c.aiProfile.experienceYears}y` : "—"}
                                        </td>
                                        <td style={{ fontSize: 13, color: "var(--text-mid)" }}>
                                            {c.assignedRequirement?.title ?? "—"}
                                        </td>
                                        <td>
                                            <span className={`status-chip ${st.cls}`}>
                                                <span className="st-dot" />{st.label}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: "var(--text-lite)" }}>
                                            {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>
        </div>
    );
}
