"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requirementService, TechRequirement } from "@/services/requirement.service";
import { candidateService } from "@/services/candidate.service";
import styles from "../hr.module.css";

export default function RequirementsPage() {
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        title: "", description: "", techStackRaw: "", minExperience: 2, matchThreshold: 80, openings: 1,
    });

    const { data: requirements = [], isLoading } = useQuery({
        queryKey: ["requirements"],
        queryFn: requirementService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: () => requirementService.create({
            title: form.title,
            description: form.description,
            techStack: form.techStackRaw.split(",").map((s) => s.trim()).filter(Boolean),
            minExperience: form.minExperience,
            matchThreshold: form.matchThreshold,
            openings: form.openings,
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["requirements"] });
            setShowForm(false);
            setForm({ title: "", description: "", techStackRaw: "", minExperience: 2, matchThreshold: 80, openings: 1 });
        },
    });

    const shortlistMutation = useMutation({
        mutationFn: (requirementId: string) => candidateService.autoShortlist(requirementId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => requirementService.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["requirements"] }),
    });

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Requirements</h1>
                    <p className={styles.pageSub}>Manage job requirements and trigger AI auto-shortlisting</p>
                </div>
                <div className={styles.headerActions}>
                    <button className="btn-pri" style={{ padding: "10px 20px", fontSize: 13 }} onClick={() => setShowForm(true)}>
                        + New Requirement
                    </button>
                </div>
            </div>

            {isLoading ? (
                <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
            ) : requirements.length === 0 ? (
                <div className={styles.card} style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                    <p style={{ color: "var(--text-mid)", fontSize: 14 }}>No requirements yet. Create your first job requirement.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 20 }}>
                    {requirements.map((req: TechRequirement) => (
                        <div key={req.id} className={styles.card}>
                            <div className={styles.cardHead}>
                                <span>{req.title}</span>
                                <span className="ctag">{req.openings} opening{req.openings !== 1 ? "s" : ""}</span>
                            </div>
                            {req.description && (
                                <p style={{ fontSize: 13, color: "var(--text-mid)", marginBottom: 14 }}>{req.description}</p>
                            )}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                                {(req.techStack as string[]).map((t) => (
                                    <span className="skill-pill" key={t}>{t}</span>
                                ))}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                                <div style={{ background: "rgba(108,71,255,.05)", borderRadius: 10, padding: "10px 14px" }}>
                                    <div style={{ fontSize: 11, color: "var(--text-lite)", marginBottom: 2 }}>Min Experience</div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{req.minExperience}y</div>
                                </div>
                                <div style={{ background: "rgba(108,71,255,.05)", borderRadius: 10, padding: "10px 14px" }}>
                                    <div style={{ fontSize: 11, color: "var(--text-lite)", marginBottom: 2 }}>Match Threshold</div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{req.matchThreshold}%</div>
                                </div>
                                <div style={{ background: "rgba(108,71,255,.05)", borderRadius: 10, padding: "10px 14px" }}>
                                    <div style={{ fontSize: 11, color: "var(--text-lite)", marginBottom: 2 }}>Candidates</div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{req.candidates?.length ?? 0}</div>
                                </div>
                                <div style={{ background: "rgba(108,71,255,.05)", borderRadius: 10, padding: "10px 14px" }}>
                                    <div style={{ fontSize: 11, color: "var(--text-lite)", marginBottom: 2 }}>Created by</div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{req.createdByHR?.name}</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    className="btn-pri"
                                    style={{ flex: 1, padding: "9px", fontSize: 12 }}
                                    onClick={() => shortlistMutation.mutate(req.id)}
                                    disabled={shortlistMutation.isPending}
                                >
                                    🧠 Auto-Shortlist
                                </button>
                                <button
                                    className="btn-gl"
                                    style={{ padding: "9px 14px", fontSize: 12 }}
                                    onClick={() => deleteMutation.mutate(req.id)}
                                >
                                    Deactivate
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showForm && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
                }}>
                    <div style={{ background: "var(--modal-bg)", borderRadius: 16, padding: 32, width: "min(480px, calc(100vw - 32px))", maxHeight: "90vh", overflowY: "auto" }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 20, color: "var(--text)" }}>New Requirement</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {[
                                { label: "Job Title", key: "title", type: "text", placeholder: "e.g. Senior React Developer" },
                                { label: "Description (optional)", key: "description", type: "text", placeholder: "Brief role description" },
                                { label: "Tech Stack (comma-separated)", key: "techStackRaw", type: "text", placeholder: "React, TypeScript, Node.js" },
                            ].map(({ label, key, type, placeholder }) => (
                                <label key={key} style={{ fontSize: 13, fontWeight: 600 }}>
                                    {label}
                                    <input
                                        type={type}
                                        placeholder={placeholder}
                                        value={form[key as keyof typeof form] as string}
                                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                        style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(108,71,255,.2)", fontSize: 13 }}
                                    />
                                </label>
                            ))}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                {[
                                    { label: "Min Exp (yrs)", key: "minExperience" },
                                    { label: "Match Threshold %", key: "matchThreshold" },
                                    { label: "Openings", key: "openings" },
                                ].map(({ label, key }) => (
                                    <label key={key} style={{ fontSize: 13, fontWeight: 600 }}>
                                        {label}
                                        <input
                                            type="number"
                                            value={form[key as keyof typeof form] as number}
                                            onChange={(e) => setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) }))}
                                            style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(108,71,255,.2)", fontSize: 13 }}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                            <button className="btn-gl" style={{ padding: "10px 20px", fontSize: 13 }} onClick={() => setShowForm(false)}>Cancel</button>
                            <button
                                className="btn-pri"
                                style={{ padding: "10px 20px", fontSize: 13 }}
                                disabled={!form.title || !form.techStackRaw || createMutation.isPending}
                                onClick={() => createMutation.mutate()}
                            >
                                {createMutation.isPending ? "Creating..." : "Create Requirement"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
