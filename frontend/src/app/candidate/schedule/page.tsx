"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewService } from "@/services/interview.service";
import { authService } from "@/services/auth.service";
import styles from "../candidate.module.css";

function formatSlot(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export default function SchedulePage() {
    const qc = useQueryClient();
    const { data: me } = useQuery({ queryKey: ["me"], queryFn: authService.me });

    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const { data: slots = [], isLoading } = useQuery({
        queryKey: ["my-availability", (me as unknown as { id?: string })?.id],
        queryFn: () => interviewService.getAvailability((me as unknown as { id: string }).id),
        enabled: !!(me as unknown as { id?: string })?.id,
    });

    const addMutation = useMutation({
        mutationFn: () => interviewService.addAvailability([{ startTime, endTime }]),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["my-availability"] });
            setStartTime("");
            setEndTime("");
        },
    });

    const available = slots.filter((s) => !s.isBooked);
    const booked = slots.filter((s) => s.isBooked);

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>My Availability</h1>
                    <p className={styles.pageSub}>Add your available time slots so interviews can be auto-scheduled</p>
                </div>
            </div>

            {/* Add Slot */}
            <div className={styles.card} style={{ marginBottom: 20 }}>
                <div className={styles.cardHead}>
                    <span>Add Availability Slot</span>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
                    <label style={{ flex: 1, minWidth: 200, fontSize: 13, fontWeight: 600 }}>
                        Available From
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(108,71,255,.2)", fontSize: 13 }}
                        />
                    </label>
                    <label style={{ flex: 1, minWidth: 200, fontSize: 13, fontWeight: 600 }}>
                        Available Until
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(108,71,255,.2)", fontSize: 13 }}
                        />
                    </label>
                    <button
                        className="btn-pri"
                        style={{ padding: "10px 24px", fontSize: 13 }}
                        disabled={!startTime || !endTime || addMutation.isPending}
                        onClick={() => addMutation.mutate()}
                    >
                        {addMutation.isPending ? "Adding..." : "Add Slot"}
                    </button>
                </div>
                {addMutation.isSuccess && (
                    <p style={{ color: "var(--teal)", fontSize: 13, marginTop: 10 }}>Slot added! HR will use this to auto-schedule your interview.</p>
                )}
            </div>

            {/* Slots */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className={styles.card}>
                    <div className={styles.cardHead}>
                        <span>Open Slots</span>
                        <span className="ctag teal">{available.length}</span>
                    </div>
                    {isLoading ? (
                        <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
                    ) : available.length === 0 ? (
                        <p style={{ color: "var(--text-lite)", fontSize: 14 }}>No open slots. Add availability above.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {available.map((slot) => (
                                <div key={slot.id} style={{ padding: "12px 16px", background: "rgba(0,212,200,.06)", borderRadius: 10, border: "1px solid rgba(0,212,200,.2)" }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{formatSlot(slot.startTime)}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-lite)", marginTop: 2 }}>→ {formatSlot(slot.endTime)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHead}>
                        <span>Booked Slots</span>
                        <span className="ctag pink">{booked.length}</span>
                    </div>
                    {booked.length === 0 ? (
                        <p style={{ color: "var(--text-lite)", fontSize: 14 }}>No interviews booked yet.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {booked.map((slot) => (
                                <div key={slot.id} style={{ padding: "12px 16px", background: "rgba(255,107,198,.06)", borderRadius: 10, border: "1px solid rgba(255,107,198,.2)" }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{formatSlot(slot.startTime)}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-lite)", marginTop: 2 }}>→ {formatSlot(slot.endTime)}</div>
                                    <div style={{ fontSize: 11, color: "var(--pink)", marginTop: 4, fontWeight: 600 }}>Interview Booked</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
