"use client";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { interviewService } from "@/services/interview.service";
import styles from "../candidate.module.css";

export default function OfferPage() {
    const { data: me } = useQuery({ queryKey: ["me"], queryFn: authService.me });
    const { data: interviews = [] } = useQuery({
        queryKey: ["my-interviews"],
        queryFn: () => interviewService.getAll(),
        enabled: !!me,
    });

    const meUser = me as unknown as {
        name?: string;
        email?: string;
        candidate?: {
            status?: string;
            assignedRequirement?: { title: string; techStack: string[] } | null;
            aiProfile?: { matchScore: number; seniorityLevel: string } | null;
        };
    };

    const status = meUser?.candidate?.status;
    const isHired = status === "HIRED";
    const candidateName = meUser?.name ?? "Candidate";
    const role = meUser?.candidate?.assignedRequirement?.title ?? "Software Engineer";
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    if (!isHired) {
        return (
            <div>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.pageTitle}>Offer Letter</h1>
                        <p className={styles.pageSub}>Your official offer letter will appear here once you&apos;re hired</p>
                    </div>
                </div>

                <div style={{
                    textAlign: "center", padding: "80px 40px",
                    background: "var(--kpi-bg, #fff)",
                    border: "1px solid var(--table-border)",
                    borderRadius: 16,
                }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
                    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                        Offer Letter Locked
                    </div>
                    <div style={{ fontSize: 14, color: "var(--text-mid)", maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
                        Your offer letter will be available here once you have been officially hired. Keep completing your interviews — you&apos;re on the right track!
                    </div>
                    <div style={{ marginTop: 24, padding: "12px 24px", background: "rgba(108,71,255,0.06)", borderRadius: 12, display: "inline-block" }}>
                        <span style={{ fontSize: 13, color: "var(--text-mid)" }}>
                            Current status:{" "}
                            <strong style={{ color: "var(--violet)" }}>{status ? status.charAt(0) + status.slice(1).toLowerCase() : "Under review"}</strong>
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Offer Letter</h1>
                    <p className={styles.pageSub}>Congratulations! Your official offer letter is ready</p>
                </div>
                <button
                    onClick={() => window.print()}
                    style={{
                        padding: "10px 20px", background: "linear-gradient(135deg,#6c47ff,#ff6bc6)",
                        color: "#fff", border: "none", borderRadius: 10, fontWeight: 700,
                        fontSize: 14, cursor: "pointer",
                    }}
                >
                    Download PDF
                </button>
            </div>

            {/* Offer Letter */}
            <div style={{
                background: "var(--kpi-bg, #fff)",
                border: "1px solid var(--table-border)",
                borderRadius: 16, padding: "48px 56px",
                maxWidth: 760, position: "relative", overflow: "hidden",
            }}>
                {/* Decorative top bar */}
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 6,
                    background: "linear-gradient(135deg,#6c47ff,#ff6bc6)",
                }} />

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
                    <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--violet)" }}>HireOn</div>
                        <div style={{ fontSize: 12, color: "var(--text-lite)", marginTop: 2 }}>hireon.ai</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 13, color: "var(--text-mid)" }}>
                        <div>Date: {today}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-lite)" }}>Ref: HIRE-{Math.floor(Math.random() * 90000) + 10000}</div>
                    </div>
                </div>

                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: "var(--text)" }}>
                    Offer of Employment
                </div>

                <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-mid)", marginBottom: 20 }}>
                    Dear <strong style={{ color: "var(--text)" }}>{candidateName}</strong>,
                </p>

                <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-mid)", marginBottom: 20 }}>
                    We are delighted to offer you the position of{" "}
                    <strong style={{ color: "var(--text)" }}>{role}</strong> at HireOn.
                    After careful review of your qualifications and interviews, we are confident that your
                    skills and experience make you an excellent candidate for this role.
                </p>

                {/* Key Terms */}
                <div style={{
                    background: "rgba(108,71,255,0.04)", borderRadius: 12,
                    padding: "24px 28px", marginBottom: 24,
                    border: "1px solid rgba(108,71,255,0.1)",
                }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: "var(--text-mid)", letterSpacing: "0.5px" }}>
                        OFFER DETAILS
                    </div>
                    {[
                        { label: "Position", value: role },
                        { label: "Start Date", value: "To be mutually agreed" },
                        { label: "Employment Type", value: "Full-time" },
                        { label: "Reporting To", value: "Engineering Manager" },
                        { label: "Location", value: "Hybrid / As discussed" },
                    ].map(({ label, value }) => (
                        <div key={label} style={{
                            display: "flex", justifyContent: "space-between",
                            padding: "8px 0", borderBottom: "1px solid rgba(108,71,255,0.07)",
                        }}>
                            <span style={{ fontSize: 13, color: "var(--text-lite)" }}>{label}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{value}</span>
                        </div>
                    ))}
                </div>

                <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-mid)", marginBottom: 20 }}>
                    This offer is contingent upon the successful completion of any required background checks
                    and reference verifications. Please review this offer carefully and confirm your acceptance
                    within 5 business days.
                </p>

                <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-mid)", marginBottom: 32 }}>
                    We look forward to welcoming you to the HireOn team. Please feel free to reach out to
                    your HR contact if you have any questions.
                </p>

                <div style={{ borderTop: "1px solid var(--table-border)", paddingTop: 24, display: "flex", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>HireOn HR Team</div>
                        <div style={{ fontSize: 12, color: "var(--text-lite)", marginTop: 4 }}>hr@hireon.ai</div>
                    </div>
                    <div style={{
                        padding: "6px 16px", background: "rgba(16,185,129,0.1)",
                        borderRadius: 20, color: "#10b981", fontSize: 12, fontWeight: 700,
                        display: "flex", alignItems: "center", gap: 6, height: "fit-content",
                    }}>
                        <span>✓</span> Officially Hired
                    </div>
                </div>
            </div>
        </div>
    );
}
