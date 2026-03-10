"use client";
import Link from "next/link";
import styles from "../interviewer.module.css";
import { useQuery } from "@tanstack/react-query";
import { interviewService } from "@/services/interview.service";

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

export default function InterviewsPage() {
    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ['interviews'],
        queryFn: () => interviewService.getAll(),
    });

    const now = new Date();
    const today = now.toDateString();

    const liveNow = interviews.filter(iv =>
        iv.status === 'SCHEDULED' &&
        new Date(iv.startTime).toDateString() === today &&
        new Date(iv.startTime) <= now &&
        new Date(iv.endTime) >= now
    );
    const upcomingToday = interviews.filter(iv =>
        iv.status === 'SCHEDULED' &&
        new Date(iv.startTime).toDateString() === today &&
        new Date(iv.startTime) > now
    );
    const completedToday = interviews.filter(iv =>
        iv.status === 'COMPLETED' &&
        new Date(iv.startTime).toDateString() === today
    );
    const upcomingFuture = interviews.filter(iv =>
        iv.status === 'SCHEDULED' &&
        new Date(iv.startTime).toDateString() !== today &&
        new Date(iv.startTime) > now
    );

    const groups = [
        { key: 'live',    label: '🟢 Live Now',        items: liveNow,        chipCls: `${styles.chip} ${styles.chipTeal}`,   chipDot: true,  chipLabel: 'Live',     cardCls: styles.iqCardNow },
        { key: 'today',   label: '🕐 Upcoming Today',  items: upcomingToday,  chipCls: `${styles.chip} ${styles.chipViolet}`, chipDot: false, chipLabel: 'Soon',     cardCls: styles.iqCardSoon },
        { key: 'done',    label: '✅ Completed',        items: completedToday, chipCls: `${styles.chip} ${styles.chipGray}`,   chipDot: false, chipLabel: 'Done',     cardCls: styles.iqCardDone },
        { key: 'future',  label: '📆 Later This Week',  items: upcomingFuture, chipCls: `${styles.chip} ${styles.chipViolet}`, chipDot: false, chipLabel: 'Upcoming', cardCls: styles.iqCardSoon },
    ];

    return (
        <div>
            <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>📥 My Interview Queue</div>
                <div className={styles.pageSub}>
                    Your assigned interviews today — confirm, reschedule or jump into the live room.
                </div>
            </div>

            {isLoading && (
                <p style={{color:'var(--text-lite)',fontSize:14,padding:'20px 0'}}>Loading...</p>
            )}

            {!isLoading && interviews.length === 0 && (
                <p style={{color:'var(--text-lite)',fontSize:14,padding:'20px 0'}}>No interviews yet.</p>
            )}

            {!isLoading && groups.map((g) => {
                if (g.items.length === 0) return null;
                return (
                    <div key={g.key} className={styles.sectionGroup}>
                        <div className={styles.sectionGroupTitle}>{g.label}</div>
                        {g.items.map((iv) => {
                            const f = fmt(iv.startTime);
                            const dateLabel = f.isToday ? 'Today' : f.date;
                            const tags = [
                                ...(iv.candidate.aiProfile ? ['Match: ' + iv.candidate.aiProfile.matchScore + '%'] : []),
                                iv.candidate.user.email,
                            ];
                            return (
                                <div
                                    key={iv.id}
                                    className={`${styles.iqCard} ${g.cardCls}`}
                                >
                                    {/* Time block */}
                                    <div className={styles.iqTimeBlock}>
                                        <div className={styles.iqHr}>{f.hr}</div>
                                        <div className={styles.iqAmPm}>{f.ampm}</div>
                                        <div className={styles.iqDate}>{dateLabel}</div>
                                    </div>

                                    {/* Info */}
                                    <div className={styles.iqInfo}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                            <span className={styles.iqName}>{iv.candidate.user.name}</span>
                                            <span className={g.chipCls}>
                                                {g.chipDot && <span className={styles.chipDot} />}
                                                {g.chipLabel}
                                            </span>
                                        </div>
                                        <div className={styles.iqRound}>Interview</div>
                                        <div className={styles.iqTags}>
                                            {tags.map((t) => (
                                                <span key={t} className={styles.iqTag}>{t}</span>
                                            ))}
                                        </div>
                                        {iv.meetLink && (
                                            <a href={iv.meetLink} target="_blank" rel="noreferrer" className={styles.iqMeet}>
                                                🔗 {iv.meetLink}
                                            </a>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className={styles.iqActions}>
                                        {g.key === 'live' && (
                                            <>
                                                {iv.meetLink && (
                                                    <a href={iv.meetLink} target="_blank" rel="noreferrer" className={styles.btnPrimary} style={{ justifyContent: "center" }}>
                                                        Enter Room
                                                    </a>
                                                )}
                                                <Link href="/interviewer/prep-kit" className={styles.btnOutline} style={{ justifyContent: "center" }}>
                                                    Prep Kit
                                                </Link>
                                            </>
                                        )}
                                        {(g.key === 'today' || g.key === 'future') && iv.meetLink && (
                                            <a href={iv.meetLink} target="_blank" rel="noreferrer" className={styles.btnOutline} style={{ justifyContent: "center" }}>
                                                🔗 Meet Link
                                            </a>
                                        )}
                                        {g.key === 'done' && !iv.feedback && (
                                            <Link href="/interviewer/scorecard" className={styles.btnPrimary} style={{ justifyContent: "center" }}>
                                                📊 Scorecard
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
