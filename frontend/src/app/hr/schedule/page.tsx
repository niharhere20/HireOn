"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "../hr.module.css";
import { interviewService } from "@/services/interview.service";
import { candidateService } from "@/services/candidate.service";
import { authService } from "@/services/auth.service";

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const TIME_OPTIONS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "13:00", "13:30", "14:00", "14:30", "15:00",
    "15:30", "16:00", "16:30", "17:00",
];

export default function SchedulePage() {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [selectedTime, setSelectedTime] = useState("10:00");
    const [selectedCandidateId, setSelectedCandidateId] = useState("");
    const [selectedInterviewerId, setSelectedInterviewerId] = useState("");
    const [scheduleMsg, setScheduleMsg] = useState("");
    const [scheduleErr, setScheduleErr] = useState("");

    const qc = useQueryClient();

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const { data: interviews = [], isLoading: ivLoading } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll(),
    });

    const { data: candidates = [] } = useQuery({
        queryKey: ["candidates"],
        queryFn: () => candidateService.getAll(),
    });

    const { data: interviewers = [] } = useQuery({
        queryKey: ["interviewers"],
        queryFn: () => authService.getInterviewers(),
    });

    const scheduleMutation = useMutation({
        mutationFn: () => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
            const startTime = new Date(`${dateStr}T${selectedTime}:00`).toISOString();
            return interviewService.schedule(selectedCandidateId, selectedInterviewerId, startTime);
        },
        onSuccess: () => {
            setScheduleMsg("Interview scheduled! Meet link generated.");
            setScheduleErr("");
            qc.invalidateQueries({ queryKey: ["interviews"] });
            setTimeout(() => setScheduleMsg(""), 4000);
        },
        onError: () => {
            setScheduleErr("Failed to schedule. Check all fields and try again.");
        },
    });

    function handleSchedule() {
        setScheduleErr("");
        if (!selectedCandidateId || !selectedInterviewerId) {
            setScheduleErr("Please select a candidate and an interviewer.");
            return;
        }
        scheduleMutation.mutate();
    }

    // Days in this month that have interviews
    const daysWithInterviews = new Set(
        interviews
            .filter(iv => {
                const d = new Date(iv.startTime);
                return d.getFullYear() === year && d.getMonth() === month;
            })
            .map(iv => new Date(iv.startTime).getDate())
    );

    // Upcoming scheduled interviews
    const scheduled = interviews
        .filter(iv => iv.status === "SCHEDULED")
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Candidates eligible for scheduling
    const schedulableCandidates = candidates.filter(c =>
        ["APPLIED", "SHORTLISTED"].includes(c.status)
    );

    // Calendar cells
    const cells: (number | null)[] = [
        ...Array(firstDayOfWeek).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const todayDate = today.getDate();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Schedule</h1>
                <p className={styles.pageSub}>
                    View and manage interview schedules. Auto-generate Google Meet links.
                </p>
            </div>

            <div className={styles.schedLayout}>
                {/* Left column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Calendar */}
                    <div className={`${styles.card} ${styles.calCard}`}>
                        <div className={styles.calNavRow}>
                            <button className={styles.calNavBtn} onClick={prevMonth}>‹</button>
                            <span className={styles.calMonth}>{monthLabel}</span>
                            <button className={styles.calNavBtn} onClick={nextMonth}>›</button>
                        </div>
                        <div className={styles.calDhRow}>
                            {DAY_HEADERS.map((d) => (
                                <span key={d} className={styles.calDh}>{d}</span>
                            ))}
                        </div>
                        <div className={styles.calGrid}>
                            {cells.map((day, idx) => {
                                if (!day) return <div key={`empty-${idx}`} />;
                                const isToday = isCurrentMonth && day === todayDate;
                                const isSelected = day === selectedDay;
                                const hasDot = daysWithInterviews.has(day);
                                return (
                                    <div
                                        key={day}
                                        onClick={() => setSelectedDay(day)}
                                        className={[
                                            styles.calDay,
                                            isToday ? styles.calToday : "",
                                            isSelected && !isToday ? styles.calSelected : "",
                                            hasDot ? styles.calHas : "",
                                        ].join(" ")}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Schedule */}
                    <div className={`${styles.card} ${styles.quickSched}`}>
                        <div className={styles.cardTitle}>Quick Schedule</div>

                        <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-lite)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                                Candidate
                            </div>
                            <select
                                className={styles.schedSelect}
                                value={selectedCandidateId}
                                onChange={(e) => setSelectedCandidateId(e.target.value)}
                            >
                                <option value="">Select candidate…</option>
                                {schedulableCandidates.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.user.name} — {c.assignedRequirement?.title || "General"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-lite)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                                Interviewer
                            </div>
                            <select
                                className={styles.schedSelect}
                                value={selectedInterviewerId}
                                onChange={(e) => setSelectedInterviewerId(e.target.value)}
                            >
                                <option value="">Select interviewer…</option>
                                {interviewers.map((iv) => (
                                    <option key={iv.id} value={iv.id}>
                                        {iv.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-lite)", textTransform: "uppercase", letterSpacing: "0.6px", margin: "14px 0 8px" }}>
                            Time on {selectedDay} {monthLabel.split(" ")[0]}
                        </div>
                        <div className={styles.timeSlots}>
                            {TIME_OPTIONS.map((t) => {
                                const [h, m] = t.split(":").map(Number);
                                const ampm = h >= 12 ? "PM" : "AM";
                                const h12 = h % 12 || 12;
                                const label = `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
                                return (
                                    <button
                                        key={t}
                                        className={selectedTime === t ? styles.tSlotActive : styles.tSlot}
                                        onClick={() => setSelectedTime(t)}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        {scheduleMsg && (
                            <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginTop: 10 }}>
                                ✅ {scheduleMsg}
                            </div>
                        )}
                        {scheduleErr && (
                            <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginTop: 10 }}>
                                ⚠️ {scheduleErr}
                            </div>
                        )}

                        <button
                            className={styles.addBtn}
                            style={{ width: "100%", marginTop: 14, justifyContent: "center" }}
                            onClick={handleSchedule}
                            disabled={scheduleMutation.isPending}
                        >
                            {scheduleMutation.isPending ? "Scheduling…" : "⚡ Auto-Schedule + Meet Link"}
                        </button>
                    </div>
                </div>

                {/* Right column: Upcoming Interviews */}
                <div>
                    <div className={styles.cardTitle} style={{ marginBottom: 16, fontSize: 16 }}>
                        Upcoming Interviews
                    </div>
                    {ivLoading ? (
                        <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
                    ) : scheduled.length === 0 ? (
                        <p style={{ color: "var(--text-lite)", fontSize: 14 }}>No upcoming interviews scheduled.</p>
                    ) : (
                        <div className={styles.upcomingList}>
                            {scheduled.map((iv) => {
                                const dt = new Date(iv.startTime);
                                const timeStr = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                                const [timePart, ampm] = timeStr.split(" ");
                                const dateLabel = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                                const matchScore = iv.candidate?.aiProfile?.matchScore;

                                return (
                                    <div key={iv.id} className={`${styles.card} ${styles.icItem}`}>
                                        <div className={styles.icTime}>
                                            <span className={styles.icHr}>{timePart}</span>
                                            <span className={styles.icAmPm}>{ampm}</span>
                                        </div>
                                        <div className={styles.icDiv} />
                                        <div className={styles.icInfo}>
                                            <div className={styles.icName}>{iv.candidate?.user?.name ?? "Candidate"}</div>
                                            <div className={styles.icRole}>
                                                {dateLabel} · with {iv.interviewer?.name ?? "Interviewer"}
                                            </div>
                                            <div className={styles.icTags}>
                                                {matchScore != null && (
                                                    <span className={styles.icTag} style={{ background: "rgba(16,185,129,.1)", color: "#10b981" }}>
                                                        {matchScore}% match
                                                    </span>
                                                )}
                                            </div>
                                            {iv.meetLink && (
                                                <a
                                                    href={iv.meetLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ color: "var(--teal)", textDecoration: "none", fontWeight: 600, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}
                                                >
                                                    🔗 Join Meeting
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
