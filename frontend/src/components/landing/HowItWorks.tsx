import styles from "./HowItWorks.module.css";

const steps = [
    {
        num: "01",
        title: "Upload Resumes",
        desc: "Drag and drop or bulk-upload resumes in any format. Our parser handles PDF, DOCX, and plain text with 99.2% accuracy.",
        icon: "📄",
        tags: ["PDF", "DOCX", "Bulk Upload"],
        color: "var(--violet)",
    },
    {
        num: "02",
        title: "AI Analyzes Instantly",
        desc: "Claude AI extracts skills, rates experience, predicts culture fit, and calculates a match score — all in under 10 seconds.",
        icon: "🧠",
        tags: ["Skill Extraction", "Scoring", "Inference"],
        color: "var(--pink)",
    },
    {
        num: "03",
        title: "Smart Shortlisting",
        desc: "Candidates are automatically ranked and shortlisted based on your job requirements and configurable thresholds.",
        icon: "✅",
        tags: ["Auto-rank", "Threshold", "Match"],
        color: "var(--teal)",
    },
    {
        num: "04",
        title: "One-Click Scheduling",
        desc: "HireOn cross-references availability, prevents conflicts, and books interviews with Google Calendar integration.",
        icon: "📅",
        tags: ["Calendar", "Overlap", "Automated"],
        color: "var(--amber)",
    },
];

export default function HowItWorks() {
    return (
        <section className={styles.sec} id="howitworks">
            <span className="sec-tag">How It Works</span>
            <h2 className="sec-title">
                From resume to interview<br />
                <span className="grad">in four steps.</span>
            </h2>

            <div className={styles.grid}>
                {steps.map((step) => (
                    <div className={styles.card} key={step.num}>
                        <div className={styles.topRow}>
                            <span className={styles.icon}>{step.icon}</span>
                            <span className={styles.num} style={{ color: step.color }}>
                                {step.num}
                            </span>
                        </div>
                        <h3 className={styles.title}>{step.title}</h3>
                        <p className={styles.desc}>{step.desc}</p>
                        <div className={styles.tags}>
                            {step.tags.map((tag) => (
                                <span className="skill-pill" key={tag}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
