"use client";
import Link from "next/link";
import styles from "./interviewer.module.css";
import { useQuery } from "@tanstack/react-query";
import { interviewService } from "@/services/interview.service";
import { useAuthStore } from "@/store/auth.store";

function fmt(iso: string) {
  const d = new Date(iso);
  return {
    hr: d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false}).replace(':',''),
    ampm: d.getHours() >= 12 ? 'PM' : 'AM',
    time: d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
    date: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}),
    isToday: d.toDateString() === new Date().toDateString(),
    isPast: d < new Date(),
  };
}

const quickAccess = [
    { icon: "🗒️", title: "Prep Kit",            sub: "Questions & checklist",  href: "/interviewer/prep-kit" },
    { icon: "📊", title: "Scorecard",            sub: "Rate candidates",         href: "/interviewer/scorecard" },
    { icon: "🤝", title: "Panel Collaboration",  sub: "Team discussion",         href: "/interviewer/collaboration" },
    { icon: "📈", title: "My Analytics",         sub: "Your performance",        href: "/interviewer/analytics" },
];

const avatarColors = [
    "linear-gradient(135deg,#a78bfa,#6c47ff)",
    "linear-gradient(135deg,#6ee7b7,#059669)",
    "linear-gradient(135deg,#fbbf24,#d97706)",
    "linear-gradient(135deg,#f9a8d4,#ec4899)",
];

export default function InterviewerDashboard() {
    const user = useAuthStore(s => s.user);
    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ['interviews'],
        queryFn: () => interviewService.getAll(),
    });

    const today = new Date().toDateString();
    const todayIvs = interviews.filter(iv => new Date(iv.startTime).toDateString() === today);
    const completed = interviews.filter(iv => iv.status === 'COMPLETED');
    const scorecardsDue = completed.filter(iv => !iv.feedback);

    const liveNow = todayIvs.filter(iv =>
        iv.status === 'SCHEDULED' &&
        new Date(iv.startTime) <= new Date() &&
        new Date(iv.endTime) >= new Date()
    );

    const kpis = [
        { icon: "📅", cls: styles.ki1, val: String(todayIvs.length), lbl: "Interviews Today", delta: "Today", deltaCls: styles.kpiDeltaNeu },
        { icon: "⏳", cls: styles.ki2, val: String(scorecardsDue.length), lbl: "Scorecards Due", delta: "Pending", deltaCls: styles.kpiDeltaUp },
        { icon: "✅", cls: styles.ki3, val: String(completed.length), lbl: "Completed", delta: "Done", deltaCls: styles.kpiDeltaUp },
        { icon: "📊", cls: styles.ki4, val: String(interviews.length), lbl: "Total Interviews", delta: "All time", deltaCls: styles.kpiDeltaNeu },
    ];

    return (
        <div>
            {/* Page header */}
            <div className={styles.pageHeader}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <div className={styles.pageTitle}>Good morning, {user?.name || 'there'} 👋</div>
                        <div className={styles.pageSub}>
                            You have <strong>{todayIvs.length} interviews today</strong>
                            {liveNow.length > 0 ? ` — ${liveNow.length} live right now. Let's go! 🎯` : '. Let\'s go! 🎯'}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {liveNow.length > 0 && (
                            <>
                                <span className={`${styles.chip} ${styles.chipTeal}`}>
                                    <span className={styles.chipDot} />
                                    {liveNow.length} Live Now
                                </span>
                                <Link href="/interviewer/live" className={`${styles.btnPrimary} ${styles.btnSm}`}>
                                    🟢 Enter Live Room
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className={styles.grid4} style={{ marginBottom: 24 }}>
                {kpis.map((k) => (
                    <div key={k.lbl} className={`${styles.kpiCard} ${k.cls}`}>
                        <div className={styles.kpiTop}>
                            <span className={styles.kpiIcon}>{k.icon}</span>
                            <span className={`${styles.kpiDelta} ${k.deltaCls}`}>{k.delta}</span>
                        </div>
                        <div className={styles.kpiVal}>{k.val}</div>
                        <div className={styles.kpiLbl}>{k.lbl}</div>
                    </div>
                ))}
            </div>

            {/* Two-column grid */}
            <div className={styles.grid2}>
                {/* Today's Schedule */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        📅 Today&apos;s Schedule
                        <span className={styles.ctag}>{todayIvs.length} interviews</span>
                    </div>

                    {isLoading ? (
                        <p style={{color:'var(--text-lite)',fontSize:14,padding:'20px 0'}}>Loading...</p>
                    ) : todayIvs.length === 0 ? (
                        <p style={{color:'var(--text-lite)',fontSize:14,padding:'20px 0'}}>No interviews today.</p>
                    ) : (
                        todayIvs.map((iv, i) => {
                            const f = fmt(iv.startTime);
                            const now = new Date();
                            const isLive = iv.status === 'SCHEDULED' && new Date(iv.startTime) <= now && new Date(iv.endTime) >= now;
                            const chip = iv.status === 'COMPLETED'
                                ? { cls: styles.chipGray, dot: false, label: 'Done' }
                                : isLive
                                    ? { cls: styles.chipTeal, dot: true, label: 'Live' }
                                    : { cls: styles.chipViolet, dot: false, label: 'Upcoming' };
                            const action = iv.status === 'COMPLETED' && !iv.feedback ? 'fill' : null;
                            const round = iv.status === 'COMPLETED' ? 'Completed' : 'Upcoming';

                            return (
                                <div key={iv.id} className={styles.activityItem}>
                                    <div
                                        className={styles.actIcon}
                                        style={{ background: avatarColors[i % avatarColors.length], color: "#fff" }}
                                    >
                                        {iv.candidate.user.name.charAt(0)}
                                    </div>
                                    <div className={styles.actText}>
                                        <div className={styles.actTitle}>{iv.candidate.user.name}</div>
                                        <div className={styles.actSub}>{round}</div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                        <span className={styles.actTime}>{f.time}</span>
                                        {action === "fill" ? (
                                            <Link
                                                href="/interviewer/scorecard"
                                                className={`${styles.btnPrimary} ${styles.btnXs}`}
                                            >
                                                Fill
                                            </Link>
                                        ) : (
                                            <span className={`${styles.chip} ${chip.cls}`}>
                                                {chip.dot && <span className={styles.chipDot} />}
                                                {chip.label}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Quick Access */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        ⚡ Quick Access
                    </div>
                    <div className={styles.quickGrid}>
                        {quickAccess.map((q) => (
                            <Link key={q.href} href={q.href} className={styles.quickBox}>
                                <span className={styles.quickBoxIcon}>{q.icon}</span>
                                <span className={styles.quickBoxTitle}>{q.title}</span>
                                <span className={styles.quickBoxSub}>{q.sub}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
