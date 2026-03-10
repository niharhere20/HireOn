"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import styles from "../hr.module.css";
import { candidateService } from "@/services/candidate.service";

const FILTER_PILLS = ["All Time", "Q1 2026", "Q4 2025", "Q3 2025", "React", "Node.js", "Senior"];

const AV_CLASSES = ["cv1", "cv2", "cv3", "cv4", "cv5", "cv6"];

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

export default function TalentDatabasePage() {
  const [activeFilter, setActiveFilter] = useState("All Time");
  const [search, setSearch] = useState("");

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["candidates"],
    queryFn: () => candidateService.getAll(),
  });

  const filtered = candidates.filter(c =>
    search === "" ||
    c.user.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.aiProfile?.extractedSkills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const kpiCards = [
    {
      val: String(candidates.length),
      label: "Candidates Stored",
      badge: "All time",
      badgeCls: "ctag",
    },
    {
      val: String(candidates.filter(c => c.status === "HIRED").length),
      label: "Hired",
      badge: "All time",
      badgeCls: "ctagGreen",
    },
    {
      val: String(candidates.filter(c => c.aiProfile).length),
      label: "AI Analyzed",
      badge: "Profiles",
      badgeCls: "ctag",
    },
  ];

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Talent Database</h1>
        <p className={styles.pageSub}>All candidates ever assessed — searchable and re-matchable forever.</p>
      </div>

      {/* Search bar */}
      <div className={styles.dbSearchRow}>
        <div className={styles.searchBox} style={{ flex: 1 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by skill, role, experience, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className={styles.addBtn}>Search Talent DB</button>
      </div>

      {/* Filter pills */}
      <div className={styles.dbFilterPills}>
        {FILTER_PILLS.map((f) => (
          <button
            key={f}
            className={activeFilter === f ? styles.filterBtnActive : styles.filterBtn}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className={styles.dbKpiGrid}>
        {kpiCards.map((k) => (
          <div key={k.label} className={`${styles.card} ${styles.dbKpi}`}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <span className={`${styles[k.badgeCls as keyof typeof styles]}`}>{k.badge}</span>
            </div>
            <div className={styles.kpiVal}>{k.val}</div>
            <div className={styles.kpiLbl}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Match list heading */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
          Candidate Database
        </span>
        <span className={styles.ctagGreen}>{filtered.length} found</span>
      </div>

      {/* Match rows */}
      {isLoading ? (
        <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--text-lite)", fontSize: 14 }}>No data yet.</p>
      ) : (
        <div className={styles.dbMatchList}>
          {filtered.map((c, idx) => {
            const avCls = AV_CLASSES[idx % AV_CLASSES.length];
            const initial = c.user.name.charAt(0).toUpperCase();
            const skills = (c.aiProfile?.extractedSkills || []).slice(0, 3).join(" + ") || "No skills analyzed";
            const matchScore = c.aiProfile?.matchScore ?? null;
            const role = c.assignedRequirement?.title || "General Applicant";

            return (
              <div key={c.id} className={`${styles.card} ${styles.dbMatchItem}`}>
                <div className={`${styles.dbMatchAv} ${styles[avCls as keyof typeof styles]}`}>
                  {initial}
                </div>
                <div className={styles.dbMatchInfo}>
                  <div className={styles.dbMatchName}>{c.user.name}</div>
                  <div className={styles.dbMatchSub}>
                    {skills} &nbsp;·&nbsp; {role} &nbsp;·&nbsp;
                    Status: <strong>{getStatusLabel(c.status)}</strong>
                    {matchScore !== null && (
                      <> &nbsp;·&nbsp; Match: <strong style={{ color: "#10b981" }}>{matchScore}%</strong></>
                    )}
                  </div>
                </div>
                <button className={styles.reengageBtn}>Re-engage</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
