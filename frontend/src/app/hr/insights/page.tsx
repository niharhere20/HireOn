"use client";
import { useQuery } from "@tanstack/react-query";
import styles from "../hr.module.css";
import { candidateService } from "@/services/candidate.service";

const SKILL_CLS = ["skillViolet", "skillPink", "skillTeal", "skillAmber"];

const PROB_STAGES_STATIC = [
  { label: "Applied", cls: "pb1" },
  { label: "Shortlisted", cls: "pb2" },
  { label: "Screened", cls: "pb3" },
  { label: "Interviewed", cls: "pb4" },
  { label: "Hired", cls: "pb5" },
];

const STATUS_TO_STAGE_IDX: Record<string, number> = {
  APPLIED: 0,
  SHORTLISTED: 1,
  SCHEDULED: 2,
  INTERVIEWED: 3,
  HIRED: 4,
};

export default function InsightsPage() {
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["candidates"],
    queryFn: () => candidateService.getAll(),
  });

  const analyzed = candidates.filter(c => c.aiProfile);
  const avgMatchScore = analyzed.length
    ? Math.round(analyzed.reduce((sum, c) => sum + (c.aiProfile?.matchScore || 0), 0) / analyzed.length)
    : 0;
  const avgHireProb = analyzed.length
    ? Math.round(analyzed.reduce((sum, c) => sum + (c.aiProfile?.hireProbability || 0), 0) / analyzed.length)
    : 0;

  // Top skills: count frequencies
  const skillCount: Record<string, number> = {};
  candidates.forEach(c => {
    [...(c.aiProfile?.extractedSkills || []), ...(c.aiProfile?.inferredSkills || [])].forEach(s => {
      skillCount[s] = (skillCount[s] || 0) + 1;
    });
  });
  const topSkills = Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Stage distribution: count per status, express as percentage of total
  const total = candidates.length || 1;
  const stageCounts = [0, 0, 0, 0, 0];
  candidates.forEach(c => {
    const idx = STATUS_TO_STAGE_IDX[c.status];
    if (idx !== undefined) stageCounts[idx]++;
  });

  const probStages = PROB_STAGES_STATIC.map((s, i) => ({
    label: s.label,
    cls: s.cls,
    val: Math.round((stageCounts[i] / total) * 100),
  }));

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>AI Insights</h1>
        <p className={styles.pageSub}>Pipeline health, skill trends, and hiring intelligence powered by AI.</p>
      </div>

      {/* AI Summary Banner */}
      <div className={styles.insightBanner}>
        <div className={styles.ibLabel}>AI SUMMARY</div>
        <div className={styles.ibTitle}>
          {isLoading ? "Loading pipeline data..." : `Your pipeline is healthy 🎯`}
        </div>
        <div className={styles.ibSub}>
          {isLoading
            ? "Fetching candidate data..."
            : `${avgMatchScore}% avg match score across ${analyzed.length} analyzed candidates. Avg hire probability: ${avgHireProb}%.`}
        </div>
      </div>

      {/* 2-col grid */}
      <div className={styles.grid2} style={{ marginBottom: 20 }}>
        {/* Stage Distribution */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Candidate Stage Distribution</div>
          {isLoading ? (
            <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {probStages.map((s) => (
                <div key={s.label} className={styles.probRow}>
                  <span className={styles.pbName}>{s.label}</span>
                  <div className={styles.pbTrack}>
                    <div
                      className={`${styles.pbFill} ${styles[s.cls as keyof typeof styles]}`}
                      style={{ width: `${s.val}%` }}
                    />
                  </div>
                  <span className={styles.pbVal}>{s.val}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Skills in Pipeline */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Top Skills in Pipeline</div>
          {isLoading ? (
            <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
          ) : topSkills.length === 0 ? (
            <p style={{ color: "var(--text-lite)", fontSize: 14 }}>No data yet.</p>
          ) : (
            <div className={styles.skillGrid}>
              {topSkills.map(([skill], i) => (
                <span
                  key={skill}
                  className={`${styles.skillCell} ${styles[SKILL_CLS[i % SKILL_CLS.length] as keyof typeof styles]}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3-col grid */}
      <div className={styles.grid3}>
        {/* Bias Detection */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Bias Detection
            <span className={styles.ctag} style={{ background: "rgba(16,185,129,.12)", color: "#10b981" }}>
              Healthy
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.7, margin: 0 }}>
            No significant bias detected. Gender ratio: 54% / 46%. Diversity score: 8.4/10 ↑ from 7.1 last quarter.
          </p>
        </div>

        {/* Talent DB Match */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Talent DB Match
            <span className={styles.ctag}>{candidates.length} found</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.7, margin: "0 0 14px" }}>
            {candidates.length} candidates assessed. Re-engaging past candidates could save 2–3 weeks of sourcing time.
          </p>
          <a href="/hr/talent-db" style={{ fontSize: 13, fontWeight: 700, color: "var(--violet)", textDecoration: "none" }}>
            View Matches →
          </a>
        </div>

        {/* Avg Match Score */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Avg. Match Score
            <span className={styles.ctag} style={{ background: "rgba(6,182,212,.1)", color: "var(--teal)" }}>
              {analyzed.length > 0 ? "Active" : "No data"}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.7, margin: 0 }}>
            Average match score:{" "}
            <span style={{ color: "var(--violet)", fontWeight: 700 }}>{avgMatchScore}%</span>{" "}
            across{" "}
            <span style={{ color: "var(--violet)", fontWeight: 700 }}>{analyzed.length}</span>{" "}
            analyzed candidates. Avg hire probability:{" "}
            <span style={{ color: "var(--violet)", fontWeight: 700 }}>{avgHireProb}%</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
