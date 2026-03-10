"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "../hr.module.css";
import { candidateService } from "@/services/candidate.service";

const FILTERS = ["All", "Shortlisted", "Scheduled", "In Review"];

const statusMap: Record<string, string | undefined> = {
  All: undefined,
  Shortlisted: "SHORTLISTED",
  Scheduled: "SCHEDULED",
  "In Review": "APPLIED",
};

const AV_CLASSES = ["cv1", "cv2", "cv3", "cv4", "cv5", "cv6"];

function getStatusChipCls(status: string): string {
  switch (status) {
    case "APPLIED": return "chipBlue";
    case "SHORTLISTED": return "chipGreen";
    case "SCHEDULED": return "chipViolet";
    case "INTERVIEWED": return "chipAmber";
    case "HIRED": return "chipGreen";
    case "REJECTED": return "chipRed";
    default: return "chipBlue";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "APPLIED": return "Applied";
    case "SHORTLISTED": return "Shortlisted";
    case "SCHEDULED": return "Scheduled";
    case "INTERVIEWED": return "Interviewed";
    case "HIRED": return "Hired";
    case "REJECTED": return "Rejected";
    default: return status;
  }
}

export default function CandidatesPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["candidates", activeFilter],
    queryFn: () =>
      candidateService.getAll(
        statusMap[activeFilter] ? { status: statusMap[activeFilter] } : undefined
      ),
  });

  const qc = useQueryClient();

  const shortlistMutation = useMutation({
    mutationFn: (id: string) => candidateService.updateStatus(id, "SHORTLISTED"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
  });

  const analyzeMutation = useMutation({
    mutationFn: (id: string) => candidateService.analyze(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
  });

  const filtered = candidates.filter((c) =>
    c.user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Candidates</h1>
        <p className={styles.pageSub}>Click a candidate name to view details or leave interview feedback.</p>
      </div>

      <div className={styles.tableToolbar}>
        <div className={styles.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              className={activeFilter === f ? styles.filterBtnActive : styles.filterBtn}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <button className={styles.addBtn}>+ Add Candidate</button>
      </div>

      <div className={styles.card}>
        {isLoading ? (
          <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Role</th>
                  <th>Skills</th>
                  <th>Match</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <p style={{ color: "var(--text-lite)", fontSize: 14 }}>No data yet.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, idx) => {
                    const avCls = AV_CLASSES[idx % AV_CLASSES.length];
                    const matchScore = c.aiProfile?.matchScore ?? 0;
                    const skills = [...(c.aiProfile?.extractedSkills || [])].slice(0, 3);
                    const chipCls = getStatusChipCls(c.status);
                    const statusLabel = getStatusLabel(c.status);
                    const role = c.assignedRequirement?.title || "General Applicant";
                    const initial = c.user.name.charAt(0).toUpperCase();

                    return (
                      <tr key={c.id}>
                        <td>
                          <div className={styles.candCell}>
                            <div className={`${styles.cav} ${styles[avCls as keyof typeof styles]}`}>
                              {initial}
                            </div>
                            <div>
                              <div className={styles.cname}>{c.user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className={styles.crole}>{role}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {skills.length === 0 ? (
                              <span style={{ fontSize: 12, color: "var(--text-lite)" }}>—</span>
                            ) : (
                              skills.map((s) => (
                                <span key={s} className={styles.skillPill}>{s}</span>
                              ))
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={styles.matchBarWrap}>
                            <div className={styles.matchBarFill} style={{ width: `${matchScore}%` }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-mid)", marginTop: 2, display: "block" }}>
                            {matchScore}%
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.chip} ${styles[chipCls as keyof typeof styles]}`}>
                            <span className={styles.chipDot} />
                            {statusLabel}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionWrap}>
                            {!c.aiProfile ? (
                              <button
                                className={styles.scheduleBtn}
                                onClick={() => analyzeMutation.mutate(c.id)}
                                disabled={analyzeMutation.isPending}
                              >
                                {analyzeMutation.isPending ? "Analyzing..." : "Analyze"}
                              </button>
                            ) : c.status === "APPLIED" ? (
                              <button
                                className={styles.scheduleBtn}
                                onClick={() => shortlistMutation.mutate(c.id)}
                                disabled={shortlistMutation.isPending}
                              >
                                {shortlistMutation.isPending ? "..." : "Shortlist"}
                              </button>
                            ) : (
                              <button className={styles.feedbackBtn}>Feedback</button>
                            )}
                            {c.resumeUrl && c.resumeUrl.startsWith("http") && (
                              <a
                                href={c.resumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.feedbackBtn}
                                style={{ textDecoration: "none" }}
                              >
                                Resume
                              </a>
                            )}
                            <button className={styles.ddToggle}>▾</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
