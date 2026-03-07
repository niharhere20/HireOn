"use client";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate.service";
import { authService } from "@/services/auth.service";
import styles from "../candidate.module.css";

export default function ResumePage() {
    const qc = useQueryClient();
    const fileRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: authService.me,
    });

    const { data: candidate, isLoading } = useQuery({
        queryKey: ["my-candidate"],
        queryFn: async () => {
            const user = await authService.me();
            return candidateService.getById((user as unknown as { candidate?: { id: string } }).candidate?.id ?? "");
        },
        enabled: !!me,
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) => candidateService.uploadResume(candidate!.id, file),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["my-candidate"] }),
    });

    const handleFile = (file: File) => {
        if (file && (file.type === "application/pdf" || file.type === "text/plain")) {
            uploadMutation.mutate(file);
        }
    };

    const ai = candidate?.aiProfile;

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>My Resume</h1>
                    <p className={styles.pageSub}>Upload your resume — AI will analyze it automatically</p>
                </div>
            </div>

            {isLoading ? (
                <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {/* Upload Section */}
                    <div className={styles.card}>
                        <div className={styles.cardHead}>
                            <span>Resume Upload</span>
                            {candidate?.resumeUrl && <span className="ctag teal">Uploaded</span>}
                        </div>

                        {candidate?.resumeUrl && (
                            <div className={styles.resumeBox}>
                                <div className={styles.resumeIcon}>📄</div>
                                <div className={styles.resumeInfo}>
                                    <div className={styles.resumeName}>{candidate.resumeUrl}</div>
                                    <div className={styles.resumeMeta}>
                                        {ai ? "AI analyzed ✓" : "Pending analysis"}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div
                            className={styles.uploadArea}
                            style={{ border: dragging ? "2px dashed var(--violet)" : undefined, background: dragging ? "rgba(108,71,255,.05)" : undefined }}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragging(false);
                                const file = e.dataTransfer.files[0];
                                if (file) handleFile(file);
                            }}
                            onClick={() => fileRef.current?.click()}
                        >
                            <div className={styles.uploadIcon}>
                                {uploadMutation.isPending ? "⏳" : "⬆️"}
                            </div>
                            <div className={styles.uploadText}>
                                {uploadMutation.isPending ? (
                                    <strong>Uploading & parsing...</strong>
                                ) : (
                                    <>
                                        <strong>Drop your resume here or click to browse</strong>
                                        <br />
                                        <span>PDF or TXT · Max 10MB</span>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".pdf,.txt"
                                style={{ display: "none" }}
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                            />
                        </div>
                        {uploadMutation.isSuccess && (
                            <p style={{ color: "var(--teal)", fontSize: 13, marginTop: 10 }}>Resume uploaded! AI analysis will run when HR assigns you to a requirement.</p>
                        )}
                        {uploadMutation.isError && (
                            <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>Upload failed. Please try again.</p>
                        )}
                    </div>

                    {/* AI Profile */}
                    <div className={styles.card}>
                        <div className={styles.cardHead}>
                            <span>AI Profile Summary</span>
                            {ai && <span className="ctag pink">Analyzed</span>}
                        </div>
                        {!ai ? (
                            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-lite)", fontSize: 14 }}>
                                <div style={{ fontSize: 36, marginBottom: 12 }}>🧠</div>
                                <p>Your AI profile will appear here once HR analyzes your resume.</p>
                            </div>
                        ) : (
                            <>
                                <div className={styles.aiGrid}>
                                    <div className={styles.aiItem}>
                                        <div className={styles.aiLbl}>Experience</div>
                                        <div className={styles.aiVal}>{ai.experienceYears} years</div>
                                    </div>
                                    <div className={styles.aiItem}>
                                        <div className={styles.aiLbl}>Seniority Level</div>
                                        <div className={styles.aiVal}>{ai.seniorityLevel}</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <div style={{ fontSize: 12, color: "var(--text-lite)", marginBottom: 6 }}>Skills</div>
                                    <div className={styles.aiSkills}>
                                        {(ai.extractedSkills as string[]).map((s) => (
                                            <span className="skill-pill" key={s}>{s}</span>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginTop: 16, background: "rgba(108,71,255,.04)", borderRadius: 12, padding: "14px 16px" }}>
                                    <div style={{ fontSize: 12, color: "var(--text-lite)", marginBottom: 6 }}>Strengths</div>
                                    <p style={{ fontSize: 13, color: "var(--text-mid)" }}>{ai.strengths}</p>
                                </div>

                                <div style={{ marginTop: 12, background: "rgba(255,107,198,.04)", borderRadius: 12, padding: "14px 16px" }}>
                                    <div style={{ fontSize: 12, color: "var(--text-lite)", marginBottom: 6 }}>Areas to Improve</div>
                                    <p style={{ fontSize: 13, color: "var(--text-mid)" }}>{ai.weaknesses}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
