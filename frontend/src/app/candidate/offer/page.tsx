"use client";
import styles from "../candidate.module.css";

const CTC = [
    { label: "Base Salary",    val: "₹18,00,000" },
    { label: "Variable Pay",   val: "₹2,00,000"  },
    { label: "Benefits",       val: "₹1,20,000"  },
    { label: "Stock Options",  val: "₹60,000"    },
];

const DOCS = [
    { icon: "📄", name: "Offer Letter",           req: "PDF Document",        ready: true  },
    { icon: "📋", name: "Employment Agreement",    req: "PDF Document",        ready: true  },
    { icon: "📝", name: "NDA Document",            req: "Pending signature",   ready: false },
    { icon: "🎓", name: "Background Check Form",   req: "Pending submission",  ready: false },
];

export default function OfferPage() {
    return (
        <div>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>📄 Offer &amp; Documents</h1>
                    <p className={styles.pageSub}>Review your offer details and complete the required documents</p>
                </div>
            </div>

            {/* Offer Banner */}
            <div className={styles.offerBanner}>
                <div className={styles.obLabel}>🎉 Congratulations!</div>
                <div className={styles.obTitle}>You&apos;ve received an offer for<br />Senior React Developer</div>
                <div className={styles.obSub}>Hireon · Starting March 3, 2026</div>
                <div className={styles.obActions}>
                    <button className={`${styles.btn} ${styles.btnGreen}`}>
                        ✅ Accept Offer
                    </button>
                    <button className={`${styles.btn}`} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
                        🤔 Negotiate
                    </button>
                    <button className={`${styles.btn} ${styles.btnRed}`}>
                        ❌ Decline
                    </button>
                </div>
            </div>

            {/* Grid2 — CTC + Documents */}
            <div className={styles.grid2}>
                {/* CTC Breakdown */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>💰 CTC Breakdown</div>

                    {CTC.map((row) => (
                        <div key={row.label} className={styles.ctcRow}>
                            <span className={styles.ctcLabel}>{row.label}</span>
                            <span className={styles.ctcVal}>{row.val}</span>
                        </div>
                    ))}

                    <div className={styles.ctcRowTotal}>
                        <span className={styles.ctcLabel}>Total CTC</span>
                        <span className={styles.ctcVal}>₹21,80,000</span>
                    </div>
                </div>

                {/* Documents */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        📎 Documents
                        <span className={`${styles.chip} ${styles.chipAmber}`}>
                            <span className={styles.chipDot} />2 Pending
                        </span>
                    </div>

                    {DOCS.map((doc) => (
                        <div key={doc.name} className={styles.docItem}>
                            <div className={styles.docIco}>{doc.icon}</div>
                            <div style={{ flex: 1 }}>
                                <div className={styles.docName}>{doc.name}</div>
                                <div className={styles.docReq}>{doc.req}</div>
                            </div>
                            <div className={styles.docStatusIco}>
                                {doc.ready ? "✅" : "⏳"}
                            </div>
                            {doc.ready && (
                                <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnXs}`}>
                                    Download
                                </button>
                            )}
                            {!doc.ready && (
                                <button className={`${styles.btn} ${styles.btnAmber} ${styles.btnXs}`}
                                    style={{ background: "rgba(251,191,36,0.12)", color: "#d97706", border: "1px solid rgba(251,191,36,0.25)" }}>
                                    Sign
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
