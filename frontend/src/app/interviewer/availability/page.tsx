"use client";
import { useState, useEffect } from "react";
import styles from "../interviewer.module.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewService } from "@/services/interview.service";
import { useAuthStore } from "@/store/auth.store";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const DEFAULT_ON: Set<string> = new Set(["0-0", "0-1", "1-2", "1-3", "2-3", "2-4", "3-5", "4-6"]);

// Get next Monday as base date for slot ISO string generation
function getNextMonday() {
    const d = new Date();
    const day = d.getDay(); // 0=Sun, 1=Mon, ...
    const diff = day === 0 ? 1 : (8 - day) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function slotToISO(dayIndex: number, timeIndex: number): { startTime: string; endTime: string } {
    const base = getNextMonday();
    base.setDate(base.getDate() + dayIndex); // Mon=0, Tue=1, ...
    const [h, m] = TIMES[timeIndex].split(':').map(Number);
    const start = new Date(base);
    start.setHours(h, m, 0, 0);
    const end = new Date(start);
    end.setHours(h + 1, m, 0, 0);
    return { startTime: start.toISOString(), endTime: end.toISOString() };
}

export default function AvailabilityPage() {
    const user = useAuthStore(s => s.user);
    const qc = useQueryClient();

    const { data: existingSlots = [] } = useQuery({
        queryKey: ['availability', user?.id],
        queryFn: () => interviewService.getAvailability(user!.id),
        enabled: !!user?.id,
    });

    // Build a set of booked slot keys from existing slots that are booked
    const bookedSlotKeys = new Set<string>();
    existingSlots.forEach((slot) => {
        if (slot.isBooked) {
            // Match slot to grid position by comparing time
            const slotStart = new Date(slot.startTime);
            const dayOfWeek = slotStart.getDay(); // 1=Mon ... 5=Fri
            const dayIndex = dayOfWeek - 1; // 0=Mon ... 4=Fri
            const timeStr = slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            const timeIndex = TIMES.indexOf(timeStr);
            if (dayIndex >= 0 && dayIndex < 5 && timeIndex >= 0) {
                bookedSlotKeys.add(`${dayIndex}-${timeIndex}`);
            }
        }
    });

    // Build a set of "on" keys from existing slots
    const existingOnKeys = new Set<string>();
    existingSlots.forEach((slot) => {
        const slotStart = new Date(slot.startTime);
        const dayOfWeek = slotStart.getDay();
        const dayIndex = dayOfWeek - 1;
        const timeStr = slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const timeIndex = TIMES.indexOf(timeStr);
        if (dayIndex >= 0 && dayIndex < 5 && timeIndex >= 0) {
            existingOnKeys.add(`${dayIndex}-${timeIndex}`);
        }
    });

    const [slots, setSlots] = useState<Set<string>>(new Set(DEFAULT_ON));

    // Once existing slots load, merge them in
    useEffect(() => {
        if (existingSlots.length > 0) {
            setSlots(new Set([...DEFAULT_ON, ...existingOnKeys]));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingSlots.length]);

    const toggle = (key: string) => {
        if (bookedSlotKeys.has(key)) return;
        setSlots((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const available = slots.size - [...slots].filter((k) => bookedSlotKeys.has(k)).length;
    const booked = [...slots].filter((k) => bookedSlotKeys.has(k)).length;

    const saveMutation = useMutation({
        mutationFn: (slotsToSave: { startTime: string; endTime: string }[]) =>
            interviewService.addAvailability(slotsToSave),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['availability'] });
            alert('Availability saved!');
        },
    });

    const handleSave = () => {
        const selectedSlots = [...slots]
            .filter((k) => !bookedSlotKeys.has(k))
            .map((k) => {
                const [di, ti] = k.split('-').map(Number);
                return slotToISO(di, ti);
            });
        saveMutation.mutate(selectedSlots);
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <div className={styles.pageTitle}>🕐 Availability</div>
                        <div className={styles.pageSub}>
                            Set your weekly availability so HR can schedule interviews with you.
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <span className={`${styles.chip} ${styles.chipViolet}`}>{available} Available</span>
                        <span className={`${styles.chip} ${styles.chipTeal}`}>{booked} Booked</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                    { cls: styles.availSlotOn,     label: "Available" },
                    { cls: styles.availSlotBooked, label: "Booked" },
                    { cls: styles.availSlot,       label: "Unavailable" },
                ].map((l) => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className={l.cls} style={{ width: 28, height: 20, borderRadius: 4, minHeight: "unset", padding: 0 }} />
                        <span style={{ fontSize: 12, color: "var(--text-mid)" }}>{l.label}</span>
                    </div>
                ))}
                <span style={{ fontSize: 12, color: "var(--text-lite)", marginLeft: "auto" }}>
                    Click a slot to toggle availability
                </span>
            </div>

            {/* Weekly grid */}
            <div className={styles.card} style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 500 }}>
                    {/* Header row */}
                    <div className={styles.availGrid} style={{ marginBottom: 6 }}>
                        <div />
                        {DAYS.map((d) => (
                            <div key={d} className={styles.availDayHeader}>{d}</div>
                        ))}
                    </div>

                    {/* Time rows */}
                    {TIMES.map((time, ti) => (
                        <div key={time} className={styles.availGrid} style={{ marginBottom: 4 }}>
                            <div className={styles.availTimeLabel}>{time}</div>
                            {DAYS.map((_, di) => {
                                const key = `${di}-${ti}`;
                                const isBooked = bookedSlotKeys.has(key);
                                const isOn = slots.has(key);
                                return (
                                    <button
                                        key={key}
                                        className={`${styles.availSlot} ${
                                            isBooked ? styles.availSlotBooked :
                                            isOn ? styles.availSlotOn : ""
                                        }`}
                                        onClick={() => toggle(key)}
                                        title={isBooked ? "Booked — cannot change" : isOn ? "Click to mark unavailable" : "Click to mark available"}
                                        style={{ cursor: isBooked ? "not-allowed" : "pointer" }}
                                    >
                                        {isBooked ? "📌" : isOn ? "✓" : ""}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Save row */}
            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className={styles.btnGhost} onClick={() => setSlots(new Set(DEFAULT_ON))}>
                    Reset
                </button>
                <button
                    className={styles.btnPrimary}
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                >
                    {saveMutation.isPending ? 'Saving...' : '💾 Save Availability'}
                </button>
            </div>
        </div>
    );
}
