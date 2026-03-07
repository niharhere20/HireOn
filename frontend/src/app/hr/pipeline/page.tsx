"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { candidateService, Candidate } from "@/services/candidate.service";
import styles from "../hr.module.css";

const COLUMNS = [
    { id: "APPLIED", label: "Applied", color: "#6c47ff", bg: "rgba(108,71,255,0.08)" },
    { id: "SHORTLISTED", label: "Shortlisted", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
    { id: "SCHEDULED", label: "Scheduled", color: "#06b6d4", bg: "rgba(6,182,212,0.08)" },
    { id: "INTERVIEWED", label: "Interviewed", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
    { id: "HIRED", label: "Hired", color: "#10b981", bg: "rgba(16,185,129,0.08)" },
    { id: "REJECTED", label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
];

const AVATAR_COLORS = [
    "linear-gradient(135deg,#ddd6fe,#a78bfa)",
    "linear-gradient(135deg,#fce7f3,#f9a8d4)",
    "linear-gradient(135deg,#d1fae5,#6ee7b7)",
    "linear-gradient(135deg,#fef3c7,#fde68a)",
    "linear-gradient(135deg,#e0e7ff,#a5b4fc)",
];

export default function PipelinePage() {
    const qc = useQueryClient();
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<string | null>(null);

    const { data: candidates = [], isLoading } = useQuery({
        queryKey: ["candidates"],
        queryFn: () => candidateService.getAll(),
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            candidateService.updateStatus(id, status),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
    });

    const byStatus = (status: string) =>
        candidates.filter((c) => c.status === status);

    const handleDragStart = (e: React.DragEvent, candidateId: string) => {
        setDragging(candidateId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDrop = (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        if (!dragging) return;
        const candidate = candidates.find((c) => c.id === dragging);
        if (candidate && candidate.status !== targetStatus) {
            updateStatus.mutate({ id: dragging, status: targetStatus });
        }
        setDragging(null);
        setDragOver(null);
    };

    const handleDragOver = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(colId);
    };

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Pipeline</h1>
                    <p className={styles.pageSub}>Drag candidates across stages to update their status</p>
                </div>
                <div className={styles.headerActions}>
                    <span style={{ fontSize: 13, color: "var(--text-mid)" }}>
                        {candidates.length} total candidates
                    </span>
                </div>
            </div>

            {isLoading ? (
                <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading pipeline...</p>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: 12,
                    overflowX: "auto",
                    paddingBottom: 16,
                }}>
                    {COLUMNS.map((col) => {
                        const cards = byStatus(col.id);
                        const isOver = dragOver === col.id;
                        return (
                            <div
                                key={col.id}
                                onDragOver={(e) => handleDragOver(e, col.id)}
                                onDragLeave={() => setDragOver(null)}
                                onDrop={(e) => handleDrop(e, col.id)}
                                style={{
                                    minWidth: 200,
                                    background: isOver ? col.bg : "var(--kpi-bg, #fff)",
                                    border: `1px solid ${isOver ? col.color : "var(--table-border, rgba(108,71,255,0.1))"}`,
                                    borderRadius: 14,
                                    padding: 12,
                                    transition: "all 0.2s",
                                    minHeight: 400,
                                }}
                            >
                                {/* Column Header */}
                                <div style={{
                                    display: "flex", alignItems: "center",
                                    justifyContent: "space-between", marginBottom: 12,
                                    padding: "6px 8px", borderRadius: 8,
                                    background: col.bg,
                                }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: col.color }}>
                                        {col.label}
                                    </span>
                                    <span style={{
                                        fontSize: 11, fontWeight: 700, background: col.color,
                                        color: "#fff", borderRadius: 20, padding: "1px 7px",
                                    }}>
                                        {cards.length}
                                    </span>
                                </div>

                                {/* Cards */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {cards.map((c, idx) => (
                                        <CandidateCard
                                            key={c.id}
                                            candidate={c}
                                            avatarBg={AVATAR_COLORS[idx % AVATAR_COLORS.length]}
                                            isDragging={dragging === c.id}
                                            onDragStart={(e) => handleDragStart(e, c.id)}
                                            onDragEnd={() => setDragging(null)}
                                        />
                                    ))}
                                    {cards.length === 0 && (
                                        <div style={{
                                            textAlign: "center", padding: "32px 8px",
                                            color: "var(--text-lite)", fontSize: 12,
                                            border: "1.5px dashed var(--table-border)",
                                            borderRadius: 10, opacity: isOver ? 0.5 : 1,
                                        }}>
                                            Drop here
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function CandidateCard({
    candidate, avatarBg, isDragging, onDragStart, onDragEnd,
}: {
    candidate: Candidate;
    avatarBg: string;
    isDragging: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
}) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            style={{
                background: "var(--card-bg, #fff)",
                border: "1px solid var(--table-border, rgba(108,71,255,0.1))",
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "grab",
                opacity: isDragging ? 0.4 : 1,
                transition: "opacity 0.2s, box-shadow 0.2s",
                boxShadow: isDragging ? "none" : "0 2px 8px rgba(108,71,255,0.07)",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: avatarBg, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>
                    {candidate.user.name.charAt(0)}
                </div>
                <div>
                    <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3, color: "var(--text)" }}>
                        {candidate.user.name}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-lite)" }}>
                        {candidate.user.email.split("@")[0]}
                    </div>
                </div>
            </div>

            {candidate.aiProfile ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{
                        flex: 1, height: 4, background: "rgba(108,71,255,0.1)",
                        borderRadius: 2, marginRight: 8, overflow: "hidden",
                    }}>
                        <div style={{
                            height: "100%", borderRadius: 2,
                            background: "linear-gradient(90deg,#6c47ff,#ff6bc6)",
                            width: `${candidate.aiProfile.matchScore}%`,
                        }} />
                    </div>
                    <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: candidate.aiProfile.matchScore >= 80 ? "#10b981" : candidate.aiProfile.matchScore >= 60 ? "#f59e0b" : "#ef4444",
                    }}>
                        {candidate.aiProfile.matchScore}%
                    </span>
                </div>
            ) : (
                <div style={{ fontSize: 10, color: "var(--text-lite)", fontStyle: "italic" }}>Not analyzed</div>
            )}

            {candidate.assignedRequirement && (
                <div style={{
                    marginTop: 6, fontSize: 10, color: "var(--text-mid)",
                    background: "rgba(108,71,255,0.06)", borderRadius: 6,
                    padding: "2px 7px", display: "inline-block",
                }}>
                    {candidate.assignedRequirement.title}
                </div>
            )}
        </div>
    );
}
