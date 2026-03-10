"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "../hr.module.css";
import { candidateService, Candidate } from "@/services/candidate.service";

const AV_CLASSES = ["cv1", "cv2", "cv3", "cv4", "cv5", "cv6"];

type ColId = "APPLIED" | "SHORTLISTED" | "INTERVIEWED" | "HIRED";

const COLUMNS: { id: ColId; label: string; accentColor: string; targetStatus: string }[] = [
    { id: "APPLIED",     label: "Applied",      accentColor: "var(--violet)", targetStatus: "APPLIED"      },
    { id: "SHORTLISTED", label: "Shortlisted",   accentColor: "var(--amber)",  targetStatus: "SHORTLISTED"  },
    { id: "INTERVIEWED", label: "Interviewed",   accentColor: "var(--teal)",   targetStatus: "INTERVIEWED"  },
    { id: "HIRED",       label: "Offer / Hired", accentColor: "#10b981",       targetStatus: "HIRED"        },
];

function getColId(status: string): ColId {
    if (status === "APPLIED")     return "APPLIED";
    if (status === "SHORTLISTED") return "SHORTLISTED";
    if (status === "SCHEDULED" || status === "INTERVIEWED") return "INTERVIEWED";
    if (status === "HIRED")       return "HIRED";
    return "APPLIED";
}

export default function PipelinePage() {
    const qc = useQueryClient();
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [overCol, setOverCol] = useState<ColId | null>(null);

    const { data: candidates = [], isLoading } = useQuery({
        queryKey: ["candidates"],
        queryFn: () => candidateService.getAll(),
    });

    const updateMutation = useMutation({
        mutationFn: ({ candidateId, status }: { candidateId: string; status: string }) =>
            candidateService.updateStatus(candidateId, status),
        onMutate: async ({ candidateId, status }) => {
            // Optimistic update
            await qc.cancelQueries({ queryKey: ["candidates"] });
            const prev = qc.getQueryData<Candidate[]>(["candidates"]);
            qc.setQueryData<Candidate[]>(["candidates"], (old) =>
                (old ?? []).map((c) => c.id === candidateId ? { ...c, status: status as Candidate["status"] } : c)
            );
            return { prev };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData(["candidates"], ctx.prev);
        },
        onSettled: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
    });

    const colCards: Record<ColId, Candidate[]> = {
        APPLIED:     candidates.filter(c => getColId(c.status) === "APPLIED"),
        SHORTLISTED: candidates.filter(c => getColId(c.status) === "SHORTLISTED"),
        INTERVIEWED: candidates.filter(c => getColId(c.status) === "INTERVIEWED"),
        HIRED:       candidates.filter(c => getColId(c.status) === "HIRED"),
    };

    function handleDragStart(e: React.DragEvent, candidateId: string) {
        e.dataTransfer.setData("candidateId", candidateId);
        e.dataTransfer.effectAllowed = "move";
        setDraggingId(candidateId);
    }

    function handleDragEnd() {
        setDraggingId(null);
        setOverCol(null);
    }

    function handleDragOver(e: React.DragEvent, colId: ColId) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOverCol(colId);
    }

    function handleDrop(e: React.DragEvent, col: typeof COLUMNS[number]) {
        e.preventDefault();
        const candidateId = e.dataTransfer.getData("candidateId");
        setDraggingId(null);
        setOverCol(null);
        if (!candidateId) return;
        const cand = candidates.find(c => c.id === candidateId);
        if (!cand) return;
        const newColId = col.id;
        if (getColId(cand.status) === newColId) return; // no change
        updateMutation.mutate({ candidateId, status: col.targetStatus });
    }

    if (isLoading) {
        return <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>;
    }

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Pipeline</h1>
                <p className={styles.pageSub}>
                    Drag candidates across stages — status updates automatically.
                </p>
            </div>

            <div className={styles.kanban}>
                {COLUMNS.map((col) => {
                    const cards = colCards[col.id];
                    const isOver = overCol === col.id;

                    return (
                        <div
                            key={col.id}
                            className={styles.kCol}
                            style={{
                                outline: isOver ? `2px dashed ${col.accentColor}` : undefined,
                                background: isOver ? `rgba(108,71,255,0.03)` : undefined,
                                transition: "outline 0.15s, background 0.15s",
                            }}
                            onDragOver={(e) => handleDragOver(e, col.id)}
                            onDragLeave={() => setOverCol(null)}
                            onDrop={(e) => handleDrop(e, col)}
                        >
                            <div className={styles.kHeader}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span className={styles.kTitle}>{col.label}</span>
                                    <span
                                        className={styles.kCount}
                                        style={{ background: col.accentColor }}
                                    >
                                        {cards.length}
                                    </span>
                                </div>
                                <div
                                    className={styles.kLine}
                                    style={{ background: col.accentColor }}
                                />
                            </div>

                            <div className={styles.kCards}>
                                {cards.length === 0 ? (
                                    <div style={{
                                        padding: "28px 12px",
                                        textAlign: "center",
                                        color: "var(--text-lite)",
                                        fontSize: 12,
                                        border: `1.5px dashed var(--card-border)`,
                                        borderRadius: 10,
                                        marginTop: 4,
                                    }}>
                                        Drop here
                                    </div>
                                ) : (
                                    cards.map((c, idx) => {
                                        const avCls = AV_CLASSES[idx % AV_CLASSES.length];
                                        const matchScore = c.aiProfile?.matchScore ?? null;
                                        const role = c.assignedRequirement?.title || "General Applicant";
                                        const isDragging = draggingId === c.id;

                                        return (
                                            <div
                                                key={c.id}
                                                className={styles.kCardItem}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, c.id)}
                                                onDragEnd={handleDragEnd}
                                                style={{
                                                    cursor: "grab",
                                                    opacity: isDragging ? 0.4 : 1,
                                                    transform: isDragging ? "scale(0.97)" : undefined,
                                                    transition: "opacity 0.15s, transform 0.15s",
                                                    userSelect: "none",
                                                }}
                                            >
                                                <div className={styles.kCardName}>{c.user.name}</div>
                                                <div className={styles.kCardRole}>{role}</div>
                                                <div className={styles.kCardFooter}>
                                                    {c.status === "HIRED" ? (
                                                        <span style={{
                                                            background: "rgba(16,185,129,.12)",
                                                            color: "#10b981",
                                                            fontSize: 10,
                                                            padding: "2px 8px",
                                                            borderRadius: 20,
                                                            fontWeight: 700,
                                                        }}>
                                                            Hired
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={styles.kCardScore}
                                                            style={{ background: col.accentColor }}
                                                        >
                                                            {matchScore !== null ? `${matchScore}%` : "—"}
                                                        </span>
                                                    )}
                                                    <div className={`${styles.kCardAv} ${styles[avCls as keyof typeof styles]}`}>
                                                        {c.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-lite)", display: "flex", alignItems: "center", gap: 6 }}>
                <span>✋</span> Drag any card to move candidate to a different stage
            </div>
        </div>
    );
}
